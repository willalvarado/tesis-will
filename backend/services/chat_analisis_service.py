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
    "SOFTWARE_EMPAQUETADO": "Desarrollo y producción de software empaquetado",
    "ACTUALIZACION_SOFTWARE": "Actualización y adaptación de software",
    "HOSTING": "Servicios de alojamiento de datos (hosting)",
    "PROCESAMIENTO_DATOS": "Servicios de procesamiento de datos",
    "CLOUD_COMPUTING": "Servicios en la nube (cloud computing)",
    "RECUPERACION_DESASTRES": "Servicios de recuperación ante desastres",
    "CIBERSEGURIDAD": "Servicios de ciberseguridad",
    "CAPACITACION_TI": "Capacitación en TI"
}

ESPECIALIDADES_VALIDAS = list(ESPECIALIDADES_DETALLADAS.keys())

# 🔥 ESPECIALIDADES DISPONIBLES (con nombres completos para la IA)
ESPECIALIDADES_PROMPT = """
ESPECIALIDADES VÁLIDAS (usa EXACTAMENTE estos nombres):
1. "Consultoría en desarrollo de sistemas"
2. "Consultoría en hardware"
3. "Consultoría en software"
4. "Desarrollo de software a medida"
5. "Desarrollo y producción de software empaquetado"
6. "Actualización y adaptación de software"
7. "Servicios de alojamiento de datos (hosting)"
8. "Servicios de procesamiento de datos"
9. "Servicios en la nube (cloud computing)"
10. "Servicios de recuperación ante desastres"
11. "Servicios de ciberseguridad"
12. "Capacitación en TI"

⚠️ IMPORTANTE: Usa SOLO estos nombres EXACTOS en el campo "especialidad" de cada sub-tarea.
NO inventes especialidades como "Diseño de interfaz", "Integración de contenido", etc.
"""

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

{ESPECIALIDADES_PROMPT}

📤 CUANDO FINALICES:

⚠️⚠️⚠️ REGLAS ABSOLUTAS - NO NEGOCIABLES ⚠️⚠️⚠️

1. SIEMPRE genera MÍNIMO 3 sub-tareas y MÁXIMO 8
2. CADA sub-tarea DEBE usar una de estas especialidades EXACTAMENTE como está escrita:
   - "Consultoría en desarrollo de sistemas"
   - "Consultoría en hardware"
   - "Consultoría en software"
   - "Desarrollo de software a medida"
   - "Desarrollo y producción de software empaquetado"
   - "Actualización y adaptación de software"
   - "Servicios de alojamiento de datos (hosting)"
   - "Servicios de procesamiento de datos"
   - "Servicios en la nube (cloud computing)"
   - "Servicios de recuperación ante desastres"
   - "Servicios de ciberseguridad"
   - "Capacitación en TI"

3. USA DIFERENTES especialidades para diferentes tareas
4. NO inventes nombres nuevos
5. COPIA Y PEGA los nombres EXACTOS de la lista

📋 GUÍA DE ESPECIALIDADES POR TIPO DE TAREA:

Si el proyecto necesita:
- Crear/programar software → "Desarrollo de software a medida"
- Configurar servidores/hosting → "Servicios de alojamiento de datos (hosting)"
- Servicios en la nube (AWS, Azure, Google Cloud) → "Servicios en la nube (cloud computing)"
- Asesoría/planificación → "Consultoría en software" o "Consultoría en desarrollo de sistemas"
- Seguridad → "Servicios de ciberseguridad"
- Actualizaciones → "Actualización y adaptación de software"
- Procesamiento de datos → "Servicios de procesamiento de datos"
- Entrenamientos → "Capacitación en TI"

Responde con este JSON (y solo este JSON, sin texto adicional):
{{
  "finalizado": true,
  "proyecto": {{
    "titulo": "Página de Promoción para Tienda de Zapatillas",
    "historia_usuario": "Como dueño de tienda, quiero una página web promocional, para atraer más clientes",
    "descripcion_completa": "Página web promocional con galería de productos, información de contacto y mapa de ubicación",
    "criterios_aceptacion": [
      "La página debe mostrar las zapatillas con imágenes de alta calidad",
      "Debe incluir información de contacto visible",
      "Debe ser responsive (verse bien en móviles)"
    ],
    "presupuesto_estimado": 500,
    "tiempo_estimado_dias": 30,
    "subtareas": [
      {{
        "codigo": "TASK-001",
        "titulo": "Desarrollo del sitio web",
        "descripcion": "Crear la página web con HTML, CSS y JavaScript. Incluir galería de imágenes, sección de contacto y diseño responsive.",
        "especialidad": "Desarrollo de software a medida",
        "prioridad": "ALTA",
        "estimacion_horas": 30,
        "dependencias": []
      }},
      {{
        "codigo": "TASK-002",
        "titulo": "Configuración de hosting y dominio",
        "descripcion": "Contratar servicio de hosting, configurar dominio, subir archivos al servidor y configurar DNS.",
        "especialidad": "Servicios de alojamiento de datos (hosting)",
        "prioridad": "ALTA",
        "estimacion_horas": 6,
        "dependencias": ["TASK-001"]
      }},
      {{
        "codigo": "TASK-003",
        "titulo": "Asesoría en diseño y estructura",
        "descripcion": "Consultoría sobre mejores prácticas de diseño web, usabilidad y estructura de contenido para la tienda.",
        "especialidad": "Consultoría en software",
        "prioridad": "MEDIA",
        "estimacion_horas": 8,
        "dependencias": []
      }}
    ]
  }}
}}

