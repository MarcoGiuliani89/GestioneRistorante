const rows = document.querySelectorAll('tr[data-tavoloid]');
rows.forEach(row => {
    // Recupero gli id dei tavoli
    const tavoloId = row.getAttribute('data-tavoloid');

    // CHIAMO API
    API_scarica_dati_tavolo(tavoloId, row)
});



function API_scarica_dati_tavolo(tavolo_id, row) {
    ajax(`/tavoli/api/dati-tavolo-servizio/${tavolo_id}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        success: (response) => {
            popola_tabella(response.value, row)
        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)
        }
    })
}

function popola_tabella(dati, row) {

    //console.log(dati)
    row.children[1].innerHTML = dati.utilizzabile ? "Si" : "No";
}