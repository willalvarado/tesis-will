from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Numeric
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# Enum para los estados del proyecto
class EstadoProyecto(str, enum.Enum):
    ASIGNADO = "asignado"
    EN_PROCESO = "en_proceso"
    PAUSADO = "pausado"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"

class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True)
    requerimiento_id = Column(Integer, ForeignKey("requerimientos.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    
    # Información del proyecto
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    especialidad = Column(String(100), nullable=False)
    estado = Column(Enum(EstadoProyecto), default=EstadoProyecto.ASIGNADO)
    
    # Gestión del proyecto
    progreso = Column(Integer, default=0)  # 0-100%
    presupuesto = Column(Numeric(10, 2), default=0.0)
    pagado = Column(Numeric(10, 2), default=0.0)
    
    # Fechas
    fecha_inicio = Column(DateTime, default=datetime.utcnow)
    fecha_estimada = Column(DateTime, nullable=True)
    fecha_completado = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    requerimiento = relationship("Requerimiento", backref="proyecto")
    cliente = relationship("UsuarioDB", foreign_keys=[cliente_id], backref="proyectos_como_cliente")
    vendedor = relationship("UsuarioDB", foreign_keys=[vendedor_id], backref="proyectos_como_vendedor")