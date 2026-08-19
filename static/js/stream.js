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
        return d.toISOString().replace('T', ' ').replace('.000Z', 'Z');
    } catch (e) { return String(ms); }
}

function makeCard(ev) {
    const card = document.createElement('div');
    card.className = 'huggies_rex_card';
    card.style.fontSize = '0.9rem';
    let body = '';
    if (ev.kind === 'trade_pool') {
        const decIn = tokenMeta.get(ev.token_in)?.decimals;
        const decOut = tokenMeta.get(ev.token_out)?.decimals;
        const symIn = tokenMeta.get(ev.token_in)?.symbol || shortAccount(ev.token_in);
        const symOut = tokenMeta.get(ev.token_out)?.symbol || shortAccount(ev.token_out);
        body = `
            <div><strong style="color:var(--huggies-rex-color-da291c)">swap</strong>
                pool <a href="/pool/${ev.pool_id}">#${ev.pool_id}</a>
                &middot; block <code>${ev.block_height}</code>
                &middot; ${tsLabel(ev.ts_unix_ms)}</div>
            <div style="margin: 0.4rem 0; font-size: 1rem;">
                <strong>${fmtAmount(ev.amount_in, decIn)}</strong>
                <a href="/token/${ev.token_in}">${symIn}</a>
                &rarr;
                <strong>${fmtAmount(ev.amount_out, decOut)}</strong>
                <a href="/token/${ev.token_out}">${symOut}</a>
            </div>
            <table class="huggies_rex_table" style="font-size:0.85rem">
                <tr><td>pool</td><td><a href="/pool/${ev.pool_id}">#${ev.pool_id}</a></td></tr>
                <tr><td>token in</td><td><a href="/token/${ev.token_in}">${ev.token_in}</a> <small>(${symIn})</small></td></tr>
                <tr><td>amount in</td><td>${ev.amount_in} <small>raw</small> = <strong>${fmtAmount(ev.amount_in, decIn)} ${symIn}</strong></td></tr>
                <tr><td>token out</td><td><a href="/token/${ev.token_out}">${ev.token_out}</a> <small>(${symOut})</small></td></tr>
                <tr><td>amount out</td><td>${ev.amount_out} <small>raw</small> = <strong>${fmtAmount(ev.amount_out, decOut)} ${symOut}</strong></td></tr>
                <tr><td>trader</td><td><a href="/trader/${ev.trader}">${ev.trader}</a> <small>(${shortAccount(ev.trader)})</small></td></tr>
                <tr><td>block</td><td><code>${ev.block_height}</code></td></tr>
                <tr><td>ts</td><td><code>${tsLabel(ev.ts_unix_ms)}</code></td></tr>
            </table>
        `;
    } else if (ev.kind === 'trade_pool_change') {
        const tokensHtml = (ev.token_account_ids || []).map((tid, i) => {
            const dec = tokenMeta.get(tid)?.decimals;
            const sym = tokenMeta.get(tid)?.symbol || shortAccount(tid);
            return `<div>${shortAccount(tid)} (${sym}): <strong>${fmtAmount(ev.amounts?.[i], dec)}</strong></div>`;
        }).join('');
        body = `
            <div><strong style="color:var(--huggies-rex-color-00c6d7)">pool change</strong>
                pool <a href="/pool/${ev.pool_id}">#${ev.pool_id}</a> (${ev.pool_kind})
                &middot; fee ${ev.total_fee}
                &middot; ${tsLabel(ev.ts_unix_ms)}</div>
            <table class="huggies_rex_table" style="font-size:0.85rem">
                <tr><td>pool</td><td><a href="/pool/${ev.pool_id}">#${ev.pool_id}</a></td></tr>
                <tr><td>kind</td><td>${ev.pool_kind}</td></tr>
                <tr><td>fee</td><td>${ev.total_fee} bps</td></tr>
                <tr><td>tokens</td><td>${(ev.token_account_ids || []).map(t => `<a href="/token/${t}">${shortAccount(t)}</a>`).join(', ')}</td></tr>
                <tr><td>amounts</td><td>${tokensHtml}</td></tr>
                <tr><td>ts</td><td><code>${tsLabel(ev.ts_unix_ms)}</code></td></tr>
            </table>
        `;
    } else if (ev.kind === 'trade_swap') {
        body = `
            <div><strong style="color:var(--huggies-rex-color-00c6d7)">swap event (root)</strong>
                block <code>${ev.block_height}</code>
                &middot; ${tsLabel(ev.ts_unix_ms)}</div>
            <table class="huggies_rex_table" style="font-size:0.85rem">
                <tr><td>trader</td><td><a href="/trader/${ev.trader}">${ev.trader}</a> <small>(${shortAccount(ev.trader)})</small></td></tr>
                <tr><td>block</td><td><code>${ev.block_height}</code></td></tr>
                <tr><td>ts</td><td><code>${tsLabel(ev.ts_unix_ms)}</code></td></tr>
            </table>
        `;
    } else if (ev.kind === 'heartbeat') {
        body = `<small style="color:var(--huggies-rex-color-474747)">heartbeat &middot; ${tsLabel(ev.ts_unix_ms)}</small>`;
        card.style.opacity = '0.5';
        card.style.padding = '0.25rem 0.75rem';
    } else {
        body = `<pre style="white-space:pre-wrap;margin:0;font-size:0.8rem">${JSON.stringify(ev, null, 2)}</pre>`;
    }
    card.innerHTML = body;
    return card;
}

(async function () {
    await loadMeta();
    const ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => { status.textContent = 'connected'; };
    ws.onclose = () => { status.textContent = 'disconnected'; };
    ws.onerror = () => { status.textContent = 'error'; };
    ws.onmessage = (e) => {
        let ev;
        try { ev = JSON.parse(e.data); } catch { return; }
        if (ev.kind === 'heartbeat') return; // skip noise
        const card = makeCard(ev);
        log.prepend(card);
        while (log.childElementCount > 50) log.removeChild(log.lastChild);
        if (countsVals[ev.kind] != null) {
            countsVals[ev.kind] += 1;
            if (counts[ev.kind]) counts[ev.kind].textContent = countsVals[ev.kind];
        }
    };
    // also tick counts for heartbeats separately (but skip the card)
    setInterval(() => {
        if (countsVals.heartbeat > 0 && counts.heartbeat) {
            counts.heartbeat.textContent = countsVals.heartbeat;
        }
    }, 1000);
})();
// =====================
// copyright 2026 by sleet.near