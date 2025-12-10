from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from modelos.requerimiento_model import Requerimiento, EstadoRequerimiento, EspecialidadEnum
from modelos.proyecto_modelo import Proyecto, EstadoProyecto
from modelos.usuario_modelo import UsuarioDB
from Vendedores.vendedor_modelo import Vendedor
from pydantic import BaseModel
from datetime import datetime
from services.openai_service import convertir_codigo_a_nombre


router = APIRouter(
    prefix="/requerimientos",
    tags=["Requerimientos"]
)

# ... todo tu código existente ...

# 🆕 NUEVO ENDPOINT: Obtener proyectos en análisis o publicados
@router.get("/proyectos-cliente/{cliente_id}")
def obtener_proyectos_en_analisis_publicado(cliente_id: int, db: Session = Depends(get_db)):
    """
    Obtiene los proyectos del cliente que están en ANALISIS o PUBLICADO.
    Estos son proyectos creados con IA que están esperando vendedores.
    """
    from modelos.proyecto_modelo import Proyecto, FaseProyecto, SubTarea, EstadoSubTarea
    
    # Proyectos en análisis o publicados
    proyectos = db.query(Proyecto).filter(
        Proyecto.cliente_id == cliente_id,
        Proyecto.fase.in_([FaseProyecto.ANALISIS, FaseProyecto.PUBLICADO])
    ).order_by(Proyecto.created_at.desc()).all()
    
    resultado = []
    for proyecto in proyectos:
        # Contar sub-tareas
        total_subtareas = db.query(SubTarea).filter(
            SubTarea.proyecto_id == proyecto.id
        ).count()
        
        subtareas_completadas = db.query(SubTarea).filter(
            SubTarea.proyecto_id == proyecto.id,
            SubTarea.estado == EstadoSubTarea.COMPLETADO
        ).count()
        
        # Parsear criterios de aceptación si existen
        criterios = []
        if proyecto.criterios_aceptacion:
            try:
                import json
                # Si es string JSON, parsearlo
                if isinstance(proyecto.criterios_aceptacion, str):
                    criterios = json.loads(proyecto.criterios_aceptacion)
                # Si ya es lista, usarla directamente
                elif isinstance(proyecto.criterios_aceptacion, list):
                    criterios = proyecto.criterios_aceptacion
            except:
                criterios = []
        
        resultado.append({
            "id": proyecto.id,
            "titulo": proyecto.titulo,
            "descripcion": proyecto.descripcion,
            "fase": proyecto.fase.value if hasattr(proyecto.fase, 'value') else str(proyecto.fase),
            "total_subtareas": total_subtareas,
            "subtareas_completadas": subtareas_completadas,
            "historia_usuario": proyecto.historia_usuario,
            "criterios_aceptacion": criterios,
            "diagrama_flujo": proyecto.diagrama_flujo,
            "created_at": proyecto.created_at,
            "updated_at": proyecto.updated_at
        })
    
    return resultado

# ... resto de tu código ...

# 🔥 FUNCIÓN DE MAPEO: Nombre amigable → Código ENUM
def nombre_amigable_a_enum(nombre: str) -> str:
    """
    Convierte nombres amigables a códigos del ENUM.
    """
    mapeo = {
        # Consultoría en TI
        "consultoría en desarrollo de sistemas": "CONSULTORIA_DESARROLLO",
        "consultoría en hardware": "CONSULTORIA_HARDWARE",
        "consultoría en software": "CONSULTORIA_SOFTWARE",
        
        # Desarrollo de software
        "desarrollo de software a medida": "DESARROLLO_MEDIDA",
        "desarrollo y producción de software empaquetado": "SOFTWARE_EMPAQUETADO",
        "actualización y adaptación de software": "ACTUALIZACION_SOFTWARE",
        
        # Tratamiento de datos, alojamiento y nube
        "servicios de alojamiento de datos (hosting)": "HOSTING",
        "servicios de procesamiento de datos": "PROCESAMIENTO_DATOS",
        "servicios en la nube (cloud computing)": "CLOUD_COMPUTING",
        
        # Otros servicios de TI
        "servicios de recuperación ante desastres": "RECUPERACION_DESASTRES",
        "servicios de ciberseguridad": "CIBERSEGURIDAD",
        "capacitación en ti": "CAPACITACION_TI",
        
        "otro": "OTRO"
    }
    
    # Normalizar a minúsculas para buscar
    nombre_lower = nombre.strip().lower()
    return mapeo.get(nombre_lower, nombre.upper().replace(" ", "_"))


# Schemas Pydantic
class RequerimientoCreate(BaseModel):
    mensaje: str
    cliente_id: int

