import { useState, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";

const IDIOMAS = ["Español", "Ingles", "Portugues"];
const NIVELES = ["Avanzado", "Basico"];
const DEFAULT_PASSWORD = "12345678";

function parseTextBlock(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const users = [];
  for (const line of lines) {
    // Try patterns: "Name Lastname - email" or "Name Lastname email@..." or "email - Name Lastname"
    let match;

    // Pattern 1: "Nombre Apellido - email@domain.com"
    match = line.match(/^(.+?)\s*[-–—]\s*([\w.+-]+@[\w.-]+\.\w+)$/);
    if (match) {
      const nameParts = match[1].trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      users.push({
        firstName,
        lastName,
        email: match[2].trim(),
        password: DEFAULT_PASSWORD,
        idioma: IDIOMAS[0],
        nivel: NIVELES[0],
      });
      continue;
    }

    // Pattern 2: "email@domain.com - Nombre Apellido"
    match = line.match(/^([\w.+-]+@[\w.-]+\.\w+)\s*[-–—]\s*(.+)$/);
    if (match) {
      const nameParts = match[2].trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      users.push({
        firstName,
        lastName,
        email: match[1].trim(),
        password: DEFAULT_PASSWORD,
        idioma: IDIOMAS[0],
        nivel: NIVELES[0],
      });
      continue;
    }

    // Pattern 3: "Nombre Apellido email@domain.com" (space separated)
    match = line.match(/^(.+?)\s+([\w.+-]+@[\w.-]+\.\w+)$/);
    if (match) {
      const nameParts = match[1].trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      users.push({
        firstName,
        lastName,
        email: match[2].trim(),
        password: DEFAULT_PASSWORD,
        idioma: IDIOMAS[0],
        nivel: NIVELES[0],
      });
      continue;
    }

    // Skip lines that don't match (headers, greetings, etc.)
  }
  return users;
}

export default function Bulk() {
  const [rawText, setRawText] = useState("");
  const [users, setUsers] = useState([]);
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleParse = () => {
    const parsed = parseTextBlock(rawText);
    if (parsed.length === 0) {
      alert(
        "No se encontraron usuarios. Usa el formato:\nNombre Apellido - email@dominio.com"
      );
      return;
    }
    setUsers(parsed);
    setResults({});
  };

  const addRow = () => {
    setUsers([
      ...users,
      {
        firstName: "",
        lastName: "",
        email: "",
        password: DEFAULT_PASSWORD,
        idioma: IDIOMAS[0],
        nivel: NIVELES[0],
      },
    ]);
  };

  const removeRow = (index) => {
    setUsers(users.filter((_, i) => i !== index));
    const newResults = { ...results };
    delete newResults[index];
    setResults(newResults);
  };

  const updateUser = (index, field, value) => {
    const updated = [...users];
    updated[index] = { ...updated[index], [field]: value };
    setUsers(updated);
  };

  const applyToAll = useCallback(
    (field, value) => {
      setUsers(users.map((u) => ({ ...u, [field]: value })));
    },
    [users]
  );

  const handleSubmitAll = async () => {
    const valid = users.every(
      (u) =>
        u.firstName.trim() &&
        u.lastName.trim() &&
        u.email.trim() &&
        u.password.length >= 8
    );
    if (!valid) {
      alert(
        "Todos los usuarios necesitan Nombre, Apellido, Email y Contraseña (min 8 chars)"
      );
      return;
    }

    setProcessing(true);
    setResults({});

    for (let i = 0; i < users.length; i++) {
      setCurrentIndex(i);
      try {
        const res = await fetch("/api/create-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(users[i]),
        });
        const data = await res.json();
        setResults((prev) => ({
          ...prev,
          [i]: {
            ok: res.ok,
            status: res.status,
            data,
          },
        }));
      } catch (err) {
        setResults((prev) => ({
          ...prev,
          [i]: {
            ok: false,
            status: 0,
            data: { error: err.message },
          },
        }));
      }
    }

    setCurrentIndex(-1);
    setProcessing(false);
  };

  const successCount = Object.values(results).filter((r) => r.ok).length;
  const errorCount = Object.values(results).filter((r) => !r.ok).length;

  return (
    <>
      <Head>
        <title>HuAcademy — Alta masiva de Partners</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>HuAcademy</h1>
              <p style={styles.subtitle}>Alta masiva de Partners</p>
            </div>
            <Link href="/" style={styles.link}>
              ← Individual
            </Link>
          </div>

          {/* Step 1: Paste text */}
          <div style={styles.section}>
            <label style={styles.label}>
              1. Pegar listado de usuarios
            </label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={
                "Yeniree Garcia - yeniree.garcia@empresa.com\nMiguel Rivero - miguel.rivero@empresa.com\nFares Rivas - fares.rivas@empresa.com"
              }
              style={styles.textarea}
              rows={6}
            />
            <div style={styles.actions}>
              <button
                onClick={handleParse}
                style={styles.btnSecondary}
                disabled={!rawText.trim()}
              >
                Parsear texto
              </button>
              <button onClick={addRow} style={styles.btnOutline}>
                + Agregar fila manual
              </button>
            </div>
          </div>

          {/* Step 2: Editable grid */}
          {users.length > 0 && (
            <div style={styles.section}>
              <label style={styles.label}>
                2. Revisar y editar ({users.length} usuarios)
              </label>

              {/* Bulk apply controls */}
              <div style={styles.bulkControls}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Aplicar a todos:
                </span>
                <select
                  onChange={(e) => {
                    if (e.target.value) applyToAll("idioma", e.target.value);
                  }}
                  style={styles.miniSelect}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Idioma
                  </option>
                  {IDIOMAS.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                <select
                  onChange={(e) => {
                    if (e.target.value) applyToAll("nivel", e.target.value);
                  }}
                  style={styles.miniSelect}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Nivel
                  </option>
                  {NIVELES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.gridWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Nombre</th>
                      <th style={styles.th}>Apellido</th>
                      <th style={styles.th}>Email</th>
                      <th style={styles.th}>Pass</th>
                      <th style={styles.th}>Idioma</th>
                      <th style={styles.th}>Nivel</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.th}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr
                        key={idx}
                        style={
                          currentIndex === idx
                            ? { backgroundColor: "#eff6ff" }
                            : {}
                        }
                      >
                        <td style={styles.td}>
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                            {idx + 1}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <input
                            value={user.firstName}
                            onChange={(e) =>
                              updateUser(idx, "firstName", e.target.value)
                            }
                            style={styles.cellInput}
                            disabled={processing}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            value={user.lastName}
                            onChange={(e) =>
                              updateUser(idx, "lastName", e.target.value)
                            }
                            style={styles.cellInput}
                            disabled={processing}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            value={user.email}
                            onChange={(e) =>
                              updateUser(idx, "email", e.target.value)
                            }
                            style={{
                              ...styles.cellInput,
                              minWidth: "180px",
                            }}
                            disabled={processing}
                          />
                        </td>
                        <td style={styles.td}>
                          <input
                            value={user.password}
                            onChange={(e) =>
                              updateUser(idx, "password", e.target.value)
                            }
                            style={{
                              ...styles.cellInput,
                              width: "80px",
                            }}
                            disabled={processing}
                          />
                        </td>
                        <td style={styles.td}>
                          <select
                            value={user.idioma}
                            onChange={(e) =>
                              updateUser(idx, "idioma", e.target.value)
                            }
                            style={styles.cellSelect}
                            disabled={processing}
                          >
                            {IDIOMAS.map((i) => (
                              <option key={i} value={i}>
                                {i}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={styles.td}>
                          <select
                            value={user.nivel}
                            onChange={(e) =>
                              updateUser(idx, "nivel", e.target.value)
                            }
                            style={styles.cellSelect}
                            disabled={processing}
                          >
                            {NIVELES.map((n) => (
                              <option key={n} value={n}>
                                {n}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={styles.td}>
                          {currentIndex === idx && (
                            <span style={styles.spinner}>⏳</span>
                          )}
                          {results[idx] &&
                            (results[idx].ok ? (
                              <span style={{ color: "#16a34a" }}>✓</span>
                            ) : (
                              <span
                                style={{ color: "#dc2626", cursor: "pointer" }}
                                title={
                                  results[idx].data?.error ||
                                  JSON.stringify(results[idx].data?.details)
                                }
                              >
                                ✗
                              </span>
                            ))}
                        </td>
                        <td style={styles.td}>
                          <button
                            onClick={() => removeRow(idx)}
                            style={styles.btnRemove}
                            disabled={processing}
                            title="Quitar"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: "8px" }}>
                <button onClick={addRow} style={styles.btnOutline} disabled={processing}>
                  + Agregar fila
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Submit */}
          {users.length > 0 && (
            <div style={styles.section}>
              <button
                onClick={handleSubmitAll}
                disabled={processing || users.length === 0}
                style={{
                  ...styles.btnPrimary,
                  opacity: processing ? 0.6 : 1,
                  cursor: processing ? "not-allowed" : "pointer",
                }}
              >
                {processing
                  ? `Procesando ${currentIndex + 1} de ${users.length}...`
                  : `Crear ${users.length} Partners en HuAcademy`}
              </button>

              {Object.keys(results).length > 0 && !processing && (
                <div style={styles.summary}>
                  <span style={{ color: "#16a34a" }}>
                    ✓ {successCount} creados
                  </span>
                  {errorCount > 0 && (
                    <span style={{ color: "#dc2626", marginLeft: "12px" }}>
                      ✗ {errorCount} con error
                    </span>
                  )}
                  <span style={{ color: "#64748b", marginLeft: "12px" }}>
                    (pasa el mouse sobre ✗ para ver el error)
                  </span>
                </div>
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
    maxWidth: "960px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  title: {
    margin: "0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    margin: "4px 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  link: {
    fontSize: "13px",
    color: "#2563eb",
    textDecoration: "none",
  },
  section: {
    marginBottom: "24px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
    display: "block",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13px",
    fontFamily: "monospace",
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  actions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  bulkControls: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  miniSelect: {
    padding: "4px 8px",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    fontSize: "12px",
    backgroundColor: "#fff",
  },
  gridWrapper: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    padding: "8px 6px",
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "4px 4px",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "middle",
  },
  cellInput: {
    width: "100%",
    padding: "5px 6px",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    fontSize: "13px",
    outline: "none",
    boxSizing: "border-box",
  },
  cellSelect: {
    padding: "5px 4px",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    fontSize: "12px",
    backgroundColor: "#fff",
  },
  btnPrimary: {
    width: "100%",
    padding: "10px 16px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
  },
  btnSecondary: {
    padding: "7px 14px",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  btnOutline: {
    padding: "7px 14px",
    backgroundColor: "#fff",
    color: "#334155",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "13px",
    cursor: "pointer",
  },
  btnRemove: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
    padding: "2px 6px",
  },
  spinner: {
    fontSize: "14px",
  },
  summary: {
    marginTop: "12px",
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    borderRadius: "6px",
    fontSize: "13px",
  },
};
