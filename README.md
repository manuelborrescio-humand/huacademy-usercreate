# HuAcademy — Alta de Partners

Formulario interno para dar de alta partners externos en HuAcademy (Humand).

## Flujo

1. El equipo de Humand completa el formulario
2. Se crea el usuario en HuAcademy via API (PUT /users — upsert, no envia email de bienvenida)
3. Se registra en una Google Sheet via Apps Script
4. Apps Script envia un email instructivo al partner con sus datos de acceso

## Variables de entorno

| Variable | Descripcion |
|----------|-------------|
| `HUMAND_API_KEY` | API Key de la comunidad HuAcademy (se obtiene del equipo de Humand) |
| `APPS_SCRIPT_URL` | URL del Web App de Google Apps Script (ver seccion de setup) |

## Setup local

```bash
npm install
cp .env.example .env.local
# Editar .env.local con tus valores
npm run dev
```

Abrir http://localhost:3000

## Deploy en Vercel

1. Pushear el repo a GitHub
2. Importar el repo en [vercel.com](https://vercel.com)
3. En Settings → Environment Variables, agregar:
   - `HUMAND_API_KEY` = tu API key de HuAcademy
   - `APPS_SCRIPT_URL` = URL del Web App de Apps Script
4. Deploy automatico

## Setup del Apps Script (envio de mails)

1. Crear una Google Sheet nueva
2. Ir a **Extensions → Apps Script**
3. Borrar el contenido default y pegar el contenido de `apps-script/Code.gs`
4. Ir a **Deploy → New deployment**
   - Tipo: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Hacer click en **Deploy** y copiar la URL generada
6. Pegar esa URL en la variable `APPS_SCRIPT_URL` (en `.env.local` o en Vercel)

## Notas importantes

- Se usa **PUT** (upsert) en lugar de POST para crear usuarios. Esto evita que Humand envie el email de bienvenida automatico. El mail lo controlamos nosotros via Apps Script.
- Si el usuario ya existe, PUT lo actualiza (reemplaza todos los campos).
- La segmentacion "Segmentacion temporal = Partners" se asigna automaticamente. El formulario solo pide Idioma y Nivel.
- El `employeeInternalId` (usuario de login) es el email del partner.
- La contrasena por defecto es `12345678`, editable desde el formulario.
