from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# Enum para los estados del requerimiento
class EstadoRequerimiento(str, enum.Enum):
    PENDIENTE = "pendiente"
    ASIGNADO = "asignado"
    EN_PROCESO = "en_proceso"
    COMPLETADO = "completado"
    CANCELADO = "cancelado"

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
    vendedor_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    
    # Información del requerimiento
    titulo = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=False)
    descripcion = Column(Text, nullable=True)
    especialidad = Column(Enum(EspecialidadEnum), default=EspecialidadEnum.OTRO)
    estado = Column(Enum(EstadoRequerimiento), default=EstadoRequerimiento.PENDIENTE)
    
    # Timestamps
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    cliente = relationship("UsuarioDB", foreign_keys=[cliente_id], back_populates="requerimientos_creados")
    vendedor = relationship("UsuarioDB", foreign_keys=[vendedor_id], back_populates="requerimientos_asignados")
