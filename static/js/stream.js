// =====================
// stream.js
// =====================
const status = document.getElementById('ws-status');
const log = document.getElementById('ws-log');
const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
ws.onopen = () => { status.textContent = 'connected'; };
ws.onclose = () => { status.textContent = 'disconnected (will not reconnect automatically)'; };
ws.onerror = () => { status.textContent = 'error'; };
ws.onmessage = (e) => {
    const line = document.createElement('div');
    line.textContent = e.data;
    log.prepend(line);
    while (log.childElementCount > 200) log.removeChild(log.lastChild);
};
// =====================
// copyright 2026 by sleet.near