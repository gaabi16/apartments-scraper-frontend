const BACKEND_URL = 'https://nonpractically-unlamed-kesha.ngrok-free.dev';

// varianta locala:
// const BACKEND_URL = 'http://127.0.0.1:5000';

// Headers pentru ngrok
const fetchOptions = {
    headers: {
        'ngrok-skip-browser-warning': 'true',
        'User-Agent': 'MyApp'
    }
};

// --- Funcții Noi pentru LocalStorage ---

function saveFilters() {
    localStorage.setItem('rooms', document.getElementById('rooms').value);
    localStorage.setItem('sector', document.getElementById('sector').value);
    localStorage.setItem('min_price', document.getElementById('min_price').value);
    localStorage.setItem('max_price', document.getElementById('max_price').value);
    console.log('Filtre salvate în LocalStorage');
}

function loadFilters() {
    const savedRooms = localStorage.getItem('rooms');
    const savedSector = localStorage.getItem('sector');
    const savedMinPrice = localStorage.getItem('min_price');
    const savedMaxPrice = localStorage.getItem('max_price');

    if (savedRooms) document.getElementById('rooms').value = savedRooms;
    if (savedSector) document.getElementById('sector').value = savedSector;
    if (savedMinPrice) document.getElementById('min_price').value = savedMinPrice;
    if (savedMaxPrice) document.getElementById('max_price').value = savedMaxPrice;
}

// --- Sfârșit Funcții Noi ---

function startScraping(site) {
    console.log(`Starting scraping for ${site}...`);
    
    // --- VALIDARE INPUT-URI (NOU) ---
    const minPriceVal = document.getElementById('min_price').value;
    const maxPriceVal = document.getElementById('max_price').value;

    // Convertim la numere pentru comparație
    const min = parseFloat(minPriceVal);
    const max = parseFloat(maxPriceVal);

    if (minPriceVal && maxPriceVal && min > max) {
        alert(`Eroare: Prețul minim (${min}€) nu poate fi mai mare decât prețul maxim (${max}€)!`);
        return; // Oprim execuția funcției aici
    }
    // --- SFÂRȘIT VALIDARE ---

    // Salvăm filtrele curent selectate (doar dacă validarea a trecut)
    saveFilters();
    
    // Colectare date din filtre
    const rooms = document.getElementById('rooms').value;
    const sector = document.getElementById('sector').value;
    // Folosim valorile deja extrase mai sus
    const minPrice = minPriceVal;
    const maxPrice = maxPriceVal;

    console.log(`Applying filters: Rooms=${rooms}, Sector=${sector}, Price=${minPrice}-${maxPrice}`);

    const statusText = document.getElementById(`status_${site}`);
    const statusBadge = document.getElementById(`badge_${site}`);
    const statusIcon = document.getElementById(`icon_${site}`);
    const progressBar = document.getElementById(`progress_${site}`);
    const scrapeBtn = document.getElementById(`btn_scrape_${site}`);
    const downloadBtn = document.getElementById(`btn_download_${site}`);
    
    statusText.innerText = "Se conectează la site...";
    statusBadge.innerText = "În lucru";
    statusBadge.classList.add("running");
    statusBadge.classList.remove("finished");
    statusIcon.classList.add("spinning");
    statusIcon.classList.remove("success");
    progressBar.classList.add("active");
    
    scrapeBtn.disabled = true;
    downloadBtn.disabled = true;
    
    // Construire URL cu parametrii de filtrare
    const url = new URL(`${BACKEND_URL}/scrape/${site}`);
    url.searchParams.append('rooms', rooms);
    url.searchParams.append('sector', sector);
    url.searchParams.append('price_min', minPrice);
    url.searchParams.append('price_max', maxPrice);

    fetch(url, fetchOptions)
        .then(response => {
            console.log('Response:', response);
            if (!response.ok) {
                // Dacă backend-ul returnează eroare (de ex. validare preț eșuată)
                return response.json().then(err => { throw new Error(err.error || 'Eroare server'); });
            }
            return response.json();
        })
        .then(data => {
            console.log('Data:', data);
            if (data.started) {
                statusText.innerText = "Scraping în desfășurare...";
                checkStatus(site);
            } else {
                statusText.innerText = "Scraping-ul este deja activ";
                setTimeout(() => checkStatus(site), 1000);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            statusText.innerText = "Eroare: " + error.message;
            resetUI(site);
        });
}

function checkStatus(site) {
    const statusText = document.getElementById(`status_${site}`);
    const statusBadge = document.getElementById(`badge_${site}`);
    const statusIcon = document.getElementById(`icon_${site}`);
    const progressBar = document.getElementById(`progress_${site}`);
    const scrapeBtn = document.getElementById(`btn_scrape_${site}`);
    const downloadBtn = document.getElementById(`btn_download_${site}`);
    
    fetch(`${BACKEND_URL}/status/${site}`, fetchOptions)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                statusText.innerText = "Eroare: " + data.error;
                resetUI(site);
                return;
            }
            
            if (data.finished) {
                statusText.innerText = "✓ Scraping terminat cu succes!";
                statusBadge.innerText = "Terminat";
                statusBadge.classList.remove("running");
                statusBadge.classList.add("finished");
                statusIcon.classList.remove("spinning");
                statusIcon.classList.add("success");
                progressBar.classList.remove("active");
                
                scrapeBtn.disabled = false;
                downloadBtn.disabled = false;
                
                const card = statusIcon.closest('.scraper-card');
                card.style.animation = 'none';
                setTimeout(() => {
                    card.style.animation = 'fadeInUp 0.6s ease-out';
                }, 10);
                
            } else if (data.running) {
                statusText.innerText = "Se extrag datele... Vă rugăm așteptați";
                setTimeout(() => checkStatus(site), 2000);
            } else {
                resetUI(site);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            statusText.innerText = "Eroare la verificarea statusului";
            resetUI(site);
        });
}

