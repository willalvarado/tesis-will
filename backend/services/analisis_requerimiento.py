# services/analisis_requerimiento.py
from modelos.requerimiento_model import EspecialidadEnum

class AnalizadorRequerimientos:
    """
    Analiza el mensaje del cliente y determina:
    - La especialidad CPC requerida
    - Un título descriptivo
    - Una descripción estructurada
    """
    
    # Mapeo de palabras clave a especialidades CPC
    PALABRAS_CLAVE = {
        EspecialidadEnum.CONSULTORIA_DESARROLLO: [
            "consultoría", "asesoría", "análisis de sistemas", "levantamiento de requerimientos",
            "arquitectura de software", "diseño de sistemas", "metodología", "scrum", "agile",
            "evaluación de sistemas", "auditoría de sistemas", "mejora de procesos"
        ],
        
        EspecialidadEnum.CONSULTORIA_HARDWARE: [
            "hardware", "servidores", "computadoras", "equipos", "infraestructura física",
            "redes", "routers", "switches", "datacenter", "instalación de equipos",
            "mantenimiento de hardware", "soporte técnico"
        ],
        
        EspecialidadEnum.CONSULTORIA_SOFTWARE: [
            "software", "licencias", "implementación", "erp", "crm", "selección de software",
            "evaluación de software", "migración", "integración de sistemas", "api",
            "consultoría de software"
        ],
        
        EspecialidadEnum.DESARROLLO_MEDIDA: [
            "desarrollo a medida", "aplicación personalizada", "sistema personalizado",
            "software a medida", "desarrollo web", "página web", "sitio web", "webapp",
            "aplicación móvil", "app", "android", "ios", "sistema específico",
            "plataforma", "portal", "dashboard", "panel de control"
        ],
        
        EspecialidadEnum.SOFTWARE_EMPAQUETADO: [
            "software empaquetado", "producto de software", "saas", "software como servicio",
            "aplicación comercial", "software estándar", "paquete de software",
            "solución lista para usar", "software comercial"
        ],
        
        EspecialidadEnum.ACTUALIZACION_SOFTWARE: [
            "actualización", "upgrade", "modernización", "migración de versión",
            "parche", "mantenimiento de software", "adaptación", "personalización",
            "modificación de software", "mejora de software", "optimización"
        ],
        
        EspecialidadEnum.HOSTING: [
            "hosting", "alojamiento", "servidor web", "dominio", "hospedaje",
            "vps", "servidor dedicado", "servidor compartido", "cpanel", "plesk",
            "alojamiento web", "espacio web"
        ],
        
        EspecialidadEnum.PROCESAMIENTO_DATOS: [
            "procesamiento de datos", "análisis de datos", "big data", "etl",
            "transformación de datos", "limpieza de datos", "minería de datos",
            "data mining", "business intelligence", "bi", "reportes", "analytics",
            "estadísticas", "métricas", "kpi", "visualización de datos"
        ],
        
        EspecialidadEnum.CLOUD_COMPUTING: [
            "nube", "cloud", "aws", "azure", "google cloud", "gcp", "cloud computing",
            "infraestructura como servicio", "iaas", "paas", "migración a la nube",
            "servicios en la nube", "almacenamiento en la nube", "backup en la nube"
        ],
        
        EspecialidadEnum.RECUPERACION_DESASTRES: [
            "recuperación ante desastres", "backup", "respaldo", "continuidad del negocio",
            "plan de contingencia", "disaster recovery", "restauración", "réplica",
            "alta disponibilidad", "redundancia", "failover"
        ],
        
        EspecialidadEnum.CIBERSEGURIDAD: [
            "seguridad", "ciberseguridad", "seguridad informática", "pentesting",
            "vulnerabilidades", "firewall", "antivirus", "protección", "hackeo",
            "ethical hacking", "auditoría de seguridad", "ssl", "https", "cifrado",
            "encriptación", "seguridad de datos", "compliance", "iso 27001"
        ],
        
        EspecialidadEnum.CAPACITACION_TI: [
            "capacitación", "entrenamiento", "curso", "formación", "training",
            "taller", "workshop", "certificación", "aprendizaje", "educación",
            "enseñanza", "instructor", "capacitar personal", "formar equipo"
        ]
    }
    
    @classmethod
    def analizar_mensaje(cls, mensaje: str) -> dict:
        """
        Analiza el mensaje y retorna:
        - especialidad detectada
        - título sugerido
        - descripción estructurada
        """
        mensaje_lower = mensaje.lower()
        
        # Detectar especialidad
        especialidad = cls._detectar_especialidad(mensaje_lower)
        
        # Generar título (primeras 50 caracteres del mensaje o menos)
        titulo = cls._generar_titulo(mensaje)
        
        # Generar descripción
        descripcion = cls._generar_descripcion(mensaje, especialidad)
        
        return {
            "especialidad": especialidad,
            "titulo": titulo,
            "descripcion": descripcion
        }
    
    @classmethod
    def _detectar_especialidad(cls, mensaje: str) -> EspecialidadEnum:
        """Detecta la especialidad basándose en palabras clave"""
        
        # Contar coincidencias por especialidad
        coincidencias = {}
        
        for especialidad, palabras in cls.PALABRAS_CLAVE.items():
            count = 0
            for palabra in palabras:
                if palabra in mensaje:
                    count += 1
            if count > 0:
                coincidencias[especialidad] = count
        
        # Si hay coincidencias, retornar la de mayor puntaje
        if coincidencias:
            return max(coincidencias, key=coincidencias.get)
        
        # Si no hay coincidencias claras, intentar detectar por contexto general
        if any(word in mensaje for word in ["sistema", "aplicación", "software", "desarrollo", "programa"]):
            return EspecialidadEnum.DESARROLLO_MEDIDA
        
        # Si no se puede determinar, retornar OTRO
        return EspecialidadEnum.OTRO
    
    @classmethod
    def _generar_titulo(cls, mensaje: str) -> str:
        """Genera un título descriptivo del requerimiento"""
        # Tomar las primeras palabras del mensaje
        palabras = mensaje.split()[:8]  # Máximo 8 palabras
        titulo = " ".join(palabras)
        
        # Si es muy largo, cortar y agregar puntos suspensivos
        if len(titulo) > 60:
            titulo = titulo[:57] + "..."
        
        return titulo if titulo else "Nuevo requerimiento"
    
    @classmethod
    def _generar_descripcion(cls, mensaje: str, especialidad: EspecialidadEnum) -> str:
        """Genera una descripción estructurada del requerimiento"""
        descripcion = f"""
REQUERIMIENTO DE CLIENTE
========================
Especialidad detectada: {especialidad.value}

Mensaje original:
{mensaje}

Estado: Pendiente de revisión por vendedor especializado
"""
        return descripcion