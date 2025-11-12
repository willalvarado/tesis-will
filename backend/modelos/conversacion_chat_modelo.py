from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

class TipoConversacion(str, enum.Enum):
    ANALISIS = "ANALISIS"  # Chat con IA
    PROYECTO = "PROYECTO"  # Chat con vendedor

class EmisorMensaje(str, enum.Enum):
    CLIENTE = "CLIENTE"
    VENDEDOR = "VENDEDOR"
    IA = "IA"

class ConversacionChat(Base):
    __tablename__ = "conversaciones_chat"
    
    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"))
    cliente_id = Column(Integer, ForeignKey("usuarios.id", ondelete="CASCADE"), nullable=False)
    tipo = Column(String(20), default="ANALISIS")
    participante_id = Column(Integer, ForeignKey("vendedores.id", ondelete="SET NULL"))
    mensaje = Column(Text, nullable=False)
    emisor = Column(String(20), nullable=False)
    metadatos = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # 🔥 RELATIONSHIPS - AGREGAR back_populates
    # Nota: Usamos strings para evitar imports circulares