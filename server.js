const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Parsează corpul formularelor (application/x-www-form-urlencoded).
app.use(express.urlencoded({ extended: true }));

const HTTP_PORT = process.env.HTTP_PORT || 8080;
const HTTPS_PORT = process.env.HTTPS_PORT || 8443;

// Token-ul "secret" pe care studenții îl caută în captură. Se regenerează
// la fiecare pornire a serverului, ca să nu fie copiat între grupe.
const SECRET_TOKEN = 'SSI-LAB-' + crypto.randomBytes(4).toString('hex').toUpperCase();

// ---------------------------------------------------------------------------
//  Șablon HTML (inline, ca aplicația să rămână dintr-un singur fișier)
// ---------------------------------------------------------------------------
function pagina(req, continut) {
  const protocol = req.secure ? 'HTTPS (criptat)' : 'HTTP (în clar)';
  const culoare = req.secure ? '#1b7f3b' : '#b91c1c';
  return `<!doctype html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Laborator SSI — Demo trafic de rețea</title>
  <style>
    :root { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
    body { max-width: 720px; margin: 24px auto; padding: 0 16px; color: #1a1a1a; }
    h1 { font-size: 1.4rem; }
    .banner { background: #fff3cd; border: 1px solid #ffe08a; border-radius: 8px;
              padding: 12px 14px; font-size: .9rem; margin-bottom: 20px; }
    .proto { font-weight: 700; color: ${culoare}; }
    form { border: 1px solid #e2e2e2; border-radius: 8px; padding: 16px;
           margin-bottom: 18px; }
    fieldset { border: 0; padding: 0; margin: 0; }
    legend { font-weight: 600; margin-bottom: 8px; }
    label { display: block; font-size: .85rem; margin: 10px 0 4px; }
    input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 6px;
            box-sizing: border-box; }
    button { margin-top: 12px; padding: 9px 16px; border: 0; border-radius: 6px;
             background: #2563eb; color: #fff; font-weight: 600; cursor: pointer; }
    .ok { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;
          padding: 14px; }
    code { background: #f3f4f6; padding: 2px 5px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Laborator SSI — Demo de trafic de rețea</h1>
  <div class="banner">
    Conexiune curentă: <span class="proto">${protocol}</span>.
    Aplicație de laborator, intenționat nesecurizată. Nu folosiți date reale.
  </div>
  ${continut}
</body>
</html>`;
}

const formulare = `
  <form method="POST" action="/login">
    <fieldset>
      <legend>1. Autentificare (POST)</legend>
      <!-- Token "secret" ascuns: studenții trebuie să îl găsească în captură -->
      <input type="hidden" name="token" value="${SECRET_TOKEN}">
      <label>Utilizator</label>
      <input name="username" value="student" autocomplete="off">
      <label>Parolă</label>
      <input name="password" type="password" value="Parola123!" autocomplete="off">
      <button type="submit">Autentificare</button>
    </fieldset>
  </form>

  <form method="POST" action="/trimite">
    <fieldset>
      <legend>2. Mesaj de contact (POST)</legend>
      <label>Nume</label>
      <input name="nume" value="Ion Popescu" autocomplete="off">
      <label>Email</label>
      <input name="email" value="ion.popescu@example.com" autocomplete="off">
      <label>Mesaj</label>
      <input name="mesaj" value="Date confidentiale de test" autocomplete="off">
      <button type="submit">Trimite mesajul</button>
    </fieldset>
  </form>

  <form method="GET" action="/cauta">
    <fieldset>
      <legend>3. Căutare (GET — datele ajung în URL)</legend>
      <label>Termen de căutare</label>
      <input name="q" value="informatie-sensibila" autocomplete="off">
      <button type="submit">Caută</button>
    </fieldset>
  </form>
`;

// ---------------------------------------------------------------------------
//  Rute
// ---------------------------------------------------------------------------
app.get('/', (req, res) => {
  res.send(pagina(req, formulare));
});

app.post('/login', (req, res) => {
  const { username, password, token } = req.body;
  log(req, 'LOGIN', { username, password, token });
  res.send(pagina(req, `
    <div class="ok">
      <p><strong>Date primite de server (trimise în clar pe HTTP):</strong></p>
      <p>Utilizator: <code>${escapeHtml(username)}</code><br>
         Parolă: <code>${escapeHtml(password)}</code><br>
         Token ascuns: <code>${escapeHtml(token)}</code></p>
      <p>Caută aceste valori în captura ta de pachete (Follow TCP Stream).</p>
      <p><a href="/">&larr; Înapoi la formulare</a></p>
    </div>`));
});

app.post('/trimite', (req, res) => {
  const { nume, email, mesaj } = req.body;
  log(req, 'MESAJ', { nume, email, mesaj });
  res.send(pagina(req, `
    <div class="ok">
      <p><strong>Mesaj primit (în clar pe HTTP):</strong></p>
      <p>Nume: <code>${escapeHtml(nume)}</code><br>
         Email: <code>${escapeHtml(email)}</code><br>
         Mesaj: <code>${escapeHtml(mesaj)}</code></p>
      <p><a href="/">&larr; Înapoi la formulare</a></p>
    </div>`));
});

app.get('/cauta', (req, res) => {
  const q = req.query.q || '';
  log(req, 'CAUTARE', { q });
  res.send(pagina(req, `
    <div class="ok">
      <p><strong>Căutare procesată.</strong> Observă termenul în bara de adrese
         și în pachetul GET: <code>/cauta?q=${escapeHtml(q)}</code></p>
      <p>Pe HTTP, întregul URL (inclusiv query string) circulă în clar.</p>
      <p><a href="/">&larr; Înapoi la formulare</a></p>
    </div>`));
});

// ---------------------------------------------------------------------------
//  Utilitare
// ---------------------------------------------------------------------------
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function log(req, tip, date) {
  const proto = req.secure ? 'HTTPS' : 'HTTP ';
  const ip = req.socket.remoteAddress;
  console.log(`[${new Date().toISOString()}] [${proto}] ${tip} de la ${ip}:`,
              JSON.stringify(date));
}

// ---------------------------------------------------------------------------
//  Pornirea serverelor
// ---------------------------------------------------------------------------
http.createServer(app).listen(HTTP_PORT, () => {
  console.log('='.repeat(70));
  console.log('  Laborator SSI — server pornit');
  console.log('='.repeat(70));
  console.log(`  HTTP  (în clar)  : http://localhost:${HTTP_PORT}`);
});

const keyPath = path.join(__dirname, 'certs', 'key.pem');
const certPath = path.join(__dirname, 'certs', 'cert.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  const optiuni = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(optiuni, app).listen(HTTPS_PORT, () => {
    console.log(`  HTTPS (criptat)  : https://localhost:${HTTPS_PORT}  (certificat self-signed)`);
    console.log('  Token secret al acestei sesiuni:', SECRET_TOKEN);
    console.log('='.repeat(70));
  });
} else {
  console.log('  HTTPS            : dezactivat (lipsesc certificatele)');
  console.log('                     Rulează  ./generate-cert.sh  pentru varianta criptată.');
  console.log('  Token secret al acestei sesiuni:', SECRET_TOKEN);
  console.log('='.repeat(70));
}
