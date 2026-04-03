import { useState } from "react";
import Head from "next/head";

const IDIOMAS = ["Español", "Ingles", "Portugues"];
const NIVELES = ["Avanzado", "Basico"];
const DEFAULT_PASSWORD = "12345678";

export default function Home() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: DEFAULT_PASSWORD,
    idioma: IDIOMAS[0],
    nivel: NIVELES[0],
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setResult({ type: "success", data });
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          password: DEFAULT_PASSWORD,
          idioma: IDIOMAS[0],
          nivel: NIVELES[0],
        });
      } else {
        setResult({ type: "error", data });
      }
    } catch (err) {
      setResult({
        type: "error",
        data: { error: "Error de red", details: err.message },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>HuAcademy — Alta de Partners</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>HuAcademy</h1>
          <p style={styles.subtitle}>Alta de Partners</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Nombre *</label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="Ej: Maria"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Apellido *</label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="Ej: Garcia"
                />
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                style={styles.input}
                placeholder="partner@empresa.com"
              />
              <span style={styles.hint}>
                Se usa como usuario de login y destino del mail instructivo
              </span>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Contrasena inicial *</label>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={8}
                style={styles.input}
              />
              <span style={styles.hint}>Minimo 8 caracteres</span>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>Idioma *</label>
                <select
                  name="idioma"
                  value={form.idioma}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  {IDIOMAS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Nivel *</label>
                <select
                  name="nivel"
                  value={form.nivel}
                  onChange={handleChange}
                  required
                  style={styles.input}
                >
                  {NIVELES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={styles.segInfo}>
              Segmentacion fija: <strong>Segmentacion temporal = Partners</strong>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creando usuario..." : "Crear Partner en HuAcademy"}
            </button>
          </form>

          {result && (
            <div
              style={{
                ...styles.result,
                borderColor:
                  result.type === "success" ? "#22c55e" : "#ef4444",
                backgroundColor:
                  result.type === "success" ? "#f0fdf4" : "#fef2f2",
              }}
            >
              {result.type === "success" ? (
                <>
                  <h3 style={{ margin: "0 0 8px", color: "#16a34a" }}>
                    Usuario creado exitosamente
                  </h3>
                  <p style={{ margin: "4px 0" }}>
                    <strong>ID:</strong>{" "}
                    {result.data.user?.employeeInternalId || result.data.user?.id}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Nombre:</strong> {result.data.user?.firstName}{" "}
                    {result.data.user?.lastName}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Email:</strong> {result.data.user?.email}
                  </p>
                  <p style={{ margin: "4px 0" }}>
                    <strong>Estado:</strong> {result.data.user?.status}
                  </p>
                  <p
                    style={{
                      margin: "8px 0 0",
                      color: result.data.mail?.sent ? "#16a34a" : "#d97706",
                    }}
                  >
                    {result.data.mail?.sent
                      ? "Mail instructivo enviado"
                      : `Mail no enviado: ${result.data.mail?.error || "error desconocido"}`}
                  </p>
                </>
              ) : (
                <>
                  <h3 style={{ margin: "0 0 8px", color: "#dc2626" }}>Error</h3>
                  <p style={{ margin: "4px 0" }}>
                    {result.data.error || "Error desconocido"}
                  </p>
                  {result.data.details && (
                    <pre style={styles.pre}>
                      {typeof result.data.details === "string"
                        ? result.data.details
                        : JSON.stringify(result.data.details, null, 2)}
                    </pre>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "40px 16px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
    padding: "32px",
    width: "100%",
    maxWidth: "520px",
  },
  title: {
    margin: "0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    margin: "4px 0 24px",
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  row: {
    display: "flex",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
  },
  label: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    marginBottom: "4px",
  },
  input: {
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#fff",
  },
  hint: {
    fontSize: "11px",
    color: "#94a3b8",
    marginTop: "2px",
  },
  segInfo: {
    fontSize: "12px",
    color: "#64748b",
    backgroundColor: "#f8fafc",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  button: {
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    marginTop: "4px",
  },
  result: {
    marginTop: "20px",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid",
    fontSize: "14px",
  },
  pre: {
    margin: "8px 0 0",
    padding: "8px",
    backgroundColor: "#f8fafc",
    borderRadius: "4px",
    fontSize: "12px",
    overflow: "auto",
    maxHeight: "200px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
};
