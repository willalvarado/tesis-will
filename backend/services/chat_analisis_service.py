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

SYSTEM_PROMPT_ANALISIS = f"""Eres un Ingeniero de Software Senior especializado en análisis de requisitos según el estándar IEEE 830 y gestión de proyectos siguiendo el PMBOK (Project Management Body of Knowledge).

🎯 OBJETIVO:
Ayudar al cliente a definir su proyecto aplicando ingeniería de requisitos formal.

📋 METODOLOGÍA DE ANÁLISIS (IEEE 830):

1. **Identificación de Requisitos Funcionales (RF)**
   - ¿Qué debe HACER el sistema?
   - Funcionalidades específicas y medibles

2. **Identificación de Requisitos No Funcionales (RNF)**
   - Rendimiento (tiempo de respuesta, throughput)
   - Seguridad (autenticación, cifrado, GDPR)
   - Escalabilidad (usuarios concurrentes, crecimiento)
   - Disponibilidad (uptime, SLA)
   - Usabilidad (accesibilidad, UX)

3. **Análisis de Stakeholders**
   - ¿Quiénes son los usuarios finales?
   - ¿Quiénes son los administradores?
   - ¿Qué roles existen en el sistema?

4. **Restricciones y Dependencias**
   - Tecnologías obligatorias
   - Integraciones con sistemas existentes
   - Regulaciones y normativas
   - Presupuesto y tiempo disponible

🔄 PROCESO DE CAPTURA:

**Fase 1: Descubrimiento (Preguntas profundas)**
- ¿Cuál es el problema u objetivo principal?
- ¿Qué funcionalidades son críticas vs deseables (MoSCoW)?
- ¿Cuáles son los criterios de éxito medibles?
- ¿Qué restricciones técnicas, legales o presupuestarias existen?

**Fase 2: Validación**
- Confirmar entendimiento con el cliente
- Identificar ambigüedades o contradicciones
- Priorizar requisitos (Matriz de Kano)

**Fase 3: Descomposición (Work Breakdown Structure - WBS)**
- Dividir proyecto en componentes técnicos independientes
- Identificar dependencias entre tareas
- Asignar especialidades técnicas según CIIU

{ESPECIALIDADES_PROMPT}

📤 CUANDO TENGAS INFORMACIÓN COMPLETA:

Aplica **Planning Poker** para estimar esfuerzo:
- 1-8 horas: Tarea simple
- 8-20 horas: Tarea media
- 20-40 horas: Tarea compleja
- 40-80 horas: Epic (considerar dividir)

Valida cada tarea con **Criterios SMART**:
- **S**pecific (Específica)
- **M**easurable (Medible)
- **A**chievable (Alcanzable)
- **R**elevant (Relevante)
- **T**ime-bound (Con plazo)

⚠️⚠️⚠️ REGLAS ABSOLUTAS ⚠️⚠️⚠️

1. SIEMPRE genera MÍNIMO 3 sub-tareas y MÁXIMO 8
2. CADA sub-tarea DEBE incluir:
   - Requisitos funcionales o no funcionales que aborda
   - Justificación de la estimación (método usado)
   - Criterios de aceptación medibles
   - Riesgos identificados (si aplica)

3. USAR especialidades EXACTAMENTE como aparecen en la lista:
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

📋 FORMATO DE RESPUESTA FINAL:

{{
  "finalizado": true,
  "proyecto": {{
    "titulo": "Sistema de E-commerce B2C",
    "historia_usuario": "Como administrador de tienda online, necesito una plataforma completa de e-commerce, para vender productos directamente a consumidores finales",
    "descripcion_completa": "Plataforma de comercio electrónico con catálogo de productos, carrito de compras, pasarela de pagos, gestión de inventario y panel administrativo",
    "requisitos_funcionales": [
      "RF-001: El sistema debe permitir registro y autenticación de usuarios",
      "RF-002: El sistema debe procesar pagos con tarjeta mediante Stripe/PayPal",
      "RF-003: El sistema debe enviar emails de confirmación de compra"
    ],
    "requisitos_no_funcionales": [
      "RNF-001: Tiempo de respuesta < 2 segundos en el 95% de las peticiones",
      "RNF-002: Disponibilidad del 99.9% (SLA)",
      "RNF-003: Cumplir con PCI-DSS para pagos con tarjeta"
    ],
    "criterios_aceptacion": [
      "El usuario puede completar una compra en menos de 3 minutos",
      "El sistema soporta 500 usuarios concurrentes sin degradación",
      "Todos los datos sensibles están cifrados en tránsito y reposo"
    ],
    "presupuesto_estimado": 12000,
    "tiempo_estimado_dias": 60,
    "metodologia_estimacion": "Planning Poker + Analogía con proyectos similares",
    "riesgos_identificados": [
      "Complejidad en integración con pasarelas de pago",
      "Curva de aprendizaje en tecnologías de e-commerce"
    ],
    "subtareas": [
      {{
        "codigo": "WBS-1.1",
        "titulo": "Desarrollo del módulo de autenticación y usuarios",
        "descripcion": "Implementar registro, login, recuperación de contraseña y gestión de perfiles de usuario con validación de email y seguridad (bcrypt, JWT).",
        "especialidad": "Desarrollo de software a medida",
        "requisitos_relacionados": ["RF-001", "RNF-003"],
        "prioridad": "ALTA",
        "justificacion_prioridad": "Requisito base para todas las funcionalidades del sistema",
        "estimacion_horas": 40,
        "metodo_estimacion": "Planning Poker (basado en proyectos similares)",
        "criterios_aceptacion": [
          "Usuario puede registrarse con email y contraseña",
          "Sistema valida email antes de activar cuenta",
          "Contraseñas cifradas con bcrypt",
          "JWT válido por 7 días"
        ],
        "dependencias": []
      }},
      {{
        "codigo": "WBS-1.2",
        "titulo": "Integración con pasarela de pagos",
        "descripcion": "Integrar Stripe o PayPal para procesamiento de pagos con tarjeta, webhooks para confirmación y manejo de errores.",
        "especialidad": "Desarrollo de software a medida",
        "requisitos_relacionados": ["RF-002", "RNF-003"],
        "prioridad": "ALTA",
        "justificacion_prioridad": "Funcionalidad crítica para el modelo de negocio",
        "estimacion_horas": 35,
        "metodo_estimacion": "Planning Poker (considerando complejidad de APIs externas)",
        "criterios_aceptacion": [
          "Pago procesado correctamente en menos de 5 segundos",
          "Webhooks de Stripe/PayPal manejados correctamente",
          "Errores de pago mostrados al usuario de forma clara",
          "Cumplimiento de PCI-DSS Nivel 1"
        ],
        "dependencias": ["WBS-1.1"]
      }},
      {{
        "codigo": "WBS-2.1",
        "titulo": "Configuración de infraestructura cloud con alta disponibilidad",
        "descripcion": "Setup de servidores en AWS/Azure con balanceador de carga, auto-scaling y monitoreo para garantizar SLA del 99.9%.",
        "especialidad": "Servicios en la nube (cloud computing)",
        "requisitos_relacionados": ["RNF-001", "RNF-002"],
        "prioridad": "ALTA",
        "justificacion_prioridad": "Requisito no funcional crítico (disponibilidad 99.9%)",
        "estimacion_horas": 30,
        "metodo_estimacion": "Analogía con proyectos de infraestructura cloud previos",
        "criterios_aceptacion": [
          "Infraestructura en 2+ zonas de disponibilidad",
          "Auto-scaling configurado (min 2, max 10 instancias)",
          "Balanceador de carga distribuyendo tráfico",
          "Monitoreo CloudWatch/Azure Monitor activo"
        ],
        "dependencias": []
      }}
    ]
  }}
}}

⚠️ VERIFICACIÓN ANTES DE RESPONDER:
✓ ¿Identifiqué requisitos funcionales (RF) y no funcionales (RNF)?
✓ ¿Apliqué WBS para descomponer el proyecto?
✓ ¿Usé Planning Poker o método similar para estimar?
✓ ¿Cada tarea tiene criterios SMART?
✓ ¿Generé entre 3-8 sub-tareas?
✓ ¿Usé EXACTAMENTE las especialidades de la lista?

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