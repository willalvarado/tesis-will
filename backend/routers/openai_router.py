# backend/routers/openai_router.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.openai_service import analizar_requerimiento, sugerir_vendedores, chat_requerimiento  # 🔥 AGREGAR AQUÍ
from typing import List

router = APIRouter(prefix="/api/openai", tags=["OpenAI"])

class RequerimientoAnalisis(BaseModel):
    texto: str

class VendedorSugerencia(BaseModel):
    especialidad: str
    complejidad: str

class MensajeChat(BaseModel):
    role: str  # "user" o "assistant"
    content: str

class ChatRequest(BaseModel):
    mensajes: List[MensajeChat]

@router.post("/analizar-requerimiento")
async def analizar_req(req: RequerimientoAnalisis):
    """
    Analiza un requerimiento usando OpenAI
    """
    if not req.texto or len(req.texto) < 10:
        raise HTTPException(status_code=400, detail="El texto debe tener al menos 10 caracteres")
    
    resultado = analizar_requerimiento(req.texto)
    
    if not resultado["exito"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
    
    return resultado

@router.post("/sugerir-vendedores")
async def sugerir_vend(sug: VendedorSugerencia):
    """
    Sugiere criterios para seleccionar vendedores
    """
    resultado = sugerir_vendedores(sug.especialidad, sug.complejidad)
    
    if not resultado["exito"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
    
    return resultado

@router.post("/chat-requerimiento")
async def chat_req(req: ChatRequest):
    """
    Chat conversacional para crear requerimientos
    """
    if not req.mensajes:
        raise HTTPException(status_code=400, detail="Debe enviar al menos un mensaje")
    
    # Convertir a formato de OpenAI
    mensajes_openai = [
        {"role": msg.role, "content": msg.content}
        for msg in req.mensajes
    ]
    
    resultado = chat_requerimiento(mensajes_openai)  # 🔥 GUIÓN BAJO, NO GUIÓN
    
    if not resultado["exito"]:
        raise HTTPException(status_code=500, detail=resultado["error"])
    
    return resultado