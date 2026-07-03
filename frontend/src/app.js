const { useEffect, useMemo, useState } = React;

const demoProviders = [
  { id: "DOC-01", name: "Dr. Neha Rao", specialty: "General Physician", next_slot: "10:30 AM", available_today: true },
  { id: "DOC-02", name: "Dr. Kabir Singh", specialty: "Cardiology", next_slot: "02:00 PM", available_today: true },
  { id: "DOC-03", name: "Dr. Aisha Khan", specialty: "Dermatology", next_slot: "Tomorrow 11:00 AM", available_today: false },
];

const demoAppointments = [
  {
    id: "APT-1001",
    patient_name: "Aarav Mehta",
    reason: "Follow-up for blood pressure",
    preferred_date: new Date().toISOString().slice(0, 10),
    department: "Cardiology",
    status: "scheduled",
  },
];

function App() {
  const [apiBase, setApiBase] = useState(localStorage.getItem("telehealthApiBase") || "");
  const [providers, setProviders] = useState(demoProviders);
  const [appointments, setAppointments] = useState(demoAppointments);
  const [health, setHealth] = useState("demo mode");
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    patient_name: "",
    reason: "",
    department: "General Care",
    preferred_date: new Date().toISOString().slice(0, 10),
  });

  const normalizedApiBase = useMemo(() => apiBase.trim().replace(/\/$/, ""), [apiBase]);

  async function api(path, options) {
    if (!normalizedApiBase) {
      throw new Error("API base URL not set");
    }
    const response = await fetch(`${normalizedApiBase}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  }

  async function refresh() {
    if (!normalizedApiBase) return;
    localStorage.setItem("telehealthApiBase", normalizedApiBase);
    try {
      const [healthData, providerData, appointmentData] = await Promise.all([
        api("/health"),
        api("/api/providers"),
        api("/api/appointments"),
      ]);
      setHealth(healthData.status || "online");
      setProviders(providerData.providers || []);
      setAppointments(appointmentData.appointments || []);
      setMessage("Connected to live backend");
    } catch (error) {
      setHealth("offline");
      setMessage(error.message);
    }
  }

  async function createAppointment(event) {
    event.preventDefault();
    if (!normalizedApiBase) {
      const localAppointment = {
        ...form,
        id: `LOCAL-${Date.now()}`,
        status: "scheduled",
      };
      setAppointments([localAppointment, ...appointments]);
      setMessage("Saved locally. Add the ALB URL to use the backend.");
      return;
    }
    try {
      const created = await api("/api/appointments", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setAppointments([created, ...appointments]);
      setMessage("Appointment created through the API");
    } catch (error) {
      setMessage(error.message);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    React.createElement("div", { className: "shell" },
      React.createElement("section", { className: "hero" },
        React.createElement("div", null,
          React.createElement("p", { className: "eyebrow" }, "AWS Telehealth Demo"),
          React.createElement("h1", null, "Smart Telehealth"),
          React.createElement("p", { className: "lede" }, "A small patient intake, provider availability, and appointment workflow for your ALB, ASG, SSM, S3, and CloudFront demo.")
        ),
        React.createElement("div", { className: "status" },
          React.createElement("span", null, "API status"),
          React.createElement("strong", null, health)
        )
      ),
      React.createElement("section", { className: "apiPanel" },
        React.createElement("label", null, "Backend ALB URL"),
        React.createElement("div", { className: "apiRow" },
          React.createElement("input", {
            value: apiBase,
            onChange: (event) => setApiBase(event.target.value),
            placeholder: "http://your-alb-dns-name",
          }),
          React.createElement("button", { onClick: refresh }, "Connect")
        ),
        React.createElement("p", null, message || "Leave blank to use built-in demo data.")
      ),
      React.createElement("section", { className: "grid" },
        React.createElement("div", { className: "panel" },
          React.createElement("h2", null, "Book Appointment"),
          React.createElement("form", { onSubmit: createAppointment },
            React.createElement("input", {
              required: true,
              placeholder: "Patient name",
              value: form.patient_name,
              onChange: (event) => setForm({ ...form, patient_name: event.target.value }),
            }),
            React.createElement("input", {
              required: true,
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
              React.createElement("option", null, "Dermatology")
            ),
            React.createElement("input", {
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
        React.createElement("div", { className: "panel wide" },
          React.createElement("h2", null, "Appointments"),
          appointments.map((appointment) =>
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

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
