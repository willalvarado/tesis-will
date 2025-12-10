from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# Enum para los estados del requerimiento
class EstadoRequerimiento(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    ANALISIS = "ANÁLISIS"  # IA está procesando la solicitud
    PUBLICADO = "PUBLICADO"  # Esperando ofertas de vendedores
    CON_OFERTAS = "CON_OFERTAS"  # Hay ofertas pendientes de revisión
    ASIGNADO = "ASIGNADO"
    ACEPTADO = "ACEPTADO"  # Cliente aceptó una oferta → se convirtió en proyecto
    RECHAZADO = "RECHAZADO"  # Cliente rechazó todas las ofertas
    CANCELADO = "CANCELADO"  # Cliente canceló el requerimiento

# Enum para las especialidades CPC (Clasificación Central de Productos)
class EspecialidadEnum(str, enum.Enum):
    # Consultoría en TI
    CONSULTORIA_DESARROLLO = "Consultoría en desarrollo de sistemas"
    CONSULTORIA_HARDWARE = "Consultoría en hardware"
    CONSULTORIA_SOFTWARE = "Consultoría en software"
    
    # Desarrollo de software
    DESARROLLO_MEDIDA = "Desarrollo de software a medida"
    SOFTWARE_EMPAQUETADO = "Desarrollo y producción de software empaquetado"
    ACTUALIZACION_SOFTWARE = "Actualización y adaptación de software"
    
    # Tratamiento de datos, alojamiento y nube
    HOSTING = "Servicios de alojamiento de datos (hosting)"
    PROCESAMIENTO_DATOS = "Servicios de procesamiento de datos"
    CLOUD_COMPUTING = "Servicios en la nube (cloud computing)"
    
    # Otros servicios de TI
    RECUPERACION_DESASTRES = "Servicios de recuperación ante desastres"
    CIBERSEGURIDAD = "Servicios de ciberseguridad"
    CAPACITACION_TI = "Capacitación en TI"
    
    OTRO = "Otro"

class Requerimiento(Base):
    __tablename__ = "requerimientos"

    id = Column(Integer, primary_key=True, index=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)  # NULL hasta que se acepte oferta
    
    # Información del requerimiento
    titulo = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=False)  # Mensaje original del cliente
    descripcion = Column(Text, nullable=True)  # Descripción procesada por la IA
    especialidad = Column(Enum(EspecialidadEnum), default=EspecialidadEnum.OTRO)
    estado = Column(Enum(EstadoRequerimiento), default=EstadoRequerimiento.ANALISIS)
    
    # 🆕 Campos adicionales generados por la IA
    historia_usuario = Column(Text, nullable=True)  # Historia de usuario generada
    criterios_aceptacion = Column(Text, nullable=True)  # JSON con criterios
    diagrama_flujo = Column(Text, nullable=True)  # Mermaid diagram
    
    # Timestamps
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    cliente = relationship("UsuarioDB", foreign_keys=[cliente_id], back_populates="requerimientos_creados")
    vendedor = relationship("UsuarioDB", foreign_keys=[vendedor_id], back_populates="requerimientos_asignados")
    
    # 🔥 CORREGIDO: Usar string "Oferta" en lugar de clase directa
      #  ofertas = relationship("Oferta", back_populates="requerimiento", cascade="all, delete-orphan")
    
    # 🔥 CORREGIDO: Usar string "Proyecto"
    proyecto = relationship("Proyecto", back_populates="requerimiento", uselist=False)

    def __repr__(self):
        return f"<Requerimiento(id={self.id}, titulo='{self.titulo}', estado='{self.estado}')>"