⚠️ VERIFICA ANTES DE RESPONDER:
✓ ¿Generaste al menos 3 sub-tareas?
✓ ¿Cada "especialidad" es EXACTAMENTE una de la lista de 12?
✓ ¿Usaste DIFERENTES especialidades?
✓ ¿NO inventaste nombres como "Desarrollo de la Página Web"?

SI LA RESPUESTA A CUALQUIERA ES NO, CORRIGE ANTES DE RESPONDER.

Prioridades válidas: ALTA, MEDIA, BAJA
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
                    
                    # 🔥 IMPRIMIR ESPECIALIDADES GENERADAS
                    for i, tarea in enumerate(proyecto.get('subtareas', [])):
                        print(f"   {i+1}. {tarea.get('titulo')}: '{tarea.get('especialidad')}'")
                    
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
    """Valida y corrige sub-tareas"""
    try:
        subtareas = proyecto_data.get("subtareas", [])
        codigos_vistos = set()
        
        # 🔥 MAPEO: Nombre completo → Código interno
        NOMBRE_A_CODIGO = {
            "Consultoría en desarrollo de sistemas": "CONSULTORIA_DESARROLLO",
            "Consultoría en hardware": "CONSULTORIA_HARDWARE",
            "Consultoría en software": "CONSULTORIA_SOFTWARE",
            "Desarrollo de software a medida": "DESARROLLO_MEDIDA",
            "Desarrollo y producción de software empaquetado": "SOFTWARE_EMPAQUETADO",
            "Actualización y adaptación de software": "ACTUALIZACION_SOFTWARE",
            "Servicios de alojamiento de datos (hosting)": "HOSTING",
            "Servicios de procesamiento de datos": "PROCESAMIENTO_DATOS",
            "Servicios en la nube (cloud computing)": "CLOUD_COMPUTING",
            "Servicios de recuperación ante desastres": "RECUPERACION_DESASTRES",
            "Servicios de ciberseguridad": "CIBERSEGURIDAD",
            "Capacitación en TI": "CAPACITACION_TI"
        }
        
        for i, tarea in enumerate(subtareas):
            # Código único
            codigo = tarea.get("codigo", f"TASK-{str(i+1).zfill(3)}")
            if codigo in codigos_vistos:
                codigo = f"TASK-{str(i+1).zfill(3)}"
            codigos_vistos.add(codigo)
            tarea["codigo"] = codigo
            
            # 🔥 CONVERTIR ESPECIALIDAD: Nombre → Código
            especialidad_nombre = tarea.get("especialidad", "")
            
            # Buscar en el mapeo (coincidencia exacta o parcial)
            especialidad_codigo = None
            for nombre, codigo in NOMBRE_A_CODIGO.items():
                if nombre.lower() == especialidad_nombre.lower():
                    # Coincidencia exacta
                    especialidad_codigo = codigo
                    break
                elif nombre.lower() in especialidad_nombre.lower() or especialidad_nombre.lower() in nombre.lower():
                    # Coincidencia parcial
                    especialidad_codigo = codigo
            
            # Si no encontró match, usar DESARROLLO_MEDIDA por defecto
            if not especialidad_codigo:
                print(f"⚠️ Especialidad no encontrada: '{especialidad_nombre}' - usando DESARROLLO_MEDIDA")
                especialidad_codigo = "DESARROLLO_MEDIDA"
            
            tarea["especialidad"] = especialidad_codigo
            print(f"✅ Sub-tarea {i+1}: '{especialidad_nombre}' → {especialidad_codigo}")
            
            # Validar prioridad
            if tarea.get("prioridad") not in ["ALTA", "MEDIA", "BAJA"]:
                tarea["prioridad"] = "MEDIA"
            
            # Validar estimación
            if not isinstance(tarea.get("estimacion_horas"), (int, float)) or tarea["estimacion_horas"] <= 0:
                tarea["estimacion_horas"] = 40
            
            # Validar dependencias
            if not isinstance(tarea.get("dependencias"), list):
                tarea["dependencias"] = []
        
        proyecto_data["subtareas"] = subtareas
        
        return {"exito": True, "proyecto": proyecto_data}
        
    except Exception as e:
        print(f"❌ Error refinando sub-tareas: {e}")
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