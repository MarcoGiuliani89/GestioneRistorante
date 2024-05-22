const rows = document.querySelectorAll('tr[data-tavoloid]');

const info_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/></svg>`;


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
            if (tavolo_id == "1") {
                console.log(response.value)
            }
            if (tavolo_id == "29") {
                console.log(response.value)
            }
            popola_tabella(response.value, row)
            inizializza_popovers();
        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)
        }
    })
}

function popola_tabella(dati, row) {
    row.children[1].innerHTML = dati.utilizzabile ? "Si" : "No";
    row.children[2].innerHTML = badge_posti(dati.max_posti);
    row.children[3].innerHTML = scrivi_ospite(dati.ospite, dati.note_ospite);
    row.children[4].innerHTML = scrivi_camere(dati.ospite, dati.rooms);
    row.children[5].innerHTML = badge_tipologia(dati.tipologia);
    row.children[6].innerHTML = badge_trattamento(dati.trattamento);
    row.children[7].innerHTML = dati.adulti;
    row.children[8].innerHTML = dati.bambini;
    row.children[9].innerHTML = dati.infant;
    row.children[10].innerHTML = dati.note_servizio;
    row.children[11].innerHTML = dati.note_tavolo;
}

function scrivi_ospite(ospite, note_ospite) {
    if (ospite) {
        html_ospite = `<strong>${ospite}</strong>`
        if (note_ospite) {
            html_ospite += `
            <a  tabindex="0" type="button" class="btn btn-link text-primary-emphasis p-1" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="left"  data-bs-trigger="focus" data-bs-title="Note ospite: ${ospite}" data-bs-content="${note_ospite}">
	                    ${info_svg}
            </a>
            `;
        }
        return html_ospite
    } else {
        return ""
    }
}

function scrivi_camere(ospite, camere) {
    if (ospite && camere) {
        const camere_list = camere.split(",");
        console.log(camere_list);
        if (camere_list.length > 1) {
            let html_rooms = `
                <a tabindex="0" type="button" class="btn btn-link text-success-emphasis px-0" 
                   data-bs-container="body" data-bs-toggle="popover" data-bs-placement="right" 
                   data-bs-trigger="focus" data-bs-title="Camere: ${ospite}" 
                   data-bs-content="${camere}">
                    #${camere_list.length}
                </a>
            `;
            console.log(html_rooms);
            return html_rooms;
        } else {
            return camere;
        }
    } else {
        return "";
    }
}

function badge_posti(posti) {
    return posti ? `<span class="badge rounded-pill text-bg-warning">${posti}</span>` : ""
}
function badge_tipologia(tipologia) {
    html_badge = ""
    if (tipologia) {
        html_badge = `<span class="badge rounded-pill text-bg-`
        switch (tipologia) {
            case "Individuali":
                html_badge += "primary"
                break;
            case "Gruppo":
                html_badge += "secondary"
                break;
            case "Esterni":
                html_badge += "danger"
                break;
            default:
                html_badge += "warning"
                break;
        }
        html_badge += `">${tipologia}</span>`
    }
    return html_badge
}
function badge_trattamento(trattamento) {
    html_badge = ""
    if (trattamento) {
        html_badge = `<span class="badge rounded-pill text-bg-`
        switch (trattamento) {
            case "BB":
                html_badge += "warning"
                break;
            case "HB":
                html_badge += "info"
                break;
            case "FB":
                html_badge += "light"
                break;
            case "HBB":
                html_badge += "primary"
                break;
            case "FBB":
                html_badge += "danger"
                break;
            default:
                html_badge += "secondary"
                break;
        }
        html_badge += `">${trattamento}</span>`
    }
    return html_badge
}

function inizializza_popovers() {
    const popoverElements = document.querySelectorAll('[data-bs-toggle="popover"]');
    popoverElements.forEach(popoverElement => {
        new bootstrap.Popover(popoverElement);
    });
}