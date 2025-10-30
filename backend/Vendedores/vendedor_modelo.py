from sqlalchemy import Column, Integer, String, Text
from database import Base


class Vendedor(Base):
    __tablename__ = "vendedores"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    correo = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    especialidades = Column(Text, nullable=True)  # Almacena especialidades como texto separado por comas
    telefono = Column(String(20), nullable=True)
    direccion = Column(Text, nullable=True)
    ciudad = Column(String(100), nullable=True)
    experiencia = Column(String(20), nullable=True)
    biografia = Column(Text, nullable=True)
    habilidades = Column(Text, nullable=True)

