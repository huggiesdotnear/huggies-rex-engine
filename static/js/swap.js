// =====================
// swap.js
// shared by / (home) and /swap
// supports two modes:
//   swap       = best routes for token a -> token b
//   roundtrip  = cycle routes that start and end at the same token
// =====================
const tokenIn = document.getElementById('swap-token-in');
const tokenOut = document.getElementById('swap-token-out');
const tokenOutLabel = document.getElementById('swap-token-out-label');
const middleInput = document.getElementById('swap-middle');
const middleLabel = document.getElementById('swap-middle-label');
const amountIn = document.getElementById('swap-amount-in');
const amountOutEl = document.getElementById('swap-amount-out');
const resultLine = document.getElementById('swap-result-line');
const routesEl = document.getElementById('swap-routes');
const list = document.getElementById('swap-token-list');
const MAX_HOPS_DISPLAY = 3;

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

function currentMode() {
    const r = document.querySelector('input[name="swap-mode"]:checked');
    return r ? r.value : 'swap';
}

function applyModeUi() {
    const mode = currentMode();
    const swapVisible = mode === 'swap';
    const viaVisible = mode === 'via';
    if (tokenOut) tokenOut.style.display = swapVisible ? '' : 'none';
    if (tokenOutLabel) tokenOutLabel.style.display = swapVisible ? '' : 'none';
    if (middleInput) middleInput.style.display = viaVisible ? '' : 'none';
    if (middleLabel) middleLabel.style.display = viaVisible ? '' : 'none';
    if (resultLine) {
        const label = mode === 'swap' ? 'best return: '
            : mode === 'via' ? 'best round-trip: '
            : 'best cycle: ';
        resultLine.firstChild.textContent = label;
    }
    amountOutEl.textContent = '—';
    routesEl.innerHTML = '';
}

document.querySelectorAll('input[name="swap-mode"]').forEach(r => {
    r.addEventListener('change', applyModeUi);
});
applyModeUi();

// When the user picks a token, show its decimals next to the amount
// input so they know the scale of what they're typing.
function refreshAmountHint() {
    const hint = document.getElementById('swap-amount-hint');
    if (!hint) return;
    const meta = tokenMeta.get(tokenIn.value.trim());
    if (meta) {
        hint.innerHTML = `token has <strong>${meta.decimals}</strong> decimals. typing "1" = 1 ${(meta.symbol || meta.account_id.split('.')[0])} (${'1' + '0'.repeat(meta.decimals)} raw). typing "0.001" = ${meta.decimals >= 3 ? '1' + '0'.repeat(meta.decimals - 3) : '0.001'} raw.`;
    } else {
        hint.textContent = '';
    }
}
tokenIn.addEventListener('input', refreshAmountHint);
refreshAmountHint();

function renderRouteCard(i, r) {
    const card = document.createElement('div');
    card.className = 'huggies_rex_card';
    const hopHtml = r.hops.map(h => `
        <div>
            pool <a href="/pool/${h.pool_id}">#${h.pool_id}</a>:
            ${humanFor(h.token_in, h.amount_in.raw)} <a href="/token/${h.token_in}">${h.token_in.split('.')[0]}</a>
            &rarr; <strong>${humanFor(h.token_out, h.amount_out.raw)}</strong> <a href="/token/${h.token_out}">${h.token_out.split('.')[0]}</a>
        </div>
    `).join('');
    const src = r.source ? `&middot; source: ${r.source}` : '';
    card.innerHTML = `
        <strong>route ${i + 1}</strong>
        &middot; out: <strong>${humanFor(r.token_out, r.amount_out)}</strong> ${r.token_out.split('.')[0]}
        &middot; hops: ${r.hops.length}
        ${src}
        <div style="margin-top:0.5rem">${hopHtml}</div>
    `;
    return card;
}

function renderArbCard(i, c) {
    const card = document.createElement('div');
    card.className = 'huggies_rex_card';
    const profitClass = c.profit_bps >= 0 ? 'color:var(--huggies-rex-color-00c6d7)' : 'color:var(--huggies-rex-color-da291c)';
    const hopHtml = c.hops.map(h => `
        <div>
            pool <a href="/pool/${h.pool_id}">#${h.pool_id}</a>:
            ${humanFor(h.token_in, h.amount_in.raw)} <a href="/token/${h.token_in}">${h.token_in.split('.')[0]}</a>
            &rarr; <strong>${humanFor(h.token_out, h.amount_out.raw)}</strong> <a href="/token/${h.token_out}">${h.token_out.split('.')[0]}</a>
        </div>
    `).join('');
    card.innerHTML = `
        <strong>cycle ${i + 1}</strong>
        &middot; in: ${humanFor(c.start_token, c.amount_in)} ${c.start_token.split('.')[0]}
        &middot; out: <strong>${humanFor(c.start_token, c.amount_out)}</strong>
        &middot; <span style="${profitClass}">profit: ${c.profit} (${c.profit_bps >= 0 ? '+' : ''}${c.profit_bps.toFixed(2)} bps)</span>
        &middot; hops: ${c.hops.length}
        <div style="margin-top:0.5rem">${hopHtml}</div>
    `;
    return card;
}

