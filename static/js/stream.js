// =====================
// stream.js
// =====================
const status = document.getElementById('ws-status');
const log = document.getElementById('ws-log');
const counts = {
    trade_pool: document.getElementById('ws-count-trade-pool'),
    trade_pool_change: document.getElementById('ws-count-trade-pool-change'),
    trade_swap: document.getElementById('ws-count-trade-swap'),
    heartbeat: document.getElementById('ws-count-heartbeat'),
};
const countsVals = { trade_pool: 0, trade_pool_change: 0, trade_swap: 0, heartbeat: 0 };
const tokenMeta = new Map();
const poolMeta = new Map();

function fmtAmount(raw, decimals) {
    if (raw == null) return '—';
    if (!decimals || decimals === 0) return raw;
    try {
        const big = BigInt(raw);
        const denom = 10n ** BigInt(decimals);
        const whole = big / denom;
        const frac = big % denom;
        if (frac === 0n) return whole.toString();
        const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
        return fracStr ? `${whole}.${fracStr}` : whole.toString();
    } catch (e) {
        return raw;
    }
}

function shortAccount(acc) {
    if (!acc) return '';
    if (acc.length <= 18) return acc;
    return acc.slice(0, 9) + '…' + acc.slice(-6);
}

async function loadMeta() {
    try {
        const [tokens, pools] = await Promise.all([
            fetch('/api/tokens').then(r => r.json()),
            fetch('/api/pools').then(r => r.json()),
        ]);
        for (const t of tokens) tokenMeta.set(t.account_id, t);
        for (const p of pools) poolMeta.set(String(p.pool_id), p);
    } catch (e) {
        console.warn('stream meta fetch failed', e);
    }
}

function tsLabel(ms) {
    if (!ms) return '';
    try {
        const d = new Date(ms);
        return d.toISOString().replace('T', ' ').replace('Z', '');
    } catch (e) { return String(ms); }
}

function makeCard(ev) {
    const card = document.createElement('div');
    card.className = 'huggies_rex_card';
    let kind = ev.kind;
    let body = '';
    if (kind === 'trade_pool') {
        const decIn = tokenMeta.get(ev.token_in)?.decimals;
        const decOut = tokenMeta.get(ev.token_out)?.decimals;
        body = `
            <strong>swap</strong> on pool
            <a href="/pool/${ev.pool_id}">#${ev.pool_id}</a>
            &middot; ${tsLabel(ev.ts_unix_ms)}
            &middot; block ${ev.block_height}
            <div>${fmtAmount(ev.amount_in, decIn)} <a href="/token/${ev.token_in}">${shortAccount(ev.token_in)}</a>
                 &rarr; <strong>${fmtAmount(ev.amount_out, decOut)}</strong> <a href="/token/${ev.token_out}">${shortAccount(ev.token_out)}</a></div>
            <div><small>trader: <a href="/trader/${ev.trader}">${shortAccount(ev.trader)}</a></small></div>
        `;
    } else if (kind === 'trade_pool_change') {
        const tokensHtml = (ev.token_account_ids || []).map((tid, i) => {
            const dec = tokenMeta.get(tid)?.decimals;
            return `<div>${shortAccount(tid)}: ${fmtAmount(ev.amounts?.[i], dec)}</div>`;
        }).join('');
        body = `
            <strong>pool change</strong> on
            <a href="/pool/${ev.pool_id}">#${ev.pool_id}</a>
            (${ev.pool_kind})
            &middot; ${tsLabel(ev.ts_unix_ms)}
            &middot; fee ${ev.total_fee}
            <div>${tokensHtml}</div>
        `;
    } else if (kind === 'trade_swap') {
        body = `
            <strong>swap event</strong>
            &middot; ${tsLabel(ev.ts_unix_ms)}
            &middot; block ${ev.block_height}
            <div><small>trader: <a href="/trader/${ev.trader}">${shortAccount(ev.trader)}</a></small></div>
        `;
    } else if (kind === 'heartbeat') {
        body = `<small>heartbeat &middot; ${tsLabel(ev.ts_unix_ms)}</small>`;
    } else {
        body = `<pre style="white-space:pre-wrap;margin:0">${JSON.stringify(ev, null, 2)}</pre>`;
    }
    card.innerHTML = body;
    return card;
}

(async function () {
    await loadMeta();
    const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => { status.textContent = 'connected'; };
    ws.onclose = () => { status.textContent = 'disconnected (no auto-reconnect in the browser)'; };
    ws.onerror = () => { status.textContent = 'error'; };
    ws.onmessage = (e) => {
        let ev;
        try { ev = JSON.parse(e.data); } catch { return; }
        const card = makeCard(ev);
        log.prepend(card);
        while (log.childElementCount > 100) log.removeChild(log.lastChild);
        if (countsVals[ev.kind] != null) {
            countsVals[ev.kind] += 1;
            if (counts[ev.kind]) counts[ev.kind].textContent = countsVals[ev.kind];
        }
    };
})();
// =====================
// copyright 2026 by sleet.near