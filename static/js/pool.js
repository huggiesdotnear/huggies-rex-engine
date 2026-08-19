// =====================
// pool.js
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

function shortAccount(acc) {
    if (!acc) return '';
    if (acc.length <= 18) return acc;
    return acc.slice(0, 9) + '…' + acc.slice(-6);
}

(async function () {
    const tokens = await fetch('/api/tokens').then(r => r.json()).catch(() => []);
    const meta = new Map();
    for (const t of tokens) meta.set(t.account_id, t);
    fetch(`/api/pool/${POOL_ID}`)
        .then(r => r.json())
        .then(p => {
            document.getElementById('pool-kind').textContent = p.pool_kind;
            document.getElementById('pool-tokens').innerHTML =
                p.token_account_ids.map(t => `<a href="/token/${t}">${t}</a>`).join(' / ');
            document.getElementById('pool-fee').textContent = p.total_fee;
            const amountsEl = document.getElementById('pool-amounts');
            amountsEl.innerHTML = p.token_account_ids.map((tid, i) => {
                const dec = meta.get(tid)?.decimals;
                return `<div>${shortAccount(tid)}: <strong>${fmtAmount(p.amounts[i], dec)}</strong></div>`;
            }).join('');
            document.getElementById('pool-shares').innerHTML =
                `<div>${fmtAmount(p.shares_total_supply, 0)} LP total</div>`;
            document.getElementById('pool-updated').textContent = new Date(p.updated_at_unix_ms).toISOString();
        })
        .catch(e => {
            document.getElementById('pool-kind').textContent = 'error: ' + e.message;
        });
})();
// =====================
// copyright 2026 by sleet.near