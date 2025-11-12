# backend/routers/chat_analisis_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

from database import get_db
from services.chat_analisis_service import (
    chat_analisis_proyecto,
    refinar_subtareas,
    generar_resumen_ejecutivo,
    ESPECIALIDADES_DETALLADAS
)
from modelos.proyecto_modelo import Proyecto, FaseProyecto
from modelos.sub_tarea_modelo import SubTarea, PrioridadSubTarea, EstadoSubTarea
from modelos.conversacion_chat_modelo import ConversacionChat, EmisorMensaje, TipoConversacion
from modelos.analisis_ia_modelo import AnalisisIA

router = APIRouter(
    prefix="/chat-analisis",
    tags=["Chat Análisis"]
)


# ========================================
# SCHEMAS PYDANTIC
# ========================================

class MensajeChat(BaseModel):
    contenido: str

class HistorialMensaje(BaseModel):
    role: str  # "user" o "assistant"
    content: str

class IniciarAnalisisRequest(BaseModel):
    cliente_id: int
    mensaje_inicial: str

class ContinuarAnalisisRequest(BaseModel):
    proyecto_id: int
    mensaje: str

class PublicarProyectoRequest(BaseModel):
    proyecto_id: int


# ========================================
# ENDPOINTS
# ========================================

@router.post("/iniciar")
def iniciar_analisis(
    data: IniciarAnalisisRequest,
    db: Session = Depends(get_db)
):
    """
    Inicia un nuevo análisis de proyecto.
    
    1. Crea el proyecto en fase ANÁLISIS
    2. Guarda el primer mensaje del cliente
    3. Genera la primera respuesta de la IA
    
    Returns:
        - proyecto_id: ID del proyecto creado
        - respuesta_ia: Primera pregunta/respuesta de la IA
        - finalizado: False (siempre al inicio)
    """
    try:
        # 1. Crear proyecto en fase de ANÁLISIS
        nuevo_proyecto = Proyecto(
            cliente_id=data.cliente_id,
            titulo="Proyecto en análisis...",
            descripcion="Análisis en progreso con IA",
            especialidad="OTRO",
            fase=FaseProyecto.ANALISIS,
            progreso=0
        )
        db.add(nuevo_proyecto)
        db.commit()
        db.refresh(nuevo_proyecto)
        
        print(f"✅ Proyecto {nuevo_proyecto.id} creado en fase ANÁLISIS")
        
        # 2. Guardar mensaje inicial del cliente
        mensaje_cliente = ConversacionChat(
            proyecto_id=nuevo_proyecto.id,
            cliente_id=data.cliente_id,
            tipo=TipoConversacion.ANALISIS,
            mensaje=data.mensaje_inicial,
            emisor=EmisorMensaje.CLIENTE
        )
        db.add(mensaje_cliente)
        db.commit()
        
        # 3. Crear historial para OpenAI
        historial = [
            {"role": "user", "content": data.mensaje_inicial}
        ]
        
        # 4. Obtener respuesta de la IA
        resultado = chat_analisis_proyecto(historial, data.cliente_id)
        
        if not resultado["exito"]:
            raise HTTPException(status_code=500, detail=resultado.get("error", "Error en análisis"))
        
        # 5. Guardar respuesta de la IA
        mensaje_ia = ConversacionChat(
            proyecto_id=nuevo_proyecto.id,
            cliente_id=data.cliente_id,
            tipo=TipoConversacion.ANALISIS,
            mensaje=resultado["respuesta"],
            emisor=EmisorMensaje.IA,
            metadatos={
                "tokens_usados": resultado.get("tokens_usados"),
                "costo": resultado.get("costo_estimado")
            }
        )
        db.add(mensaje_ia)
        db.commit()
        
        print(f"💬 Conversación iniciada - {resultado.get('tokens_usados')} tokens")
        
        return {
            "exito": True,
            "proyecto_id": nuevo_proyecto.id,
            "respuesta_ia": resultado["respuesta"],
            "finalizado": False,
            "tokens_usados": resultado.get("tokens_usados")
        }
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error iniciando análisis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/continuar")
def continuar_analisis(
    data: ContinuarAnalisisRequest,
    db: Session = Depends(get_db)
):
    """
    Continúa el análisis de un proyecto existente.
    
    1. Carga el historial de mensajes previos
    2. Agrega el nuevo mensaje del cliente
    3. Obtiene respuesta de la IA
    4. Si finalizó, crea sub-tareas y análisis
    
    Returns:
        - respuesta_ia: Respuesta de la IA
        - finalizado: True si el análisis terminó
        - proyecto: Datos completos del proyecto (si finalizó)
        - resumen: Resumen ejecutivo (si finalizó)
    """
    try:
        # 1. Verificar que el proyecto existe y está en ANÁLISIS
        proyecto = db.query(Proyecto).filter(Proyecto.id == data.proyecto_id).first()
        if not proyecto:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        if proyecto.fase != FaseProyecto.ANALISIS:
            raise HTTPException(status_code=400, detail="El proyecto ya no está en fase de análisis")
        
        # 2. Cargar historial de conversación
        mensajes_db = db.query(ConversacionChat).filter(
            ConversacionChat.proyecto_id == data.proyecto_id,
            ConversacionChat.tipo == TipoConversacion.ANALISIS
        ).order_by(ConversacionChat.timestamp).all()
        
        # Convertir a formato OpenAI
        historial = []
        for msg in mensajes_db:
            role = "user" if msg.emisor == EmisorMensaje.CLIENTE else "assistant"
            historial.append({"role": role, "content": msg.mensaje})
        
        # 3. Agregar nuevo mensaje del cliente
        historial.append({"role": "user", "content": data.mensaje})
        
        # Guardar mensaje del cliente
        mensaje_cliente = ConversacionChat(
            proyecto_id=proyecto.id,
            cliente_id=proyecto.cliente_id,
            tipo=TipoConversacion.ANALISIS,
            mensaje=data.mensaje,
            emisor=EmisorMensaje.CLIENTE
        )
        db.add(mensaje_cliente)
        db.commit()
        
        print(f"💬 Continuando análisis - {len(historial)} mensajes en historial")
        
        # 4. Obtener respuesta de la IA
        resultado = chat_analisis_proyecto(historial, proyecto.cliente_id)
        
        if not resultado["exito"]:
            raise HTTPException(status_code=500, detail=resultado.get("error"))
        
        # 5. Guardar respuesta de la IA
        mensaje_ia = ConversacionChat(
            proyecto_id=proyecto.id,
            cliente_id=proyecto.cliente_id,
            tipo=TipoConversacion.ANALISIS,
            mensaje=resultado["respuesta"],
            emisor=EmisorMensaje.IA,
            metadatos={
                "tokens_usados": resultado.get("tokens_usados"),
                "finalizado": resultado.get("finalizado")
            }
        )
        db.add(mensaje_ia)
        
        # 6. Si finalizó, crear sub-tareas y análisis
        if resultado.get("finalizado"):
            proyecto_data = resultado["proyecto"]
            
            # Refinar sub-tareas
            refinado = refinar_subtareas(proyecto_data)
            if not refinado["exito"]:
                raise HTTPException(status_code=500, detail="Error refinando sub-tareas")
            
            proyecto_data = refinado["proyecto"]
            
            # Actualizar proyecto
            proyecto.titulo = proyecto_data["titulo"]
            proyecto.descripcion = proyecto_data["descripcion_completa"]
            proyecto.historia_usuario = proyecto_data["historia_usuario"]
            proyecto.criterios_aceptacion = proyecto_data["criterios_aceptacion"]
            proyecto.presupuesto = float(proyecto_data["presupuesto_estimado"])
            proyecto.total_subtareas = len(proyecto_data["subtareas"])
            proyecto.fase = FaseProyecto.ANALISIS  # Aún no se publica
            
            # Crear análisis IA
            analisis = AnalisisIA(
                proyecto_id=proyecto.id,
                version=1,
                analisis_completo=proyecto_data,
                especialidades_detectadas=[t["especialidad"] for t in proyecto_data["subtareas"]],
                presupuesto_estimado=float(proyecto_data["presupuesto_estimado"]),
                tiempo_estimado_dias=proyecto_data["tiempo_estimado_dias"],
                completado=True
            )
            db.add(analisis)
            
            # Crear sub-tareas
            for tarea_data in proyecto_data["subtareas"]:
                subtarea = SubTarea(
                    proyecto_id=proyecto.id,
                    codigo=tarea_data["codigo"],
                    titulo=tarea_data["titulo"],
                    descripcion=tarea_data["descripcion"],
                    especialidad=tarea_data["especialidad"],
                    estado=EstadoSubTarea.PENDIENTE,
                    prioridad=PrioridadSubTarea[tarea_data["prioridad"]],
                    estimacion_horas=tarea_data["estimacion_horas"]
                )
                db.add(subtarea)
            
            db.commit()
            db.refresh(proyecto)
            
            print(f"✅ Análisis completado - {len(proyecto_data['subtareas'])} sub-tareas creadas")
            
            # Generar resumen
            resumen = generar_resumen_ejecutivo(proyecto_data)
            
            return {
                "exito": True,
                "respuesta_ia": resultado["respuesta"],
                "finalizado": True,
                "proyecto_id": proyecto.id,
                "proyecto": proyecto_data,
                "resumen": resumen,
                "tokens_usados": resultado.get("tokens_usados")
            }
        
        else:
            # No finalizó, continuar conversación
            db.commit()
            
            return {
                "exito": True,
                "respuesta_ia": resultado["respuesta"],
                "finalizado": False,
                "tokens_usados": resultado.get("tokens_usados")
            }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error continuando análisis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/publicar")
