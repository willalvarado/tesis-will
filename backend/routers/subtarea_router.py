# backend/routers/subtarea_router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import json

from database import get_db
from modelos.proyecto_modelo import SubTarea, EstadoSubTarea
from modelos.proyecto_modelo import Proyecto, FaseProyecto
from modelos.usuario_modelo import UsuarioDB
from Vendedores.vendedor_modelo import Vendedor
from pydantic import BaseModel

router = APIRouter(
    prefix="/subtareas",
    tags=["Sub-tareas"]
)


# ========================================
# 🔥 MAPEO DE ESPECIALIDADES
# ========================================

# Nombres completos → Códigos (para matching)
ESPECIALIDADES_NOMBRE_A_CODIGO = {
    "Consultoría en desarrollo de sistemas": "CONSULTORIA_DESARROLLO",
    "Consultoría en hardware": "CONSULTORIA_HARDWARE",
    "Consultoría en software": "CONSULTORIA_SOFTWARE",
    "Desarrollo de software a medida": "DESARROLLO_MEDIDA",
    "Desarrollo y producción de software empaquetado": "SOFTWARE_EMPAQUETADO",
    "Actualización y adaptación de software": "ACTUALIZACION_SOFTWARE",
    "Servicios de alojamiento de datos (hosting)": "HOSTING",
    "Servicios de procesamiento de datos": "PROCESAMIENTO_DATOS",
    "Servicios en la nube (cloud computing)": "CLOUD_COMPUTING",
    "Servicios de recuperación ante desastres": "RECUPERACION_DESASTRES",
    "Servicios de ciberseguridad": "CIBERSEGURIDAD",
    "Capacitación en TI": "CAPACITACION_TI"
}

# Códigos → Nombres completos (para mostrar)
ESPECIALIDADES_CODIGO_A_NOMBRE = {v: k for k, v in ESPECIALIDADES_NOMBRE_A_CODIGO.items()}


def convertir_especialidades_a_codigos(especialidades_nombres: List[str]) -> List[str]:
    """
    Convierte una lista de nombres de especialidades a códigos.
    Ejemplo: ["Desarrollo de software a medida"] → ["DESARROLLO_MEDIDA"]
    """
    codigos = []
    for nombre in especialidades_nombres:
        # Buscar coincidencia exacta
        codigo = ESPECIALIDADES_NOMBRE_A_CODIGO.get(nombre)
        if codigo:
            codigos.append(codigo)
        else:
            # Si ya viene como código, usarlo directamente
            if nombre in ESPECIALIDADES_CODIGO_A_NOMBRE:
                codigos.append(nombre)
            else:
                print(f"⚠️ Especialidad no reconocida: {nombre}")
    
    return codigos


# ========================================
# SCHEMAS
# ========================================

class SubTareaResponse(BaseModel):
    id: int
    proyecto_id: int
    proyecto_titulo: str
    cliente_id: int
    cliente_nombre: str
    codigo: str
    titulo: str
    descripcion: Optional[str]
    especialidad: str
    vendedor_id: Optional[int]
    vendedor_nombre: Optional[str]
    estado: str
    prioridad: str
    presupuesto: float
    pagado: float
    estimacion_horas: Optional[int]
    fecha_asignacion: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AceptarSubTareaRequest(BaseModel):
    subtarea_id: int
    vendedor_id: int


class ActualizarProgresoRequest(BaseModel):
    subtarea_id: int
    estado: str  # EN_PROGRESO, COMPLETADO
    notas: Optional[str] = None


# ========================================
# HELPERS
# ========================================

