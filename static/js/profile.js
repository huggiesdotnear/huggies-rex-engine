// =====================
// profile.js
// =====================
const watchlistBody = document.getElementById('watchlist-body');
const followsBody = document.getElementById('follows-body');

async function refreshWatchlist() {
    const data = await fetch('/api/watchlist').then(r => r.json());
    watchlistBody.innerHTML = '';
    for (const e of data.entries) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="/token/${encodeURIComponent(e.token_account_id)}">${e.token_account_id}</a></td>
            <td>${e.note ?? ''}</td>
            <td><button class="huggies_rex_button" data-id="${e.token_account_id}">REMOVE</button></td>`;
        watchlistBody.appendChild(tr);
    }
    watchlistBody.querySelectorAll('button[data-id]').forEach(b => {
        b.addEventListener('click', async () => {
            await fetch(`/api/watchlist?token_account_id=${encodeURIComponent(b.dataset.id)}`, { method: 'DELETE' });
            refreshWatchlist();
        });
    });
}

async function refreshFollows() {
    const data = await fetch('/api/follows').then(r => r.json());
    followsBody.innerHTML = '';
    for (const e of data.entries) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><a href="/trader/${encodeURIComponent(e.account_id)}">${e.account_id}</a></td>
            <td>${e.note ?? ''}</td>
            <td><button class="huggies_rex_button huggies_rex_button_secondary" data-id="${e.account_id}">UNFOLLOW</button></td>`;
        followsBody.appendChild(tr);
    }
    followsBody.querySelectorAll('button[data-id]').forEach(b => {
        b.addEventListener('click', async () => {
            await fetch(`/api/follows?account_id=${encodeURIComponent(b.dataset.id)}`, { method: 'DELETE' });
            refreshFollows();
        });
    });
}

document.getElementById('watchlist-add').addEventListener('click', async () => {
    const token = document.getElementById('watchlist-input').value.trim();
    if (!token) return;
    await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_account_id: token }),
    });
    document.getElementById('watchlist-input').value = '';
    refreshWatchlist();
});

document.getElementById('follows-add').addEventListener('click', async () => {
    const acc = document.getElementById('follows-input').value.trim();
    if (!acc) return;
    await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: acc }),
    });
    document.getElementById('follows-input').value = '';
    refreshFollows();
});

refreshWatchlist();
refreshFollows();
// =====================
// copyright 2026 by sleet.near