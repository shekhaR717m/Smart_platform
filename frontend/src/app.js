const { useEffect, useMemo, useState } = React;

const STORAGE_KEYS = {
  apiBase: "telehealthApiBase",
  appointments: "telehealthAppointments",
};

const demoProviders = [
  { id: "DOC-01", name: "Dr. Neha Rao", specialty: "General Physician", next_slot: "10:30 AM", available_today: true },
  { id: "DOC-02", name: "Dr. Kabir Singh", specialty: "Cardiology", next_slot: "02:00 PM", available_today: true },
  { id: "DOC-03", name: "Dr. Aisha Khan", specialty: "Dermatology", next_slot: "Tomorrow 11:00 AM", available_today: false },
  { id: "DOC-04", name: "Dr. Rohan Iyer", specialty: "Mental Health", next_slot: "05:30 PM", available_today: true },
];

const demoAppointments = [
  {
    id: "APT-1001",
    patient_name: "Aarav Mehta",
    reason: "Follow-up for blood pressure",
    preferred_date: new Date().toISOString().slice(0, 10),
    department: "Cardiology",
    status: "scheduled",
    created_at: new Date().toISOString(),
  },
];

const defaultForm = {
  patient_name: "",
  reason: "",
  department: "General Care",
  preferred_date: new Date().toISOString().slice(0, 10),
};

function readStoredAppointments() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.appointments) || "[]");
    return Array.isArray(stored) && stored.length > 0 ? stored : demoAppointments;
  } catch (_error) {
    return demoAppointments;
  }
}

function normalizeApiBase(value) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  return `http://${trimmed}`;
}

function createLocalAppointment(form) {
  return {
    ...form,
    id: `LOCAL-${Date.now()}`,
    status: "scheduled",
    created_at: new Date().toISOString(),
  };
}