document.getElementById('swap-quote').addEventListener('click', async () => {
    const mode = currentMode();
    const inAddr = tokenIn.value.trim();
    const outAddr = mode === 'swap' ? tokenOut.value.trim() : '';
    const middleAddr = mode === 'via' ? middleInput.value.trim() : '';
    const human = amountIn.value.trim();
    if (!inAddr || (mode === 'swap' && !outAddr) || (mode === 'via' && !middleAddr) || !human) {
        amountOutEl.textContent = 'fill all fields';
        routesEl.innerHTML = '';
        return;
    }
    const inMeta = tokenMeta.get(inAddr);
    if (!inMeta) {
        amountOutEl.textContent = 'unknown token in';
        routesEl.innerHTML = '<p>token_in not in our metadata cache yet. try a known token like <code>wrap.near</code>.</p>';
        return;
    }
    // basic sanity: must look like a non-negative decimal
    if (!/^[0-9]+(\.[0-9]+)?$/.test(human)) {
        amountOutEl.textContent = 'invalid amount';
        routesEl.innerHTML = '<p>amount must be a non-negative decimal number (e.g. 5, 0.5, 0.001).</p>';
        return;
    }
    routesEl.innerHTML = '<p>quoting…</p>';
    try {
        if (mode === 'swap') {
            // send the human value to the backend; the server is the
            // single source of truth for token decimals (price-indexer).
            const params = new URLSearchParams({
                token_in: inAddr, token_out: outAddr, amount: human,
            });
            const data = await fetch('/api/get_return?' + params).then(r => r.json());
            if (!data.routes || data.routes.length === 0) {
                amountOutEl.textContent = 'no route';
                const dec = inMeta.decimals;
                routesEl.innerHTML = `
                    <p>no viable route found in local state. likely reasons:</p>
                    <ul style="text-align:left">
                        <li>no SIMPLE_POOL connects ${inAddr} and ${outAddr}.</li>
                        <li>the amount is too small to produce a non-zero output (constant-product math rounds to 0). try at least 1 ${inAddr.split('.')[0]} (= 10<sup>${dec}</sup> raw).</li>
                    </ul>
                `;
                return;
            }
            const best = data.routes[0];
            amountOutEl.textContent = `${humanFor(best.token_out, best.amount_out)} (${best.source})`;
            routesEl.innerHTML = '';
            for (let i = 0; i < data.routes.length; i++) {
                routesEl.appendChild(renderRouteCard(i, data.routes[i]));
            }
        } else {
            // round-trip (with or without a fixed middle)
            const params = new URLSearchParams({
                token: inAddr, amount: human, max_hops: '3',
            });
            if (middleAddr) params.set('middle', middleAddr);
            const cycles = await fetch('/api/arb?' + params).then(r => r.json());
            if (!cycles || cycles.length === 0) {
                amountOutEl.textContent = 'no cycle';
                const dec = inMeta.decimals;
                routesEl.innerHTML = `
                    <p>no cycle found in local state. likely reasons:</p>
                    <ul style="text-align:left">
                        <li>the amount is too small to produce a non-zero output in any pool (constant-product math rounds to 0). try at least 1 ${inAddr.split('.')[0]} (= 10<sup>${dec}</sup> raw).</li>
                        <li>no ${MAX_HOPS_DISPLAY}-hop path connects ${inAddr} back to itself through SIMPLE_POOLs with valid reserves.</li>
                    </ul>
                `;
                return;
            }
            const best = cycles[0];
            const sign = best.profit_bps >= 0 ? '+' : '';
            amountOutEl.textContent = `${humanFor(best.start_token, best.amount_out)} ${inAddr.split('.')[0]} (profit ${sign}${best.profit_bps.toFixed(2)} bps)`;
            routesEl.innerHTML = '';
            for (let i = 0; i < cycles.length; i++) {
                routesEl.appendChild(renderArbCard(i, cycles[i]));
            }
        }
    } catch (e) {
        amountOutEl.textContent = 'error: ' + e.message;
        routesEl.innerHTML = '';
    }
});
// =====================
// copyright 2026 by sleet.near