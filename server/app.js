const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const QRCode = require('qrcode');
const os = require('os');

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

// Middleware
app.use(express.json());

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
async function incrementCounter() {
  const data = await readCounterData();
  data.count += 1;
  data.totalHits += 1;
  data.lastAccessed = new Date().toISOString();
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
app.get('/scan', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'scan.html'));
});

// Reset page - resets counter and shows hello world
app.get('/reset', async (req, res) => {
  try {
    // Reset the counter to 0
    const resetData = {
      count: 0,
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      totalHits: 0
    };
    await writeCounterData(resetData);
    
    // Serve the reset page
    res.sendFile(path.join(__dirname, '..', 'public', 'reset.html'));
  } catch (error) {
    console.error('Error resetting counter:', error);
    res.status(500).send('Error resetting counter');
  }
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
    
    const scanUrl = `${baseUrl}/scan`;
    const qrCodeDataURL = await QRCode.toDataURL(scanUrl);
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