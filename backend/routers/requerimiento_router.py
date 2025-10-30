from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from modelos.requerimiento_model import Requerimiento, EstadoRequerimiento, EspecialidadEnum
from modelos.proyecto_modelo import Proyecto, EstadoProyecto
from pydantic import BaseModel
from datetime import datetime
from services.openai_service import convertir_codigo_a_nombre


router = APIRouter(
    prefix="/requerimientos",
    tags=["Requerimientos"]
)

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

class RequerimientoResponse(BaseModel):
    id: int
    cliente_id: int
    vendedor_id: int | None
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


# Endpoints

@router.post("/crear", response_model=RequerimientoResponse)
def crear_requerimiento(req: RequerimientoCreate, db: Session = Depends(get_db)):
    """Crea un nuevo requerimiento"""
    
    # Por defecto, usar "Otro"
    especialidad_nombre = "Otro"
    
    # Si el mensaje contiene un código de especialidad, extraerlo
    # (esto lo mejoraremos con OpenAI en el siguiente paso)
    
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


@router.get("/cliente/{cliente_id}", response_model=List[RequerimientoResponse])
def obtener_requerimientos_por_cliente(cliente_id: int, db: Session = Depends(get_db)):
    """Obtiene los requerimientos creados por un cliente específico"""
    return db.query(Requerimiento).filter(
        Requerimiento.cliente_id == cliente_id
    ).order_by(Requerimiento.fecha_creacion.desc()).all()


@router.get("/vendedor/disponibles", response_model=List[RequerimientoResponse])
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
        # 🔥 Convertir nombre amigable a ENUM
        codigo_enum = nombre_amigable_a_enum(especialidad)
        
        print(f"🔍 Especialidad recibida: {especialidad}")
        print(f"🔍 Código ENUM: {codigo_enum}")
        
        # Verificar si el código existe en el ENUM
        if codigo_enum in EspecialidadEnum.__members__:
            enum_especialidad = EspecialidadEnum[codigo_enum]
            query = query.filter(Requerimiento.especialidad == enum_especialidad)
            print(f"✅ Filtrando por: {enum_especialidad}")
        else:
            print(f"⚠️ Código ENUM no encontrado: {codigo_enum}")
    
    return query.order_by(Requerimiento.fecha_creacion.desc()).all()


# 🔥 ENDPOINT CON FILTRO MEJORADO
@router.get("/vendedores/disponibles", response_model=List[RequerimientoResponse])
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
        # 🔥 Convertir especialidades (pueden venir separadas por coma)
        especialidades_vendedor = [esp.strip() for esp in especialidad.split(',')]
        
        print(f"🔍 Especialidades recibidas del vendedor: {especialidades_vendedor}")
        
        # Convertir a códigos ENUM
        codigos_enum = []
        for esp in especialidades_vendedor:
            codigo = nombre_amigable_a_enum(esp)
            if codigo in EspecialidadEnum.__members__:
                codigos_enum.append(codigo)
        
        print(f"🔍 Códigos ENUM a filtrar: {codigos_enum}")
        
        # Filtrar por los códigos ENUM
        if codigos_enum:
            enums = [EspecialidadEnum[codigo] for codigo in codigos_enum]
            query = query.filter(Requerimiento.especialidad.in_(enums))
            print(f"✅ Filtrando por ENUMs: {enums}")
        else:
            print(f"⚠️ No se encontraron ENUMs válidos para filtrar")
    
    resultados = query.order_by(Requerimiento.fecha_creacion.desc()).all()
    print(f"📊 Total requerimientos filtrados: {len(resultados)}")
    
    return resultados


@router.get("/vendedor/{vendedor_id}", response_model=List[RequerimientoResponse])
def obtener_requerimientos_por_vendedor(vendedor_id: int, db: Session = Depends(get_db)):
    """Obtiene los requerimientos asignados a un vendedor"""
    return db.query(Requerimiento).filter(
        Requerimiento.vendedor_id == vendedor_id
    ).order_by(Requerimiento.fecha_creacion.desc()).all()


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
    # Buscar el requerimiento
    req = db.query(Requerimiento).filter(Requerimiento.id == requerimiento_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requerimiento no encontrado")
    if req.vendedor_id:
        raise HTTPException(status_code=400, detail="Requerimiento ya asignado")

    # Asignar vendedor y cambiar estado
    req.vendedor_id = vendedor_id
    req.estado = EstadoRequerimiento.ASIGNADO
    
    # === NUEVO: Crear proyecto automáticamente ===
    nuevo_proyecto = Proyecto(
        requerimiento_id=req.id,
        cliente_id=req.cliente_id,
        vendedor_id=vendedor_id,
        titulo=req.titulo,
        descripcion=req.descripcion or req.mensaje,
        especialidad=req.especialidad.value,  # Convertir enum a string
        estado=EstadoProyecto.ASIGNADO,
        progreso=0,
        presupuesto=0.0,
        pagado=0.0,
        fecha_inicio=datetime.utcnow(),
        fecha_estimada=None  # El vendedor lo puede actualizar después
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
    
    # Convertir código a nombre de especialidad
    especialidad_nombre = convertir_codigo_a_nombre(data.especialidad_codigo)
    
    # Actualizar datos
    req.titulo = data.titulo
    req.descripcion = data.descripcion
    
    # Buscar el enum correspondiente
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