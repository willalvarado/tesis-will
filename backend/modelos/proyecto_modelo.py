from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Numeric, ARRAY
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

# 🆕 Enum para las fases del proyecto
class FaseProyecto(str, enum.Enum):
    ANALISIS = "ANÁLISIS"  # Creando con IA, aún no publicado
    PUBLICADO = "PUBLICADO"  # Sub-tareas publicadas, esperando vendedores
    EN_PROGRESO = "EN_PROGRESO"  # Al menos una sub-tarea asignada
    COMPLETADO = "COMPLETADO"  # Todas las sub-tareas completadas
    CANCELADO = "CANCELADO"

class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True)
    requerimiento_id = Column(Integer, ForeignKey("requerimientos.id"), nullable=True)  # 🔥 Ahora opcional
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)  # 🔥 Ahora opcional (múltiples vendedores)
    
    # Información del proyecto
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    especialidad = Column(String(100), nullable=False)
    estado = Column(Enum(EstadoProyecto), default=EstadoProyecto.ASIGNADO)
    
    # 🆕 NUEVOS CAMPOS - Levantamiento de requerimientos
    historia_usuario = Column(Text)  # "Como [rol], quiero [objetivo], para [beneficio]"
    criterios_aceptacion = Column(ARRAY(Text))  # Array de criterios
    diagrama_flujo = Column(Text)  # URL o descripción del flujo
    fase = Column(Enum(FaseProyecto), default=FaseProyecto.ANALISIS)  # 🔥 Fase del proyecto
    
    # 🆕 NUEVOS CAMPOS - Gestión de sub-tareas
    total_subtareas = Column(Integer, default=0)
    subtareas_completadas = Column(Integer, default=0)
    
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
    
    # 🔥 RELACIONES ACTUALIZADAS
requerimiento = relationship("Requerimiento", backref="proyecto")
cliente = relationship("UsuarioDB", foreign_keys="Proyecto.cliente_id", backref="proyectos_como_cliente")
vendedor = relationship("Vendedor", foreign_keys="Proyecto.vendedor_id", backref="proyectos_como_vendedor")

# 🆕 NUEVAS RELACIONES - SIN back_populates para evitar errores circulares
sub_tareas = relationship("SubTarea", cascade="all, delete-orphan", lazy="dynamic")
analisis = relationship("AnalisisIA", cascade="all, delete-orphan", lazy="dynamic")
conversaciones = relationship("ConversacionChat", cascade="all, delete-orphan", lazy="dynamic")
    