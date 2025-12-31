from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# 🆕 Enum para estados de solicitudes
class EstadoSolicitud(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    ACEPTADA = "ACEPTADA"
    RECHAZADA = "RECHAZADA"

class SolicitudSubtarea(Base):
    __tablename__ = "solicitudes_subtarea"

    id = Column(Integer, primary_key=True, index=True)
    subtarea_id = Column(Integer, ForeignKey("sub_tareas.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)
    
    # Estado y mensaje
    estado = Column(Enum(EstadoSolicitud), default=EstadoSolicitud.PENDIENTE)
    mensaje = Column(Text, nullable=True)  # Mensaje del vendedor al solicitar
    motivo_rechazo = Column(Text, nullable=True)  # Razón si el cliente rechaza
    
    # Fechas
    fecha_solicitud = Column(DateTime, default=datetime.utcnow)
    fecha_respuesta = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    subtarea = relationship("SubTarea", backref="solicitudes")
    vendedor = relationship("Vendedor", backref="solicitudes_enviadas")

    def __repr__(self):
        return f"<SolicitudSubtarea(id={self.id}, subtarea_id={self.subtarea_id}, estado='{self.estado}')>"