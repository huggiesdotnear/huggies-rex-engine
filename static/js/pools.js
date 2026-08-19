// =====================
// pools.js
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

const body = document.getElementById('pools-body');
const search = document.getElementById('pools-search');
const tokenMeta = new Map();

(async function () {
    const [pools, tokens] = await Promise.all([
        fetch('/api/pools').then(r => r.json()),
        fetch('/api/tokens').then(r => r.json()).catch(() => []),
    ]);
    for (const t of tokens) tokenMeta.set(t.account_id, t);
    const render = (filter) => {
        body.innerHTML = '';
        const f = filter.trim().toLowerCase();
        const filtered = f
            ? pools.filter(p =>
                  String(p.pool_id).includes(f) ||
                  p.token_account_ids.some(t => t.toLowerCase().includes(f)))
            : pools;
        for (const p of filtered.slice(0, 500)) {
            const tr = document.createElement('tr');
            const tokensHtml = p.token_account_ids
                .map(t => `<a href="/token/${t}">${shortAccount(t)}</a>`)
                .join(' / ');
            tr.innerHTML = `
                <td><a href="/pool/${p.pool_id}">${p.pool_id}</a></td>
                <td>${p.pool_kind}</td>
                <td>${tokensHtml}</td>
                <td>${p.total_fee}</td>`;
            body.appendChild(tr);
        }
        document.getElementById('pools-shown').textContent = `${filtered.length} pools`;
    };
    render('');
    search.addEventListener('input', () => render(search.value));
})();
// =====================
// copyright 2026 by sleet.near