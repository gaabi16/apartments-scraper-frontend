// script.js — pagina principală (scraping manual)
// BACKEND_URL, fetchOptions, buildApiUrl, saveFiltersToDB definite în config.js

function saveFilters() {
    localStorage.setItem('rooms',     document.getElementById('rooms').value);
    localStorage.setItem('sector',    document.getElementById('sector').value);
    localStorage.setItem('min_price', document.getElementById('min_price').value);
    localStorage.setItem('max_price', document.getElementById('max_price').value);
}

function loadFilters() {
    const set = (id, key) => { const v = localStorage.getItem(key); if (v) document.getElementById(id).value = v; };
    set('rooms',     'rooms');
    set('sector',    'sector');
    set('min_price', 'min_price');
    set('max_price', 'max_price');
}

function startScraping(site) {
    const minPriceVal = document.getElementById('min_price').value;
    const maxPriceVal = document.getElementById('max_price').value;
    const min = parseFloat(minPriceVal);
    const max = parseFloat(maxPriceVal);

    if (minPriceVal && maxPriceVal && min > max) {
        alert(`Eroare: Prețul minim (${min}€) nu poate fi mai mare decât prețul maxim (${max}€)!`);
        return;
    }

    saveFilters();
    const filters = getFilterParamsFromForm();
    // Salvare asincronă în DB — scheduler-ul va folosi aceste filtre la 07:00
    saveFiltersToDB(filters);

    const rooms   = filters.rooms;
    const sector  = filters.sector;
    const minPrice = filters.price_min;
    const maxPrice = filters.price_max;

    const statusText  = document.getElementById(`status_${site}`);
    const statusBadge = document.getElementById(`badge_${site}`);
    const statusIcon  = document.getElementById(`icon_${site}`);
    const progressBar = document.getElementById(`progress_${site}`);
    const scrapeBtn   = document.getElementById(`btn_scrape_${site}`);
    const downloadBtn = document.getElementById(`btn_download_${site}`);

    statusText.innerText = 'Se conectează la site...';
    statusBadge.innerText = 'În lucru';
    statusBadge.classList.add('running');
    statusBadge.classList.remove('finished');
    statusIcon.classList.add('spinning');
    statusIcon.classList.remove('success');
    progressBar.classList.add('active');
    scrapeBtn.disabled = true;
    downloadBtn.disabled = true;

    const url = new URL(`${BACKEND_URL}/scrape/${site}`);
    url.searchParams.append('rooms',     rooms);
    url.searchParams.append('sector',    sector);
    url.searchParams.append('price_min', minPrice);
    url.searchParams.append('price_max', maxPrice);

    fetch(url, fetchOptions)
        .then(r => {
            if (!r.ok) return r.json().then(e => { throw new Error(e.error || 'Eroare server'); });
            return r.json();
        })
        .then(data => {
            if (data.started) {
                statusText.innerText = 'Scraping în desfășurare...';
                checkStatus(site);
            } else {
                statusText.innerText = 'Scraping-ul este deja activ';
                setTimeout(() => checkStatus(site), 1000);
            }
        })
        .catch(err => {
            statusText.innerText = 'Eroare: ' + err.message;
            resetUI(site);
        });
}

function checkStatus(site) {
    const statusText  = document.getElementById(`status_${site}`);
    const statusBadge = document.getElementById(`badge_${site}`);
    const statusIcon  = document.getElementById(`icon_${site}`);
    const progressBar = document.getElementById(`progress_${site}`);
    const scrapeBtn   = document.getElementById(`btn_scrape_${site}`);
    const downloadBtn = document.getElementById(`btn_download_${site}`);

    fetch(`${BACKEND_URL}/status/${site}`, fetchOptions)
        .then(r => r.json())
        .then(data => {
            if (data.error) { statusText.innerText = 'Eroare: ' + data.error; resetUI(site); return; }

            if (data.finished) {
                statusText.innerText = '✓ Scraping terminat cu succes!';
                statusBadge.innerText = 'Terminat';
                statusBadge.classList.remove('running');
                statusBadge.classList.add('finished');
                statusIcon.classList.remove('spinning');
                statusIcon.classList.add('success');
                progressBar.classList.remove('active');
                scrapeBtn.disabled = false;
                downloadBtn.disabled = false;
            } else if (data.running) {
                statusText.innerText = 'Se extrag datele... Vă rugăm așteptați';
                setTimeout(() => checkStatus(site), 2000);
            } else {
                resetUI(site);
            }
        })
        .catch(() => { statusText.innerText = 'Eroare la verificarea statusului'; resetUI(site); });
}

function downloadFile(site) {
    const statusText = document.getElementById(`status_${site}`);
    statusText.innerText = 'Se descarcă...';
    window.location.href = `${BACKEND_URL}/download/${site}`;
    setTimeout(() => { statusText.innerText = '✓ Scraping terminat cu succes!'; }, 2000);
}

function resetUI(site) {
    const statusText  = document.getElementById(`status_${site}`);
    const statusBadge = document.getElementById(`badge_${site}`);
    const statusIcon  = document.getElementById(`icon_${site}`);
    const progressBar = document.getElementById(`progress_${site}`);
    const scrapeBtn   = document.getElementById(`btn_scrape_${site}`);

    if (!statusText.innerText.startsWith('Eroare')) statusText.innerText = 'Apasă butonul pentru a începe';
    statusBadge.innerText = 'Gata';
    statusBadge.classList.remove('running', 'finished');
    statusIcon.classList.remove('spinning', 'success');
    progressBar.classList.remove('active');
    scrapeBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
    loadFilters();

    // La prima încărcare, citește filtrele salvate în DB și populează form-ul
    fetch(buildApiUrl('/api/filters'), fetchOptions)
        .then(r => r.json())
        .then(f => applyFiltersToForm(f))
        .catch(() => {/* fallback pe localStorage deja aplicat */});

    ['imobiliare', 'publi24', 'romimo'].forEach(site => {
        fetch(`${BACKEND_URL}/status/${site}`, fetchOptions)
            .then(r => r.json())
            .then(data => {
                if (data.running) {
                    document.getElementById(`status_${site}`).innerText  = 'Scraping în desfășurare...';
                    document.getElementById(`badge_${site}`).innerText   = 'În lucru';
                    document.getElementById(`badge_${site}`).classList.add('running');
                    document.getElementById(`icon_${site}`).classList.add('spinning');
                    document.getElementById(`progress_${site}`).classList.add('active');
                    checkStatus(site);
                } else if (data.finished && data.file) {
                    document.getElementById(`status_${site}`).innerText  = '✓ Scraping terminat cu succes!';
                    document.getElementById(`badge_${site}`).innerText   = 'Terminat';
                    document.getElementById(`badge_${site}`).classList.add('finished');
                    document.getElementById(`icon_${site}`).classList.add('success');
                    document.getElementById(`btn_download_${site}`).disabled = false;
                }
            })
            .catch(() => {});
    });
});
