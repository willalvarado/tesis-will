# modelos/usuario_modelo.py
from pydantic import BaseModel, EmailStr
from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
from database import Base

# ✅ Modelo Pydantic para entrada y validación
class Usuario(BaseModel):
    nombre: str
    correo: EmailStr
    contrasena: str
    tipo: str

    class Config:
        from_attributes = True  # Actualizado para Pydantic v2

# ✅ Modelo SQLAlchemy para la tabla de usuarios
class UsuarioDB(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    correo = Column(String, unique=True, index=True)
    contrasena = Column(String)
    tipo = Column(String)

    # Relaciones con los requerimientos - CORREGIDO con foreign_keys
    requerimientos_creados = relationship(
        "Requerimiento", 
        foreign_keys="[Requerimiento.cliente_id]",
        back_populates="cliente",
        cascade="all, delete-orphan"
    )
    
    requerimientos_asignados = relationship(
        "Requerimiento", 
        foreign_keys="[Requerimiento.vendedor_id]",
        back_populates="vendedor",
        cascade="all, delete-orphan"
    )