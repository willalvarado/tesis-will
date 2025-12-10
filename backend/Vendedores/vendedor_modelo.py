from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
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

    # 🔥 RELACIONES
    
    # Relación con proyectos (proyectos viejos con un solo vendedor)
    proyectos_como_vendedor = relationship(
        "Proyecto", 
        foreign_keys="[Proyecto.vendedor_id]",
        back_populates="vendedor"
    )
    
    # Relación con sub-tareas (proyectos nuevos divididos en tareas)
    subtareas_asignadas = relationship(
        "SubTarea",
        back_populates="vendedor"
    )
    
    # Relación con ofertas (propuestas enviadas a requerimientos)
      # ofertas = relationship(
          # "Oferta",
          # back_populates="vendedor"
    #   )