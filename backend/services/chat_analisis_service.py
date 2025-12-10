# backend/services/chat_analisis_service.py
import os
import json
from openai import OpenAI
from typing import List, Dict

# Configuración de OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ========================================
# MAPEO DE ESPECIALIDADES
# ========================================

ESPECIALIDADES_DETALLADAS = {
    "CONSULTORIA_DESARROLLO": "Consultoría en desarrollo de sistemas",
    "CONSULTORIA_HARDWARE": "Consultoría en hardware",
    "CONSULTORIA_SOFTWARE": "Consultoría en software",
    "DESARROLLO_MEDIDA": "Desarrollo de software a medida",
    "SOFTWARE_EMPAQUETADO": "Software empaquetado",
    "ACTUALIZACION_SOFTWARE": "Actualización de software",
    "HOSTING": "Hosting",
    "PROCESAMIENTO_DATOS": "Procesamiento de datos",
    "CLOUD_COMPUTING": "Servicios en la nube (cloud computing)",
    "RECUPERACION_DESASTRES": "Recuperación ante desastres",
    "CIBERSEGURIDAD": "Servicios de ciberseguridad",
    "CAPACITACION_TI": "Capacitación en TI"
}

ESPECIALIDADES_VALIDAS = list(ESPECIALIDADES_DETALLADAS.keys())

# ========================================
# SYSTEM PROMPT
# ========================================

SYSTEM_PROMPT_ANALISIS = f"""Eres un analista experto de proyectos de TI de Conecta Solutions.

Tu trabajo es ayudar al cliente a definir su proyecto mediante una conversación profunda y detallada.

🎯 NO HAY LÍMITE DE PREGUNTAS. Profundiza todo lo necesario hasta tener información completa.

📋 INFORMACIÓN A CAPTURAR:

1. **Problema u objetivo**: ¿Qué quiere lograr?
2. **Funcionalidades clave**: Características específicas
3. **Usuarios finales**: ¿Quiénes usarán el sistema?
4. **Requisitos técnicos**: Tecnologías, plataformas
5. **Escala**: Usuarios esperados, volumen
6. **Plazo**: Tiempo disponible
7. **Presupuesto**: Rango de inversión
8. **Criterios de éxito**: ¿Cómo se medirá?

🔄 FLUJO:
1. Haz preguntas profundas
2. Si falta información, profundiza más
3. Al final pregunta: "¿Está completo o profundizamos más?"
4. Solo cuando tengas TODO, genera el proyecto

📤 CUANDO FINALICES:

Responde con este JSON (y solo este JSON, sin texto adicional):
{{
  "finalizado": true,
  "proyecto": {{
    "titulo": "...",
    "historia_usuario": "Como [rol], quiero [objetivo], para [beneficio]",
    "descripcion_completa": "...",
    "criterios_aceptacion": ["...", "...", "..."],
    "presupuesto_estimado": 5000,
    "tiempo_estimado_dias": 60,
    "subtareas": [
      {{
        "codigo": "TASK-001",
        "titulo": "...",
        "descripcion": "...",
        "especialidad": "DESARROLLO_MEDIDA",
        "prioridad": "ALTA",
        "estimacion_horas": 40,
        "dependencias": []
      }}
    ]
  }}
}}

Especialidades: {', '.join(ESPECIALIDADES_VALIDAS)}
Prioridades: ALTA, MEDIA, BAJA
"""

# ========================================
# FUNCIÓN PRINCIPAL
# ========================================

