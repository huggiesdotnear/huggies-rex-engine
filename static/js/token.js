// =====================
// token.js
// =====================
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

const tokenMeta = new Map();
const poolBody = document.getElementById('token-pools-body');

async function loadTokensMeta() {
    try {
        const tokens = await fetch('/api/tokens').then(r => r.json());
        for (const t of tokens) tokenMeta.set(t.account_id, t);
    } catch (e) {
        console.warn('tokens meta fetch failed', e);
    }
}

function shortAccount(acc) {
    if (!acc) return '';
    if (acc.length <= 18) return acc;
    return acc.slice(0, 9) + '…' + acc.slice(-6);
}

(async function () {
    await loadTokensMeta();
    fetch(`/api/token/${encodeURIComponent(TOKEN_ID)}`)
        .then(r => r.json())
        .then(t => {
            document.getElementById('token-symbol').textContent = t.symbol;
            document.getElementById('token-account').textContent = t.account_id;
            document.getElementById('token-decimals').textContent = t.decimals;
            document.getElementById('token-price').textContent = t.price_usd != null ? `$${Number(t.price_usd).toFixed(6)}` : '—';
        })
        .catch(e => {
            document.getElementById('token-symbol').textContent = 'error: ' + e.message;
        });

    fetch(`/api/token/${encodeURIComponent(TOKEN_ID)}/pools`)
        .then(r => r.json())
        .then(pools => {
            document.getElementById('token-pools-count').textContent = pools.length;
            for (const p of pools) {
                const otherTokens = p.token_account_ids.filter(t => t !== TOKEN_ID);
                const amountsHtml = p.token_account_ids.map((tid, i) => {
                    const meta = tokenMeta.get(tid);
                    const dec = meta ? meta.decimals : 0;
                    return `<div>${shortAccount(tid)}: <strong>${fmtAmount(p.amounts[i], dec)}</strong></div>`;
                }).join('');
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><a href="/pool/${p.pool_id}">${p.pool_id}</a></td>
                    <td>${p.pool_kind}</td>
                    <td>${otherTokens.map(t => `<a href="/token/${t}">${shortAccount(t)}</a>`).join(', ')}</td>
                    <td>${p.total_fee}</td>
                    <td>${amountsHtml}</td>`;
                poolBody.appendChild(tr);
            }
        })
        .catch(e => {
            document.getElementById('token-pools-count').textContent = 'error';
            console.error(e);
        });
})();
// =====================
// copyright 2026 by sleet.near