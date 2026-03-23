require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const QRCode = require('qrcode');
const os = require('os');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'counter.json');

// Get base URL for QR codes
function getBaseUrl() {
  // Custom domain from environment variable
  if (process.env.CUSTOM_DOMAIN) {
    return `https://${process.env.CUSTOM_DOMAIN}`;
  }
  
  // Production hosting platforms
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (process.env.RAILWAY_STATIC_URL) {
    return process.env.RAILWAY_STATIC_URL;
  }
  
  // Development fallback
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return `http://${interface.address}:${PORT}`;
      }
    }
  }
  return `http://localhost:${PORT}`;
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'qr-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
}));

function requireAuth(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next();
  if (req.session.authenticated) return next();
  res.redirect('/admin/login');
}

// Trust proxy for production (behind nginx/cloudflare)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
// Disabled HTTPS redirect — nginx handles TLS termination
// app.use((req, res, next) => {
//   // Force HTTPS in production
//   if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
//     return res.redirect(301, 'https://' + req.get('host') + req.url);
//   }
//   next();
// });

app.use(express.static(path.join(__dirname, '..', 'public')));

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE);
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read counter data
async function readCounterData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, create initial data
    const initialData = {
      count: 0,
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      totalHits: 0
    };
    await writeCounterData(initialData);
    return initialData;
  }
}

// Write counter data
async function writeCounterData(data) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

// Increment counter
async function incrementCounter(meta = {}) {
  const data = await readCounterData();
  data.count += 1;
  data.totalHits += 1;
  data.lastAccessed = new Date().toISOString();
  if (!data.scans) data.scans = [];
  data.scans.push({
    timestamp: new Date().toISOString(),
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
    ref: meta.ref || null,
  });
  await writeCounterData(data);
  return data;
}

// Routes

// Main counter page - increments on visit
app.get('/', async (req, res) => {
  try {
    const counterData = await incrementCounter();
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  } catch (error) {
    console.error('Error incrementing counter:', error);
    res.status(500).send('Internal Server Error');
  }
});

// QR code display page
app.get('/qr', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'qr.html'));
});

// Scan page - increments counter and shows success
app.get('/scan', async (req, res) => {
  try {
    await incrementCounter({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      ref: req.query.ref || null,
    });
    res.sendFile(path.join(__dirname, '..', 'public', 'scan.html'));
  } catch (error) {
    console.error('Error incrementing counter:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Midnight page
app.get('/midnight', async (req, res) => {
  try {
    await incrementCounter({
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      ref: 'midnight',
    });
  } catch (e) { /* don't let counter errors break the experience */ }

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #000;
      color: #fff;
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
      padding: 40px;
    }
    #hi {
      display: none;
      flex-direction: column;
      gap: 16px;
    }
    #hi .word {
      font-size: 72px;
      font-weight: bold;
      opacity: 0;
      transition: opacity 2s ease;
    }
    #hi .sub {
      font-size: 14px;
      color: #444;
      opacity: 0;
      transition: opacity 2s ease;
      transition-delay: 1.5s;
    }
    #wait {
      display: none;
      flex-direction: column;
      gap: 20px;
    }
    #wait .label {
      font-size: 14px;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    #wait .countdown {
      font-size: 52px;
      font-weight: bold;
      font-variant-numeric: tabular-nums;
      letter-spacing: 2px;
    }
    #wait .hint {
      font-size: 13px;
      color: #333;
      margin-top: 8px;
    }
  </style>
</head>
<body>

  <div id="hi">
    <div class="word" id="hiWord">Hi.</div>
    <div class="sub" id="hiSub">You actually came back.</div>
  </div>

  <div id="wait">
    <div class="label">come back in</div>
    <div class="countdown" id="countdown">--:--:--</div>
    <div class="hint">scan this at midnight</div>
  </div>

  <script>
    function check() {
      const now = new Date();
      const h = now.getHours();
      const isMidnight = h === 23 || h === 0;

      if (isMidnight) {
        document.getElementById('hi').style.display = 'flex';
        setTimeout(() => {
          document.getElementById('hiWord').style.opacity = 1;
          setTimeout(() => {
            document.getElementById('hiSub').style.opacity = 1;
          }, 500);
        }, 300);
      } else {
        document.getElementById('wait').style.display = 'flex';
        tick();
        setInterval(tick, 1000);
      }
    }

    function tick() {
      const now = new Date();
      const target = new Date();
      target.setHours(23, 0, 0, 0);
      if (now >= target) target.setDate(target.getDate() + 1);

      const diff = target - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

      document.getElementById('countdown').textContent =
        String(h).padStart(2, '0') + ':' +
        String(m).padStart(2, '0') + ':' +
        String(s).padStart(2, '0');
    }

    check();
  </script>
