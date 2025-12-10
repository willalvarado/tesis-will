from sqlalchemy import Column, Integer, ForeignKey, DateTime, Text, Enum, Numeric
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class EstadoOferta(str, enum.Enum):
    PENDIENTE = "PENDIENTE"  # Esperando revisión del cliente
    ACEPTADA = "ACEPTADA"  # Cliente aceptó la oferta
    RECHAZADA = "RECHAZADA"  # Cliente rechazó la oferta
    RETIRADA = "RETIRADA"  # Vendedor retiró la oferta

class Oferta(Base):
    __tablename__ = "ofertas"

    id = Column(Integer, primary_key=True, index=True)
    requerimiento_id = Column(Integer, ForeignKey("requerimientos.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)  # 🔥 CORREGIDO: vendedores.id
    
    # Propuesta del vendedor
    mensaje = Column(Text, nullable=False)  # Mensaje del vendedor
    presupuesto = Column(Numeric(10, 2), nullable=False)  # Precio ofertado
    tiempo_estimado = Column(Integer, nullable=False)  # Días estimados
    
    # Estado de la oferta
    estado = Column(Enum(EstadoOferta), default=EstadoOferta.PENDIENTE)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    requerimiento = relationship("Requerimiento", back_populates="ofertas")
    # 🔥 NOTA: La relación con Vendedor la configuramos después

    def __repr__(self):
        return f"<Oferta(id={self.id}, vendedor_id={self.vendedor_id}, estado='{self.estado}')>"