def agregar_nombres_a_subtareas(subtareas: List[SubTarea], db: Session) -> List[dict]:
    """Agrega nombres de proyecto, cliente y vendedor a las sub-tareas"""
    resultado = []
    
    for st in subtareas:
        # Obtener proyecto
        proyecto = db.query(Proyecto).filter(Proyecto.id == st.proyecto_id).first()
        proyecto_titulo = proyecto.titulo if proyecto else f"Proyecto #{st.proyecto_id}"
        cliente_id = proyecto.cliente_id if proyecto else None
        
        # Obtener cliente
        cliente = db.query(UsuarioDB).filter(UsuarioDB.id == cliente_id).first() if cliente_id else None
        cliente_nombre = cliente.nombre if cliente else "Cliente desconocido"
        
        # Obtener vendedor (si está asignado)
        vendedor_nombre = None
        if st.vendedor_id:
            vendedor = db.query(Vendedor).filter(Vendedor.id == st.vendedor_id).first()
            vendedor_nombre = vendedor.nombre if vendedor else f"Vendedor #{st.vendedor_id}"
        
        # 🔥 CONVERTIR CÓDIGO A NOMBRE para mostrar
        especialidad_mostrar = ESPECIALIDADES_CODIGO_A_NOMBRE.get(st.especialidad, st.especialidad)
        
        resultado.append({
            "id": st.id,
            "proyecto_id": st.proyecto_id,
            "proyecto_titulo": proyecto_titulo,
            "cliente_id": cliente_id,
            "cliente_nombre": cliente_nombre,
            "codigo": st.codigo,
            "titulo": st.titulo,
            "descripcion": st.descripcion,
            "especialidad": especialidad_mostrar,  # 🔥 NOMBRE COMPLETO
            "vendedor_id": st.vendedor_id,
            "vendedor_nombre": vendedor_nombre,
            "estado": st.estado.value if hasattr(st.estado, 'value') else st.estado,
            "prioridad": st.prioridad,
            "presupuesto": float(st.presupuesto),
            "pagado": float(st.pagado),
            "estimacion_horas": st.estimacion_horas,
            "fecha_asignacion": st.fecha_asignacion,
            "created_at": st.created_at
        })
    
    return resultado


# ========================================
# ENDPOINTS
# ========================================

