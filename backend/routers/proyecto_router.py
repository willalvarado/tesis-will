# backend/routers/proyecto_router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from typing import List
from database import get_db
from modelos.proyecto_modelo import Proyecto, EstadoProyecto, SubTarea
from modelos.usuario_modelo import UsuarioDB
from Vendedores.vendedor_modelo import Vendedor as VendedorDB
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

router = APIRouter(
    prefix="/proyectos",
    tags=["Proyectos"]
)

# Schema para cliente con nombre
class ClienteInfo(BaseModel):
    id: int
    nombre: str
    email: str | None = None
    
    class Config:
        from_attributes = True

# Schema para vendedor con nombre
class VendedorInfo(BaseModel):
    id: int
    nombre: str
    email: str | None = None
    
    class Config:
        from_attributes = True

# Schema modificado con información de cliente y vendedor
class ProyectoResponse(BaseModel):
    id: int
    requerimiento_id: int | None = None
    cliente_id: int
    vendedor_id: int | None = None
    titulo: str
    descripcion: str | None
    especialidad: str
    estado: str
    progreso: int
    presupuesto: float
    pagado: float
    fecha_inicio: datetime
    fecha_estimada: datetime | None
    fecha_completado: datetime | None
    created_at: datetime
    updated_at: datetime
    
    # Campos nuevos (todos opcionales)
    total_subtareas: int | None = None
    subtareas_completadas: int | None = None
    fase: str | None = None
    historia_usuario: str | None = None
    
    # Información del cliente y vendedor
    cliente: ClienteInfo | None = None
    vendedor: VendedorInfo | None = None
    
    class Config:
        from_attributes = True

class ProyectoUpdate(BaseModel):
    estado: str | None = None
    progreso: int | None = None
    pagado: float | None = None
    fecha_estimada: datetime | None = None
    presupuesto: float | None = None

# ========================================
# ENDPOINTS
# ========================================

@router.get("/cliente/{cliente_id}", response_model=List[ProyectoResponse])
def obtener_proyectos_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los proyectos de un cliente CON nombre del vendedor (si existe)"""
    
    # LEFT JOIN para que traiga proyectos SIN vendedor también
    proyectos = db.query(
        Proyecto,
        VendedorDB.nombre.label('vendedor_nombre'),
        VendedorDB.correo.label('vendedor_email')
    ).outerjoin(
        VendedorDB, Proyecto.vendedor_id == VendedorDB.id
    ).filter(
        Proyecto.cliente_id == cliente_id
    ).order_by(Proyecto.created_at.desc()).all()
    
    # Construir la respuesta con la info del vendedor (puede ser None)
    resultado = []
    for proyecto, vendedor_nombre, vendedor_email in proyectos:
        vendedor_info = None
        if proyecto.vendedor_id and vendedor_nombre:
            vendedor_info = {
                'id': proyecto.vendedor_id,
                'nombre': vendedor_nombre,
                'email': vendedor_email
            }
        
        proyecto_dict = {
            **proyecto.__dict__,
            'vendedor': vendedor_info
        }
        resultado.append(proyecto_dict)
    
    return resultado


@router.get("/vendedor/{vendedor_id}", response_model=List[ProyectoResponse])
def obtener_proyectos_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    """
    Obtiene proyectos donde el vendedor tiene sub-tareas asignadas.
    NUEVO: Sistema con sub-tareas - un proyecto puede tener múltiples vendedores.
    """
    
    print(f"🔍 Buscando proyectos para vendedor {vendedor_id}...")
    
    # Obtener IDs de proyectos donde el vendedor tiene sub-tareas
    proyectos_ids = db.query(distinct(SubTarea.proyecto_id)).filter(
        SubTarea.vendedor_id == vendedor_id
    ).subquery()
    
    # Obtener proyectos con info del cliente
    proyectos = db.query(
        Proyecto,
        UsuarioDB.nombre.label('cliente_nombre'),
        UsuarioDB.correo.label('cliente_email')
    ).join(
        UsuarioDB, Proyecto.cliente_id == UsuarioDB.id
    ).filter(
        Proyecto.id.in_(proyectos_ids)
    ).order_by(Proyecto.created_at.desc()).all()
    
    print(f"📊 Vendedor {vendedor_id}: {len(proyectos)} proyectos encontrados")
    
    # Construir respuesta con info del cliente
    resultado = []
    for proyecto, cliente_nombre, cliente_email in proyectos:
        proyecto_dict = {
            **proyecto.__dict__,
            'cliente': {
                'id': proyecto.cliente_id,
                'nombre': cliente_nombre,
                'email': cliente_email
            },
            'vendedor': None  # En el nuevo sistema no hay vendedor único por proyecto
        }
        resultado.append(proyecto_dict)
    
    return resultado


@router.get("/{proyecto_id}", response_model=ProyectoResponse)
def obtener_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    """Obtiene el detalle de un proyecto específico"""
    proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return proyecto


@router.put("/{proyecto_id}", response_model=ProyectoResponse)
def actualizar_proyecto(
    proyecto_id: int,
    update_data: ProyectoUpdate,
    db: Session = Depends(get_db)
):
    """Actualiza los datos de un proyecto (progreso, pagado, estado, etc.)"""
    proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Actualizar solo los campos proporcionados
    if update_data.estado is not None:
        proyecto.estado = update_data.estado
        # Si se marca como completado, guardar la fecha
        if update_data.estado == EstadoProyecto.COMPLETADO and not proyecto.fecha_completado:
            proyecto.fecha_completado = datetime.utcnow()
    
    if update_data.progreso is not None:
        if 0 <= update_data.progreso <= 100:
            proyecto.progreso = update_data.progreso
        else:
            raise HTTPException(status_code=400, detail="El progreso debe estar entre 0 y 100")
    
    if update_data.pagado is not None:
        if update_data.pagado >= 0:
            proyecto.pagado = Decimal(str(update_data.pagado))
        else:
            raise HTTPException(status_code=400, detail="El monto pagado no puede ser negativo")
    
    if update_data.fecha_estimada is not None:
        proyecto.fecha_estimada = update_data.fecha_estimada
    
    if update_data.presupuesto is not None:
        if update_data.presupuesto >= 0:
            proyecto.presupuesto = Decimal(str(update_data.presupuesto))
        else:
            raise HTTPException(status_code=400, detail="El presupuesto no puede ser negativo")
    
    db.commit()
    db.refresh(proyecto)
    return proyecto


@router.delete("/{proyecto_id}")
def eliminar_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    """Elimina un proyecto (normalmente no se usa, mejor cambiar estado a cancelado)"""
    proyecto = db.query(Proyecto).filter(Proyecto.id == proyecto_id).first()
    if not proyecto:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    db.delete(proyecto)
    db.commit()
    return {"message": "Proyecto eliminado exitosamente"}