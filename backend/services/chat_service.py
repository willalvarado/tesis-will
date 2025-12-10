from sqlalchemy.orm import Session
from modelos import MensajeChat
from datetime import datetime
from typing import List, Optional

class ChatService:
    
    @staticmethod
    def crear_mensaje(
        db: Session,
        subtarea_id: int,
        remitente_id: int,
        remitente_tipo: str,
        contenido: str
    ) -> MensajeChat:
        """Crea un nuevo mensaje en el chat de una sub-tarea"""
        nuevo_mensaje = MensajeChat(
            subtarea_id=subtarea_id,
            remitente_id=remitente_id,
            remitente_tipo=remitente_tipo,
            contenido=contenido,
            leido=False,
            created_at=datetime.now()
        )
        
        db.add(nuevo_mensaje)
        db.commit()
        db.refresh(nuevo_mensaje)
        
        return nuevo_mensaje
    
    @staticmethod
    def obtener_mensajes_subtarea(
        db: Session,
        subtarea_id: int
    ) -> List[MensajeChat]:
        """Obtiene todos los mensajes de una sub-tarea"""
        return db.query(MensajeChat)\
            .filter(MensajeChat.subtarea_id == subtarea_id)\
            .order_by(MensajeChat.created_at.asc())\
            .all()
    
    @staticmethod
    def marcar_mensaje_leido(
        db: Session,
        mensaje_id: int
    ) -> Optional[MensajeChat]:
        """Marca un mensaje como leído"""
        mensaje = db.query(MensajeChat).filter(MensajeChat.id == mensaje_id).first()
        if mensaje:
            mensaje.leido = True
            db.commit()
            db.refresh(mensaje)
        return mensaje
    
    @staticmethod
    def marcar_mensajes_leidos_subtarea(
        db: Session,
        subtarea_id: int,
        remitente_tipo: str
    ):
        """Marca todos los mensajes de un remitente como leídos"""
        db.query(MensajeChat)\
            .filter(
                MensajeChat.subtarea_id == subtarea_id,
                MensajeChat.remitente_tipo != remitente_tipo,
                MensajeChat.leido == False
            )\
            .update({MensajeChat.leido: True})
        db.commit()