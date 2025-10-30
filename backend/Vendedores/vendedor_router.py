import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from Vendedores.vendedor_schema import RegistroVendedor, LoginVendedor
from Vendedores.vendedor_modelo import Vendedor
from utils import get_password_hash, verificar_contrasena

vendedor_router = APIRouter()

# 🔥 MAPEO DE CÓDIGOS ENUM A NOMBRES AMIGABLES
def enum_a_nombre_amigable(codigo_enum: str) -> str:
    """
    Convierte códigos del ENUM a nombres amigables.
    """
    mapeo = {
        # Consultoría en TI
        "CONSULTORIA_DESARROLLO": "Consultoría en desarrollo de sistemas",
        "CONSULTORIA_HARDWARE": "Consultoría en hardware",
        "CONSULTORIA_SOFTWARE": "Consultoría en software",
        
        # Desarrollo de software
        "DESARROLLO_MEDIDA": "Desarrollo de software a medida",
        "SOFTWARE_EMPAQUETADO": "Desarrollo y producción de software empaquetado",
        "ACTUALIZACION_SOFTWARE": "Actualización y adaptación de software",
        
        # Tratamiento de datos, alojamiento y nube
        "HOSTING": "Servicios de alojamiento de datos (hosting)",
        "PROCESAMIENTO_DATOS": "Servicios de procesamiento de datos",
        "CLOUD_COMPUTING": "Servicios en la nube (cloud computing)",
        
        # Otros servicios de TI
        "RECUPERACION_DESASTRES": "Servicios de recuperación ante desastres",
        "CIBERSEGURIDAD": "Servicios de ciberseguridad",
        "CAPACITACION_TI": "Capacitación en TI",
        
        "OTRO": "Otro"
    }
    
    return mapeo.get(codigo_enum, codigo_enum)


@vendedor_router.post("/login-vendedor")
def login_vendedor(datos: LoginVendedor, db: Session = Depends(get_db)):
    vendedor = db.query(Vendedor).filter(Vendedor.correo == datos.correo).first()
    if not vendedor:
        raise HTTPException(status_code=401, detail="Correo no registrado")
    if not verificar_contrasena(datos.contrasena, vendedor.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    # 🔥 Procesar especialidades
    especialidades_lista = []
    if vendedor.especialidades:
        try:
            if isinstance(vendedor.especialidades, str):
                especialidades_lista = json.loads(vendedor.especialidades)
            else:
                especialidades_lista = vendedor.especialidades
        except:
            especialidades_lista = [vendedor.especialidades]
    
    # 🔥 CONVERTIR CÓDIGOS ENUM A NOMBRES AMIGABLES
    especialidades_amigables = [enum_a_nombre_amigable(esp) for esp in especialidades_lista]
    
    # Convertir a string separado por comas
    especialidades_str = ", ".join(especialidades_amigables) if especialidades_amigables else "Otro"
    
    print(f"🔍 DEBUG - Vendedor: {vendedor.nombre}")
    print(f"🔍 DEBUG - Especialidades raw (ENUM): {vendedor.especialidades}")
    print(f"🔍 DEBUG - Especialidades amigables: {especialidades_str}")
    
    return {
        "mensaje": "Login exitoso", 
        "vendedor": {
            "id": vendedor.id,
            "nombre": vendedor.nombre,
            "correo": vendedor.correo,
            "especialidades": especialidades_str,  # 🔥 Devolver nombres amigables
            "tipo": "vendedor"
        }
    }