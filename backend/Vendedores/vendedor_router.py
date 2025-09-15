from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import json

from database import get_db
from Vendedores.vendedor_schema import RegistroVendedor, LoginVendedor
from Vendedores.vendedor_modelo import Vendedor
from utils import get_password_hash, verificar_contrasena

vendedor_router = APIRouter()

# ✅ REGISTRO
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

# ✅ LOGIN
@vendedor_router.post("/login-vendedor")
def login_vendedor(datos: LoginVendedor, db: Session = Depends(get_db)):
    vendedor = db.query(Vendedor).filter(Vendedor.correo == datos.correo).first()
    if not vendedor:
        raise HTTPException(status_code=401, detail="Correo no registrado")
    if not verificar_contrasena(datos.contrasena, vendedor.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    return {"mensaje": "Login exitoso", "vendedor": vendedor.correo}
