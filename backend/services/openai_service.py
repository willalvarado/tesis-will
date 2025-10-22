# backend/services/openai_service.py
import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Inicializar cliente de OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analizar_requerimiento(texto_requerimiento: str) -> dict:
    """
    Analiza un requerimiento del cliente usando GPT-4o mini
    y extrae información estructurada.
    """
    
    prompt = f"""
Eres un asistente experto en análisis de proyectos de software. 
Analiza el siguiente requerimiento de un cliente y extrae la siguiente información en formato JSON:

{{
  "especialidad": "La especialidad técnica necesaria",
  "tiempo_estimado": "Tiempo estimado (ej: 2-3 meses)",
  "presupuesto_sugerido": "Rango de presupuesto en USD",
  "complejidad": "Baja, Media o Alta",
  "tecnologias_sugeridas": ["tech1", "tech2", "tech3"],
  "descripcion_tecnica": "Descripción técnica del proyecto en 2-3 oraciones"
}}

Requerimiento del cliente:
"{texto_requerimiento}"

Responde ÚNICAMENTE con el objeto JSON, sin texto adicional antes o después.
"""

    try:
        print("🔍 Enviando petición a OpenAI...")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un asistente de análisis de proyectos de software. Respondes SOLO con JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=500,
            response_format={"type": "json_object"}
        )
        
        contenido = response.choices[0].message.content
        print(f"✅ Respuesta de OpenAI: {contenido}")
        
        resultado = json.loads(contenido)
        
        return {
            "exito": True,
            "analisis": resultado,
            "tokens_usados": response.usage.total_tokens,
            "costo_aproximado": f"${(response.usage.total_tokens * 0.00015 / 1000):.6f}"
        }
        
    except json.JSONDecodeError as e:
        print(f"❌ Error parseando JSON: {e}")
        return {
            "exito": False,
            "error": f"OpenAI no devolvió JSON válido: {str(e)}",
            "respuesta_cruda": contenido if 'contenido' in locals() else "Sin respuesta"
        }
    
    except Exception as e:
        print(f"❌ Error general: {e}")
        return {
            "exito": False,
            "error": str(e),
            "analisis": None
        }


def sugerir_vendedores(especialidad: str, complejidad: str) -> dict:
    """
    Sugiere criterios para seleccionar vendedores ideales.
    """
    
    prompt = f"""
Necesito seleccionar un vendedor/freelancer para un proyecto con estas características:
- Especialidad: {especialidad}
- Complejidad: {complejidad}

Genera un objeto JSON con esta estructura:
{{
  "experiencia_minima": "X años",
  "habilidades_clave": ["habilidad1", "habilidad2", "habilidad3"],
  "criterios_evaluacion": ["criterio1", "criterio2", "criterio3"]
}}

Responde ÚNICAMENTE con el objeto JSON.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Eres un experto en selección de talento técnico. Respondes SOLO con JSON válido."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        contenido = response.choices[0].message.content
        resultado = json.loads(contenido)
        
        return {
            "exito": True,
            "sugerencias": resultado
        }
        
    except Exception as e:
        return {
            "exito": False,
            "error": str(e)
        }


# ========================================
# CHAT CONVERSACIONAL
# ========================================

ESPECIALIDADES = """
ESPECIALIDADES DISPONIBLES:

1. CONSULTORÍA EN TI:
   - Consultoría en desarrollo de sistemas (83111)
   - Consultoría en hardware (83112)
   - Consultoría en software (83113)

2. DESARROLLO DE SOFTWARE:
   - Desarrollo de software a medida (83131)
   - Desarrollo y producción de software empaquetado (83132)
   - Actualización y adaptación de software (83133)

3. TRATAMIENTO DE DATOS, ALOJAMIENTO Y NUBE:
   - Servicios de alojamiento de datos/hosting (83141)
   - Servicios de procesamiento de datos (83142)
   - Servicios en la nube/cloud computing (83143)

4. OTROS SERVICIOS DE TI:
   - Servicios de recuperación ante desastres (83161)
   - Servicios de ciberseguridad (83162)
   - Capacitación en TI (83163)
"""

SYSTEM_PROMPT = f"""
Eres un asistente virtual de Conecta Solutions, una plataforma que conecta clientes con vendedores especializados en tecnología.

{ESPECIALIDADES}

TU MISIÓN:
Ayudar al cliente a definir su proyecto en máximo 5-8 preguntas cortas y claras.

INFORMACIÓN QUE DEBES CAPTURAR:
1. Tipo de servicio (de las especialidades disponibles)
2. Objetivo/problema a resolver
3. Características principales del proyecto
4. Plazo o urgencia
5. PRESUPUESTO (obligatorio al final)
6. Título del proyecto (breve y descriptivo)

REGLAS IMPORTANTES:
- Sé amigable, profesional y breve
- Usa emojis ocasionalmente 😊
- Haz máximo 2 preguntas a la vez
- Ofrece opciones múltiples cuando sea posible
- El presupuesto es OBLIGATORIO antes de finalizar
- Adapta las preguntas según las respuestas del cliente
- Si el cliente da mucha información de golpe, no repitas preguntas innecesarias
- Al final, genera un resumen completo del requerimiento

FORMATO DE RESPUESTA:
- Si aún faltan preguntas: responde normalmente
- Si ya tienes toda la información: responde con JSON:
{{
  "finalizado": true,
  "requerimiento": {{
    "titulo": "título corto del proyecto",
    "descripcion": "descripción detallada y completa (puede ser larga)",
    "especialidad": "código de especialidad (ej: 83131)",
    "presupuesto": "monto en USD",
    "mensaje": "resumen conversacional del proyecto"
  }}
}}
"""


def chat_requerimiento(mensajes_historial: list) -> dict:
    """
    Chat conversacional para crear requerimientos.
    
    Args:
        mensajes_historial: Lista de mensajes [{"role": "user"/"assistant", "content": "..."}]
    
    Returns:
        dict con la respuesta del asistente
    """
    try:
        mensajes_completos = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ] + mensajes_historial
        
        print(f"💬 Enviando {len(mensajes_historial)} mensajes a OpenAI...")
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=mensajes_completos,
            temperature=0.8,
            max_tokens=600
        )
        
        respuesta = response.choices[0].message.content
        print(f"✅ Respuesta: {respuesta[:100]}...")
        
        finalizado = False
        requerimiento = None
        
        if "finalizado" in respuesta and "{" in respuesta:
            try:
                inicio = respuesta.index("{")
                fin = respuesta.rindex("}") + 1
                json_str = respuesta[inicio:fin]
                data = json.loads(json_str)
                
                if data.get("finalizado"):
                    finalizado = True
                    requerimiento = data.get("requerimiento")
                    respuesta = "¡Perfecto! He generado tu requerimiento. 🎉"
            except:
                pass
        
        return {
            "exito": True,
            "respuesta": respuesta,
            "finalizado": finalizado,
            "requerimiento": requerimiento,
            "tokens_usados": response.usage.total_tokens
        }
        
    except Exception as e:
        print(f"❌ Error en chat: {e}")
        return {
            "exito": False,
            "error": str(e)
        }