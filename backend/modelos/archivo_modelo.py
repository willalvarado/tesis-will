from sqlalchemy import Column, Integer, String, BigInteger, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base

class ArchivoProyecto(Base):
    """Modelo para archivos subidos en los proyectos"""
    __tablename__ = "archivos_proyecto"
    
    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey('proyectos.id', ondelete='CASCADE'), nullable=False)
    nombre_original = Column(String(255), nullable=False)
    nombre_guardado = Column(String(255), nullable=False)
    ruta = Column(String(500), nullable=False)
    tamanio = Column(BigInteger, nullable=False)
    tipo_mime = Column(String(100))
    subido_por_tipo = Column(String(20), nullable=False)  # 'cliente' o 'vendedor'
    subido_por_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())