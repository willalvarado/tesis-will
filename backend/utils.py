from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verificar_contrasena(password_plano: str, password_hash: str) -> bool:
    return pwd_context.verify(password_plano, password_hash)
