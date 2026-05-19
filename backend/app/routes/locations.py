from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.db import get_db
from app.models.device_location import DeviceLocation
from app.core.deps import get_current_user, require_admin
from app.models.user import User

router = APIRouter(prefix="/locations", tags=["locations"])


def _serialize(d: DeviceLocation) -> dict:
    return {
        "device_id": d.device_id,
        "name": d.name,
        "color": d.color,
        "lat": d.lat,
        "lng": d.lng,
        "accuracy": d.accuracy,
        "update_interval": d.update_interval,
        "refresh_requested": d.refresh_requested,
        "last_seen": d.last_seen.isoformat() if d.last_seen else None,
    }


class LocationUpdate(BaseModel):
    device_id: str
    lat: float
    lng: float
    accuracy: Optional[float] = None
    device_name: Optional[str] = None


class DeviceEdit(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    update_interval: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


@router.post("/update")
def update_location(
    payload: LocationUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    device = db.query(DeviceLocation).filter(DeviceLocation.device_id == payload.device_id).first()
    now = datetime.now(timezone.utc)
    if device:
        device.lat = payload.lat
        device.lng = payload.lng
        device.accuracy = payload.accuracy
        device.last_seen = now
        device.refresh_requested = False
        if payload.device_name and not device.name:
            device.name = payload.device_name
    else:
        device = DeviceLocation(
            device_id=payload.device_id,
            name=payload.device_name or payload.device_id[:12],
            lat=payload.lat,
            lng=payload.lng,
            accuracy=payload.accuracy,
            last_seen=now,
        )
        db.add(device)
    db.commit()
    db.refresh(device)
    return {"ok": True, "update_interval": device.update_interval}


@router.get("")
def list_devices(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    devices = db.query(DeviceLocation).order_by(DeviceLocation.last_seen.desc()).all()
    return [_serialize(d) for d in devices]


@router.get("/{device_id}/needs-refresh")
def needs_refresh(
    device_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    device = db.query(DeviceLocation).filter(DeviceLocation.device_id == device_id).first()
    if not device:
        return {"needs_refresh": False, "update_interval": 15}
    return {"needs_refresh": device.refresh_requested, "update_interval": device.update_interval}


@router.post("/{device_id}/request-update")
def request_update(
    device_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    device = db.query(DeviceLocation).filter(DeviceLocation.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    device.refresh_requested = True
    db.commit()
    return {"ok": True}


@router.put("/{device_id}")
def update_device(
    device_id: str,
    payload: DeviceEdit,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    device = db.query(DeviceLocation).filter(DeviceLocation.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    if payload.name is not None:
        device.name = payload.name
    if payload.color is not None:
        device.color = payload.color
    if payload.update_interval is not None:
        device.update_interval = payload.update_interval
    if payload.lat is not None:
        device.lat = payload.lat
    if payload.lng is not None:
        device.lng = payload.lng
    db.commit()
    db.refresh(device)
    return _serialize(device)


@router.delete("/{device_id}", status_code=204)
def delete_device(
    device_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    device = db.query(DeviceLocation).filter(DeviceLocation.device_id == device_id).first()
    if not device:
        raise HTTPException(status_code=404, detail="Dispositivo no encontrado")
    db.delete(device)
    db.commit()
