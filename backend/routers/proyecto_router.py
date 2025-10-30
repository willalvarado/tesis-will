from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from modelos.proyecto_modelo import Proyecto, EstadoProyecto
from modelos.usuario_modelo import UsuarioDB  # Importar modelo Usuario
from Vendedores.vendedor_modelo import Vendedor as VendedorDB  # Usar modelo existente
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

router = APIRouter(
    prefix="/proyectos",
    tags=["Proyectos"]
)

# NUEVO: Schema para cliente con nombre
class ClienteInfo(BaseModel):
    id: int
    nombre: str
    email: str | None = None
    
    class Config:
        from_attributes = True

# NUEVO: Schema para vendedor con nombre
class VendedorInfo(BaseModel):
    id: int
    nombre: str
    email: str | None = None
    
    class Config:
        from_attributes = True

# Schema modificado con información de cliente y vendedor
class ProyectoResponse(BaseModel):
    id: int
    requerimiento_id: int
    cliente_id: int
    vendedor_id: int
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
    # NUEVO: Información del cliente y vendedor
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

# Endpoints

@router.get("/cliente/{cliente_id}", response_model=List[ProyectoResponse])
def obtener_proyectos_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los proyectos de un cliente CON nombre del vendedor"""
    # MODIFICADO: Hacer join con la tabla de vendedores
    proyectos = db.query(
        Proyecto,
        VendedorDB.nombre.label('vendedor_nombre'),
        VendedorDB.correo.label('vendedor_email')
    ).join(
        VendedorDB, Proyecto.vendedor_id == VendedorDB.id
    ).filter(
        Proyecto.cliente_id == cliente_id
    ).order_by(Proyecto.created_at.desc()).all()
    
    # Construir la respuesta con la info del vendedor
    resultado = []
    for proyecto, vendedor_nombre, vendedor_email in proyectos:
        proyecto_dict = {
            **proyecto.__dict__,
            'vendedor': {
                'id': proyecto.vendedor_id,
                'nombre': vendedor_nombre,
                'email': vendedor_email
            }
        }
        resultado.append(proyecto_dict)
    
    return resultado

@router.get("/vendedor/{vendedor_id}", response_model=List[ProyectoResponse])
def obtener_proyectos_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los proyectos de un vendedor CON nombre del cliente"""
    # MODIFICADO: Hacer join con la tabla de usuarios (clientes)
    proyectos = db.query(
        Proyecto,
        UsuarioDB.nombre.label('cliente_nombre'),
        UsuarioDB.correo.label('cliente_email')
    ).join(
        UsuarioDB, Proyecto.cliente_id == UsuarioDB.id
    ).filter(
        Proyecto.vendedor_id == vendedor_id
    ).order_by(Proyecto.created_at.desc()).all()
    
    # Construir la respuesta con la info del cliente
    resultado = []
    for proyecto, cliente_nombre, cliente_email in proyectos:
        proyecto_dict = {
            **proyecto.__dict__,
            'cliente': {
                'id': proyecto.cliente_id,
                'nombre': cliente_nombre,
                'email': cliente_email
            }
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