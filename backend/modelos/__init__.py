"""
Modelos de la base de datos
"""

from .usuario_modelo import UsuarioDB
from .requerimiento_model import Requerimiento, EstadoRequerimiento, EspecialidadEnum
#from .oferta_modelo import Oferta, EstadoOferta  # 🆕 AGREGADO
from .proyecto_modelo import Proyecto, EstadoProyecto, FaseProyecto, SubTarea, EstadoSubTarea  # 🔥 SubTarea desde aquí
from .conversacion_chat_modelo import ConversacionChat, TipoConversacion, EmisorMensaje
from .analisis_ia_modelo import AnalisisIA
from .mensaje_modelo import MensajeChat
# from .archivo_modelo import Archivo  # 🔥 COMENTADO si no existe

__all__ = [
    # Usuarios
    "UsuarioDB",
    
    # Requerimientos
    "Requerimiento",
    "EstadoRequerimiento",
    "EspecialidadEnum",
    
    # Ofertas
    "Oferta",  # 🆕 AGREGADO
    "EstadoOferta",  # 🆕 AGREGADO
    
    # Proyectos
    "Proyecto",
    "EstadoProyecto",
    "FaseProyecto",
    
    # Sub-tareas
    "SubTarea",
    "EstadoSubTarea",
    # "PrioridadSubTarea",  # 🔥 COMENTADO - ahora usamos un string simple para prioridad
    
    # Chat y conversaciones
    "ConversacionChat",
    "TipoConversacion",
    "EmisorMensaje",
    
    # Análisis IA
    "AnalisisIA",
    
    # Mensajes
    "MensajeChat",
]