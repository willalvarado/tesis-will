from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class MensajeChat(Base):
    """Modelo para los mensajes del chat entre cliente y vendedor"""
    __tablename__ = "mensajes_chat"
    
    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey('proyectos.id', ondelete='CASCADE'), nullable=False)
    remitente_id = Column(Integer, nullable=False)  # ID del usuario o vendedor
    remitente_tipo = Column(String(20), nullable=False)  # 'cliente' o 'vendedor'
    contenido = Column(Text, nullable=False)
    leido = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())