def publicar_proyecto(
    data: PublicarProyectoRequest,
    db: Session = Depends(get_db)
):
    """
    Publica un proyecto analizado para que los vendedores puedan ver las sub-tareas.
    
    Cambia la fase de ANÁLISIS → PUBLICADO
    """
    try:
        proyecto = db.query(Proyecto).filter(Proyecto.id == data.proyecto_id).first()
        
        if not proyecto:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        if proyecto.fase != FaseProyecto.ANALISIS:
            raise HTTPException(status_code=400, detail="El proyecto no está en fase de análisis")
        
        # Verificar que tenga sub-tareas
        subtareas = db.query(SubTarea).filter(SubTarea.proyecto_id == proyecto.id).count()
        if subtareas == 0:
            raise HTTPException(status_code=400, detail="El proyecto no tiene sub-tareas")
        
        # Cambiar fase
        proyecto.fase = FaseProyecto.PUBLICADO
        db.commit()
        
        print(f"📢 Proyecto {proyecto.id} PUBLICADO - {subtareas} sub-tareas disponibles")
        
        return {
            "exito": True,
            "mensaje": "Proyecto publicado exitosamente",
            "proyecto_id": proyecto.id,
            "subtareas_publicadas": subtareas
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error publicando proyecto: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historial/{proyecto_id}")
def obtener_historial_conversacion(
    proyecto_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene todo el historial de conversación de un proyecto.
    """
    try:
        mensajes = db.query(ConversacionChat).filter(
            ConversacionChat.proyecto_id == proyecto_id,
            ConversacionChat.tipo == TipoConversacion.ANALISIS
        ).order_by(ConversacionChat.timestamp).all()
        
        return {
            "exito": True,
            "total_mensajes": len(mensajes),
            "mensajes": [
                {
                    "id": m.id,
                    "emisor": m.emisor,
                    "mensaje": m.mensaje,
                    "timestamp": m.timestamp,
                    "metadatos": m.metadatos
                }
                for m in mensajes
            ]
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo historial: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/especialidades")
def listar_especialidades():
    """
    Lista todas las especialidades disponibles.
    """
    return {
        "exito": True,
        "especialidades": [
            {"codigo": codigo, "nombre": nombre}
            for codigo, nombre in ESPECIALIDADES_DETALLADAS.items()
        ]
    }