</body>
</html>`);
});


// API endpoint to get current counter
app.get('/api/counter', async (req, res) => {
  try {
    const data = await readCounterData();
    res.json(data);
  } catch (error) {
    console.error('Error reading counter:', error);
    res.status(500).json({ error: 'Failed to read counter' });
  }
});

// API endpoint to manually increment counter
app.post('/api/counter/increment', async (req, res) => {
  try {
    const data = await incrementCounter();
    res.json(data);
  } catch (error) {
    console.error('Error incrementing counter:', error);
    res.status(500).json({ error: 'Failed to increment counter' });
  }
});

// API endpoint to generate QR code
app.get('/api/qr', async (req, res) => {
  try {
    let baseUrl = getBaseUrl();

    // In production, prefer the actual request host over local network detection
    if (process.env.NODE_ENV === 'production' && req.get('host')) {
      const protocol = req.secure || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      baseUrl = `${protocol}://${req.get('host')}`;
    }

    const ref = req.query.ref;
    const scanUrl = `${baseUrl}/scan${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
    const qrCodeDataURL = await QRCode.toDataURL(scanUrl, { width: 400, margin: 2 });
    res.json({ qrCode: qrCodeDataURL, url: scanUrl });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    domain: getBaseUrl()
  });
});

// Admin login
app.get('/admin/login', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f13; color: #e2e2e2; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { background: #1c1c24; padding: 40px; border-radius: 12px; width: 100%; max-width: 340px; box-shadow: 0 4px 24px rgba(0,0,0,0.4); }
    h1 { font-size: 20px; margin-bottom: 24px; color: #f0f0f0; }
    input { width: 100%; padding: 10px 14px; background: #25252f; border: 1px solid #2e2e3a; border-radius: 6px; color: #e2e2e2; font-size: 14px; box-sizing: border-box; margin-bottom: 16px; }
    button { width: 100%; padding: 10px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; }
    button:hover { background: #4338ca; }
    .error { color: #f87171; font-size: 13px; margin-bottom: 12px; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Admin Login</h1>
    ${req.query.error ? '<p class="error">Incorrect password.</p>' : ''}
    <form method="POST" action="/admin/login">
      <input type="password" name="password" placeholder="Password" autofocus />
      <button type="submit">Login</button>
    </form>
  </div>
</body>
</html>`);
});