function downloadFile(site) {
    const statusText = document.getElementById(`status_${site}`);
    // Mesaj temporar
    const originalText = "✓ Scraping terminat cu succes!";
    statusText.innerText = "Se descarcă...";
    
    window.location.href = `${BACKEND_URL}/download/${site}`;
    
    // MODIFICARE: Nu mai resetam UI-ul complet pentru a permite re-descarcarea
    setTimeout(() => {
        statusText.innerText = originalText;
    }, 2000);
}

function resetUI(site) {
    const statusText = document.getElementById(`status_${site}`);
    const statusBadge = document.getElementById(`badge_${site}`);
    const statusIcon = document.getElementById(`icon_${site}`);
    const progressBar = document.getElementById(`progress_${site}`);
    const scrapeBtn = document.getElementById(`btn_scrape_${site}`);
    
    // Doar dacă nu avem deja textul de eroare setat
    if (!statusText.innerText.startsWith("Eroare")) {
        statusText.innerText = "Apasă butonul pentru a începe";
    }
    
    statusBadge.innerText = "Gata";
    statusBadge.classList.remove("running", "finished");
    statusIcon.classList.remove("spinning", "success");
    progressBar.classList.remove("active");
    scrapeBtn.disabled = false;
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, Backend URL:', BACKEND_URL);
    
    // Încărcăm filtrele salvate la pornirea paginii
    loadFilters();
    
    ['imobiliare', 'publi24', 'romimo'].forEach(site => {
        fetch(`${BACKEND_URL}/status/${site}`, fetchOptions)
            .then(response => response.json())
            .then(data => {
                console.log(`Status for ${site}:`, data);
                
                if (data.running) {
                    const statusText = document.getElementById(`status_${site}`);
                    const statusBadge = document.getElementById(`badge_${site}`);
                    const statusIcon = document.getElementById(`icon_${site}`);
                    const progressBar = document.getElementById(`progress_${site}`);
                    
                    statusText.innerText = "Scraping în desfășurare...";
                    statusBadge.innerText = "În lucru";
                    statusBadge.classList.add("running");
                    statusIcon.classList.add("spinning");
                    progressBar.classList.add("active");
                    
                    checkStatus(site);
                } else if (data.finished && data.file) {
                    const statusText = document.getElementById(`status_${site}`);
                    const statusBadge = document.getElementById(`badge_${site}`);
                    const statusIcon = document.getElementById(`icon_${site}`);
                    const downloadBtn = document.getElementById(`btn_download_${site}`);
                    
                    statusText.innerText = "✓ Scraping terminat cu succes!";
                    statusBadge.innerText = "Terminat";
                    statusBadge.classList.add("finished");
                    statusIcon.classList.add("success");
                    downloadBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Error checking initial status:', error);
            });
    });
});