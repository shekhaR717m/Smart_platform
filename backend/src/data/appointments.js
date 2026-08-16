const today = new Date().toISOString().slice(0, 10);

export const appointments = [
  {
    id: "APT-1001",
    patient_name: "Aarav Mehta",
    reason: "Follow-up for blood pressure",
    preferred_date: today,
    department: "Cardiology",
    status: "scheduled",
    created_at: new Date().toISOString(),
  },
];
