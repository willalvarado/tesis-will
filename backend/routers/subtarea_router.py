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
        # 🔥 1. Si YA es un código válido, usarlo directamente
        if nombre in ESPECIALIDADES_CODIGO_A_NOMBRE:
            codigos.append(nombre)
            print(f"✅ '{nombre}' ya es un código válido")
        # 🔥 2. Buscar coincidencia como nombre completo
        elif nombre in ESPECIALIDADES_NOMBRE_A_CODIGO:
            codigo = ESPECIALIDADES_NOMBRE_A_CODIGO[nombre]
            codigos.append(codigo)
            print(f"✅ '{nombre}' convertido a '{codigo}'")
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


class PresupuestoUpdate(BaseModel):
    presupuesto: float


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
    especialidad: Optional[str] = None,
    prioridad: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene sub-tareas disponibles (sin asignar) de proyectos PUBLICADOS.
    """
    try:
        query = db.query(SubTarea).join(
            Proyecto, SubTarea.proyecto_id == Proyecto.id
        ).filter(
            SubTarea.estado == EstadoSubTarea.PENDIENTE,
            SubTarea.vendedor_id == None,
            Proyecto.fase.in_([FaseProyecto.PUBLICADO, FaseProyecto.EN_PROGRESO])
        )
        
        if especialidad:  
            lista_especialidades = [esp.strip() for esp in especialidad.split(',')]
            print(f"🔍 Especialidades recibidas del vendedor: {lista_especialidades}")
            
            codigos_vendedor = convertir_especialidades_a_codigos(lista_especialidades)
            print(f"🔍 Códigos del vendedor: {codigos_vendedor}")
            
            if codigos_vendedor:
                query = query.filter(SubTarea.especialidad.in_(codigos_vendedor))
                print(f"✅ Filtrando sub-tareas con especialidades: {codigos_vendedor}")
        
        if prioridad:
            prioridad_upper = prioridad.upper()
            if prioridad_upper in ["ALTA", "MEDIA", "BAJA"]:
                query = query.filter(SubTarea.prioridad == prioridad_upper)
        
        from sqlalchemy import case
        
        prioridad_orden = case(
            (SubTarea.prioridad == "ALTA", 1),
            (SubTarea.prioridad == "MEDIA", 2),
            (SubTarea.prioridad == "BAJA", 3),
            else_=4
        )
        
        subtareas = query.order_by(
            prioridad_orden,
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


@router.get("/vendedor/{vendedor_id}")
def obtener_subtareas_vendedor_dashboard(
    vendedor_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las sub-tareas de un vendedor para el dashboard.
    Incluye conteo de mensajes no leídos por sub-tarea.
    """
    try:
        subtareas = db.query(SubTarea).filter(
            SubTarea.vendedor_id == vendedor_id
        ).all()
        
        subtareas_info = agregar_nombres_a_subtareas(subtareas, db)
        
        # TODO: Agregar conteo de mensajes no leídos
        for st in subtareas_info:
            st['mensajes_no_leidos'] = 0
        
        return subtareas_info
        
    except Exception as e:
        print(f"❌ Error obteniendo sub-tareas del vendedor: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/proyecto/{proyecto_id}")
