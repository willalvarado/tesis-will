from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from modelos.usuario_modelo import Usuario, UsuarioDB
from database import get_db
from utils import get_password_hash, verificar_contrasena
from fastapi import Body
from pydantic import BaseModel

usuario_router = APIRouter()

@usuario_router.post("/registro")
def registrar_usuario(usuario: Usuario, db: Session = Depends(get_db)):
    usuario_existente = db.query(UsuarioDB).filter(UsuarioDB.correo == usuario.correo).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Correo ya registrado"
        )
    nuevo_usuario = UsuarioDB(
        nombre=usuario.nombre,
        correo=usuario.correo,
        contrasena=get_password_hash(usuario.contrasena),
        tipo=usuario.tipo
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"mensaje": "Registro exitoso", "usuario": nuevo_usuario.correo}

@usuario_router.post("/login")
def login_usuario(datos: dict, db: Session = Depends(get_db)):
    correo = datos.get("correo")
    contrasena = datos.get("contrasena")

    usuario = db.query(UsuarioDB).filter_by(correo=correo).first()
    if not usuario or not verificar_contrasena(contrasena, usuario.contrasena):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    return {
        "mensaje": "Inicio de sesión exitoso",
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "correo": usuario.correo,
            "tipo": usuario.tipo
        } 
    }

# Pydantic para actualizar perfil
class PerfilUpdateRequest(BaseModel):
    nombre: str
    telefono: str | None = None
    direccion: str | None = None
    ciudad: str | None = None
    biografia: str | None = None

# Obtener perfil
@usuario_router.get("/perfil/{usuario_id}")
def obtener_perfil(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "correo": usuario.correo,
        "telefono": getattr(usuario, "telefono", None),
        "direccion": getattr(usuario, "direccion", None),
        "ciudad": getattr(usuario, "ciudad", None),
        "biografia": getattr(usuario, "biografia", None)
    }

# Actualizar perfil
@usuario_router.put("/perfil/{usuario_id}")
def actualizar_perfil(usuario_id: int, datos: PerfilUpdateRequest, db: Session = Depends(get_db)):
    usuario = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Actualizar los campos permitidos
    usuario.nombre = datos.nombre
    usuario.telefono = datos.telefono
    usuario.direccion = datos.direccion
    usuario.ciudad = datos.ciudad
    usuario.biografia = datos.biografia

    db.commit()
    db.refresh(usuario)

    return {"mensaje": "Perfil actualizado correctamente", "usuario": {
        "id": usuario.id,
        "nombre": usuario.nombre,
        "correo": usuario.correo,
        "telefono": usuario.telefono,
        "direccion": usuario.direccion,
        "ciudad": usuario.ciudad,
        "biografia": usuario.biografia
    }}