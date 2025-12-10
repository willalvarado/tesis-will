from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Enum, Numeric, ARRAY
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# Enum para los estados del proyecto (para proyectos viejos)
class EstadoProyecto(str, enum.Enum):
    ASIGNADO = "ASIGNADO"
    EN_PROCESO = "EN_PROCESO"
    PAUSADO = "PAUSADO"
    COMPLETADO = "COMPLETADO"
    CANCELADO = "CANCELADO"

# 🆕 Enum para las fases del proyecto (para proyectos nuevos con IA)
class FaseProyecto(str, enum.Enum):
    ANALISIS = "ANALISIS"  # 🔥 SIN TILDE
    PUBLICADO = "PUBLICADO"
    EN_PROGRESO = "EN_PROGRESO"
    COMPLETADO = "COMPLETADO"
    CANCELADO = "CANCELADO"

# 🆕 Enum para los estados de las sub-tareas
class EstadoSubTarea(str, enum.Enum):
    PENDIENTE = "PENDIENTE"
    ASIGNADA = "ASIGNADA"
    EN_PROGRESO = "EN_PROGRESO"
    EN_REVISION = "EN_REVISION"
    COMPLETADO = "COMPLETADO"
    RECHAZADO = "RECHAZADO"
    CANCELADO = "CANCELADO"

class Proyecto(Base):
    __tablename__ = "proyectos"

    id = Column(Integer, primary_key=True, index=True)
    requerimiento_id = Column(Integer, ForeignKey("requerimientos.id"), nullable=True)
    cliente_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)
    
    # Información del proyecto
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=True)
    especialidad = Column(String(100), nullable=False)
    estado = Column(Enum(EstadoProyecto), default=EstadoProyecto.ASIGNADO)
    
    # 🆕 LEVANTAMIENTO DE REQUERIMIENTOS
    historia_usuario = Column(Text, nullable=True)
    criterios_aceptacion = Column(ARRAY(Text), nullable=True)
    diagrama_flujo = Column(Text, nullable=True)
    fase = Column(Enum(FaseProyecto), default=FaseProyecto.ANALISIS)
    
    # 🔥 CONTADORES DE SUB-TAREAS (NUEVOS)
    total_subtareas = Column(Integer, default=0, nullable=False)
    subtareas_completadas = Column(Integer, default=0, nullable=False)
    
    # Gestión del proyecto
    progreso = Column(Integer, default=0)
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
    requerimiento = relationship("Requerimiento", back_populates="proyecto")
    cliente = relationship("UsuarioDB", foreign_keys=[cliente_id], back_populates="proyectos_como_cliente")
    vendedor = relationship("Vendedor", foreign_keys=[vendedor_id], back_populates="proyectos_como_vendedor")
    sub_tareas = relationship("SubTarea", back_populates="proyecto", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Proyecto(id={self.id}, titulo='{self.titulo}', fase='{self.fase}')>"


class SubTarea(Base):
    __tablename__ = "sub_tareas"

    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id"), nullable=False)
    codigo = Column(String(50), unique=True, nullable=False)
    
    # Información
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    especialidad = Column(String(100), nullable=False)
    
    # Asignación
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=True)
    estado = Column(Enum(EstadoSubTarea), default=EstadoSubTarea.PENDIENTE)
    prioridad = Column(String(20), default="MEDIA")
    
    # Gestión
    presupuesto = Column(Numeric(10, 2), default=0.0)
    pagado = Column(Numeric(10, 2), default=0.0)
    estimacion_horas = Column(Integer, nullable=True)
    
    # Fechas
    fecha_asignacion = Column(DateTime, nullable=True)
    fecha_inicio = Column(DateTime, nullable=True)
    fecha_completado = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    proyecto = relationship("Proyecto", back_populates="sub_tareas")
    vendedor = relationship("Vendedor", back_populates="subtareas_asignadas")

    def __repr__(self):
        return f"<SubTarea(id={self.id}, codigo='{self.codigo}', estado='{self.estado}')>"