# backend/services/chat_analisis_service.py
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from typing import List, Dict, Optional

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ========================================
# MAPEO DE ESPECIALIDADES
# ========================================

ESPECIALIDADES_DETALLADAS = {
    "CONSULTORIA_DESARROLLO": "Consultoría en desarrollo de sistemas",
    "CONSULTORIA_HARDWARE": "Consultoría en hardware",
    "CONSULTORIA_SOFTWARE": "Consultoría en software",
    "DESARROLLO_MEDIDA": "Desarrollo de software a medida",
    "SOFTWARE_EMPAQUETADO": "Desarrollo y producción de software empaquetado",
    "ACTUALIZACION_SOFTWARE": "Actualización y adaptación de software",
    "HOSTING": "Servicios de alojamiento de datos (hosting)",
    "PROCESAMIENTO_DATOS": "Servicios de procesamiento de datos",
    "CLOUD_COMPUTING": "Servicios en la nube (cloud computing)",
    "RECUPERACION_DESASTRES": "Servicios de recuperación ante desastres",
    "CIBERSEGURIDAD": "Servicios de ciberseguridad",
    "CAPACITACION_TI": "Capacitación en TI"
}

# ========================================
# PROMPT MEJORADO PARA CHAT SIN LÍMITES
# ========================================

SYSTEM_PROMPT_ANALISIS = """
Eres un Analista de Proyectos de TI experto que trabaja para Conecta Solutions, una plataforma que conecta clientes con vendedores especializados.

🎯 TU MISIÓN:
Ayudar al cliente a definir su proyecto de forma COMPLETA y DETALLADA mediante un diálogo natural y profundo.

📋 INFORMACIÓN QUE DEBES CAPTURAR:
1. **Problema u objetivo**: ¿Qué necesita resolver o lograr?
2. **Funcionalidades clave**: Características principales del sistema/servicio
3. **Usuarios finales**: ¿Quién usará el producto/servicio?
4. **Requisitos técnicos**: Plataformas, integraciones, tecnologías preferidas
5. **Escala**: Volumen de usuarios, datos, transacciones
6. **Plazo**: Urgencia y fechas importantes
7. **Presupuesto**: Rango de inversión disponible
8. **Criterios de éxito**: ¿Cómo medirá el éxito del proyecto?

🔑 REGLAS IMPORTANTES:
- **NO hay límite de preguntas** - profundiza todo lo necesario
- Sé amigable, profesional y conversacional 😊
- Haz preguntas abiertas que inviten a detallar
- Si la respuesta es vaga, pide ejemplos concretos
- Ofrece opciones cuando sea útil
- Adapta tu estilo al del cliente (técnico o no técnico)
- Usa ejemplos para clarificar conceptos
- Al final de cada mensaje, pregunta: "¿Está completo o profundizamos más?"

📊 ESPECIALIDADES DISPONIBLES:
- Consultoría en desarrollo de sistemas
- Consultoría en hardware/software
- Desarrollo de software a medida
- Software empaquetado
- Hosting y procesamiento de datos
- Cloud computing
- Ciberseguridad
- Recuperación ante desastres
- Capacitación en TI

🎯 CRITERIO DE FINALIZACIÓN:
Solo finaliza cuando:
1. Tengas TODA la información detallada
2. El cliente confirme explícitamente que está satisfecho
3. Puedas descomponer el proyecto en sub-tareas técnicas específicas

📤 CUANDO FINALICES:
Responde con este JSON (y solo este JSON, sin texto adicional):
```json
{
  "finalizado": true,
  "proyecto": {
    "titulo": "Título claro y descriptivo del proyecto",
    "historia_usuario": "Como [tipo de usuario], quiero [funcionalidad], para [beneficio]",
    "descripcion_completa": "Descripción técnica detallada de todo el proyecto (puede ser muy larga)",
    "criterios_aceptacion": [
      "Criterio 1 específico y medible",
      "Criterio 2 específico y medible",
      "Criterio 3 específico y medible"
    ],
    "presupuesto_estimado": 5000,
    "tiempo_estimado_dias": 60,
    "subtareas": [
      {
        "codigo": "TASK-001",
        "titulo": "Título de la sub-tarea",
        "descripcion": "Descripción técnica detallada",
        "especialidad": "DESARROLLO_MEDIDA",
        "prioridad": "ALTA",
        "estimacion_horas": 40,
        "dependencias": []
      }
    ]
  }
}
```

💬 ESTILO DE CONVERSACIÓN:
- Si el cliente da mucha información: "¡Excelente! Entiendo que necesitas [resumir]. Déjame profundizar en..."
- Si la respuesta es corta: "Perfecto, para asegurarme de entender bien..."
- Usa bullets cuando listes opciones
- Termina siempre con una pregunta abierta o "¿Algo más que agregar sobre esto?"

🚫 NO HAGAS:
- No asumas información no mencionada
- No limites las preguntas a un número fijo
- No finalices hasta que el cliente confirme
- No uses jerga técnica con clientes no técnicos
"""


# ========================================
# FUNCIÓN PRINCIPAL DE CHAT
# ========================================

