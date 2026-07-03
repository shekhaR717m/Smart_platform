from datetime import date, datetime
from enum import Enum
from typing import List
from uuid import uuid4

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


app = FastAPI(
    title="Smart Telehealth API",
    version="1.0.0",
    description="Demo backend for telehealth appointments, providers, and triage.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AppointmentStatus(str, Enum):
    scheduled = "scheduled"
    checked_in = "checked_in"
    completed = "completed"


class AppointmentCreate(BaseModel):
    patient_name: str = Field(min_length=2, max_length=80)
    reason: str = Field(min_length=3, max_length=200)
    preferred_date: date
    department: str = Field(default="General Care", max_length=80)


class Appointment(AppointmentCreate):
    id: str
    status: AppointmentStatus
    created_at: datetime


class TriageRequest(BaseModel):
    symptoms: List[str] = Field(default_factory=list)
    temperature_c: float | None = None
    oxygen_level: int | None = Field(default=None, ge=50, le=100)


class TriageResult(BaseModel):
    urgency: str
    recommendation: str
    next_step: str


appointments: list[Appointment] = [
    Appointment(
        id="APT-1001",
        patient_name="Aarav Mehta",
        reason="Follow-up for blood pressure",
        preferred_date=date.today(),
        department="Cardiology",
        status=AppointmentStatus.scheduled,
        created_at=datetime.utcnow(),
    )
]

providers = [
    {
        "id": "DOC-01",
        "name": "Dr. Neha Rao",
        "specialty": "General Physician",
        "available_today": True,
        "next_slot": "10:30 AM",
    },
    {
        "id": "DOC-02",
        "name": "Dr. Kabir Singh",
        "specialty": "Cardiology",
        "available_today": True,
        "next_slot": "02:00 PM",
    },
    {
        "id": "DOC-03",
        "name": "Dr. Aisha Khan",
        "specialty": "Dermatology",
        "available_today": False,
        "next_slot": "Tomorrow 11:00 AM",
    },
]


@app.get("/")
def root():
    return {
        "service": "Smart Telehealth API",
        "status": "online",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "smart-telehealth-api",
        "checked_at": datetime.utcnow().isoformat() + "Z",
    }


@app.get("/api/providers")
def list_providers():
    return {"providers": providers}


@app.get("/api/appointments")
def list_appointments():
    return {"appointments": appointments}


@app.post("/api/appointments", response_model=Appointment)
def create_appointment(payload: AppointmentCreate):
    appointment = Appointment(
        id=f"APT-{uuid4().hex[:8].upper()}",
        status=AppointmentStatus.scheduled,
        created_at=datetime.utcnow(),
        **payload.model_dump(),
    )
    appointments.insert(0, appointment)
    return appointment


@app.post("/api/triage", response_model=TriageResult)
def triage(payload: TriageRequest):
    symptoms = {item.lower() for item in payload.symptoms}
    urgent_symptoms = {"chest pain", "shortness of breath", "severe bleeding"}

    if symptoms & urgent_symptoms or (payload.oxygen_level is not None and payload.oxygen_level < 92):
        return TriageResult(
            urgency="high",
            recommendation="Seek urgent medical attention.",
            next_step="Call emergency services or go to the nearest emergency department.",
        )

    if payload.temperature_c is not None and payload.temperature_c >= 38:
        return TriageResult(
            urgency="medium",
            recommendation="Book a same-day virtual consultation.",
            next_step="Schedule with a general physician and monitor hydration.",
        )

    return TriageResult(
        urgency="low",
        recommendation="Book a routine telehealth appointment.",
        next_step="Choose the next available provider slot.",
    )
