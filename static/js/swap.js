// =====================
// swap.js
// shared by / (home) and /swap
// fetches all viable routes and lets the user pick
// =====================
const tokenIn = document.getElementById('swap-token-in');
const tokenOut = document.getElementById('swap-token-out');
const amountIn = document.getElementById('swap-amount-in');
const amountOutEl = document.getElementById('swap-amount-out');
const routesEl = document.getElementById('swap-routes');
const list = document.getElementById('swap-token-list');

function fmtAmount(raw, decimals) {
    if (raw == null) return '—';
    if (decimals == null || decimals === 0) return raw;
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

const tokenMeta = new Map();

fetch('/api/tokens').then(r => r.json()).then(tokens => {
    for (const t of tokens) {
        tokenMeta.set(t.account_id, t);
        const o = document.createElement('option');
        o.value = t.account_id;
        o.label = `${t.symbol} (${t.account_id})`;
        list.appendChild(o);
    }
});

function humanFor(tokenId, rawAmount) {
    const meta = tokenMeta.get(tokenId);
    const dec = meta ? meta.decimals : null;
    return fmtAmount(rawAmount, dec);
}

document.getElementById('swap-quote').addEventListener('click', async () => {
    const params = new URLSearchParams({
        token_in: tokenIn.value.trim(),
        token_out: tokenOut.value.trim(),
        amount_in: amountIn.value.trim(),
    });
    if (!params.get('token_in') || !params.get('token_out') || !params.get('amount_in')) {
        amountOutEl.textContent = 'fill all fields';
        routesEl.innerHTML = '';
        return;
    }
    routesEl.innerHTML = '<p>quoting…</p>';
    try {
        const data = await fetch('/api/get_return?' + params).then(r => r.json());
        if (!data.routes || data.routes.length === 0) {
            amountOutEl.textContent = 'no route';
            routesEl.innerHTML = '<p>no viable route found in local state.</p>';
            return;
        }
        const best = data.routes[0];
        amountOutEl.textContent = `${humanFor(best.token_out, best.amount_out)} (${best.source})`;
        routesEl.innerHTML = '';
        for (let i = 0; i < data.routes.length; i++) {
            const r = data.routes[i];
            const card = document.createElement('div');
            card.className = 'huggies_rex_card';
            const hopHtml = r.hops.map(h => `
                <div>
                    pool #${h.pool_id}:
                    ${humanFor(h.token_in, h.amount_in)} ${h.token_in}
                    &rarr; ${humanFor(h.token_out, h.amount_out)} ${h.token_out}
                </div>
            `).join('');
            card.innerHTML = `
                <strong>route ${i + 1}</strong>
                &middot; out: ${humanFor(r.token_out, r.amount_out)}
                &middot; hops: ${r.hops.length}
                &middot; source: ${r.source}
                <div style="margin-top:0.5rem">${hopHtml}</div>
            `;
            routesEl.appendChild(card);
        }
    } catch (e) {
        amountOutEl.textContent = 'error: ' + e.message;
        routesEl.innerHTML = '';
    }
});
// =====================
// copyright 2026 by sleet.near