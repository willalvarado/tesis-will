# routers/chatbot_router.py
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from modelos.requerimiento_model import Requerimiento, EstadoRequerimiento
from services.analisis_requerimiento import AnalizadorRequerimientos

router = APIRouter()

class ChatInput(BaseModel):
    mensaje: str
    cliente_id: int

@router.post("/chat")
def enviar_mensaje(input: ChatInput, db: Session = Depends(get_db)):
    """
    Versión de prueba SIN OpenAI
    1. Recibe el mensaje del cliente
    2. Crea un requerimiento
    3. Lo analiza y clasifica
    4. Devuelve una respuesta simulada
    """
    try:
        # Analizar el mensaje
        analisis = AnalizadorRequerimientos.analizar_mensaje(input.mensaje)
        
        # Crear el requerimiento automáticamente
        nuevo_req = Requerimiento(
            cliente_id=input.cliente_id,
            titulo=analisis["titulo"],
            mensaje=input.mensaje,
            descripcion=analisis["descripcion"],
            especialidad=analisis["especialidad"],
            estado=EstadoRequerimiento.PENDIENTE
        )
        
        db.add(nuevo_req)
        db.commit()
        db.refresh(nuevo_req)
        
        # Respuesta simulada (sin OpenAI)
        respuesta_bot = f"""
        Gracias por tu mensaje. He registrado tu requerimiento:
        
        📋 Título: {analisis['titulo']}
        🏷️ Especialidad detectada: {analisis['especialidad'].value}
        🔢 Número de requerimiento: #{nuevo_req.id}
        
        Un vendedor especializado en {analisis['especialidad'].value} revisará tu solicitud pronto.
        
        ¿Necesitas agregar más detalles a tu requerimiento?
        """
        
        return {
            "respuesta": respuesta_bot,
            "requerimiento_id": nuevo_req.id,
            "especialidad_detectada": analisis['especialidad'].value
        }
        
    except Exception as e:
        return {"error": str(e)}