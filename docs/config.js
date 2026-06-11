// Schimbă la URL-ul ngrok când rulezi cu tunel public
const BACKEND_URL = 'http://127.0.0.1:5000';

const fetchOptions = {
    headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'MyApp'
    }
};

function buildApiUrl(path, params = {}) {
    const url = new URL(`${BACKEND_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, value);
        }
    });
    return url.toString();
}

/** Citește filtrele din form-ul de pe pagina curentă. */
function getFilterParamsFromForm() {
    return {
        rooms:     document.getElementById('rooms')?.value     || '',
        sector:    document.getElementById('sector')?.value    || '',
        price_min: document.getElementById('min_price')?.value || '',
        price_max: document.getElementById('max_price')?.value || '',
    };
}

/** Populează form-ul cu un obiect de filtre. */
function applyFiltersToForm(f) {
    if (!f) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val != null) el.value = val; };
    set('rooms',     f.rooms);
    set('sector',    f.sector);
    set('min_price', f.price_min);
    set('max_price', f.price_max);
}

/** Salvează filtrele în DB (fără await — fire-and-forget). */
async function saveFiltersToDB(filters) {
    try {
        await fetch(buildApiUrl('/api/filters'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...fetchOptions.headers },
            body: JSON.stringify({
                rooms:     parseInt(filters.rooms)     || 2,
                sector:    parseInt(filters.sector)    || 0,
                price_min: parseInt(filters.price_min) || 0,
                price_max: parseInt(filters.price_max) || 999999,
            }),
        });
    } catch (e) {
        console.warn('Nu am putut salva filtrele în DB:', e);
    }
}

/** Formatare preț: 75000 → 75.000 */
function formatPrice(price) {
    if (price == null) return '—';
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Badge HTML colorat pentru sursă. */
function sourceBadge(src) {
    const s = (src || '').toLowerCase();
    let cls = 'bg-imobiliare';
    if (s.includes('publi24')) cls = 'bg-publi24';
    else if (s.includes('romimo')) cls = 'bg-romimo';
    return `<span class="source-badge ${cls}">${src || '?'}</span>`;
}

/** Formatare dată din ISO string. */
function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
        + ' ' + d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
}