app.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?error=1');
  }
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// QR Generator
app.get('/admin/generate', requireAuth, (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Generator</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f13; color: #e2e2e2; margin: 0; padding: 30px; }
    h1 { font-size: 22px; color: #f0f0f0; margin-bottom: 6px; }
    .nav { margin-bottom: 30px; font-size: 13px; }
    .nav a { color: #7c6af5; text-decoration: none; margin-right: 16px; }
    .nav a:hover { color: #a78bfa; }
    .builder { display: flex; gap: 40px; flex-wrap: wrap; align-items: flex-start; }
    .controls { flex: 1; min-width: 260px; }
    label { display: block; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
    input { width: 100%; padding: 10px 14px; background: #25252f; border: 1px solid #2e2e3a; border-radius: 6px; color: #e2e2e2; font-size: 14px; box-sizing: border-box; margin-bottom: 20px; }
    input:focus { outline: none; border-color: #4f46e5; }
    .presets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .preset { padding: 6px 12px; background: #25252f; border: 1px solid #2e2e3a; border-radius: 20px; font-size: 12px; color: #aaa; cursor: pointer; }
    .preset:hover { border-color: #4f46e5; color: #e2e2e2; }
    .url-preview { background: #25252f; border-radius: 6px; padding: 10px 14px; font-size: 12px; color: #666; margin-bottom: 20px; word-break: break-all; }
    .url-preview span { color: #a78bfa; }
    button { padding: 10px 24px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; margin-right: 8px; }
    button:hover { background: #4338ca; }
    .btn-print { background: #25252f; border: 1px solid #2e2e3a; }
    .btn-print:hover { background: #2e2e3a; }
    .qr-output { text-align: center; }
    .qr-box { background: white; border-radius: 12px; padding: 24px; display: inline-block; margin-bottom: 16px; }
    .qr-box img { display: block; width: 260px; height: 260px; }
    .qr-label { font-size: 13px; color: #888; }
    .qr-label strong { color: #a78bfa; }
    @media print {
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { background: white; margin: 0; padding: 0; }
      .nav, .controls, h1, .qr-label { display: none; }
      .builder { display: block; }
      .qr-output { display: flex; justify-content: center; align-items: center; min-height: 100vh; }
      .sticker { display: flex !important; }
      .qr-box { display: inline-block !important; }
    }
  </style>
</head>
<body>
  <div class="nav">
    <a href="/admin">← Dashboard</a>
    <a href="/admin/logout">Logout</a>
  </div>
  <h1>QR Generator</h1>

  <div class="builder">
    <div class="controls">
      <label>Hook Text</label>
      <input type="text" id="hookInput" placeholder="e.g. How many New Yorkers walked past this?" />

      <label>Subtext <span style="color:#555;font-weight:normal;text-transform:none">(optional)</span></label>
      <input type="text" id="subInput" placeholder="e.g. Scan to find out" />

      <label>Location Name</label>
      <input type="text" id="refInput" placeholder="e.g. subway-14th-st" />

      <label>Quick Presets</label>
      <div class="presets">
        <div class="preset" onclick="setRef('subway-14th')">Subway 14th</div>
        <div class="preset" onclick="setRef('subway-union-sq')">Union Sq</div>
        <div class="preset" onclick="setRef('coffee-shop')">Coffee Shop</div>
        <div class="preset" onclick="setRef('bar-ludlow')">Bar Ludlow</div>
        <div class="preset" onclick="setRef('williamsburg')">Williamsburg</div>
        <div class="preset" onclick="setRef('soho')">SoHo</div>
      </div>

      <label>Scan URL</label>
      <div class="url-preview" id="urlPreview">Enter a location name above</div>

      <button onclick="generateQR()">Generate QR</button>
      <button class="btn-print" onclick="window.print()">Print</button>
    </div>

    <div class="qr-output">
      <div class="sticker" id="sticker" style="display:none; flex-direction:column; align-items:center; background:#111; border-radius:16px; padding:32px 40px; max-width:320px; text-align:center;">
        <p id="stickerHook" style="font-size:22px; font-weight:bold; color:#fff; margin:0 0 6px 0; line-height:1.3;"></p>
        <p id="stickerSub" style="font-size:14px; color:#aaa; margin:0 0 24px 0;"></p>
        <div style="background:white; border-radius:10px; padding:16px; display:inline-block;">
          <img id="qrImg" src="" alt="QR Code" style="display:block; width:200px; height:200px;" />
        </div>
        <p id="stickerRef" style="font-size:11px; color:#555; margin:16px 0 0 0;"></p>
      </div>
      <div class="qr-label" id="qrLabel"></div>
    </div>
  </div>

  <script>
    const input = document.getElementById('refInput');
    const hookInput = document.getElementById('hookInput');
    const subInput = document.getElementById('subInput');
    const preview = document.getElementById('urlPreview');

    input.addEventListener('input', updatePreview);
    hookInput.addEventListener('input', updateSticker);
    subInput.addEventListener('input', updateSticker);

    function setRef(val) {
      input.value = val;
      updatePreview();
      generateQR();
    }

    function updatePreview() {
      const ref = input.value.trim();
      if (!ref) { preview.textContent = 'Enter a location name above'; return; }
      const slug = slugify(ref);
      preview.innerHTML = window.location.origin + '/scan?ref=<span>' + slug + '</span>';
    }

    function updateSticker() {
      document.getElementById('stickerHook').textContent = hookInput.value || '';
      document.getElementById('stickerSub').textContent = subInput.value || '';
    }

    function slugify(val) {
      return val.toLowerCase().trim().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }

    async function generateQR() {
      const ref = slugify(input.value.trim());
      if (!ref) return;
      const res = await fetch('/api/qr?ref=' + encodeURIComponent(ref));
      const data = await res.json();
      document.getElementById('qrImg').src = data.qrCode;
      document.getElementById('stickerHook').textContent = hookInput.value || '';
      document.getElementById('stickerSub').textContent = subInput.value || '';
      document.getElementById('stickerRef').textContent = ref;
      document.getElementById('sticker').style.display = 'flex';
      document.getElementById('qrLabel').innerHTML = 'Location: <strong>' + ref + '</strong>';
      preview.innerHTML = window.location.origin + '/scan?ref=<span>' + ref + '</span>';
    }
  </script>
</body>
</html>`);
});

// Admin dashboard
app.get('/admin', requireAuth, async (req, res) => {
  const data = await readCounterData();
  const scans = (data.scans || []).slice().reverse();

  const rows = scans.map((s, i) => {
    const num = scans.length - i;
    const date = new Date(s.timestamp);
    const ua = s.userAgent || '-';
    const device = /iPhone|iPad/.test(ua) ? '🍎 iOS' : /Android/.test(ua) ? '🤖 Android' : /Windows/.test(ua) ? '🖥 Windows' : /Mac/.test(ua) ? '🖥 Mac' : '?';
    return `<tr>
      <td>#${num}</td>
      <td>${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
      <td>${s.ip || '-'}</td>
      <td>${device}</td>
      <td class="ua">${ua}</td>
      <td>${s.ref || '-'}</td>
    </tr>`;
  }).join('');

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard</title>
  <style>
    body { font-family: Arial, sans-serif; background: #0f0f13; color: #e2e2e2; margin: 0; padding: 30px; }
    h1 { font-size: 22px; color: #f0f0f0; margin-bottom: 6px; }
    .meta { color: #666; font-size: 13px; margin-bottom: 30px; }
    .stats { display: flex; gap: 16px; margin-bottom: 30px; flex-wrap: wrap; }
    .stat { background: #1c1c24; border-radius: 10px; padding: 20px 28px; min-width: 120px; }
    .stat-val { font-size: 36px; font-weight: bold; color: #a78bfa; }
    .stat-label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; background: #1c1c24; border-radius: 10px; overflow: hidden; font-size: 13px; }
    th { text-align: left; padding: 12px 16px; background: #25252f; color: #888; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
    td { padding: 10px 16px; border-bottom: 1px solid #25252f; color: #ccc; }
    tr:last-child td { border-bottom: none; }
    td.ua { color: #555; font-size: 11px; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .logout { float: right; font-size: 13px; color: #555; text-decoration: none; }
    .logout:hover { color: #aaa; }
  </style>
</head>
<body>
  <a class="logout" href="/admin/logout">Logout</a>
  <a class="logout" style="margin-right:16px" href="/admin/generate">+ Generate QR</a>
  <h1>Scan Dashboard</h1>
  <p class="meta">Total scans: <strong>${data.count}</strong> &nbsp;|&nbsp; Since: ${new Date(data.created).toLocaleDateString()}</p>
  <div class="stats">
    <div class="stat"><div class="stat-val">${data.count}</div><div class="stat-label">Total Scans</div></div>
    <div class="stat"><div class="stat-val">${scans.filter(s => { const d = new Date(s.timestamp); const now = new Date(); return d.toDateString() === now.toDateString(); }).length}</div><div class="stat-label">Today</div></div>
    <div class="stat"><div class="stat-val">${scans.filter(s => /iPhone|iPad|Android/.test(s.userAgent || '')).length}</div><div class="stat-label">Mobile</div></div>
  </div>
  <table>
    <thead><tr><th>#</th><th>Time</th><th>IP</th><th>Device</th><th>User Agent</th><th>Ref</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:#555;padding:30px">No scans yet.</td></tr>'}</tbody>
  </table>
</body>
</html>`);
});

// Initialize server
async function startServer() {
  await ensureDataDirectory();
  const baseUrl = getBaseUrl();
  
  // Bind to all network interfaces for cloud deployment
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 QR Counter server running on port ${PORT}`);
    console.log(`📱 QR code page: ${baseUrl}/qr`);
    console.log(`📊 Counter page: ${baseUrl}`);
    console.log(`🌐 Server accessible at: ${baseUrl}`);
    
    if (process.env.NODE_ENV === 'production') {
      console.log(`🔒 HTTPS handled by Nginx reverse proxy`);
    }
  });
}

startServer().catch(console.error); 