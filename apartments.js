// Date de test simulate direct din baza de date
const mockApartments = [
    { source_website: "Imobiliare.ro", title: "Apartament 2 camere luminos", price: 72000, location: "Bucuresti, Sector 1", surface: 54, floor: "2", contact_name: "Agentia X", phone_number: "0722123456", link: "#" },
    { source_website: "Publi24", title: "Proprietar vand apartament 2 camere", price: 68500, location: "Bucuresti, Sector 1, Pajura", surface: 50, floor: "3", contact_name: "Ion Popescu", phone_number: "0744987654", link: "#" },
    { source_website: "Romimo", title: "2 Camere zona Victoriei", price: 79000, location: "Sector 1", surface: 58, floor: "1", contact_name: "Livit Concept Srl", phone_number: "0733111222", link: "#" },
    { source_website: "Imobiliare.ro", title: "Apt decomandat langa metrou", price: 75000, location: "Bucuresti, Sector 1, Grivita", surface: 52, floor: "4", contact_name: "Imob Invest", phone_number: "0721000000", link: "#" },
    { source_website: "Publi24", title: "Vanzare 2 camere Baneasa", price: 81000, location: "Sector 1, Baneasa", surface: 60, floor: "Parter", contact_name: "Maria Ionescu", phone_number: "0755444333", link: "#" },
    { source_website: "Romimo", title: "Ocazie! Apartament renovat", price: 64000, location: "Bucuresti, Sector 1", surface: 48, floor: "5", contact_name: "Proprietar", phone_number: "0766999888", link: "#" },
    { source_website: "Imobiliare.ro", title: "2 camere Bucurestii Noi", price: 70000, location: "Sector 1, Bucurestii Noi", surface: 51, floor: "2", contact_name: "Agentia Y", phone_number: "0722111333", link: "#" },
    { source_website: "Publi24", title: "Apartament 2 cam decomandat", price: 73500, location: "Bucuresti, Sector 1", surface: 55, floor: "3", contact_name: "Elena Popa", phone_number: "0741222333", link: "#" },
    { source_website: "Romimo", title: "Vand apartament Gara de Nord", price: 67000, location: "Sector 1", surface: 49, floor: "6", contact_name: "Agent Imob", phone_number: "0788777666", link: "#" },
    { source_website: "Imobiliare.ro", title: "Investitie Airbnb - 2 camere", price: 80000, location: "Sector 1, Cismigiu", surface: 56, floor: "1", contact_name: "City Homes", phone_number: "0723456789", link: "#" }
];

// Funcție pentru alocarea clasei corecte de culoare în funcție de sursă
function getSourceClass(source) {
    if (source.toLowerCase().includes('imobiliare')) return 'bg-imobiliare';
    if (source.toLowerCase().includes('publi24')) return 'bg-publi24';
    if (source.toLowerCase().includes('romimo')) return 'bg-romimo';
    return 'bg-imobiliare'; // default
}

// Funcție pentru formatarea prețului (ex: 75000 -> 75.000)
function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Renderizare tabel
function renderTable(data) {
    const tbody = document.getElementById('apartments-tbody');
    tbody.innerHTML = ''; // Curăță tabelul existent

    data.forEach(apt => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><span class="source-badge ${getSourceClass(apt.source_website)}">${apt.source_website}</span></td>
            <td><strong>${apt.title}</strong></td>
            <td class="price-col">${formatPrice(apt.price)}</td>
            <td>${apt.location}</td>
            <td>${apt.surface} mp</td>
            <td>${apt.floor || '-'}</td>
            <td class="contact-col">
                <div>${apt.contact_name || 'N/A'}</div>
                <div>📞 ${apt.phone_number || 'N/A'}</div>
            </td>
            <td><a href="${apt.link}" target="_blank" class="link-btn">Vezi Anunț</a></td>
        `;
        
        tbody.appendChild(tr);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // deocamdata incarc datele static
    renderTable(mockApartments);

    // cand o sa am un endpoint in Flask (de ex: /api/apartments) trb sa inlocuiesc
    // apelul de mai sus cu un fetch real catre baza de date

});