# 🔥 RESPONSE MEJORADO CON NOMBRES
class RequerimientoResponse(BaseModel):
    id: int
    cliente_id: int
    cliente_nombre: Optional[str] = None  # 🔥 NUEVO
    vendedor_id: int | None
    vendedor_nombre: Optional[str] = None  # 🔥 NUEVO
    titulo: str
    mensaje: str
    descripcion: str | None
    especialidad: str
    estado: str
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class RequerimientoUpdate(BaseModel):
    estado: str | None = None
    vendedor_id: int | None = None


# 🔥 FUNCIÓN HELPER PARA AGREGAR NOMBRES
def agregar_nombres_a_requerimientos(requerimientos: List[Requerimiento], db: Session) -> List[dict]:
    """
    Agrega los nombres de cliente y vendedor a los requerimientos
    """
    resultado = []
    for req in requerimientos:
        # Obtener nombre del cliente
        cliente = db.query(UsuarioDB).filter(UsuarioDB.id == req.cliente_id).first()
        cliente_nombre = cliente.nombre if cliente else f"Cliente #{req.cliente_id}"
        
        # Obtener nombre del vendedor (si existe)
        vendedor_nombre = None
        if req.vendedor_id:
            vendedor = db.query(Vendedor).filter(Vendedor.id == req.vendedor_id).first()
            vendedor_nombre = vendedor.nombre if vendedor else f"Vendedor #{req.vendedor_id}"
        
        # Crear diccionario con toda la info
        req_dict = {
            "id": req.id,
            "cliente_id": req.cliente_id,
            "cliente_nombre": cliente_nombre,  # 🔥 NUEVO
            "vendedor_id": req.vendedor_id,
            "vendedor_nombre": vendedor_nombre,  # 🔥 NUEVO
            "titulo": req.titulo,
            "mensaje": req.mensaje,
            "descripcion": req.descripcion,
            "especialidad": req.especialidad.value,
            "estado": req.estado.value,
            "fecha_creacion": req.fecha_creacion
        }
        resultado.append(req_dict)
    
    return resultado


# Endpoints

