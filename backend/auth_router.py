from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from utils import verificar_contrasena
from modelos.usuario_modelo import UsuarioDB
from Vendedores.vendedor_modelo import Vendedor
from pydantic import BaseModel, EmailStr

auth_router = APIRouter()

class LoginRequest(BaseModel):
    correo: EmailStr
    contrasena: str

@auth_router.post("/login")
def login_unificado(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Buscar en tabla usuarios (clientes)
    usuario = db.query(UsuarioDB).filter(UsuarioDB.correo == login_data.correo).first()
    if usuario and verificar_contrasena(login_data.contrasena, usuario.contrasena):
        return {
            "mensaje": "Inicio de sesión exitoso",
            "usuario": {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "correo": usuario.correo,
                "tipo": "cliente"
            }
        }

    # Buscar en tabla vendedores
    vendedor = db.query(Vendedor).filter(Vendedor.correo == login_data.correo).first()
    if vendedor and verificar_contrasena(login_data.contrasena, vendedor.hashed_password):
        return {
            "mensaje": "Inicio de sesión exitoso",
            "usuario": {
                "id": vendedor.id,
                "nombre": vendedor.nombre,
                "correo": vendedor.correo,
                "tipo": "vendedor"
            }
        }

    raise HTTPException(status_code=401, detail="Credenciales incorrectas")