def obtener_subtareas_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las sub-tareas de un proyecto específico.
    """
    try:
        proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
        if not proyecto:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        subtareas = db.query(SubTarea).filter(
            SubTarea.proyecto_id == proyecto_id
        ).order_by(SubTarea.codigo).all()
        
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
    """
    try:
        subtarea = db.query(SubTarea).filter(SubTarea.id == data.subtarea_id).first()
        if not subtarea:
            raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
        
        if subtarea.vendedor_id:
            raise HTTPException(status_code=400, detail="Sub-tarea ya asignada")
        
        if subtarea.estado != EstadoSubTarea.PENDIENTE:
            raise HTTPException(status_code=400, detail="Sub-tarea no disponible")
        
        vendedor = db.query(Vendedor).filter(Vendedor.id == data.vendedor_id).first()
        if not vendedor:
            raise HTTPException(status_code=404, detail="Vendedor no encontrado")
        
        especialidades_vendedor = []
        if vendedor.especialidades:
            try:
                if isinstance(vendedor.especialidades, str):
                    especialidades_vendedor = json.loads(vendedor.especialidades)
                elif isinstance(vendedor.especialidades, list):
                    especialidades_vendedor = vendedor.especialidades
            except json.JSONDecodeError as e:
                print(f"❌ Error parseando especialidades: {e}")
                especialidades_vendedor = []
        
        codigos_vendedor = convertir_especialidades_a_codigos(especialidades_vendedor)
        
        if subtarea.especialidad not in codigos_vendedor:
            raise HTTPException(
                status_code=403, 
                detail=f"No tienes la especialidad requerida: {ESPECIALIDADES_CODIGO_A_NOMBRE.get(subtarea.especialidad, subtarea.especialidad)}"
            )
        
        proyecto = db.query(Proyecto).filter(Proyecto.id == subtarea.proyecto_id).first()
        if proyecto.fase not in [FaseProyecto.PUBLICADO, FaseProyecto.EN_PROGRESO]:
            raise HTTPException(status_code=400, detail="Proyecto no disponible")
        
        subtarea.vendedor_id = data.vendedor_id
        subtarea.estado = EstadoSubTarea.ASIGNADA
        subtarea.fecha_asignacion = datetime.utcnow()
        
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
    """
    try:
        subtarea = db.query(SubTarea).filter(SubTarea.id == data.subtarea_id).first()
        if not subtarea:
            raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
        
        if not subtarea.vendedor_id:
            raise HTTPException(status_code=400, detail="Sub-tarea no asignada")
        
        nuevo_estado = EstadoSubTarea[data.estado.upper()]
        
        if nuevo_estado == EstadoSubTarea.EN_PROGRESO:
            if subtarea.estado not in [EstadoSubTarea.ASIGNADA, EstadoSubTarea.PENDIENTE]:
                raise HTTPException(status_code=400, detail="Transición de estado inválida")
            subtarea.fecha_inicio = datetime.utcnow()
        
        elif nuevo_estado == EstadoSubTarea.COMPLETADO:
            if subtarea.estado not in [EstadoSubTarea.ASIGNADA, EstadoSubTarea.EN_PROGRESO]:
                raise HTTPException(status_code=400, detail="Transición de estado inválida")
            subtarea.fecha_completado = datetime.utcnow()
            
            proyecto = db.query(Proyecto).filter(Proyecto.id == subtarea.proyecto_id).first()
            if proyecto:
                completadas_count = db.query(SubTarea).filter(
                    SubTarea.proyecto_id == proyecto.id,
                    SubTarea.estado == EstadoSubTarea.COMPLETADO
                ).count() + 1
                
                proyecto.subtareas_completadas = completadas_count
                
                if proyecto.total_subtareas > 0:
                    proyecto.progreso = int((completadas_count / proyecto.total_subtareas) * 100)
                
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
    """
    try:
        subtarea = db.query(SubTarea).filter(SubTarea.id == subtarea_id).first()
        if not subtarea:
            raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
        
        proyecto = db.query(Proyecto).filter(Proyecto.id == subtarea.proyecto_id).first()
        if not proyecto:
            raise HTTPException(status_code=404, detail="Proyecto no encontrado")
        
        cliente = db.query(UsuarioDB).filter(UsuarioDB.id == proyecto.cliente_id).first()
        cliente_info = {
            "id": cliente.id,
            "nombre": cliente.nombre,
            "correo": cliente.correo
        } if cliente else None
        
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
        
        especialidad_mostrar = ESPECIALIDADES_CODIGO_A_NOMBRE.get(subtarea.especialidad, subtarea.especialidad)
        
        return {
            "exito": True,
            "subtarea": {
                "id": subtarea.id,
                "codigo": subtarea.codigo,
                "titulo": subtarea.titulo,
                "descripcion": subtarea.descripcion,
                "especialidad": especialidad_mostrar,
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


@router.put("/{subtarea_id}/actualizar-presupuesto")
def actualizar_presupuesto_subtarea(
    subtarea_id: int,
    data: PresupuestoUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza el presupuesto de una sub-tarea.
    """
    try:
        subtarea = db.query(SubTarea).filter(SubTarea.id == subtarea_id).first()
        if not subtarea:
            raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
        
        if data.presupuesto < 0:
            raise HTTPException(status_code=400, detail="El presupuesto no puede ser negativo")
        
        subtarea.presupuesto = data.presupuesto
        subtarea.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(subtarea)
        
        print(f"✅ Presupuesto de sub-tarea {subtarea.codigo} actualizado a ${data.presupuesto}")
        
        return {
            "exito": True,
            "mensaje": "Presupuesto actualizado exitosamente",
            "subtarea_id": subtarea.id,
            "nuevo_presupuesto": float(subtarea.presupuesto)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ Error actualizando presupuesto: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))