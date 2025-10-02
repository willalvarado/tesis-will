from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar Base y engine para crear tablas
from database import Base, engine

# Routers
from routers.requerimiento_router import router as requerimiento_router
from Usuarios.usuario_router import usuario_router
from Vendedores.vendedor_router import vendedor_router
from routers.chatbot_router import router as chatbot_router

# Crear instancia de FastAPI
app = FastAPI(title="Gestor Virtual")

# Permitir peticiones desde frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Crear tablas en la base de datos
print("Creando tablas en la base de datos...")
Base.metadata.create_all(bind=engine)
print("¡Listo! Tablas creadas.")

# Registrar routers
app.include_router(usuario_router, prefix="/usuarios", tags=["Usuarios"])
app.include_router(vendedor_router, prefix="/vendedores", tags=["Vendedores"])
app.include_router(requerimiento_router)
app.include_router(chatbot_router, prefix="/chat", tags=["Chat"])

# Ruta de prueba
@app.get("/")
def read_root():
    return {"mensaje": "API funcionando correctamente"}