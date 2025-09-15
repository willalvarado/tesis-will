from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ✅ URL para conectarte a tu base de datos PostgreSQL local
DATABASE_URL = "postgresql://postgres:mtqnaw5k@localhost:5432/gestor_virtual"

print("DATABASE_URL:", DATABASE_URL)

# ✅ Crear el engine sin connect_args si es PostgreSQL
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ✅ Función requerida por FastAPI para obtener la sesión de base de datos
def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