@router.post("/crear", response_model=RequerimientoResponse)
def crear_requerimiento(req: RequerimientoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo requerimiento"""
    
    nuevo_req = Requerimiento(
        cliente_id=req.cliente_id,
        titulo="Nuevo requerimiento",
        mensaje=req.mensaje,
        descripcion=None,
        especialidad=EspecialidadEnum.OTRO,
        estado=EstadoRequerimiento.PENDIENTE
    )
    db.add(nuevo_req)
    db.commit()
    db.refresh(nuevo_req)
    return nuevo_req


@router.get("/cliente/{cliente_id}")
def obtener_requerimientos_por_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene los requerimientos creados por un cliente específico"""
    requerimientos = db.query(Requerimiento).filter(
        Requerimiento.cliente_id == cliente_id
    ).order_by(Requerimiento.fecha_creacion.desc()).all()
    
    # 🔥 Agregar nombres
    return agregar_nombres_a_requerimientos(requerimientos, db)


@router.get("/vendedor/disponibles")
def obtener_requerimientos_disponibles(
    especialidad: str | None = None,
    db: Session = Depends(get_db)
):
    """Obtiene requerimientos disponibles para vendedores (sin asignar)"""
    query = db.query(Requerimiento).filter(
        Requerimiento.estado == EstadoRequerimiento.PENDIENTE,
        Requerimiento.vendedor_id == None
    )
    
    if especialidad:
        codigo_enum = nombre_amigable_a_enum(especialidad)
        
        print(f"🔍 Especialidad recibida: {especialidad}")
        print(f"🔍 Código ENUM: {codigo_enum}")
        
        if codigo_enum in EspecialidadEnum.__members__:
            enum_especialidad = EspecialidadEnum[codigo_enum]
            query = query.filter(Requerimiento.especialidad == enum_especialidad)
            print(f"✅ Filtrando por: {enum_especialidad}")
        else:
            print(f"⚠️ Código ENUM no encontrado: {codigo_enum}")
    
    requerimientos = query.order_by(Requerimiento.fecha_creacion.desc()).all()
    
    # 🔥 Agregar nombres
    return agregar_nombres_a_requerimientos(requerimientos, db)


# 🔥 ENDPOINT CON FILTRO MEJORADO
@router.get("/vendedores/disponibles")
def obtener_requerimientos_disponibles_alias(
    especialidad: str | None = None,
    db: Session = Depends(get_db)
):
    """
    Obtiene requerimientos disponibles filtrando por especialidades del vendedor.
    Soporta múltiples especialidades separadas por coma.
    """
    query = db.query(Requerimiento).filter(
        Requerimiento.estado == EstadoRequerimiento.PENDIENTE,
        Requerimiento.vendedor_id == None
    )
    
    if especialidad:
        especialidades_vendedor = [esp.strip() for esp in especialidad.split(',')]
        
        print(f"🔍 Especialidades recibidas del vendedor: {especialidades_vendedor}")
        
        codigos_enum = []
        for esp in especialidades_vendedor:
            codigo = nombre_amigable_a_enum(esp)
            if codigo in EspecialidadEnum.__members__:
                codigos_enum.append(codigo)
        
        print(f"🔍 Códigos ENUM a filtrar: {codigos_enum}")
        
        if codigos_enum:
            enums = [EspecialidadEnum[codigo] for codigo in codigos_enum]
            query = query.filter(Requerimiento.especialidad.in_(enums))
            print(f"✅ Filtrando por ENUMs: {enums}")
        else:
            print(f"⚠️ No se encontraron ENUMs válidos para filtrar")
    
    requerimientos = query.order_by(Requerimiento.fecha_creacion.desc()).all()
    print(f"📊 Total requerimientos filtrados: {len(requerimientos)}")
    
    # 🔥 Agregar nombres
    return agregar_nombres_a_requerimientos(requerimientos, db)


@router.get("/vendedor/{vendedor_id}")
def obtener_requerimientos_por_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    """Obtiene los requerimientos asignados a un vendedor"""
    requerimientos = db.query(Requerimiento).filter(
        Requerimiento.vendedor_id == vendedor_id
    ).order_by(Requerimiento.fecha_creacion.desc()).all()
    
    # 🔥 Agregar nombres
    return agregar_nombres_a_requerimientos(requerimientos, db)


@router.put("/{requerimiento_id}/asignar")
def asignar_requerimiento(
    requerimiento_id: int,
    vendedor_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Asigna un requerimiento a un vendedor y crea automáticamente un proyecto.
    Este endpoint ahora crea el proyecto en la tabla proyectos.
    """
    req = db.query(Requerimiento).filter(Requerimiento.id == requerimiento_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    if req.vendedor_id:
        raise HTTPException(status_code=400, detail="Requerimiento ya asignado")

    req.vendedor_id = vendedor_id
    req.estado = EstadoRequerimiento.ASIGNADO
    
    nuevo_proyecto = Proyecto(
        requerimiento_id=req.id,
        cliente_id=req.cliente_id,
        vendedor_id=vendedor_id,
        titulo=req.titulo,
        descripcion=req.descripcion or req.mensaje,
        especialidad=req.especialidad.value,
        estado=EstadoProyecto.ASIGNADO,
        progreso=0,
        presupuesto=0.0,
        pagado=0.0,
        fecha_inicio=datetime.utcnow(),
        fecha_estimada=None
    )
    
    db.add(nuevo_proyecto)
    db.commit()
    db.refresh(req)
    db.refresh(nuevo_proyecto)
    
    return {
        "message": "Requerimiento asignado y proyecto creado exitosamente",
        "requerimiento": req,
        "proyecto_id": nuevo_proyecto.id
    }


@router.put("/{requerimiento_id}/estado")
def cambiar_estado_requerimiento(
    requerimiento_id: int,
    nuevo_estado: str = Query(...),
    db: Session = Depends(get_db)
):
    """Cambia el estado de un requerimiento"""
    req = db.query(Requerimiento).filter(Requerimiento.id == requerimiento_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")

    req.estado = nuevo_estado
    db.commit()
    db.refresh(req)
    return req


class RequerimientoAIUpdate(BaseModel):
    requerimiento_id: int
    titulo: str
    descripcion: str
    especialidad_codigo: str
    presupuesto: str


@router.put("/actualizar-con-ia")
def actualizar_requerimiento_con_ia(
    data: RequerimientoAIUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualiza un requerimiento con los datos analizados por OpenAI
    """
    req = db.query(Requerimiento).filter(
        Requerimiento.id == data.requerimiento_id
    ).first()
    
    if not req:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    
    especialidad_nombre = convertir_codigo_a_nombre(data.especialidad_codigo)
    
    req.titulo = data.titulo
    req.descripcion = data.descripcion
    
    try:
        for esp in EspecialidadEnum:
            if esp.value == especialidad_nombre:
                req.especialidad = esp
                break
    except:
        req.especialidad = EspecialidadEnum.OTRO
    
    db.commit()
    db.refresh(req)
    
    return {
        "message": "Requerimiento actualizado con IA",
        "requerimiento": req
    }
