from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class MensajeChat(Base):
    """Modelo para los mensajes del chat entre cliente y vendedor"""
    __tablename__ = "mensajes_chat"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # 🔥 NUEVO: Ahora puede ser de proyecto O de sub-tarea
    proyecto_id = Column(Integer, ForeignKey('proyectos.id', ondelete='CASCADE'), nullable=True)
    subtarea_id = Column(Integer, ForeignKey('sub_tareas.id', ondelete='CASCADE'), nullable=True)
    
    remitente_id = Column(Integer, nullable=False)
    remitente_tipo = Column(String(20), nullable=False)  # 'cliente' o 'vendedor'
    contenido = Column(Text, nullable=False)
    leido = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<MensajeChat(id={self.id}, remitente_tipo='{self.remitente_tipo}')>"


class ArchivoSubtarea(Base):
    """Modelo para archivos subidos en el chat de sub-tareas"""
    __tablename__ = "archivos_subtarea"
    
    id = Column(Integer, primary_key=True, index=True)
    subtarea_id = Column(Integer, ForeignKey('sub_tareas.id', ondelete='CASCADE'), nullable=False)
    
    subido_por_id = Column(Integer, nullable=False)
    subido_por_tipo = Column(String(20), nullable=False)
    
    nombre_original = Column(String(255), nullable=False)
    nombre_guardado = Column(String(255), nullable=False, unique=True)
    ruta = Column(String(500), nullable=False)
    tamaño = Column(Integer, nullable=False)  # 🔥 CON Ñ (como está en la BD)
    tipo_mime = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ArchivoSubtarea(id={self.id}, nombre='{self.nombre_original}')>"