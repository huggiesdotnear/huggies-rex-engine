// =====================
// pools.js
// =====================
const body = document.getElementById('pools-body');
const search = document.getElementById('pools-search');

fetch('/api/pools').then(r => r.json()).then(all => {
    const render = (filter) => {
        body.innerHTML = '';
        const f = filter.trim().toLowerCase();
        const filtered = f
            ? all.filter(p =>
                  p.pool_id.toString().includes(f) ||
                  p.token_account_ids.some(t => t.toLowerCase().includes(f)))
            : all;
        for (const p of filtered) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><a href="/pool/${p.pool_id}">${p.pool_id}</a></td>
                <td>${p.pool_kind}</td>
                <td>${p.token_account_ids.map(t => `<a href="/token/${t}">${t}</a>`).join(' / ')}</td>
                <td>${p.total_fee}</td>`;
            body.appendChild(tr);
        }
    };
    render('');
    search.addEventListener('input', () => render(search.value));
});
// =====================
// copyright 2026 by sleet.near