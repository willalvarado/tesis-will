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


# ✅ REGISTRO (NO CAMBIÓ)
@vendedor_router.post("/registro-vendedor")
def registrar_vendedor(datos: RegistroVendedor, db: Session = Depends(get_db)):
    if db.query(Vendedor).filter(Vendedor.correo == datos.correo).first():
        raise HTTPException(status_code=400, detail="Correo ya registrado")

    nuevo = Vendedor(
        nombre=datos.nombreEmpresa,
        correo=datos.correo,
        hashed_password=get_password_hash(datos.contrasena),
        especialidades=json.dumps(datos.especialidades)
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"mensaje": "Vendedor registrado exitosamente"}


# ✅ LOGIN (CON CAMBIOS)
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
            "especialidades": especialidades_str,
            "tipo": "vendedor"
        }
    }


# 🆕 OBTENER PERFIL DEL VENDEDOR
@vendedor_router.get("/{vendedor_id}")
def obtener_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    vendedor = db.query(Vendedor).filter(Vendedor.id == vendedor_id).first()
    
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    
    # Procesar especialidades
    especialidades = []
    if vendedor.especialidades:
        try:
            especialidades = json.loads(vendedor.especialidades)
        except json.JSONDecodeError:
            especialidades = [vendedor.especialidades]
    
    return {
        "id": vendedor.id,
        "nombre": vendedor.nombre,
        "correo": vendedor.correo,
        "especialidades": especialidades,
        "telefono": vendedor.telefono,
        "direccion": vendedor.direccion,
        "ciudad": vendedor.ciudad,
        "experiencia": vendedor.experiencia,
        "biografia": vendedor.biografia,
        "habilidades": vendedor.habilidades
    }


# 🆕 ACTUALIZAR PERFIL DEL VENDEDOR
@vendedor_router.put("/{vendedor_id}")
def actualizar_vendedor(vendedor_id: int, datos: dict, db: Session = Depends(get_db)):
    vendedor = db.query(Vendedor).filter(Vendedor.id == vendedor_id).first()
    
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    
    # Actualizar campos editables
    if "nombre" in datos:
        vendedor.nombre = datos["nombre"]
    if "telefono" in datos:
        vendedor.telefono = datos["telefono"]
    if "direccion" in datos:
        vendedor.direccion = datos["direccion"]
    if "ciudad" in datos:
        vendedor.ciudad = datos["ciudad"]
    if "experiencia" in datos:
        vendedor.experiencia = datos["experiencia"]
    if "biografia" in datos:
        vendedor.biografia = datos["biografia"]
    if "habilidades" in datos:
        vendedor.habilidades = datos["habilidades"]
    
    try:
        db.commit()
        db.refresh(vendedor)
        return {
            "mensaje": "Vendedor actualizado correctamente",
            "id": vendedor.id,
            "nombre": vendedor.nombre
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar vendedor: {str(e)}")