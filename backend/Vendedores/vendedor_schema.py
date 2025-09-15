from pydantic import BaseModel, EmailStr
from typing import List

class RegistroVendedor(BaseModel):
    nombreEmpresa: str
    correo: EmailStr
    contrasena: str
    especialidades: List[str]  # Mejor usar typing.List[str] para compatibilidad

class LoginVendedor(BaseModel):
    correo: EmailStr
    contrasena: str
