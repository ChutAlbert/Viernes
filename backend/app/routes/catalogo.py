from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload
from typing import List
import re
import unicodedata


def _slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text).strip("-")
    return text or "producto"


def _unique_slug(db: Session, base: str, exclude_id: int | None = None) -> str:
    slug = _slugify(base)
    candidate, n = slug, 2
    while True:
        q = db.query(CatalogoProducto).filter(CatalogoProducto.slug == candidate)
        if exclude_id:
            q = q.filter(CatalogoProducto.id != exclude_id)
        if not q.first():
            return candidate
        candidate = f"{slug}-{n}"
        n += 1

from app.db import get_db
from app.core.deps import get_current_user
from app.core.config import FILES_DIR
from app.models.catalogo import (
    CatalogoFilamento,
    CatalogoProducto,
    CatalogoProductoFilamento,
    CatalogoProductoImagen,
)
from app.schemas.catalogo import ImagenOut
from app.schemas.catalogo import (
    FilamentoCreate, FilamentoUpdate, FilamentoOut,
    ProductoCreate, ProductoUpdate, ProductoOut, ProductoListItem,
    CalcularPrecioRequest, CalcularPrecioResponse, ImagenOut,
)
from app.services.precio_catalogo import calcular_precio

router = APIRouter(prefix="/catalogo", tags=["catalogo"])