def chat_analisis_proyecto(
    mensajes_historial: List[Dict[str, str]],
    cliente_id: int
) -> Dict:
    """
    Gestiona la conversación con OpenAI para analizar un proyecto.
    """
    try:
        # Preparar mensajes
        mensajes_completos = [
            {"role": "system", "content": SYSTEM_PROMPT_ANALISIS}
        ] + mensajes_historial
        
        print(f"📤 Enviando {len(mensajes_historial)} mensajes a OpenAI...")
        
        # 🔥 FORZAR JSON MODE después de 4 mensajes
        usar_json_mode = len(mensajes_historial) >= 4
        
        # Llamada a OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=mensajes_completos,
            temperature=0.7,
            max_tokens=2000,
            response_format={"type": "json_object"} if usar_json_mode else None
        )
        
        respuesta_texto = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens
        
        print(f"📥 Respuesta recibida: {tokens} tokens")
        print(f"📄 Contenido (primeros 200 chars): {respuesta_texto[:200]}...")
        
        # 🔥 INTENTAR PARSEAR JSON
        try:
            datos = json.loads(respuesta_texto)
            print(f"✅ JSON parseado correctamente")
            print(f"🔍 Keys en JSON: {list(datos.keys())}")
            
            # Verificar si finalizó
            if datos.get("finalizado") == True or datos.get("finalizado") == "true":
                print(f"🎉 Análisis FINALIZADO detectado")
                
                if "proyecto" in datos and datos["proyecto"]:
                    proyecto = datos["proyecto"]
                    print(f"✅ Proyecto encontrado: {proyecto.get('titulo', 'Sin título')}")
                    print(f"📋 Sub-tareas: {len(proyecto.get('subtareas', []))}")
                    
                    return {
                        "exito": True,
                        "respuesta": "✨ ¡Perfecto! He analizado tu proyecto y lo he descompuesto en tareas específicas.",
                        "finalizado": True,
                        "proyecto": proyecto,
                        "tokens_usados": tokens,
                        "costo_estimado": tokens * 0.00015 / 1000
                    }
                else:
                    print(f"⚠️ JSON indica finalizado=true pero falta el proyecto")
            else:
                print(f"ℹ️ Análisis NO finalizado (continuando conversación)")
                
        except json.JSONDecodeError as e:
            print(f"⚠️ No es JSON válido (probablemente conversación normal): {e}")
            # No es JSON, es conversación normal
        except Exception as e:
            print(f"❌ Error parseando JSON: {e}")
        
        # 🔥 Respuesta normal (conversación continúa)
        return {
            "exito": True,
            "respuesta": respuesta_texto,
            "finalizado": False,
            "tokens_usados": tokens,
            "costo_estimado": tokens * 0.00015 / 1000
        }
        
    except Exception as e:
        print(f"❌ Error en chat_analisis_proyecto: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "exito": False,
            "error": str(e),
            "respuesta": "Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.",
            "finalizado": False,
            "tokens_usados": 0,
            "costo_estimado": 0
        }


def refinar_subtareas(proyecto_data: Dict) -> Dict:
    """Valida sub-tareas"""
    try:
        subtareas = proyecto_data.get("subtareas", [])
        codigos_vistos = set()
        
        for i, tarea in enumerate(subtareas):
            codigo = tarea.get("codigo", f"TASK-{str(i+1).zfill(3)}")
            if codigo in codigos_vistos:
                codigo = f"TASK-{str(i+1).zfill(3)}"
            codigos_vistos.add(codigo)
            tarea["codigo"] = codigo
            
            if tarea.get("especialidad") not in ESPECIALIDADES_VALIDAS:
                tarea["especialidad"] = "DESARROLLO_MEDIDA"
            
            if tarea.get("prioridad") not in ["ALTA", "MEDIA", "BAJA"]:
                tarea["prioridad"] = "MEDIA"
            
            if not isinstance(tarea.get("estimacion_horas"), (int, float)) or tarea["estimacion_horas"] <= 0:
                tarea["estimacion_horas"] = 40
            
            if not isinstance(tarea.get("dependencias"), list):
                tarea["dependencias"] = []
        
        proyecto_data["subtareas"] = subtareas
        
        return {"exito": True, "proyecto": proyecto_data}
        
    except Exception as e:
        return {"exito": False, "error": str(e)}


def generar_resumen_ejecutivo(proyecto_data: Dict) -> str:
    """Genera resumen del proyecto"""
    try:
        titulo = proyecto_data.get("titulo", "Proyecto")
        presupuesto = proyecto_data.get("presupuesto_estimado", 0)
        dias = proyecto_data.get("tiempo_estimado_dias", 0)
        subtareas = proyecto_data.get("subtareas", [])
        
        resumen = f"\n📋 **Resumen del Proyecto: {titulo}**\n\n"
        resumen += f"📝 **Descripción:**\n{proyecto_data.get('descripcion_completa', '')[:200]}...\n\n"
        resumen += f"💰 **Presupuesto Estimado:** ${presupuesto:,.2f}\n"
        resumen += f"⏱️ **Tiempo Estimado:** {dias} días\n\n"
        resumen += f"🎯 **Sub-tareas ({len(subtareas)}):**\n\n"
        
        por_especialidad = {}
        for tarea in subtareas:
            esp = tarea.get("especialidad", "OTRO")
            if esp not in por_especialidad:
                por_especialidad[esp] = []
            por_especialidad[esp].append(tarea)
        
        for esp, tareas in por_especialidad.items():
            nombre_esp = ESPECIALIDADES_DETALLADAS.get(esp, esp)
            resumen += f"**{nombre_esp}:**\n"
            for tarea in tareas:
                resumen += f"  • {tarea.get('titulo', '')}\n"
            resumen += "\n"
        
        return resumen
        
    except Exception as e:
        return "Error generando resumen"