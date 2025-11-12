from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class EstadoSubTarea(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    ASIGNADO = "ASIGNADO"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADO = "COMPLETADO"
    CANCELADO = "CANCELADO"

class PrioridadSubTarea(str, enum.Enum):
    ALTA = "ALTA"
    MEDIA = "MEDIA"
    BAJA = "BAJA"

class SubTarea(Base):
    __tablename__ = "sub_tareas"
    
    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    codigo = Column(String(20), unique=True, nullable=False)
    titulo = Column(String(255), nullable=False)
    descripcion = Column(Text)
    especialidad = Column(String(100), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id", ondelete="SET NULL"))
    estado = Column(SQLEnum(EstadoSubTarea), default=EstadoSubTarea.PENDIENTE)
    prioridad = Column(SQLEnum(PrioridadSubTarea), default=PrioridadSubTarea.MEDIA)
    presupuesto = Column(Numeric(10, 2), default=0.00)
    pagado = Column(Numeric(10, 2), default=0.00)
    estimacion_horas = Column(Integer)
    fecha_asignacion = Column(DateTime)
    fecha_inicio = Column(DateTime)
    fecha_completado = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    proyecto = relationship("Proyecto", backref="sub_tareas_list")
    vendedor = relationship("Vendedor")