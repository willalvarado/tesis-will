from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from modelos.solicitud_modelo import SolicitudSubtarea, EstadoSolicitud
from modelos.proyecto_modelo import SubTarea, EstadoSubTarea
from Vendedores.vendedor_modelo import Vendedor
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/solicitudes", tags=["Solicitudes"])

# ========================================
# SCHEMAS (Pydantic)
# ========================================

class SolicitudCreate(BaseModel):
    subtarea_id: int
    vendedor_id: int
    mensaje: Optional[str] = None

class SolicitudResponse(BaseModel):
    id: int
    subtarea_id: int
    vendedor_id: int
    estado: str
    mensaje: Optional[str]
    motivo_rechazo: Optional[str]
    fecha_solicitud: datetime
    fecha_respuesta: Optional[datetime]
    
    subtarea_codigo: Optional[str] = None
    subtarea_titulo: Optional[str] = None
    vendedor_nombre: Optional[str] = None
    vendedor_email: Optional[str] = None

    class Config:
        from_attributes = True

class ResponderSolicitud(BaseModel):
    accion: str
    motivo_rechazo: Optional[str] = None

# ========================================
# ENDPOINTS
# ========================================

@router.post("/enviar", response_model=SolicitudResponse)
def enviar_solicitud(solicitud: SolicitudCreate, db: Session = Depends(get_db)):
    """
    🔥 VENDEDOR: Envía solicitud para aceptar una sub-tarea
    """
    
    subtarea = db.query(SubTarea).filter(SubTarea.id == solicitud.subtarea_id).first()
    if not subtarea:
        raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
    
    # 🔥 CAMBIADO: Verificar solo PENDIENTE (no SOLICITADA)
    if subtarea.estado != EstadoSubTarea.PENDIENTE:
        raise HTTPException(status_code=400, detail="Esta sub-tarea ya no está disponible")
    
    solicitud_existente = db.query(SolicitudSubtarea).filter(
        SolicitudSubtarea.subtarea_id == solicitud.subtarea_id,
        SolicitudSubtarea.vendedor_id == solicitud.vendedor_id,
        SolicitudSubtarea.estado == EstadoSolicitud.PENDIENTE
    ).first()
    
    if solicitud_existente:
        raise HTTPException(status_code=400, detail="Ya enviaste una solicitud para esta sub-tarea")
    
    nueva_solicitud = SolicitudSubtarea(
        subtarea_id=solicitud.subtarea_id,
        vendedor_id=solicitud.vendedor_id,
        mensaje=solicitud.mensaje,
        estado=EstadoSolicitud.PENDIENTE
    )
    
    db.add(nueva_solicitud)
    
    # 🔥 ELIMINADO: NO cambiar estado de la sub-tarea
    # La sub-tarea SIGUE en PENDIENTE para que otros vendedores la vean
    
    db.commit()
    db.refresh(nueva_solicitud)
    
    return {
        "id": nueva_solicitud.id,
        "subtarea_id": nueva_solicitud.subtarea_id,
        "vendedor_id": nueva_solicitud.vendedor_id,
        "estado": nueva_solicitud.estado,
        "mensaje": nueva_solicitud.mensaje,
        "motivo_rechazo": nueva_solicitud.motivo_rechazo,
        "fecha_solicitud": nueva_solicitud.fecha_solicitud,
        "fecha_respuesta": nueva_solicitud.fecha_respuesta,
        "subtarea_codigo": subtarea.codigo,
        "subtarea_titulo": subtarea.titulo
    }


@router.get("/proyecto/{proyecto_id}", response_model=List[SolicitudResponse])
def obtener_solicitudes_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    """
    🔥 CLIENTE: Obtiene todas las solicitudes de un proyecto
    """
    
    subtareas = db.query(SubTarea).filter(SubTarea.proyecto_id == proyecto_id).all()
    subtareas_ids = [st.id for st in subtareas]
    
    if not subtareas_ids:
        return []
    
    solicitudes = db.query(SolicitudSubtarea).filter(
        SolicitudSubtarea.subtarea_id.in_(subtareas_ids),
        SolicitudSubtarea.estado == EstadoSolicitud.PENDIENTE
    ).all()
    
    resultado = []
    for sol in solicitudes:
        subtarea = db.query(SubTarea).filter(SubTarea.id == sol.subtarea_id).first()
        vendedor = db.query(Vendedor).filter(Vendedor.id == sol.vendedor_id).first()
        
        resultado.append({
            "id": sol.id,
            "subtarea_id": sol.subtarea_id,
            "vendedor_id": sol.vendedor_id,
            "estado": sol.estado,
            "mensaje": sol.mensaje,
            "motivo_rechazo": sol.motivo_rechazo,
            "fecha_solicitud": sol.fecha_solicitud,
            "fecha_respuesta": sol.fecha_respuesta,
            "subtarea_codigo": subtarea.codigo if subtarea else None,
            "subtarea_titulo": subtarea.titulo if subtarea else None,
            "vendedor_nombre": vendedor.nombre if vendedor else None,
            "vendedor_email": vendedor.correo if vendedor else None
        })
    
    return resultado