def chat_analisis_proyecto(
    mensajes_historial: List[Dict[str, str]],
    cliente_id: int
) -> Dict:
    """
    Chat conversacional sin límites para análisis profundo de proyectos.
    
    Args:
        mensajes_historial: Lista de mensajes [{"role": "user"/"assistant", "content": "..."}]
        cliente_id: ID del cliente
    
    Returns:
        dict con:
        - exito: bool
        - respuesta: str (mensaje del asistente)
        - finalizado: bool
        - proyecto: dict (si finalizado=True)
        - tokens_usados: int
    """
    try:
        # Preparar mensajes
        mensajes_completos = [
            {"role": "system", "content": SYSTEM_PROMPT_ANALISIS}
        ] + mensajes_historial
        
        print(f"💬 Analizando proyecto - {len(mensajes_historial)} mensajes en historial")
        
        # Llamada a OpenAI
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=mensajes_completos,
            temperature=0.7,
            max_tokens=1500,  # Más tokens para respuestas detalladas
            response_format={"type": "json_object"} if len(mensajes_historial) > 6 else None  # JSON solo si hay suficiente contexto
        )
        
        respuesta = response.choices[0].message.content
        tokens = response.usage.total_tokens
        
        print(f"✅ Respuesta generada - {tokens} tokens usados")
        
        # Intentar parsear como JSON (si finalizó)
        finalizado = False
        proyecto = None
        
        try:
            data = json.loads(respuesta)
            if data.get("finalizado"):
                finalizado = True
                proyecto = data.get("proyecto")
                
                # Validar que tenga las sub-tareas
                if not proyecto.get("subtareas") or len(proyecto["subtareas"]) == 0:
                    print("⚠️ Proyecto finalizado pero sin sub-tareas, continuando análisis...")
                    finalizado = False
                    proyecto = None
                    respuesta = "Tengo casi toda la información. ¿Podrías confirmar si hay algo más específico que necesites o si con esto podemos proceder?"
                else:
                    print(f"🎉 Proyecto finalizado - {len(proyecto['subtareas'])} sub-tareas generadas")
                    respuesta = "✨ ¡Perfecto! He analizado tu proyecto y lo he descompuesto en tareas específicas. Puedes revisarlo y publicarlo para que los vendedores especializados puedan postularse."
                    
        except json.JSONDecodeError:
            # No es JSON, es una pregunta normal del chat
            print("💬 Respuesta conversacional normal")
        
        return {
            "exito": True,
            "respuesta": respuesta,
            "finalizado": finalizado,
            "proyecto": proyecto,
            "tokens_usados": tokens,
            "costo_estimado": f"${(tokens * 0.00015 / 1000):.6f}"
        }
        
    except Exception as e:
        print(f"❌ Error en chat_analisis_proyecto: {e}")
        return {
            "exito": False,
            "error": str(e),
            "respuesta": "Lo siento, hubo un error procesando tu mensaje. ¿Podrías intentarlo de nuevo?",
            "finalizado": False
        }


# ========================================
# FUNCIÓN PARA REFINAR SUB-TAREAS
# ========================================

def refinar_subtareas(proyecto_data: Dict) -> Dict:
    """
    Refina y valida las sub-tareas generadas por el análisis.
    Asegura que tengan toda la información necesaria.
    """
    try:
        subtareas = proyecto_data.get("subtareas", [])
        
        # Validar cada sub-tarea
        subtareas_validadas = []
        for i, tarea in enumerate(subtareas, 1):
            # Asegurar código único
            if not tarea.get("codigo"):
                tarea["codigo"] = f"TASK-{str(i).zfill(3)}"
            
            # Validar especialidad
            if tarea.get("especialidad") not in ESPECIALIDADES_DETALLADAS:
                print(f"⚠️ Especialidad inválida en {tarea['codigo']}: {tarea.get('especialidad')}")
                tarea["especialidad"] = "DESARROLLO_MEDIDA"  # Default
            
            # Asegurar prioridad
            if tarea.get("prioridad") not in ["ALTA", "MEDIA", "BAJA"]:
                tarea["prioridad"] = "MEDIA"
            
            # Asegurar estimación
            if not tarea.get("estimacion_horas") or tarea["estimacion_horas"] <= 0:
                tarea["estimacion_horas"] = 40  # Default 1 semana
            
            subtareas_validadas.append(tarea)
        
        proyecto_data["subtareas"] = subtareas_validadas
        proyecto_data["total_subtareas"] = len(subtareas_validadas)
        
        print(f"✅ {len(subtareas_validadas)} sub-tareas validadas")
        
        return {
            "exito": True,
            "proyecto": proyecto_data
        }
        
    except Exception as e:
        print(f"❌ Error refinando sub-tareas: {e}")
        return {
            "exito": False,
            "error": str(e)
        }


# ========================================
# FUNCIÓN PARA GENERAR RESUMEN EJECUTIVO
# ========================================

def generar_resumen_ejecutivo(proyecto_data: Dict) -> str:
    """
    Genera un resumen ejecutivo del proyecto para mostrar al cliente.
    """
    try:
        subtareas = proyecto_data.get("subtareas", [])
        
        # Agrupar por especialidad
        especialidades_usadas = {}
        for tarea in subtareas:
            esp = tarea["especialidad"]
            if esp not in especialidades_usadas:
                especialidades_usadas[esp] = []
            especialidades_usadas[esp].append(tarea["titulo"])
        
        resumen = f"""
📋 **Resumen del Proyecto: {proyecto_data['titulo']}**

📝 **Descripción:**
{proyecto_data['descripcion_completa'][:200]}...

💰 **Presupuesto Estimado:** ${proyecto_data['presupuesto_estimado']:,.2f}
⏱️ **Tiempo Estimado:** {proyecto_data['tiempo_estimado_dias']} días

🎯 **Sub-tareas ({len(subtareas)}):**
"""
        
        for esp, tareas in especialidades_usadas.items():
            nombre_esp = ESPECIALIDADES_DETALLADAS.get(esp, esp)
            resumen += f"\n**{nombre_esp}:**\n"
            for tarea in tareas:
                resumen += f"  • {tarea}\n"
        
        return resumen
        
    except Exception as e:
        return f"Error generando resumen: {str(e)}"