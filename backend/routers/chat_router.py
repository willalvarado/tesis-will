from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from database import get_db
from modelos.mensaje_modelo import MensajeChat, ArchivoSubtarea
from pydantic import BaseModel
from datetime import datetime
import json
import os
import uuid
import shutil

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

# Directorio para guardar archivos
UPLOAD_DIR = "uploads/subtareas"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ========================================
# GESTIÓN DE CONEXIONES WEBSOCKET
# ========================================

class ConnectionManager:
    def __init__(self):
        # Conexiones por proyecto (viejo)
        self.active_connections_proyecto: Dict[int, List[WebSocket]] = {}
        # 🔥 NUEVO: Conexiones por sub-tarea
        self.active_connections_subtarea: Dict[int, List[WebSocket]] = {}
    
    # Proyecto (viejo sistema)
    async def connect_proyecto(self, websocket: WebSocket, proyecto_id: int):
        await websocket.accept()
        if proyecto_id not in self.active_connections_proyecto:
            self.active_connections_proyecto[proyecto_id] = []
        self.active_connections_proyecto[proyecto_id].append(websocket)
        print(f"✅ Cliente conectado al proyecto {proyecto_id}")
    
    def disconnect_proyecto(self, websocket: WebSocket, proyecto_id: int):
        if proyecto_id in self.active_connections_proyecto:
            self.active_connections_proyecto[proyecto_id].remove(websocket)
            if len(self.active_connections_proyecto[proyecto_id]) == 0:
                del self.active_connections_proyecto[proyecto_id]
        print(f"❌ Cliente desconectado del proyecto {proyecto_id}")
    
    async def send_to_proyecto(self, mensaje: dict, proyecto_id: int):
        if proyecto_id in self.active_connections_proyecto:
            for connection in self.active_connections_proyecto[proyecto_id]:
                try:
                    await connection.send_json(mensaje)
                except:
                    pass
    
    # 🔥 NUEVO: Sub-tarea
    async def connect_subtarea(self, websocket: WebSocket, subtarea_id: int):
        await websocket.accept()
        if subtarea_id not in self.active_connections_subtarea:
            self.active_connections_subtarea[subtarea_id] = []
        self.active_connections_subtarea[subtarea_id].append(websocket)
        print(f"✅ Cliente conectado a sub-tarea {subtarea_id}")
    
    def disconnect_subtarea(self, websocket: WebSocket, subtarea_id: int):
        if subtarea_id in self.active_connections_subtarea:
            self.active_connections_subtarea[subtarea_id].remove(websocket)
            if len(self.active_connections_subtarea[subtarea_id]) == 0:
                del self.active_connections_subtarea[subtarea_id]
        print(f"❌ Cliente desconectado de sub-tarea {subtarea_id}")
    
    async def send_to_subtarea(self, mensaje: dict, subtarea_id: int):
        if subtarea_id in self.active_connections_subtarea:
            for connection in self.active_connections_subtarea[subtarea_id]:
                try:
                    await connection.send_json(mensaje)
                except:
                    pass

manager = ConnectionManager()

# ========================================
# SCHEMAS
# ========================================

class MensajeResponse(BaseModel):
    id: int
    proyecto_id: Optional[int] = None
    subtarea_id: Optional[int] = None
    remitente_id: int
    remitente_tipo: str
    contenido: str
    leido: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class MensajeCreate(BaseModel):
    proyecto_id: Optional[int] = None
    subtarea_id: Optional[int] = None
    remitente_id: int
    remitente_tipo: str
    contenido: str

class ArchivoResponse(BaseModel):
    id: int
    subtarea_id: int
    subido_por_id: int
    subido_por_tipo: str
    nombre_original: str
    tamano: int
    tipo_mime: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ========================================
# WEBSOCKET ENDPOINTS
# ========================================

@router.websocket("/ws/{proyecto_id}")
async def websocket_proyecto(websocket: WebSocket, proyecto_id: int):
    """WebSocket para chat de proyecto (sistema viejo)"""
    await manager.connect_proyecto(websocket, proyecto_id)
    try:
        while True:
            data = await websocket.receive_text()
            mensaje_data = json.loads(data)
            await manager.send_to_proyecto(mensaje_data, proyecto_id)
    except WebSocketDisconnect:
        manager.disconnect_proyecto(websocket, proyecto_id)

@router.websocket("/ws/subtarea/{subtarea_id}")
async def websocket_subtarea(websocket: WebSocket, subtarea_id: int):
    """🔥 NUEVO: WebSocket para chat de sub-tarea"""
    await manager.connect_subtarea(websocket, subtarea_id)
    try:
        while True:
            data = await websocket.receive_text()
            mensaje_data = json.loads(data)
            await manager.send_to_subtarea(mensaje_data, subtarea_id)
    except WebSocketDisconnect:
        manager.disconnect_subtarea(websocket, subtarea_id)

# ========================================
# HTTP ENDPOINTS - MENSAJES
# ========================================

@router.get("/mensajes/{proyecto_id}", response_model=List[MensajeResponse])
def obtener_mensajes_proyecto(proyecto_id: int, db: Session = Depends(get_db)):
    """Obtiene mensajes de un proyecto (sistema viejo)"""
    mensajes = db.query(MensajeChat).filter(
        MensajeChat.proyecto_id == proyecto_id
    ).order_by(MensajeChat.created_at.asc()).all()
    return mensajes

