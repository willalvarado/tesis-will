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

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from utils import verificar_contrasena
from modelos.usuario_modelo import UsuarioDB
from Vendedores.vendedor_modelo import Vendedor
from pydantic import BaseModel, EmailStr
import json  # 🔥 AGREGAR ESTO

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
        # 🔥 Parsear especialidades (viene como JSON string)
        especialidades_lista = []
        if vendedor.especialidades:
            try:
                # Si es un string JSON, parsearlo
                if isinstance(vendedor.especialidades, str):
                    especialidades_lista = json.loads(vendedor.especialidades)
                else:
                    especialidades_lista = vendedor.especialidades
            except:
                especialidades_lista = [vendedor.especialidades]
        
        # Convertir lista a string separado por comas
        especialidades_str = ", ".join(especialidades_lista) if especialidades_lista else "Sin especialidad"
        
        print(f"🔍 DEBUG - Vendedor: {vendedor.nombre}")
        print(f"🔍 DEBUG - Especialidades raw: {vendedor.especialidades}")
        print(f"🔍 DEBUG - Especialidades procesadas: {especialidades_str}")
        
        return {
            "mensaje": "Inicio de sesión exitoso",
            "vendedor": {
                "id": vendedor.id,
                "nombre": vendedor.nombre,
                "correo": vendedor.correo,
                "especialidades": especialidades_str,  # 🔥 Enviar como string
                "tipo": "vendedor"
            }
        }
    
    raise HTTPException(status_code=401, detail="Credenciales incorrectas")