# ══════════════════════════════════════════════════════════════════════════════
# FILAMENTOS  (solo dashboard — requiere auth)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/filamentos", response_model=List[FilamentoOut])
def list_filamentos(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(CatalogoFilamento).order_by(CatalogoFilamento.tipo_material, CatalogoFilamento.nombre).all()


@router.post("/filamentos", response_model=FilamentoOut)
def create_filamento(payload: FilamentoCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    filamento = CatalogoFilamento(**payload.model_dump())
    db.add(filamento)
    db.commit()
    db.refresh(filamento)
    return filamento


@router.put("/filamentos/{filamento_id}", response_model=FilamentoOut)
def update_filamento(filamento_id: int, payload: FilamentoUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    filamento = db.query(CatalogoFilamento).filter(CatalogoFilamento.id == filamento_id).first()
    if not filamento:
        raise HTTPException(status_code=404, detail="Filamento no encontrado")
    for field, value in payload.model_dump().items():
        setattr(filamento, field, value)
    db.commit()
    db.refresh(filamento)
    return filamento


@router.delete("/filamentos/{filamento_id}")
def delete_filamento(filamento_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    filamento = db.query(CatalogoFilamento).filter(CatalogoFilamento.id == filamento_id).first()
    if not filamento:
        raise HTTPException(status_code=404, detail="Filamento no encontrado")
    db.delete(filamento)
    db.commit()
    return {"ok": True}


@router.post("/filamentos/{filamento_id}/asignar-todos")
def asignar_filamento_todos(filamento_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Agrega este filamento a todos los productos que aún no lo tienen."""
    if not db.query(CatalogoFilamento).filter(CatalogoFilamento.id == filamento_id).first():
        raise HTTPException(status_code=404, detail="Filamento no encontrado")
    productos = db.query(CatalogoProducto).all()
    count = 0
    for p in productos:
        exists = db.query(CatalogoProductoFilamento).filter_by(
            producto_id=p.id, filamento_id=filamento_id
        ).first()
        if not exists:
            db.add(CatalogoProductoFilamento(producto_id=p.id, filamento_id=filamento_id, archivo_3d_url=None))
            count += 1
    db.commit()
    return {"ok": True, "asignados": count}


@router.post("/filamentos/{filamento_id}/desasignar-todos")
def desasignar_filamento_todos(filamento_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Quita este filamento de todos los productos."""
    count = db.query(CatalogoProductoFilamento).filter_by(filamento_id=filamento_id).delete()
    db.commit()
    return {"ok": True, "eliminados": count}


# ══════════════════════════════════════════════════════════════════════════════
# PRODUCTOS  (CRUD en dashboard — requiere auth)
# ══════════════════════════════════════════════════════════════════════════════

def _load_producto(db: Session, producto_id: int) -> CatalogoProducto:
    from sqlalchemy.orm import selectinload as _si
    producto = (
        db.query(CatalogoProducto)
        .options(
            selectinload(CatalogoProducto.filamentos).selectinload(CatalogoProductoFilamento.filamento),
            selectinload(CatalogoProducto.imagenes),
        )
        .filter(CatalogoProducto.id == producto_id)
        .first()
    )
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


def _sync_filamentos(db: Session, producto: CatalogoProducto, filamentos: list):
    db.query(CatalogoProductoFilamento).filter(
        CatalogoProductoFilamento.producto_id == producto.id
    ).delete()
    for f in filamentos:
        db.add(CatalogoProductoFilamento(
            producto_id=producto.id,
            filamento_id=f.filamento_id,
            archivo_3d_url=f.archivo_3d_url,
        ))


@router.get("/productos", response_model=List[ProductoListItem])
def list_productos(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(CatalogoProducto).order_by(CatalogoProducto.created_at.desc()).all()


@router.post("/productos", response_model=ProductoOut)
def create_producto(payload: ProductoCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    data = payload.model_dump(exclude={"filamentos"})
    if not data.get("slug"):
        data["slug"] = _unique_slug(db, payload.nombre)
    producto = CatalogoProducto(**data)
    db.add(producto)
    db.flush()
    _sync_filamentos(db, producto, payload.filamentos)
    db.commit()
    return _load_producto(db, producto.id)


@router.get("/productos/{producto_id}", response_model=ProductoOut)
def get_producto(producto_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _load_producto(db, producto_id)


@router.put("/productos/{producto_id}", response_model=ProductoOut)
def update_producto(producto_id: int, payload: ProductoUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    producto = db.query(CatalogoProducto).filter(CatalogoProducto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    data = payload.model_dump(exclude={"filamentos"})
    if not data.get("slug"):
        data["slug"] = _unique_slug(db, payload.nombre, exclude_id=producto_id)
    for field, value in data.items():
        setattr(producto, field, value)
    db.flush()
    _sync_filamentos(db, producto, payload.filamentos)
    db.commit()
    return _load_producto(db, producto.id)


@router.delete("/productos/{producto_id}")
def delete_producto(producto_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    producto = db.query(CatalogoProducto).filter(CatalogoProducto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
    return {"ok": True}


# ══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS PÚBLICOS  (website — sin auth)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/public/productos", response_model=List[ProductoListItem])
def list_productos_publico(db: Session = Depends(get_db)):
    productos = (
        db.query(CatalogoProducto)
        .options(
            selectinload(CatalogoProducto.filamentos).selectinload(CatalogoProductoFilamento.filamento),
        )
        .filter(CatalogoProducto.publicado == True, CatalogoProducto.activo == True)
        .order_by(CatalogoProducto.created_at.desc())
        .all()
    )
    result = []
    for p in productos:
        tarifas = [
            pf.filamento.tarifa_por_minuto
            for pf in p.filamentos
            if pf.filamento.activo and pf.filamento.en_stock
        ]
        precio_desde = None
        if tarifas and p.tamano_base_mm and p.tamano_base_mm > 0 and p.tamano_minimo_mm and p.tiempo_impresion_minutos:
            factor = p.tamano_minimo_mm / p.tamano_base_mm
            precio_desde = round(p.tiempo_impresion_minutos * factor * min(tarifas), 2)
        result.append({
            "id": p.id,
            "slug": p.slug,
            "nombre": p.nombre,
            "foto_preview_url": p.foto_preview_url,
            "tiempo_impresion_minutos": p.tiempo_impresion_minutos,
            "tamano_minimo_mm": p.tamano_minimo_mm,
            "tamano_maximo_mm": p.tamano_maximo_mm,
            "permite_multicolor": p.permite_multicolor,
            "publicado": p.publicado,
            "created_at": p.created_at,
            "precio_desde": precio_desde,
        })
    return result


@router.get("/public/productos/{slug}", response_model=ProductoOut)
def get_producto_publico(slug: str, db: Session = Depends(get_db)):
    producto = (
        db.query(CatalogoProducto)
        .options(
            selectinload(CatalogoProducto.filamentos).selectinload(CatalogoProductoFilamento.filamento),
            selectinload(CatalogoProducto.imagenes),
        )
        .filter(
            CatalogoProducto.slug == slug,
            CatalogoProducto.publicado == True,
            CatalogoProducto.activo == True,
        )
        .first()
    )
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return producto


@router.get("/public/filamentos", response_model=List[FilamentoOut])
def list_filamentos_publico(db: Session = Depends(get_db)):
    """Filamentos activos para el website. El stock es interno: no afecta lo que se muestra."""
    return (
        db.query(CatalogoFilamento)
        .filter(CatalogoFilamento.activo == True)
        .order_by(CatalogoFilamento.tipo_material, CatalogoFilamento.nombre)
        .all()
    )


# ══════════════════════════════════════════════════════════════════════════════
# CALCULADORA  (pública)
# ══════════════════════════════════════════════════════════════════════════════

@router.post("/public/calcular-precio", response_model=CalcularPrecioResponse)
def calcular_precio_endpoint(payload: CalcularPrecioRequest, db: Session = Depends(get_db)):
    """
    Calcula el precio estimado.

    Fórmula:
      tiempo_ajustado = tiempo_base × (tamano_elegido / tamano_base)
      precio          = tiempo_ajustado × filamento.tarifa_por_minuto
      precio_final    = precio × 1.5  (solo si multicolor y num_colores > 1)
    """
    producto = db.query(CatalogoProducto).filter(
        CatalogoProducto.id == payload.producto_id,
        CatalogoProducto.activo == True,
    ).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    pf = db.query(CatalogoProductoFilamento).filter(
        CatalogoProductoFilamento.producto_id == payload.producto_id,
        CatalogoProductoFilamento.filamento_id == payload.filamento_id,
    ).first()
    if not pf:
        raise HTTPException(status_code=400, detail="Filamento no disponible para este producto")

    filamento = db.query(CatalogoFilamento).filter(CatalogoFilamento.id == payload.filamento_id).first()

    if not (producto.tamano_minimo_mm <= payload.tamano_mm <= producto.tamano_maximo_mm):
        raise HTTPException(
            status_code=400,
            detail=f"Tamaño fuera de rango ({producto.tamano_minimo_mm}–{producto.tamano_maximo_mm} mm)",
        )

    multicolor = payload.multicolor and producto.permite_multicolor

    resultado = calcular_precio(
        producto=producto,
        filamento=filamento,
        tamano_mm=payload.tamano_mm,
        multicolor=multicolor,
        num_colores=payload.num_colores,
    )
    return CalcularPrecioResponse(**resultado)


# ══════════════════════════════════════════════════════════════════════════════
# ARCHIVO 3D PÚBLICO  (solo si está en un producto publicado)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/public/archivo/{filename}")
async def archivo_3d_publico(filename: str, db: Session = Depends(get_db)):
    url_relativa = f"/files/{filename}"

    en_producto = db.query(CatalogoProducto).filter(
        CatalogoProducto.publicado == True,
        CatalogoProducto.activo == True,
        CatalogoProducto.archivo_3d_url == url_relativa,
    ).first()

    if not en_producto:
        en_filamento = db.query(CatalogoProductoFilamento).filter(
            CatalogoProductoFilamento.archivo_3d_url == url_relativa,
        ).join(CatalogoProducto).filter(
            CatalogoProducto.publicado == True,
            CatalogoProducto.activo == True,
        ).first()
        if not en_filamento:
            raise HTTPException(status_code=404, detail="Archivo no encontrado")

    path = FILES_DIR / filename
    if not path.exists() or not path.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado en disco")

    return FileResponse(path=str(path), filename=filename)


# ══════════════════════════════════════════════════════════════════════════════
# GALERÍA DE IMÁGENES DE PRODUCTO  (dashboard — requiere auth)
# ══════════════════════════════════════════════════════════════════════════════

from pydantic import BaseModel as PydanticBase

class ImagenAddPayload(PydanticBase):
    url: str
    orden: int = 0


@router.get("/productos/{producto_id}/imagenes", response_model=List[ImagenOut])
def list_imagenes(producto_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(CatalogoProductoImagen).filter(
        CatalogoProductoImagen.producto_id == producto_id
    ).order_by(CatalogoProductoImagen.orden).all()


@router.post("/productos/{producto_id}/imagenes", response_model=ImagenOut)
def add_imagen(producto_id: int, payload: ImagenAddPayload, db: Session = Depends(get_db), _=Depends(get_current_user)):
    img = CatalogoProductoImagen(producto_id=producto_id, url=payload.url, orden=payload.orden)
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


@router.delete("/productos/{producto_id}/imagenes/{imagen_id}")
def delete_imagen(producto_id: int, imagen_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    img = db.query(CatalogoProductoImagen).filter(
        CatalogoProductoImagen.id == imagen_id,
        CatalogoProductoImagen.producto_id == producto_id,
    ).first()
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    db.delete(img)
    db.commit()
    return {"ok": True}