@router.put("/{solicitud_id}/responder")
def responder_solicitud(solicitud_id: int, respuesta: ResponderSolicitud, db: Session = Depends(get_db)):
    """
    🔥 CLIENTE: Acepta o rechaza una solicitud
    """
    
    solicitud = db.query(SolicitudSubtarea).filter(SolicitudSubtarea.id == solicitud_id).first()
    if not solicitud:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if solicitud.estado != EstadoSolicitud.PENDIENTE:
        raise HTTPException(status_code=400, detail="Esta solicitud ya fue respondida")
    
    subtarea = db.query(SubTarea).filter(SubTarea.id == solicitud.subtarea_id).first()
    if not subtarea:
        raise HTTPException(status_code=404, detail="Sub-tarea no encontrada")
    
    if respuesta.accion == "ACEPTAR":
        solicitud.estado = EstadoSolicitud.ACEPTADA
        solicitud.fecha_respuesta = datetime.utcnow()
        
        # Asignar la sub-tarea al vendedor
        subtarea.vendedor_id = solicitud.vendedor_id
        subtarea.estado = EstadoSubTarea.ASIGNADA
        subtarea.fecha_asignacion = datetime.utcnow()
        
        # Rechazar todas las demás solicitudes de esta sub-tarea
        otras_solicitudes = db.query(SolicitudSubtarea).filter(
            SolicitudSubtarea.subtarea_id == solicitud.subtarea_id,
            SolicitudSubtarea.id != solicitud_id,
            SolicitudSubtarea.estado == EstadoSolicitud.PENDIENTE
        ).all()
        
        for otra in otras_solicitudes:
            otra.estado = EstadoSolicitud.RECHAZADA
            otra.motivo_rechazo = "El cliente eligió a otro vendedor"
            otra.fecha_respuesta = datetime.utcnow()
        
        db.commit()
        
        return {
            "success": True,
            "message": "Solicitud aceptada y sub-tarea asignada",
            "vendedor_id": solicitud.vendedor_id,
            "subtarea_id": solicitud.subtarea_id
        }
    
    elif respuesta.accion == "RECHAZAR":
        solicitud.estado = EstadoSolicitud.RECHAZADA
        solicitud.motivo_rechazo = respuesta.motivo_rechazo
        solicitud.fecha_respuesta = datetime.utcnow()
        
        solicitudes_pendientes = db.query(SolicitudSubtarea).filter(
            SolicitudSubtarea.subtarea_id == solicitud.subtarea_id,
            SolicitudSubtarea.estado == EstadoSolicitud.PENDIENTE
        ).count()
        
        # 🔥 ELIMINADO: No cambiar estado de sub-tarea
        # La sub-tarea SIGUE en PENDIENTE para que sigan llegando solicitudes
        
        db.commit()
        
        return {
            "success": True,
            "message": "Solicitud rechazada",
            "solicitudes_restantes": solicitudes_pendientes
        }
    
    else:
        raise HTTPException(status_code=400, detail="Acción no válida. Use 'ACEPTAR' o 'RECHAZAR'")


@router.get("/vendedor/{vendedor_id}", response_model=List[SolicitudResponse])
def obtener_mis_solicitudes(vendedor_id: int, db: Session = Depends(get_db)):
    """
    🔥 VENDEDOR: Obtiene todas sus solicitudes enviadas
    """
    
    solicitudes = db.query(SolicitudSubtarea).filter(
        SolicitudSubtarea.vendedor_id == vendedor_id
    ).order_by(SolicitudSubtarea.fecha_solicitud.desc()).all()
    
    resultado = []
    for sol in solicitudes:
        subtarea = db.query(SubTarea).filter(SubTarea.id == sol.subtarea_id).first()
        
        resultado.append({
            "id": sol.id,
            "subtarea_id": sol.subtarea_id,
            "vendedor_id": sol.vendedor_id,
            "estado": sol.estado,
            "mensaje": sol.mensaje,
            "motivo_rechazo": sol.motivo_rechazo,
            "fecha_solicitud": sol.fecha_solicitud,
            "fecha_respuesta": sol.fecha_respuesta,
            "subtarea_codigo": subtarea.codigo if subtarea else None,
            "subtarea_titulo": subtarea.titulo if subtarea else None
        })
    
    return resultado