@router.get("/disponibles")
def obtener_subtareas_disponibles(
    especialidades: Optional[str] = None,  # 🔥 Cambiado a plural
    prioridad: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene sub-tareas disponibles (sin asignar) de proyectos PUBLICADOS.
    
    Params:
        - especialidades: Lista de especialidades separadas por coma (nombres completos o códigos)
        - prioridad: ALTA, MEDIA, BAJA
    """
    try:
        # Sub-tareas disponibles de proyectos publicados
        query = db.query(SubTarea).join(
            Proyecto, SubTarea.proyecto_id == Proyecto.id
        ).filter(
            SubTarea.estado == EstadoSubTarea.PENDIENTE,
            SubTarea.vendedor_id == None,
            Proyecto.fase == FaseProyecto.PUBLICADO
        )
        
        # 🔥 FILTRO POR ESPECIALIDADES DEL VENDEDOR
        if especialidades:
            # Separar especialidades (pueden venir como nombres o códigos)
            lista_especialidades = [esp.strip() for esp in especialidades.split(',')]
            
            print(f"🔍 Especialidades recibidas del vendedor: {lista_especialidades}")
            
            # Convertir NOMBRES a CÓDIGOS
            codigos_vendedor = convertir_especialidades_a_codigos(lista_especialidades)
            
            print(f"🔍 Códigos del vendedor: {codigos_vendedor}")
            
            if codigos_vendedor:
                # Filtrar sub-tareas que tengan CUALQUIERA de estas especialidades
                query = query.filter(SubTarea.especialidad.in_(codigos_vendedor))
                print(f"✅ Filtrando sub-tareas con especialidades: {codigos_vendedor}")
            else:
                print(f"⚠️ No se pudieron convertir especialidades a códigos")
        
        # Filtro por prioridad
        if prioridad:
            prioridad_upper = prioridad.upper()
            if prioridad_upper in ["ALTA", "MEDIA", "BAJA"]:
                query = query.filter(SubTarea.prioridad == prioridad_upper)
                print(f"🔍 Filtrando por prioridad: {prioridad_upper}")
        
        # 🔥 Ordenar por prioridad manualmente (ALTA > MEDIA > BAJA)
        from sqlalchemy import case
        
        prioridad_orden = case(
            (SubTarea.prioridad == "ALTA", 1),
            (SubTarea.prioridad == "MEDIA", 2),
            (SubTarea.prioridad == "BAJA", 3),
            else_=4
        )
        
        subtareas = query.order_by(
            prioridad_orden,  # ALTA primero
            SubTarea.created_at.desc()
        ).all()
        
        print(f"📊 {len(subtareas)} sub-tareas disponibles encontradas")
        
        return agregar_nombres_a_subtareas(subtareas, db)
        
    except Exception as e:
        print(f"❌ Error obteniendo sub-tareas: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mis-subtareas/{vendedor_id}")
def obtener_mis_subtareas(
    vendedor_id: int,
    estado: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene las sub-tareas asignadas a un vendedor específico.
    
    Params:
        - estado: ASIGNADA, EN_PROGRESO, COMPLETADO
    """
    try:
        query = db.query(SubTarea).filter(
            SubTarea.vendedor_id == vendedor_id
        )
        
        if estado:
            try:
                estado_enum = EstadoSubTarea[estado.upper()]
                query = query.filter(SubTarea.estado == estado_enum)
            except KeyError:
                pass
        
        subtareas = query.order_by(SubTarea.fecha_asignacion.desc()).all()
        
        print(f"📊 Vendedor {vendedor_id}: {len(subtareas)} sub-tareas")
        
        return {
            "exito": True,
            "total": len(subtareas),
            "subtareas": agregar_nombres_a_subtareas(subtareas, db)
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo mis sub-tareas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proyecto/{proyecto_id}")
def obtener_subtareas_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las sub-tareas de un proyecto específico.
    Útil para que el cliente vea el progreso.
    """
    try:
        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        subtareas = db.query(SubTarea).filter(
            SubTarea.proyecto_id == proyecto_id
        ).order_by(SubTarea.codigo).all()
        
        # Estadísticas
        total = len(subtareas)
        pendientes = sum(1 for st in subtareas if st.estado == EstadoSubTarea.PENDIENTE)
        asignadas = sum(1 for st in subtareas if st.estado == EstadoSubTarea.ASIGNADA)
        en_progreso = sum(1 for st in subtareas if st.estado == EstadoSubTarea.EN_PROGRESO)
        completadas = sum(1 for st in subtareas if st.estado == EstadoSubTarea.COMPLETADO)
        
        return {
            "exito": True,
            "proyecto_id": proyecto_id,
            "proyecto_titulo": proyecto.titulo,
            "estadisticas": {
                "total": total,
                "pendientes": pendientes,
                "asignadas": asignadas,
                "en_progreso": en_progreso,
                "completadas": completadas,
                "progreso_porcentaje": int((completadas / total * 100)) if total > 0 else 0
            },
            "subtareas": agregar_nombres_a_subtareas(subtareas, db)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error obteniendo sub-tareas del proyecto: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/aceptar")
def aceptar_subtarea(
    data: AceptarSubTareaRequest,
    db: Session = Depends(get_db)
):
    """
    Un vendedor acepta una sub-tarea disponible.
    
    1. Verifica que esté disponible
    2. Asigna al vendedor
    3. Cambia estado a ASIGNADA
    4. Actualiza el proyecto si es necesario
    """
    try:
        # Verificar sub-tarea
        subtarea = db.query(SubTarea).filter(SubTarea.id == data.subtarea_id).first()
        if not subtarea:
            raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
        
        if subtarea.vendedor_id:
            raise HTTPException(status_code=400, detail="Sub-tarea ya asignada")
        
        if subtarea.estado != EstadoSubTarea.PENDIENTE:
            raise HTTPException(status_code=400, detail="Sub-tarea no disponible")
        
        # Verificar vendedor
        vendedor = db.query(Vendedor).filter(Vendedor.id == data.vendedor_id).first()
        if not vendedor:
            raise HTTPException(status_code=404, detail="Vendedor no encontrado")
        
        # 🔥 PARSEAR ESPECIALIDADES DESDE JSON
        especialidades_vendedor = []
        if vendedor.especialidades:
            try:
                # Si es string JSON, parsearlo
                if isinstance(vendedor.especialidades, str):
                    especialidades_vendedor = json.loads(vendedor.especialidades)
                # Si ya es lista, usarla directamente
                elif isinstance(vendedor.especialidades, list):
                    especialidades_vendedor = vendedor.especialidades
            except json.JSONDecodeError as e:
                print(f"❌ Error parseando especialidades: {e}")
                especialidades_vendedor = []
        
        print(f"🔍 Especialidades del vendedor (raw): {vendedor.especialidades}")
        print(f"🔍 Especialidades del vendedor (parseadas): {especialidades_vendedor}")
        
        # Convertir nombres a códigos
        codigos_vendedor = convertir_especialidades_a_codigos(especialidades_vendedor)
        
        print(f"🔍 Códigos del vendedor: {codigos_vendedor}")
        print(f"🔍 Especialidad requerida por sub-tarea: {subtarea.especialidad}")
        
        # Verificar que el vendedor tenga la especialidad
        if subtarea.especialidad not in codigos_vendedor:
            print(f"⚠️ Vendedor {vendedor.id} no tiene especialidad {subtarea.especialidad}")
            print(f"   Especialidades del vendedor: {codigos_vendedor}")
            raise HTTPException(
                status_code=403, 
                detail=f"No tienes la especialidad requerida: {ESPECIALIDADES_CODIGO_A_NOMBRE.get(subtarea.especialidad, subtarea.especialidad)}"
            )
        
        # Verificar proyecto publicado
        proyecto = db.query(Proyecto).filter(Proyecto.id == subtarea.proyecto_id).first()
        if proyecto.fase != FaseProyecto.PUBLICADO:
            raise HTTPException(status_code=400, detail="Proyecto no publicado")
        
        # Asignar sub-tarea
        subtarea.vendedor_id = data.vendedor_id
        subtarea.estado = EstadoSubTarea.ASIGNADA
        subtarea.fecha_asignacion = datetime.utcnow()
        
        # Actualizar proyecto a EN_PROGRESO si es la primera sub-tarea asignada
        if proyecto.fase == FaseProyecto.PUBLICADO:
            proyecto.fase = FaseProyecto.EN_PROGRESO
        
        db.commit()
        db.refresh(subtarea)
        
        print(f"✅ Sub-tarea {subtarea.codigo} asignada a vendedor {data.vendedor_id}")
        
        return {
            "exito": True,
            "mensaje": "Sub-tarea aceptada exitosamente",
            "subtarea_id": subtarea.id,
            "codigo": subtarea.codigo,
            "titulo": subtarea.titulo
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error aceptando sub-tarea: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/actualizar-progreso")
def actualizar_progreso_subtarea(
    data: ActualizarProgresoRequest,
    db: Session = Depends(get_db)
):
    """
    Actualiza el estado de una sub-tarea asignada.
    
    Estados posibles:
    - EN_PROGRESO: El vendedor está trabajando
    - COMPLETADO: El vendedor terminó
    """
    try:
        subtarea = db.query(SubTarea).filter(SubTarea.id == data.subtarea_id).first()
        if not subtarea:
            raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
        
        if not subtarea.vendedor_id:
            raise HTTPException(status_code=400, detail="Sub-tarea no asignada")
        
        # Validar transición de estado
        nuevo_estado = EstadoSubTarea[data.estado.upper()]
        
        if nuevo_estado == EstadoSubTarea.EN_PROGRESO:
            if subtarea.estado not in [EstadoSubTarea.ASIGNADA, EstadoSubTarea.PENDIENTE]:
                raise HTTPException(status_code=400, detail="Solo se puede pasar a EN_PROGRESO desde ASIGNADA o PENDIENTE")
            subtarea.fecha_inicio = datetime.utcnow()
        
        elif nuevo_estado == EstadoSubTarea.COMPLETADO:
            if subtarea.estado not in [EstadoSubTarea.ASIGNADA, EstadoSubTarea.EN_PROGRESO]:
                raise HTTPException(status_code=400, detail="Transición de estado inválida")
            subtarea.fecha_completado = datetime.utcnow()
            
            # Actualizar contador en proyecto
            proyecto = db.query(Proyecto).filter(Proyecto.id == subtarea.proyecto_id).first()
            if proyecto:
                # Recalcular sub-tareas completadas
                completadas_count = db.query(SubTarea).filter(
                    SubTarea.proyecto_id == proyecto.id,
                    SubTarea.estado == EstadoSubTarea.COMPLETADO
                ).count() + 1
                
                proyecto.subtareas_completadas = completadas_count
                
                # Calcular progreso del proyecto
                if proyecto.total_subtareas > 0:
                    proyecto.progreso = int((completadas_count / proyecto.total_subtareas) * 100)
                
                # Si todas están completadas, marcar proyecto como completado
                if completadas_count >= proyecto.total_subtareas:
                    proyecto.fase = FaseProyecto.COMPLETADO
                    proyecto.estado = "COMPLETADO"
                    proyecto.fecha_completado = datetime.utcnow()
        
        subtarea.estado = nuevo_estado
        subtarea.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(subtarea)
        
        print(f"✅ Sub-tarea {subtarea.codigo} actualizada a {nuevo_estado.value}")
        
        return {
            "exito": True,
            "mensaje": f"Sub-tarea actualizada a {nuevo_estado.value}",
            "subtarea_id": subtarea.id,
            "nuevo_estado": nuevo_estado.value
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error actualizando progreso: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/estadisticas/vendedor/{vendedor_id}")
def obtener_estadisticas_vendedor(
    vendedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene estadísticas de un vendedor.
    """
    try:
        total = db.query(SubTarea).filter(SubTarea.vendedor_id == vendedor_id).count()
        completadas = db.query(SubTarea).filter(
            SubTarea.vendedor_id == vendedor_id,
            SubTarea.estado == EstadoSubTarea.COMPLETADO
        ).count()
        en_progreso = db.query(SubTarea).filter(
            SubTarea.vendedor_id == vendedor_id,
            SubTarea.estado == EstadoSubTarea.EN_PROGRESO
        ).count()
        asignadas = db.query(SubTarea).filter(
            SubTarea.vendedor_id == vendedor_id,
            SubTarea.estado == EstadoSubTarea.ASIGNADA
        ).count()
        
        return {
            "exito": True,
            "vendedor_id": vendedor_id,
            "estadisticas": {
                "total_subtareas": total,
                "completadas": completadas,
                "en_progreso": en_progreso,
                "asignadas": asignadas,
                "tasa_completacion": int((completadas / total * 100)) if total > 0 else 0
            }
        }
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{subtarea_id}")
def obtener_detalle_subtarea(
    subtarea_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene el detalle completo de una sub-tarea específica.
    Incluye info del proyecto, cliente y vendedor asignado.
    """
    try:
        # Buscar sub-tarea
        subtarea = db.query(SubTarea).filter(SubTarea.id == subtarea_id).first()
        if not subtarea:
            raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
        
        # Obtener proyecto
        proyecto = db.query(Proyecto).filter(Proyecto.id == subtarea.proyecto_id).first()
        if not proyecto:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        # Obtener cliente
        cliente = db.query(UsuarioDB).filter(UsuarioDB.id == proyecto.cliente_id).first()
        cliente_info = {
            "id": cliente.id,
            "nombre": cliente.nombre,
            "correo": cliente.correo
        } if cliente else None
        
        # Obtener vendedor (si está asignado)
        vendedor_info = None
        if subtarea.vendedor_id:
            vendedor = db.query(Vendedor).filter(Vendedor.id == subtarea.vendedor_id).first()
            if vendedor:
                vendedor_info = {
                    "id": vendedor.id,
                    "nombre": vendedor.nombre,
                    "correo": vendedor.correo,
                    "especialidades": vendedor.especialidades
                }
        
        # 🔥 CONVERTIR CÓDIGO A NOMBRE para mostrar
        especialidad_mostrar = ESPECIALIDADES_CODIGO_A_NOMBRE.get(subtarea.especialidad, subtarea.especialidad)
        
        return {
            "exito": True,
            "subtarea": {
                "id": subtarea.id,
                "codigo": subtarea.codigo,
                "titulo": subtarea.titulo,
                "descripcion": subtarea.descripcion,
                "especialidad": especialidad_mostrar,  # 🔥 NOMBRE COMPLETO
                "estado": subtarea.estado.value if hasattr(subtarea.estado, 'value') else subtarea.estado,
                "prioridad": subtarea.prioridad,
                "presupuesto": float(subtarea.presupuesto),
                "pagado": float(subtarea.pagado),
                "estimacion_horas": subtarea.estimacion_horas,
                "fecha_asignacion": subtarea.fecha_asignacion,
                "fecha_inicio": subtarea.fecha_inicio,
                "fecha_completado": subtarea.fecha_completado,
                "created_at": subtarea.created_at
            },
            "proyecto": {
                "id": proyecto.id,
                "titulo": proyecto.titulo,
                "descripcion": proyecto.descripcion,
                "fase": proyecto.fase.value if hasattr(proyecto.fase, 'value') else proyecto.fase,
                "presupuesto": float(proyecto.presupuesto)
            },
            "cliente": cliente_info,
            "vendedor": vendedor_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error obteniendo detalle de sub-tarea: {e}")
        raise HTTPException(status_code=500, detail=str(e))