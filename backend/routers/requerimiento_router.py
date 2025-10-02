from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from modelos.requerimiento_model import Requerimiento, EstadoRequerimiento, EspecialidadEnum
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(
    prefix="/requerimientos",
    tags=["Requerimientos"]
)

# Schemas Pydantic
class RequerimientoCreate(BaseModel):
    mensaje: str
    cliente_id: int

class RequerimientoResponse(BaseModel):
    id: int
    cliente_id: int
    vendedor_id: int | None
    titulo: str
    mensaje: str
    descripcion: str | None
    especialidad: str
    estado: str
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class RequerimientoUpdate(BaseModel):
    estado: str | None = None
    vendedor_id: int | None = None

# Endpoints

@router.post("/crear", response_model=RequerimientoResponse)
def crear_requerimiento(req: RequerimientoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo requerimiento"""
    nuevo_req = Requerimiento(
        cliente_id=req.cliente_id,
        titulo="Nuevo requerimiento",
        mensaje=req.mensaje,
        descripcion=None,
        especialidad=EspecialidadEnum.OTRO,
        estado=EstadoRequerimiento.PENDIENTE
    )
    db.add(nuevo_req)
    db.commit()
    db.refresh(nuevo_req)
    return nuevo_req

@router.get("/cliente/{cliente_id}", response_model=List[RequerimientoResponse])
def obtener_requerimientos_por_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene los requerimientos creados por un cliente específico"""
    return db.query(Requerimiento).filter(
        Requerimiento.cliente_id == cliente_id
    ).order_by(Requerimiento.fecha_creacion.desc()).all()

@router.get("/vendedor/disponibles", response_model=List[RequerimientoResponse])
def obtener_requerimientos_disponibles(
    especialidad: str | None = None,
    db: Session = Depends(get_db)
):
    """Obtiene requerimientos disponibles para vendedores (sin asignar)"""
    query = db.query(Requerimiento).filter(
        Requerimiento.estado == EstadoRequerimiento.PENDIENTE,
        Requerimiento.vendedor_id == None
    )
    if especialidad:
        query = query.filter(Requerimiento.especialidad == especialidad)
    return query.order_by(Requerimiento.fecha_creacion.desc()).all()

@router.get("/vendedor/{vendedor_id}", response_model=List[RequerimientoResponse])
def obtener_requerimientos_por_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    """Obtiene los requerimientos asignados a un vendedor"""
    return db.query(Requerimiento).filter(
        Requerimiento.vendedor_id == vendedor_id
    ).order_by(Requerimiento.fecha_creacion.desc()).all()

from fastapi import Query

@router.put("/{requerimiento_id}/asignar")
def asignar_requerimiento(
    requerimiento_id: int,
    vendedor_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """Asigna un requerimiento a un vendedor"""
    req = db.query(Requerimiento).filter(Requerimiento.id == requerimiento_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    if req.vendedor_id:
        raise HTTPException(status_code=400, detail="Requerimiento ya asignado")

    req.vendedor_id = vendedor_id
    req.estado = EstadoRequerimiento.ASIGNADO
    db.commit()
    db.refresh(req)
    return req


@router.put("/{requerimiento_id}/estado")
def cambiar_estado_requerimiento(
    requerimiento_id: int,
    nuevo_estado: str = Query(...),
    db: Session = Depends(get_db)
):
    """Cambia el estado de un requerimiento"""
    req = db.query(Requerimiento).filter(Requerimiento.id == requerimiento_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")

    req.estado = nuevo_estado
    db.commit()
    db.refresh(req)
    return req