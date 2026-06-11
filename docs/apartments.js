// apartments.js — pagina "Toate Apartamentele"
// Depinde de config.js

let state = {
    page: 1,
    per_page: 20,
    sort_by: 'scraped_at',
    sort_dir: 'desc',
    total: 0,
};

function srcClass(src) {
    const s = (src || '').toLowerCase();
    if (s.includes('publi24')) return 'bg-publi24';
    if (s.includes('romimo'))  return 'bg-romimo';
    return 'bg-imobiliare';
}

function copyPhone(btn, phone) {
    navigator.clipboard.writeText(phone).then(() => {
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '📋'; }, 1800);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = phone;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '📋'; }, 1800);
    });
}
window.copyPhone = copyPhone;

function toggleRow(tr) {
    const next = tr.nextElementSibling;
    if (next && next.classList.contains('expand-row')) {
        next.remove();
        tr.classList.remove('expanded');
        return;
    }
    const apt = JSON.parse(tr.dataset.apt);
    const detail = document.createElement('tr');
    detail.className = 'expand-row';
    detail.innerHTML = `<td colspan="9" class="expand-cell">
        <div class="expand-content">
            <strong>Descriere:</strong>
            <p>${apt.description || 'Fără descriere.'}</p>
            <div class="expand-meta">
                <span>ID: ${apt.id}</span>
                <span>Adăugat: ${formatDate(apt.scraped_at)}</span>
                ${apt.contact_name ? `<span>Contact: ${apt.contact_name}</span>` : ''}
            </div>
        </div>
    </td>`;
    tr.insertAdjacentElement('afterend', detail);
    tr.classList.add('expanded');
}
window.toggleRow = toggleRow;

function renderTable(apartments) {
    const tbody = document.getElementById('apartments-tbody');
    tbody.innerHTML = '';

    apartments.forEach(apt => {
        const phone = apt.phone_number || '';
        const tr = document.createElement('tr');
        tr.className = 'apt-row';
        tr.dataset.apt = JSON.stringify(apt);
        tr.onclick = () => toggleRow(tr);
        tr.title = 'Click pentru detalii';

        tr.innerHTML = `
            <td><span class="source-badge ${srcClass(apt.source_website)}">${apt.source_website || '?'}</span></td>
            <td class="title-col"><strong>${apt.title || '—'}</strong></td>
            <td class="price-col">${formatPrice(apt.price)}</td>
            <td>${apt.location || '—'}</td>
            <td>${apt.surface != null ? apt.surface + ' m²' : '—'}</td>
            <td>${apt.floor || '—'}</td>
            <td class="contact-col">
                <div class="contact-name">${apt.contact_name || ''}</div>
                <div class="contact-phone">
                    <span class="phone-number">${phone || 'N/A'}</span>
                    ${phone ? `<button class="copy-phone-btn" onclick="event.stopPropagation(); copyPhone(this, '${phone.replace(/'/g,"\\'")}')">📋</button>` : ''}
                </div>
            </td>
            <td><a href="${apt.link || '#'}" target="_blank" rel="noopener" class="link-btn" onclick="event.stopPropagation()">↗</a></td>
            <td class="date-col">${formatDate(apt.scraped_at)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPagination(total, page, per_page) {
    const totalPages = Math.ceil(total / per_page);
    const el = document.getElementById('pagination');
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    let html = '';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goPage(${page - 1})">‹</button>`;

    const delta = 2;
    const range = [];
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) range.push(i);

    if (range[0] > 1) {
        html += `<button class="page-btn" onclick="goPage(1)">1</button>`;
        if (range[0] > 2) html += `<span class="page-ellipsis">…</span>`;
    }
    range.forEach(p => {
        html += `<button class="page-btn ${p === page ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    });
    if (range[range.length - 1] < totalPages) {
        if (range[range.length - 1] < totalPages - 1) html += `<span class="page-ellipsis">…</span>`;
        html += `<button class="page-btn" onclick="goPage(${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goPage(${page + 1})">›</button>`;
    html += `<span class="page-info">${total} rezultate</span>`;
    el.innerHTML = html;
}
window.goPage = function(p) { state.page = p; loadApartments(); };

function loadApartments() {
    const filters = getFilterParamsFromForm();

    const params = {
        page:     state.page,
        per_page: state.per_page,
        sort_by:  state.sort_by,
        sort_dir: state.sort_dir,
    };
    if (filters.rooms)     params.rooms     = filters.rooms;
    if (filters.sector)    params.sector    = filters.sector;
    if (filters.price_min) params.price_min = filters.price_min;
    if (filters.price_max) params.price_max = filters.price_max;

    const url = buildApiUrl('/api/apartments', params);

    document.getElementById('apts-loading').style.display  = 'flex';
    document.getElementById('apts-wrapper').style.display  = 'none';
    document.getElementById('apts-empty').style.display    = 'none';

    fetch(url, fetchOptions)
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
        .then(data => {
            document.getElementById('apts-loading').style.display = 'none';
            state.total = data.total || 0;

            document.getElementById('apts-subtitle').textContent =
                `${state.total} apartamente în baza de date`;

            if (!data.apartments || data.apartments.length === 0) {
                document.getElementById('apts-empty').style.display = 'block';
                return;
            }

            renderTable(data.apartments);
            renderPagination(state.total, state.page, state.per_page);
            document.getElementById('apts-wrapper').style.display = 'block';
        })
        .catch(err => {
            document.getElementById('apts-loading').style.display = 'none';
            document.getElementById('apts-empty').style.display   = 'block';
            document.getElementById('apts-empty').innerHTML =
                `<p>Eroare la conectarea cu server-ul.<br><small>${err.message}</small></p>
                 <p style="margin-top:8px;font-size:0.88rem;opacity:0.8;">Asigură-te că backend-ul Flask rulează.</p>`;
        });
}

function applyFilters() {
    state.page = 1;
    loadApartments();
}
window.applyFilters = applyFilters;

// Sortare pe click header
document.addEventListener('DOMContentLoaded', () => {
    // Preia filtrele din DB
    fetch(buildApiUrl('/api/filters'), fetchOptions)
        .then(r => r.json())
        .then(f => { applyFiltersToForm(f); loadApartments(); })
        .catch(() => loadApartments());

    document.querySelectorAll('th.sortable').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
            const col = th.dataset.col;
            if (state.sort_by === col) {
                state.sort_dir = state.sort_dir === 'desc' ? 'asc' : 'desc';
            } else {
                state.sort_by  = col;
                state.sort_dir = 'desc';
            }
            state.page = 1;

            // Actualizare iconiță
            document.querySelectorAll('th.sortable').forEach(h => {
                h.classList.remove('active-sort');
                const icon = h.querySelector('.sort-icon');
                if (icon) icon.textContent = '↕';
            });
            th.classList.add('active-sort');
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.textContent = state.sort_dir === 'desc' ? '↓' : '↑';

            loadApartments();
        });
    });
});
