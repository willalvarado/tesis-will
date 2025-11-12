from sqlalchemy import Column, Integer, Text, Numeric, Boolean, DateTime, ForeignKey, ARRAY, JSON
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class AnalisisIA(Base):
    __tablename__ = "analisis_ia"
    
    id = Column(Integer, primary_key=True, index=True)
    proyecto_id = Column(Integer, ForeignKey("proyectos.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, default=1)
    analisis_completo = Column(JSON)
    especialidades_detectadas = Column(ARRAY(Text))
    presupuesto_estimado = Column(Numeric(10, 2))
    tiempo_estimado_dias = Column(Integer)
    completado = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    proyecto = relationship("Proyecto", backref="analisis_list")