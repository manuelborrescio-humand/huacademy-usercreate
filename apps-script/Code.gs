/**
 * HuAcademy Partner Onboarding — Google Apps Script
 *
 * Instrucciones de setup:
 * 1. Crear una Google Sheet nueva (o usar una existente)
 * 2. Extensions → Apps Script → pegar este código
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copiar la URL del deployment y ponerla en APPS_SCRIPT_URL en Vercel
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Grabar en la sheet — hardcodeado para que funcione siempre
    var SHEET_ID = "1TnJw62UuY9Mevoso8DDUoNJsj_P28J2FIMzIzuby8Y4";
    var sheet = SpreadsheetApp.openById(SHEET_ID).getActiveSheet();

    // Si la sheet está vacía, agregar headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Fecha",
        "Email",
        "Nombre",
        "Apellido",
        "Contraseña",
        "Idioma",
        "Nivel",
        "Mail enviado",
      ]);
    }

    // Enviar email instructivo
    var mailSent = false;
    try {
      sendWelcomeEmail(data);
      mailSent = true;
    } catch (mailErr) {
      Logger.log("Error enviando mail: " + mailErr.message);
    }

    // Agregar fila
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.email,
      data.firstName,
      data.lastName,
      data.password,
      data.idioma,
      data.nivel,
      mailSent ? "SI" : "NO",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ success: true, mailSent: mailSent })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: err.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function sendWelcomeEmail(data) {
  var subject = "Bienvenido/a a HuAcademy — Tus datos de acceso";

  var htmlBody =
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
    '<div style="background-color: #2563eb; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">' +
    '<h1 style="color: #fff; margin: 0; font-size: 24px;">HuAcademy</h1>' +
    '<p style="color: #bfdbfe; margin: 8px 0 0; font-size: 14px;">Certified Business Partners</p>' +
    "</div>" +
    '<div style="background-color: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">' +
    "<p>Hola <strong>" +
    data.firstName +
    "</strong>,</p>" +
    "<p>Te damos la bienvenida a <strong>HuAcademy</strong>, nuestra plataforma de capacitaci\u00f3n. A continuaci\u00f3n encontrar\u00e1s tus datos de acceso:</p>" +
    '<div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">' +
    '<p style="margin: 4px 0;"><strong>Usuario:</strong> ' +
    data.email +
    "</p>" +
    '<p style="margin: 4px 0;"><strong>Contrase\u00f1a inicial:</strong> ' +
    data.password +
    "</p>" +
    "</div>" +
    "<h3>C\u00f3mo ingresar:</h3>" +
    "<ol>" +
    "<li>Descarga la app <strong>Humand</strong> desde <a href='https://apps.apple.com/app/humand/id1183990849'>App Store</a> o <a href='https://play.google.com/store/apps/details?id=co.humand'>Google Play</a></li>" +
    "<li>Tambi\u00e9n puedes acceder desde el navegador en <a href='https://app.humand.co'>app.humand.co</a></li>" +
    "<li>Busca la comunidad <strong>HuAcademy</strong></li>" +
    "<li>Ingresa con tu usuario y contrase\u00f1a</li>" +
    "<li>Te recomendamos cambiar tu contrase\u00f1a en el primer ingreso</li>" +
    "</ol>" +
    '<div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 16px; margin: 16px 0; text-align: center;">' +
    '<p style="margin: 0 0 8px; font-weight: 600;">Video tutorial de acceso</p>' +
    '<a href="https://drive.google.com/file/d/1IhnkrGXiujSdF9FlhRtQmHuSMuGR6sRK/view?usp=sharing" style="display: inline-block; background-color: #2563eb; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">Ver video instructivo</a>' +
    "</div>" +
    '<p style="color: #64748b; font-size: 12px; margin-top: 24px;">Este es un correo autom\u00e1tico. Si ten\u00e9s alguna consulta, contact\u00e1 a tu referente en Humand.</p>' +
    "</div>" +
    "</div>";

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    htmlBody: htmlBody,
  });
}

// Para testing manual desde el editor de Apps Script
function testDoPost() {
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "12345678",
        idioma: "Español",
        nivel: "Basico",
        timestamp: new Date().toISOString(),
      }),
    },
  };
  var result = doPost(mockEvent);
  Logger.log(result.getContent());
}