@router.get("/subtarea/{subtarea_id}/mensajes", response_model=List[MensajeResponse])
def obtener_mensajes_subtarea(subtarea_id: int, db: Session = Depends(get_db)):
    """🔥 NUEVO: Obtiene mensajes de una sub-tarea"""
    mensajes = db.query(MensajeChat).filter(
        MensajeChat.subtarea_id == subtarea_id
    ).order_by(MensajeChat.created_at.asc()).all()
    
    print(f"📚 Sub-tarea {subtarea_id}: {len(mensajes)} mensajes")
    return mensajes

@router.post("/mensajes", response_model=MensajeResponse)
def crear_mensaje(mensaje: MensajeCreate, db: Session = Depends(get_db)):
    """Guarda un mensaje (proyecto o sub-tarea)"""
    nuevo_mensaje = MensajeChat(
        proyecto_id=mensaje.proyecto_id,
        subtarea_id=mensaje.subtarea_id,
        remitente_id=mensaje.remitente_id,
        remitente_tipo=mensaje.remitente_tipo,
        contenido=mensaje.contenido,
        leido=False
    )
    db.add(nuevo_mensaje)
    db.commit()
    db.refresh(nuevo_mensaje)
    
    print(f"💾 Mensaje guardado: {nuevo_mensaje.id}")
    return nuevo_mensaje

@router.put("/mensajes/{proyecto_id}/marcar-leidos")
def marcar_mensajes_leidos_proyecto(
    proyecto_id: int,
    remitente_tipo: str,
    db: Session = Depends(get_db)
):
    """Marca mensajes de proyecto como leídos"""
    tipo_a_marcar = 'vendedor' if remitente_tipo == 'cliente' else 'cliente'
    
    db.query(MensajeChat).filter(
        MensajeChat.proyecto_id == proyecto_id,
        MensajeChat.remitente_tipo == tipo_a_marcar,
        MensajeChat.leido == False
    ).update({MensajeChat.leido: True})
    
    db.commit()
    return {"mensaje": "Mensajes marcados como leídos"}

@router.put("/subtarea/{subtarea_id}/marcar-leidos")
def marcar_mensajes_leidos_subtarea(
    subtarea_id: int,
    remitente_tipo: str,
    db: Session = Depends(get_db)
):
    """🔥 NUEVO: Marca mensajes de sub-tarea como leídos"""
    tipo_a_marcar = 'vendedor' if remitente_tipo == 'cliente' else 'cliente'
    
    db.query(MensajeChat).filter(
        MensajeChat.subtarea_id == subtarea_id,
        MensajeChat.remitente_tipo == tipo_a_marcar,
        MensajeChat.leido == False
    ).update({MensajeChat.leido: True})
    
    db.commit()
    return {"mensaje": "Mensajes marcados como leídos"}

# ========================================
# HTTP ENDPOINTS - ARCHIVOS
# ========================================

@router.post("/subtarea/{subtarea_id}/archivo", response_model=ArchivoResponse)
async def subir_archivo(
    subtarea_id: int,
    subido_por_id: int,
    subido_por_tipo: str,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """🔥 NUEVO: Subir archivo a una sub-tarea"""
    try:
        # Generar nombre único
        extension = os.path.splitext(archivo.filename)[1]
        nombre_guardado = f"{uuid.uuid4()}{extension}"
        ruta_completa = os.path.join(UPLOAD_DIR, nombre_guardado)
        
        # Guardar archivo
        with open(ruta_completa, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
        
        # Obtener tamaño
        tamano = os.path.getsize(ruta_completa)
        
        # Guardar en BD
        nuevo_archivo = ArchivoSubtarea(
            subtarea_id=subtarea_id,
            subido_por_id=subido_por_id,
            subido_por_tipo=subido_por_tipo,
            nombre_original=archivo.filename,
            nombre_guardado=nombre_guardado,
            ruta=ruta_completa,
            tamano=tamano,
            tipo_mime=archivo.content_type
        )
        
        db.add(nuevo_archivo)
        db.commit()
        db.refresh(nuevo_archivo)
        
        print(f"📎 Archivo subido: {archivo.filename}")
        return nuevo_archivo
        
    except Exception as e:
        print(f"❌ Error subiendo archivo: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subtarea/{subtarea_id}/archivos", response_model=List[ArchivoResponse])
def obtener_archivos(subtarea_id: int, db: Session = Depends(get_db)):
    """🔥 NUEVO: Obtener archivos de una sub-tarea"""
    archivos = db.query(ArchivoSubtarea).filter(
        ArchivoSubtarea.subtarea_id == subtarea_id
    ).order_by(ArchivoSubtarea.created_at.desc()).all()
    
    return archivos

@router.delete("/archivo/{archivo_id}")
def eliminar_archivo(
    archivo_id: int,
    usuario_id: int,
    usuario_tipo: str,
    db: Session = Depends(get_db)
):
    """🔥 NUEVO: Eliminar archivo (solo el que lo subió o vendedor)"""
    archivo = db.query(ArchivoSubtarea).filter(ArchivoSubtarea.id == archivo_id).first()
    
    if not archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    # Verificar permisos
    es_propietario = (archivo.subido_por_id == usuario_id and archivo.subido_por_tipo == usuario_tipo)
    es_vendedor = usuario_tipo == 'vendedor'
    
    if not (es_propietario or es_vendedor):
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar este archivo")
    
    # Eliminar archivo físico
    try:
        if os.path.exists(archivo.ruta):
            os.remove(archivo.ruta)
    except Exception as e:
        print(f"⚠️ Error eliminando archivo físico: {e}")
    
    # Eliminar de BD
    db.delete(archivo)
    db.commit()
    
    print(f"🗑️ Archivo eliminado: {archivo.nombre_original}")
    return {"mensaje": "Archivo eliminado"}