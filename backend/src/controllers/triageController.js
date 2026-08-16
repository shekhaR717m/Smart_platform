import { ApiError } from "../utils/apiError.js";

const URGENT_SYMPTOMS = new Set([
  "chest pain",
  "shortness of breath",
  "severe bleeding",
  "stroke symptoms",
  "loss of consciousness",
]);

export function evaluateTriage(req, res, next) {
  try {
    const payload = validateTriagePayload(req.body);
    const normalizedSymptoms = payload.symptoms.map((symptom) => symptom.toLowerCase());
    const hasUrgentSymptom = normalizedSymptoms.some((symptom) =>
      URGENT_SYMPTOMS.has(symptom),
    );

    if (hasUrgentSymptom || (payload.oxygen_level !== null && payload.oxygen_level < 92)) {
      return res.json({
        urgency: "high",
        recommendation: "Seek urgent medical attention.",
        next_step: "Call emergency services or go to the nearest emergency department.",
      });
    }

    if (payload.temperature_c !== null && payload.temperature_c >= 38) {
      return res.json({
        urgency: "medium",
        recommendation: "Book a same-day virtual consultation.",
        next_step: "Schedule with a general physician and monitor hydration.",
      });
    }

    return res.json({
      urgency: "low",
      recommendation: "Book a routine telehealth appointment.",
      next_step: "Choose the next available provider slot.",
    });
  } catch (error) {
    return next(error);
  }
}

function validateTriagePayload(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }

  const symptoms = body.symptoms ?? [];

  if (!Array.isArray(symptoms) || symptoms.some((item) => typeof item !== "string")) {
    throw new ApiError(400, "symptoms must be an array of strings.");
  }

  const temperature = optionalNumber(body.temperature_c, "temperature_c");
  const oxygenLevel = optionalInteger(body.oxygen_level, "oxygen_level");

  if (oxygenLevel !== null && (oxygenLevel < 50 || oxygenLevel > 100)) {
    throw new ApiError(400, "oxygen_level must be between 50 and 100.");
  }

  return {
    symptoms: symptoms.map((symptom) => symptom.trim()).filter(Boolean),
    temperature_c: temperature,
    oxygen_level: oxygenLevel,
  };
}

function optionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new ApiError(400, `${fieldName} must be a number.`);
  }

  return number;
}

function optionalInteger(value, fieldName) {
  const number = optionalNumber(value, fieldName);

  if (number !== null && !Number.isInteger(number)) {
    throw new ApiError(400, `${fieldName} must be an integer.`);
  }

  return number;
}
