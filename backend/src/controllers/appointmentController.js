import { randomUUID } from "node:crypto";

import { appointments } from "../data/appointments.js";
import { ApiError } from "../utils/apiError.js";

const MAX_NAME_LENGTH = 80;
const MAX_REASON_LENGTH = 200;
const MAX_DEPARTMENT_LENGTH = 80;

export function listAppointments(_req, res) {
  res.json({ appointments });
}

export function createAppointment(req, res, next) {
  try {
    const payload = validateAppointmentPayload(req.body);
    const appointment = {
      id: `APT-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`,
      ...payload,
      status: "scheduled",
      created_at: new Date().toISOString(),
    };

    appointments.unshift(appointment);

    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
}

function validateAppointmentPayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const patientName = cleanString(body.patient_name);
  const reason = cleanString(body.reason);
  const department = cleanString(body.department) || "General Care";
  const preferredDate = cleanString(body.preferred_date);

  if (patientName.length < 2 || patientName.length > MAX_NAME_LENGTH) {
    throw new ApiError(400, "patient_name must be between 2 and 80 characters.");
  }

  if (reason.length < 3 || reason.length > MAX_REASON_LENGTH) {
    throw new ApiError(400, "reason must be between 3 and 200 characters.");
  }

  if (department.length > MAX_DEPARTMENT_LENGTH) {
    throw new ApiError(400, "department must be 80 characters or fewer.");
  }

  if (!isIsoDate(preferredDate)) {
    throw new ApiError(400, "preferred_date must use YYYY-MM-DD format.");
  }

  return {
    patient_name: patientName,
    reason,
    preferred_date: preferredDate,
    department,
  };
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
