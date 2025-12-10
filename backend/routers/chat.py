from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from database import get_db
from services.chat_service import ChatService
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chat"])

# ============================================
# MODELOS PYDANTIC
# ============================================

class MensajeCreate(BaseModel):
    subtarea_id: int
    remitente_id: int
    remitente_tipo: str  # 'cliente' o 'vendedor'
    contenido: str

class MensajeResponse(BaseModel):
    id: int
    subtarea_id: int
    remitente_id: int
    remitente_tipo: str
    contenido: str
    leido: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ============================================
# GESTOR DE CONEXIONES WEBSOCKET
# ============================================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, subtarea_id: int):
        await websocket.accept()
        if subtarea_id not in self.active_connections:
            self.active_connections[subtarea_id] = []
        self.active_connections[subtarea_id].append(websocket)
        print(f"✅ Cliente conectado a sub-tarea {subtarea_id}")
    
    def disconnect(self, websocket: WebSocket, subtarea_id: int):
        if subtarea_id in self.active_connections:
            self.active_connections[subtarea_id].remove(websocket)
            if len(self.active_connections[subtarea_id]) == 0:
                del self.active_connections[subtarea_id]
        print(f"❌ Cliente desconectado de sub-tarea {subtarea_id}")
    
    async def broadcast_to_subtarea(self, subtarea_id: int, message: dict):
        if subtarea_id in self.active_connections:
            for connection in self.active_connections[subtarea_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error enviando mensaje: {e}")

manager = ConnectionManager()

# ============================================
# ENDPOINTS HTTP
# ============================================

@router.post("/mensajes", response_model=MensajeResponse)
def crear_mensaje(
    mensaje: MensajeCreate,
    db: Session = Depends(get_db)
):
    """Crea un nuevo mensaje en el chat de una sub-tarea"""
    try:
        nuevo_mensaje = ChatService.crear_mensaje(
            db=db,
            subtarea_id=mensaje.subtarea_id,
            remitente_id=mensaje.remitente_id,
            remitente_tipo=mensaje.remitente_tipo,
            contenido=mensaje.contenido
        )
        return nuevo_mensaje
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear mensaje: {str(e)}")

@router.get("/subtarea/{subtarea_id}/mensajes", response_model=List[MensajeResponse])
def obtener_mensajes_subtarea(
    subtarea_id: int,
    db: Session = Depends(get_db)
):
    """Obtiene todos los mensajes de una sub-tarea"""
    try:
        print(f"🔍 Buscando mensajes para sub-tarea: {subtarea_id}")
        mensajes = ChatService.obtener_mensajes_subtarea(db, subtarea_id)
        print(f"✅ Mensajes encontrados: {len(mensajes)}")
        return mensajes
    except Exception as e:
        print(f"❌ ERROR COMPLETO: {str(e)}")
        print(f"❌ TIPO DE ERROR: {type(e)}")
        import traceback
        print(f"❌ TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error al obtener mensajes: {str(e)}")

@router.put("/mensajes/{mensaje_id}/leido")
def marcar_mensaje_leido(
    mensaje_id: int,
    db: Session = Depends(get_db)
):
    """Marca un mensaje como leído"""
    mensaje = ChatService.marcar_mensaje_leido(db, mensaje_id)
    if not mensaje:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    return {"message": "Mensaje marcado como leído"}

# ============================================
# WEBSOCKET
# ============================================

@router.websocket("/ws/subtarea/{subtarea_id}")
async def websocket_chat(websocket: WebSocket, subtarea_id: int):
    """WebSocket para chat en tiempo real de una sub-tarea"""
    await manager.connect(websocket, subtarea_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            print(f"📨 Mensaje recibido en sub-tarea {subtarea_id}:", data)
            await manager.broadcast_to_subtarea(subtarea_id, data)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, subtarea_id)
        print(f"Cliente desconectado de sub-tarea {subtarea_id}")
    except Exception as e:
        print(f"❌ Error en WebSocket: {e}")
        manager.disconnect(websocket, subtarea_id)