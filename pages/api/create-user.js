export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.HUMAND_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "HUMAND_API_KEY no configurada en el servidor" });
  }

  const { firstName, lastName, email, password, idioma, nivel } = req.body;

  // Validación server-side
  const errors = [];
  if (!firstName?.trim()) errors.push("Nombre es requerido");
  if (!lastName?.trim()) errors.push("Apellido es requerido");
  if (!email?.trim()) errors.push("Email es requerido");
  if (!password || password.length < 8)
    errors.push("Contraseña debe tener al menos 8 caracteres");
  if (!idioma) errors.push("Idioma es requerido");
  if (!nivel) errors.push("Nivel es requerido");

  if (errors.length > 0) {
    return res.status(400).json({ error: "Datos inválidos", details: errors });
  }

  // Construir body para Humand — segmentation en singular
  const humandBody = {
    employeeInternalId: email.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    password,
    email: email.trim(),
    segmentation: [
      { group: "Segmentación temporal", item: "Partners" },
      { group: "Idioma", item: idioma },
      { group: "Nivel", item: nivel },
    ],
  };

  // Paso 1: PUT /users en Humand (upsert, no envía email de bienvenida)
  let humandResponse;
  let humandData;
  try {
    humandResponse = await fetch(
      "https://api-prod.humand.co/public/api/v1/users",
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(humandBody),
      }
    );
    humandData = await humandResponse.json();
  } catch (err) {
    return res
      .status(502)
      .json({ error: "No se pudo conectar con la API de Humand", details: err.message });
  }

  if (!humandResponse.ok) {
    return res.status(humandResponse.status).json({
      error: "Error de la API de Humand",
      humandStatus: humandResponse.status,
      details: humandData,
    });
  }

  // Paso 2: POST al Web App de Apps Script (solo si Humand fue OK)
  let mailSent = false;
  let mailError = null;
  const appsScriptUrl = process.env.APPS_SCRIPT_URL;

  if (appsScriptUrl) {
    try {
      const scriptResponse = await fetch(appsScriptUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
          idioma,
          nivel,
          timestamp: new Date().toISOString(),
        }),
        redirect: "follow",
      });
      const scriptText = await scriptResponse.text();
      try {
        const scriptData = JSON.parse(scriptText);
        mailSent = scriptData.success === true;
        if (!mailSent) mailError = scriptData.error || "Apps Script devolvió success=false";
      } catch {
        // Si Apps Script devuelve HTML (redirect de Workspace),
        // checkeamos si el status fue OK
        if (scriptResponse.ok) {
          mailSent = true; // Probablemente funcionó pero devolvió HTML
        } else {
          mailError = `Apps Script devolvió respuesta no-JSON (status ${scriptResponse.status})`;
        }
      }
    } catch (err) {
      mailError = err.message;
    }
  } else {
    mailError = "APPS_SCRIPT_URL no configurada — mail no enviado";
  }

  return res.status(humandResponse.status).json({
    success: true,
    user: humandData,
    mail: {
      sent: mailSent,
      error: mailError,
    },
  });
}
