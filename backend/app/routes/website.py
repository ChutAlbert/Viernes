from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app.core.deps import get_current_user
from app.models.website import WebsiteService, WebsiteContact, WebsiteMember, WebsiteSetting
from app.schemas.website import (
    ServiceCreate, ServiceUpdate, ServiceOut,
    ContactCreate, ContactUpdate, ContactOut,
    MemberCreate, MemberUpdate, MemberOut,
    SettingIn, SettingOut, SettingsBulkIn,
)

router = APIRouter(prefix="/website", tags=["website"])


# ── Public endpoints (no auth) ────────────────────────────────────────────────

@router.get("/services", response_model=List[ServiceOut])
def get_services(db: Session = Depends(get_db)):
    return (
        db.query(WebsiteService)
        .filter(WebsiteService.is_active == True)
        .order_by(WebsiteService.order_index)
        .all()
    )


@router.get("/contacts", response_model=List[ContactOut])
def get_contacts(db: Session = Depends(get_db)):
    return (
        db.query(WebsiteContact)
        .filter(WebsiteContact.is_active == True)
        .all()
    )


@router.get("/members", response_model=List[MemberOut])
def get_members(db: Session = Depends(get_db)):
    return (
        db.query(WebsiteMember)
        .filter(WebsiteMember.is_active == True)
        .order_by(WebsiteMember.order_index)
        .all()
    )


@router.get("/settings", response_model=List[SettingOut])
def get_settings(db: Session = Depends(get_db)):
    return db.query(WebsiteSetting).all()


@router.get("/settings/{key}", response_model=SettingOut)
def get_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(WebsiteSetting).filter(WebsiteSetting.key == key).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    return setting


# ── Admin endpoints (auth required) ──────────────────────────────────────────

# Services CRUD
@router.get("/admin/services", response_model=List[ServiceOut])
def admin_get_services(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(WebsiteService).order_by(WebsiteService.order_index).all()


@router.post("/admin/services", response_model=ServiceOut)
def create_service(payload: ServiceCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = WebsiteService(**payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/admin/services/{service_id}", response_model=ServiceOut)
def update_service(service_id: int, payload: ServiceUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = db.query(WebsiteService).filter(WebsiteService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    for field, value in payload.model_dump().items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/admin/services/{service_id}")
def delete_service(service_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    service = db.query(WebsiteService).filter(WebsiteService.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(service)
    db.commit()
    return {"ok": True}


# Contacts CRUD
@router.get("/admin/contacts", response_model=List[ContactOut])
def admin_get_contacts(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(WebsiteContact).all()


@router.post("/admin/contacts", response_model=ContactOut)
def create_contact(payload: ContactCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    contact = WebsiteContact(**payload.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.put("/admin/contacts/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: int, payload: ContactUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    contact = db.query(WebsiteContact).filter(WebsiteContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for field, value in payload.model_dump().items():
        setattr(contact, field, value)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/admin/contacts/{contact_id}")
def delete_contact(contact_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    contact = db.query(WebsiteContact).filter(WebsiteContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"ok": True}


# Members CRUD
@router.get("/admin/members", response_model=List[MemberOut])
def admin_get_members(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(WebsiteMember).order_by(WebsiteMember.order_index).all()


@router.post("/admin/members", response_model=MemberOut)
def create_member(payload: MemberCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    member = WebsiteMember(**payload.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/admin/members/{member_id}", response_model=MemberOut)
def update_member(member_id: int, payload: MemberUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    member = db.query(WebsiteMember).filter(WebsiteMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    for field, value in payload.model_dump().items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/admin/members/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    member = db.query(WebsiteMember).filter(WebsiteMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"ok": True}


# Settings
@router.get("/admin/settings", response_model=List[SettingOut])
def admin_get_settings(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(WebsiteSetting).all()


@router.put("/admin/settings/{key}", response_model=SettingOut)
def upsert_setting(key: str, payload: SettingIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    setting = db.query(WebsiteSetting).filter(WebsiteSetting.key == key).first()
    if setting:
        setting.value = payload.value
    else:
        setting = WebsiteSetting(key=key, value=payload.value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.post("/admin/settings/bulk", response_model=List[SettingOut])
def bulk_upsert_settings(payload: SettingsBulkIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    results = []
    for key, value in payload.settings.items():
        setting = db.query(WebsiteSetting).filter(WebsiteSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            setting = WebsiteSetting(key=key, value=value)
            db.add(setting)
        db.flush()
        db.refresh(setting)
        results.append(setting)
    db.commit()
    return results
