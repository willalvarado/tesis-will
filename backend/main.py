from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Importar Base y engine para crear tablas
from database import Base, engine

# Routers
from routers.requerimiento_router import router as requerimiento_router
from routers.proyecto_router import router as proyecto_router
from Usuarios.usuario_router import usuario_router
from Vendedores.vendedor_router import vendedor_router
from routers.chat_router import router as chat_router  # Chat cliente-vendedor (mantener)
from routers.archivo_router import router as archivo_router
# from routers.openai_router import router as openai_router  # 🔥 COMENTADO - Reemplazado por chat_analisis
from routers.chat_analisis_router import router as chat_analisis_router  # 🆕 NUEVO SISTEMA
from routers.subtarea_router import router as subtarea_router

# Crear instancia de FastAPI
app = FastAPI(
    title="Conecta Solutions API",
    description="Plataforma de gestión de proyectos con análisis IA",
    version="2.0.0"
)

# Permitir peticiones desde frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Cambiar por URL del frontend en producción
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
app.include_router(proyecto_router)
app.include_router(archivo_router)
app.include_router(chat_router)  # Chat 1:1 cliente-vendedor
# app.include_router(openai_router)  # 🔥 DESACTIVADO - Sistema viejo
app.include_router(chat_analisis_router)  # 🆕 Sistema nuevo de análisis con IA
app.include_router(subtarea_router)

# Ruta de prueba
@app.get("/")
def read_root():
    return {
        "mensaje": "Conecta Solutions API",
        "version": "2.0.0",
        "estado": "funcionando",
        "features": [
            "Chat con IA sin límites",
            "Análisis automático de proyectos",
            "Descomposición en sub-tareas",
            "Matching multi-vendedor"
        ]
    }