function App() {
  const [apiBase, setApiBase] = useState(localStorage.getItem(STORAGE_KEYS.apiBase) || "");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [providers, setProviders] = useState(demoProviders);
  const [appointments, setAppointments] = useState(readStoredAppointments);
  const [health, setHealth] = useState("demo mode");
  const [message, setMessage] = useState("Using built-in demo data. Add a live backend URL when your ALB is active.");
  const [form, setForm] = useState(defaultForm);
  const [triageForm, setTriageForm] = useState({
    symptoms: "fever, cough",
    temperature_c: "38.3",
    oxygen_level: "96",
  });
  const [triageResult, setTriageResult] = useState(null);

  const normalizedApiBase = useMemo(() => normalizeApiBase(apiBase), [apiBase]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.appointments, JSON.stringify(appointments));
  }, [appointments]);

  async function api(path, options = {}) {
    if (!normalizedApiBase) {
      throw new Error("API base URL not set");
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`${normalizedApiBase}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        signal: controller.signal,
        ...options,
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error?.message || `Request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Backend request timed out. Check the ALB URL and security group.");
      }
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function refresh(event) {
    event?.preventDefault();

    if (!normalizedApiBase) {
      localStorage.removeItem(STORAGE_KEYS.apiBase);
      setIsConnected(false);
      setHealth("demo mode");
      setProviders(demoProviders);
      setMessage("Using built-in demo data. Enter your ALB URL after Terraform shows a live DNS name.");
      return;
    }

    setIsConnecting(true);
    setMessage("Checking backend...");

    try {
      const [healthData, providerData, appointmentData] = await Promise.all([
        api("/health"),
        api("/api/providers"),
        api("/api/appointments"),
      ]);

      localStorage.setItem(STORAGE_KEYS.apiBase, normalizedApiBase);
      setApiBase(normalizedApiBase);
      setIsConnected(true);
      setHealth(healthData.status || "online");
      setProviders(providerData.providers || demoProviders);
      setAppointments(appointmentData.appointments || appointments);
      setMessage("Connected to live backend");
    } catch (error) {
      setIsConnected(false);
      setHealth("offline");
      setProviders(demoProviders);
      setMessage(`${error.message}. The app is still usable in demo mode.`);
    } finally {
      setIsConnecting(false);
    }
  }

  function useDemoMode() {
    localStorage.removeItem(STORAGE_KEYS.apiBase);
    setApiBase("");
    setIsConnected(false);
    setHealth("demo mode");
    setProviders(demoProviders);
    setMessage("Demo mode active. Scheduling and triage will work locally.");
  }

  async function createAppointment(event) {
    event.preventDefault();

    if (!isConnected) {
      const localAppointment = createLocalAppointment(form);
      setAppointments([localAppointment, ...appointments]);
      setForm(defaultForm);
      setMessage("Appointment saved locally because no live backend is connected.");
      return;
    }

    try {
      const created = await api("/api/appointments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAppointments([created, ...appointments]);
      setForm(defaultForm);
      setMessage("Appointment created through the live API.");
    } catch (error) {
      const localAppointment = createLocalAppointment(form);
      setIsConnected(false);
      setHealth("offline");
      setAppointments([localAppointment, ...appointments]);
      setForm(defaultForm);
      setMessage(`${error.message}. Saved locally instead.`);
    }
  }

  async function runTriage(event) {
    event.preventDefault();

    const symptoms = triageForm.symptoms
      .split(",")
      .map((symptom) => symptom.trim())
      .filter(Boolean);
    const payload = {
      symptoms,
      temperature_c: triageForm.temperature_c ? Number(triageForm.temperature_c) : null,
      oxygen_level: triageForm.oxygen_level ? Number(triageForm.oxygen_level) : null,
    };

    if (!isConnected) {
      const result = evaluateLocalTriage(payload);
      setTriageResult(result);
      setMessage("Triage evaluated locally because no live backend is connected.");
      return;
    }

    try {
      const result = await api("/api/triage", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setTriageResult(result);
      setMessage("Triage evaluated through the live API.");
    } catch (error) {
      const result = evaluateLocalTriage(payload);
      setIsConnected(false);
      setHealth("offline");
      setTriageResult(result);
      setMessage(`${error.message}. Triage evaluated locally instead.`);
    }
  }

  function resetAppointments() {
    setAppointments(demoAppointments);
    localStorage.removeItem(STORAGE_KEYS.appointments);
    setMessage("Appointments reset to sample data.");
  }

  return (
    React.createElement("div", { className: "shell" },
      React.createElement("section", { className: "hero" },
        React.createElement("div", null,
          React.createElement("p", { className: "eyebrow" }, "AWS Telehealth Demo"),
          React.createElement("h1", null, "Smart Telehealth"),
          React.createElement("p", { className: "lede" }, "Patient intake, provider availability, appointment booking, and triage running on a React frontend with a Node.js API behind AWS infrastructure.")
        ),
        React.createElement("div", { className: `status ${isConnected ? "online" : "offline"}` },
          React.createElement("span", null, "API status"),
          React.createElement("strong", null, health)
        )
      ),
      React.createElement("section", { className: "apiPanel" },
        React.createElement("form", { onSubmit: refresh },
          React.createElement("label", { htmlFor: "apiBase" }, "Backend ALB URL"),
          React.createElement("div", { className: "apiRow" },
            React.createElement("input", {
              id: "apiBase",
              value: apiBase,
              onChange: (event) => setApiBase(event.target.value),
              placeholder: "http://your-alb-dns-name",
              spellCheck: "false",
            }),
            React.createElement("button", { type: "submit", disabled: isConnecting }, isConnecting ? "Checking..." : "Connect"),
            React.createElement("button", { type: "button", className: "secondary", onClick: useDemoMode }, "Demo Mode")
          )
        ),
        React.createElement("p", { className: isConnected ? "success" : "notice" }, message)
      ),
      React.createElement("section", { className: "grid" },
        React.createElement("div", { className: "panel" },
          React.createElement("div", { className: "panelTitle" },
            React.createElement("h2", null, "Book Appointment"),
            React.createElement("span", null, isConnected ? "Live API" : "Local demo")
          ),
          React.createElement("form", { onSubmit: createAppointment },
            React.createElement("input", {
              required: true,
              minLength: 2,
              maxLength: 80,
              placeholder: "Patient name",
              value: form.patient_name,
              onChange: (event) => setForm({ ...form, patient_name: event.target.value }),
            }),
            React.createElement("input", {
              required: true,
              minLength: 3,
              maxLength: 200,
              placeholder: "Reason for visit",
              value: form.reason,
              onChange: (event) => setForm({ ...form, reason: event.target.value }),
            }),
            React.createElement("select", {
              value: form.department,
              onChange: (event) => setForm({ ...form, department: event.target.value }),
            },
              React.createElement("option", null, "General Care"),
              React.createElement("option", null, "Cardiology"),
              React.createElement("option", null, "Dermatology"),
              React.createElement("option", null, "Mental Health")
            ),
            React.createElement("input", {
              required: true,
              type: "date",
              value: form.preferred_date,
              onChange: (event) => setForm({ ...form, preferred_date: event.target.value }),
            }),
            React.createElement("button", { type: "submit" }, "Schedule")
          )
        ),
        React.createElement("div", { className: "panel" },
          React.createElement("h2", null, "Available Providers"),
          providers.map((provider) =>
            React.createElement("article", { className: "row", key: provider.id },
              React.createElement("div", null,
                React.createElement("strong", null, provider.name),
                React.createElement("span", null, provider.specialty)
              ),
              React.createElement("em", null, provider.next_slot)
            )
          )
        ),
        React.createElement("div", { className: "panel" },
          React.createElement("div", { className: "panelTitle" },
            React.createElement("h2", null, "Patient Triage"),
            React.createElement("span", null, isConnected ? "Live API" : "Local demo")
          ),
          React.createElement("form", { onSubmit: runTriage },
            React.createElement("input", {
              placeholder: "Symptoms, comma separated",
              value: triageForm.symptoms,
              onChange: (event) => setTriageForm({ ...triageForm, symptoms: event.target.value }),
            }),
            React.createElement("div", { className: "twoCol" },
              React.createElement("input", {
                type: "number",
                step: "0.1",
                placeholder: "Temperature C",
                value: triageForm.temperature_c,
                onChange: (event) => setTriageForm({ ...triageForm, temperature_c: event.target.value }),
              }),
              React.createElement("input", {
                type: "number",
                min: "50",
                max: "100",
                placeholder: "Oxygen %",
                value: triageForm.oxygen_level,
                onChange: (event) => setTriageForm({ ...triageForm, oxygen_level: event.target.value }),
              })
            ),
            React.createElement("button", { type: "submit" }, "Evaluate")
          ),
          triageResult && React.createElement("article", { className: `triageResult ${triageResult.urgency}` },
            React.createElement("strong", null, `${triageResult.urgency} urgency`),
            React.createElement("span", null, triageResult.recommendation),
            React.createElement("small", null, triageResult.next_step)
          )
        ),
        React.createElement("div", { className: "panel" },
          React.createElement("div", { className: "panelTitle" },
            React.createElement("h2", null, "Appointments"),
            React.createElement("button", { type: "button", className: "linkButton", onClick: resetAppointments }, "Reset")
          ),
          appointments.length === 0
            ? React.createElement("p", { className: "notice" }, "No appointments yet.")
            : appointments.map((appointment) =>
              React.createElement("article", { className: "appointment", key: appointment.id },
                React.createElement("strong", null, appointment.patient_name),
                React.createElement("span", null, `${appointment.department} - ${appointment.reason}`),
                React.createElement("small", null, `${appointment.preferred_date} - ${appointment.status}`)
              )
            )
        )
      )
    )
  );
}

function evaluateLocalTriage(payload) {
  const symptoms = new Set(payload.symptoms.map((symptom) => symptom.toLowerCase()));
  const urgentSymptoms = ["chest pain", "shortness of breath", "severe bleeding", "stroke symptoms", "loss of consciousness"];
  const hasUrgentSymptom = urgentSymptoms.some((symptom) => symptoms.has(symptom));

  if (hasUrgentSymptom || (payload.oxygen_level !== null && payload.oxygen_level < 92)) {
    return {
      urgency: "high",
      recommendation: "Seek urgent medical attention.",
      next_step: "Call emergency services or go to the nearest emergency department.",
    };
  }

  if (payload.temperature_c !== null && payload.temperature_c >= 38) {
    return {
      urgency: "medium",
      recommendation: "Book a same-day virtual consultation.",
      next_step: "Schedule with a general physician and monitor hydration.",
    };
  }

  return {
    urgency: "low",
    recommendation: "Book a routine telehealth appointment.",
    next_step: "Choose the next available provider slot.",
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
