// feed.js — pagina "Apartamente Noi Azi"
// Depinde de config.js (BACKEND_URL, fetchOptions, buildApiUrl, formatPrice, formatDate)

function srcHeaderClass(src) {
    const s = (src || '').toLowerCase();
    if (s.includes('publi24')) return 'src-publi24';
    if (s.includes('romimo'))  return 'src-romimo';
    return 'src-imobiliare';
}

function buildCard(apt) {
    const phone = apt.phone_number || '';
    const contactName = apt.contact_name || '';

    return `
    <div class="apt-card">
        <div class="apt-card-header ${srcHeaderClass(apt.source_website)}">
            <span class="apt-card-src">${apt.source_website || '?'}</span>
            <span class="badge-nou">NOU</span>
        </div>
        <div class="apt-card-body">
            <div class="apt-title">${apt.title || 'Fără titlu'}</div>
            <div class="apt-price">${formatPrice(apt.price)} <span>€</span></div>
            <div class="apt-meta">
                ${apt.rooms    ? `<span class="apt-chip">🛏 ${apt.rooms} cam.</span>` : ''}
                ${apt.surface  ? `<span class="apt-chip">📐 ${apt.surface} m²</span>` : ''}
                ${apt.floor    ? `<span class="apt-chip">🏢 Etaj ${apt.floor}</span>` : ''}
            </div>
            <div class="apt-location">📍 ${apt.location || '—'}</div>

            <div class="apt-contact">
                <div class="apt-contact-info">
                    ${contactName ? `<span class="apt-contact-name">${contactName}</span>` : ''}
                    <span class="apt-phone">${phone || 'Tel. indisponibil'}</span>
                </div>
                ${phone ? `<button class="apt-copy-btn" onclick="copyPhone(this, '${phone.replace(/'/g, "\\'")}')">Copiază</button>` : ''}
            </div>
        </div>
        <div class="apt-card-footer">
            <span class="apt-date">${formatDate(apt.scraped_at)}</span>
            <a href="${apt.link || '#'}" target="_blank" rel="noopener" class="apt-link">
                Vezi anunț ↗
            </a>
        </div>
    </div>`;
}

function copyPhone(btn, phone) {
    navigator.clipboard.writeText(phone).then(() => {
        btn.textContent = 'Copiat!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copiază'; btn.classList.remove('copied'); }, 2000);
    }).catch(() => {
        // fallback pentru browsere fără clipboard API
        const ta = document.createElement('textarea');
        ta.value = phone;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btn.textContent = 'Copiat!';
        setTimeout(() => { btn.textContent = 'Copiază'; }, 2000);
    });
}

function loadFeed() {
    const filters = getFilterParamsFromForm();
    const url = buildApiUrl('/api/apartments/new', {
        rooms:     filters.rooms     || undefined,
        sector:    filters.sector    || undefined,
        price_min: filters.price_min || undefined,
        price_max: filters.price_max || undefined,
    });

    document.getElementById('feed-loading').style.display = 'block';
    document.getElementById('feed-empty').style.display   = 'none';
    document.getElementById('feed-grid').style.display    = 'none';

    fetch(url, fetchOptions)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(data => {
            document.getElementById('feed-loading').style.display = 'none';
            const apts = data.apartments || [];

            document.getElementById('feed-subtitle').textContent =
                apts.length
                    ? `${apts.length} anunț${apts.length !== 1 ? 'uri' : ''} nou${apts.length !== 1 ? '' : ''} față de ieri`
                    : 'Anunțuri apărute azi, inexistente ieri';

            if (apts.length === 0) {
                document.getElementById('feed-empty').style.display = 'block';
                return;
            }

            const grid = document.getElementById('feed-grid');
            grid.innerHTML = apts.map(buildCard).join('');
            grid.style.display = 'grid';
        })
        .catch(err => {
            document.getElementById('feed-loading').style.display = 'none';
            document.getElementById('feed-empty').style.display   = 'block';
            document.getElementById('feed-empty').innerHTML =
                `<p>Eroare la conectarea cu server-ul.<br><small>${err.message}</small></p>
                 <p style="margin-top:12px; font-size:0.9rem; opacity:0.8;">Asigură-te că backend-ul Flask rulează.</p>`;
        });
}

function applyFilters() {
    loadFeed();
}

document.addEventListener('DOMContentLoaded', () => {
    // Preia filtrele salvate din DB și populează form-ul, apoi încarcă feed-ul
    fetch(buildApiUrl('/api/filters'), fetchOptions)
        .then(r => r.json())
        .then(f => { applyFiltersToForm(f); loadFeed(); })
        .catch(() => loadFeed());
});
