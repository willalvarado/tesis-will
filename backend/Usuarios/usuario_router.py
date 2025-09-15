from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from modelos.usuario_modelo import Usuario, UsuarioDB
from database import get_db
from utils import get_password_hash, verificar_contrasena

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
