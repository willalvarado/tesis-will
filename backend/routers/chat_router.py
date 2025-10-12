from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from database import get_db
from modelos.mensaje_modelo import MensajeChat
from pydantic import BaseModel
from datetime import datetime
import json

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

# Gestión de conexiones activas
class ConnectionManager:
    def __init__(self):
        # Diccionario: {proyecto_id: [websocket1, websocket2, ...]}
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, proyecto_id: int):
        await websocket.accept()
        if proyecto_id not in self.active_connections:
            self.active_connections[proyecto_id] = []
        self.active_connections[proyecto_id].append(websocket)
        print(f"✅ Cliente conectado al proyecto {proyecto_id}. Total: {len(self.active_connections[proyecto_id])}")
    
    def disconnect(self, websocket: WebSocket, proyecto_id: int):
        if proyecto_id in self.active_connections:
            self.active_connections[proyecto_id].remove(websocket)
            if len(self.active_connections[proyecto_id]) == 0:
                del self.active_connections[proyecto_id]
        print(f"❌ Cliente desconectado del proyecto {proyecto_id}")
    
    async def send_message_to_room(self, mensaje: dict, proyecto_id: int):
        """Envía un mensaje a todos los conectados en un proyecto específico"""
        if proyecto_id in self.active_connections:
            for connection in self.active_connections[proyecto_id]:
                try:
                    await connection.send_json(mensaje)
                except:
                    pass  # Si falla, el cliente se desconectó

manager = ConnectionManager()

# Schema Pydantic
class MensajeResponse(BaseModel):
    id: int
    proyecto_id: int
    remitente_id: int
    remitente_tipo: str
    contenido: str
    leido: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class MensajeCreate(BaseModel):
    proyecto_id: int
    remitente_id: int
    remitente_tipo: str
    contenido: str

# WebSocket endpoint
@router.websocket("/ws/{proyecto_id}")
async def websocket_endpoint(websocket: WebSocket, proyecto_id: int):
    await manager.connect(websocket, proyecto_id)
    try:
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_text()
            mensaje_data = json.loads(data)
            
            # Aquí podrías guardar el mensaje en BD si quieres
            # Por ahora solo lo reenviamos
            
            # Broadcast a todos los conectados en este proyecto
            await manager.send_message_to_room(mensaje_data, proyecto_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, proyecto_id)

# HTTP endpoints para historial de mensajes

@router.get("/mensajes/{proyecto_id}", response_model=List[MensajeResponse])
def obtener_mensajes(proyecto_id: int, db: Session = Depends(get_db)):
    """Obtiene el historial de mensajes de un proyecto"""
    mensajes = db.query(MensajeChat).filter(
        MensajeChat.proyecto_id == proyecto_id
    ).order_by(MensajeChat.created_at.asc()).all()
    return mensajes

@router.post("/mensajes", response_model=MensajeResponse)
def crear_mensaje(mensaje: MensajeCreate, db: Session = Depends(get_db)):
    """Guarda un mensaje en la base de datos"""
    nuevo_mensaje = MensajeChat(
        proyecto_id=mensaje.proyecto_id,
        remitente_id=mensaje.remitente_id,
        remitente_tipo=mensaje.remitente_tipo,
        contenido=mensaje.contenido,
        leido=False
    )
    db.add(nuevo_mensaje)
    db.commit()
    db.refresh(nuevo_mensaje)
    return nuevo_mensaje

@router.put("/mensajes/{proyecto_id}/marcar-leidos")
def marcar_mensajes_leidos(
    proyecto_id: int,
    remitente_tipo: str,  # 'cliente' o 'vendedor' - marca como leídos los del otro
    db: Session = Depends(get_db)
):
    """Marca como leídos todos los mensajes del proyecto que NO son del remitente"""
    # Si es cliente, marca como leídos los del vendedor
    tipo_a_marcar = 'vendedor' if remitente_tipo == 'cliente' else 'cliente'
    
    db.query(MensajeChat).filter(
        MensajeChat.proyecto_id == proyecto_id,
        MensajeChat.remitente_tipo == tipo_a_marcar,
        MensajeChat.leido == False
    ).update({MensajeChat.leido: True})
    
    db.commit()
    return {"mensaje": "Mensajes marcados como leídos"}