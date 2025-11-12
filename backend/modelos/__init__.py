"""
Modelos de la base de datos
"""

from .usuario_modelo import UsuarioDB
from .requerimiento_model import Requerimiento, EstadoRequerimiento, EspecialidadEnum
from .proyecto_modelo import Proyecto, EstadoProyecto, FaseProyecto
from .sub_tarea_modelo import SubTarea, EstadoSubTarea, PrioridadSubTarea
from .conversacion_chat_modelo import ConversacionChat, TipoConversacion, EmisorMensaje
from .analisis_ia_modelo import AnalisisIA
from .mensaje_modelo import MensajeChat  # 🔥 CAMBIO AQUÍ
# from .archivo_modelo import Archivo  # 🔥 COMENTADO si no existe

__all__ = [
    # Usuarios
    "UsuarioDB",
    
    # Requerimientos
    "Requerimiento",
    "EstadoRequerimiento",
    "EspecialidadEnum",
    
    # Proyectos
    "Proyecto",
    "EstadoProyecto",
    "FaseProyecto",
    
    # Sub-tareas
    "SubTarea",
    "EstadoSubTarea",
    "PrioridadSubTarea",
    
    # Chat y conversaciones
    "ConversacionChat",
    "TipoConversacion",
    "EmisorMensaje",
    
    # Análisis IA
    "AnalisisIA",
    
    # Mensajes
    "MensajeChat",
]