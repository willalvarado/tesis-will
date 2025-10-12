from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from modelos.archivo_modelo import ArchivoProyecto
from pydantic import BaseModel
from datetime import datetime
import os
import uuid
import shutil

router = APIRouter(
    prefix="/archivos",
    tags=["Archivos"]
)

# Crear carpeta de uploads si no existe
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Schema Pydantic
class ArchivoResponse(BaseModel):
    id: int
    proyecto_id: int
    nombre_original: str
    nombre_guardado: str
    tamanio: int
    tipo_mime: str | None
    subido_por_tipo: str
    subido_por_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

@router.post("/upload", response_model=ArchivoResponse)
async def subir_archivo(
    proyecto_id: int = Form(...),
    subido_por_tipo: str = Form(...),
    subido_por_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Sube un archivo al proyecto"""
    try:
        # Generar nombre único para evitar sobrescribir
        extension = os.path.splitext(file.filename)[1]
        nombre_guardado = f"{uuid.uuid4()}{extension}"
        ruta_archivo = os.path.join(UPLOAD_DIR, nombre_guardado)
        
        # Guardar archivo físicamente
        with open(ruta_archivo, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Obtener tamaño del archivo
        tamanio = os.path.getsize(ruta_archivo)
        
        # Guardar metadata en base de datos
        nuevo_archivo = ArchivoProyecto(
            proyecto_id=proyecto_id,
            nombre_original=file.filename,
            nombre_guardado=nombre_guardado,
            ruta=ruta_archivo,
            tamanio=tamanio,
            tipo_mime=file.content_type,
            subido_por_tipo=subido_por_tipo,
            subido_por_id=subido_por_id
        )
        
        db.add(nuevo_archivo)
        db.commit()
        db.refresh(nuevo_archivo)
        
        print(f"✅ Archivo subido: {file.filename} -> {nombre_guardado}")
        return nuevo_archivo
        
    except Exception as e:
        print(f"❌ Error al subir archivo: {str(e)}")
        # Si hay error, eliminar archivo físico si se creó
        if os.path.exists(ruta_archivo):
            os.remove(ruta_archivo)
        raise HTTPException(status_code=500, detail=f"Error al subir archivo: {str(e)}")

@router.get("/proyecto/{proyecto_id}", response_model=List[ArchivoResponse])
def listar_archivos(proyecto_id: int, db: Session = Depends(get_db)):
    """Obtiene todos los archivos de un proyecto"""
    archivos = db.query(ArchivoProyecto).filter(
        ArchivoProyecto.proyecto_id == proyecto_id
    ).order_by(ArchivoProyecto.created_at.desc()).all()
    return archivos

@router.get("/download/{archivo_id}")
def descargar_archivo(archivo_id: int, db: Session = Depends(get_db)):
    """Descarga un archivo"""
    archivo = db.query(ArchivoProyecto).filter(ArchivoProyecto.id == archivo_id).first()
    
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    if not os.path.exists(archivo.ruta):
        raise HTTPException(status_code=404, detail="Archivo físico no encontrado")
    
    return FileResponse(
        path=archivo.ruta,
        filename=archivo.nombre_original,
        media_type=archivo.tipo_mime
    )

@router.delete("/{archivo_id}")
def eliminar_archivo(
    archivo_id: int,
    db: Session = Depends(get_db)
):
    """Elimina un archivo (solo vendedor puede hacerlo)"""
    archivo = db.query(ArchivoProyecto).filter(ArchivoProyecto.id == archivo_id).first()
    
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Eliminar archivo físico
    if os.path.exists(archivo.ruta):
        os.remove(archivo.ruta)
        print(f"🗑️ Archivo físico eliminado: {archivo.ruta}")
    
    # Eliminar de base de datos
    db.delete(archivo)
    db.commit()
    
    return {"message": "Archivo eliminado exitosamente"}