// Costanti per le icone SVG
const info_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/></svg>`;
const check_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-success-emphasis bi bi-check-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/></svg>`;
const ban_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="text-danger-emphasis bi bi-ban" viewBox="0 0 16 16"><path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/></svg>`;
const pencil_svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16"><path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/></svg>`;
const loader = `<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Loading...</span></div>`;
const modificaNotaModal = new bootstrap.Modal(document.getElementById('modificaNota'));
const input_note = modificaNotaModal._element.querySelector('input');
const save_btn = modificaNotaModal._element.querySelector('#salva_nota');

let righe;


// Funzione per inizializzare le righe della tabella
function inizializzaRighe() {
    righe = document.querySelectorAll('tr[data-tavoloid]');
    righe.forEach(riga => {
        const tavoloId = riga.getAttribute('data-tavoloid');
        recuperaDati(tavoloId, riga);
    });
}

// Funzione per recuperare i dati per ciascun tavolo
function recuperaDati(tavoloId, riga) {
    ajax(`/tavoli/api/dati-tavolo-servizio/${tavoloId}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        success: response => {
            popolaTabella(response.value, riga);
            inizializzaPopovers();
        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    });
}

// Funzione per popolare la tabella con i dati
function popolaTabella(dati, riga) {
    riga.children[1].appendChild(creaBottoneUtilizzabile(dati.utilizzabile, dati.tavolo_id));
    riga.children[2].innerHTML = dati.max_posti;
    riga.children[3].innerHTML = formattaOspite(dati.ospite, dati.note_ospite);
    riga.children[4].innerHTML = formattaCamere(dati.ospite, dati.camere);
    riga.children[5].innerHTML = creaBadge(dati.tipologia, 'tipologia');
    riga.children[6].innerHTML = creaBadge(dati.trattamento, 'trattamento');
    riga.children[7].innerHTML = dati.adulti;
    riga.children[8].innerHTML = dati.bambini;
    riga.children[9].innerHTML = dati.infant;
    riga.children[10].innerHTML = formattaNotaPopover(dati.note_servizio, 'notaServizio', dati.presenza_id, dati.tavolo_id);
    riga.children[11].innerHTML = formattaNotaPopover(dati.note_tavolo, 'notaTavolo', dati.presenza_id, dati.tavolo_id);

    rendiRigaEditabile(riga, dati);
}

// Funzione per rendere alcune celle editabili
function rendiRigaEditabile(riga, dati) {
    const celleEditabili = [riga.children[2], riga.children[7], riga.children[8], riga.children[9]];

    celleEditabili.forEach(cella => {
        cella.contentEditable = 'true';
        cella.addEventListener('focus', () => selezionaTesto(cella));
        cella.addEventListener('input', () => cella.textContent = cella.textContent.replace(/[^0-9]/g, ''));
        cella.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                cella.blur();
            }
        });
        cella.addEventListener('blur', () => aggiornaDati(cella, dati));
    });
}

// Funzione per aggiornare i dati tramite chiamata API
async function aggiornaDati(cella, dati) {
    const newValue = cella.textContent;
    cella.innerHTML = loader;
    const urlMap = {
        2: "/tavoli/api/edit-max-posti-tavolo/",
        7: "/servizi/api/edit-adulti-presenza/",
        8: "/servizi/api/edit-bambini-presenza/",
        9: "/servizi/api/edit-infant-presenza/"
    };
    const fieldMap = {
        2: 'max_posti',
        7: 'adulti',
        8: 'bambini',
        9: 'infant'
    };

    const fieldIndex = [...cella.parentElement.children].indexOf(cella);
    const fieldName = fieldMap[fieldIndex];
    const url = urlMap[fieldIndex];

    // Verifica se c'è un presenza_id o se stiamo aggiornando max_posti
    if (dati.presenza_id || fieldIndex === 2) {
        const payload = {
            [fieldName]: newValue
        };

        if (fieldIndex !== 2) {
            payload['presenza_id'] = dati.presenza_id;
        } else {
            payload['tavolo_id'] = dati.tavolo_id;
        }

        try {
            const response = await apiPost(url, payload);
            cella.innerHTML = response[fieldName];
        } catch (error) {
            console.error(error);
        }
    } else {
        // Se non c'è un presenza_id e il campo non è per max_posti, ripristina il valore originale della cella
        if (fieldIndex !== 2) {
            cella.innerHTML = "";
        }
    }
}

// Funzione per creare un pulsante per alternare l'utilizzabilità di un tavolo
function creaBottoneUtilizzabile(valore, tavoloId) {
    const div = document.createElement('div');
    div.setAttribute('role', 'button');
    div.classList.add('toggle_utilizzabile');
    div.setAttribute('data-tavoloid', tavoloId);
    div.innerHTML = valore ? check_svg : ban_svg;
    div.addEventListener('click', () => alternaUtilizzabile(tavoloId, div));
    return div;
}

// Funzione per formattare le informazioni dell'ospite
function formattaOspite(ospite, notaOspite) {
    if (ospite) {
        let ospiteHtml = `<strong>${ospite}</strong>`;
        if (notaOspite) {
            ospiteHtml += `
            <a tabindex="0" type="button" class="btn btn-link text-primary-emphasis p-1" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="left" data-bs-trigger="focus" data-bs-title="Note ospite: ${ospite}" data-bs-content="${notaOspite}">
                ${info_svg}
            </a>`;
        }
        return ospiteHtml;
    } else {
        return "";
    }
}

// Funzione per formattare le informazioni delle camere
function formattaCamere(ospite, camere) {
    if (ospite && camere) {
        const listaCamere = camere.split(",");
        if (listaCamere.length > 1) {
            return `
                <a tabindex="0" type="button" class="btn btn-link text-success-emphasis px-0" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="right" data-bs-trigger="focus" data-bs-title="Camere: ${ospite}" data-bs-content="${camere}">
                    #${listaCamere[0]},...
                </a>`;
        } else {
            return `#${listaCamere[0]}`;
        }
    } else {
        return "";
    }
}

// Funzione per creare un badge colorato
function creaBadge(valore, tipo) {
    const badgeTypes = {
        tipologia: {
            Individuali: "primary",
            Gruppo: "secondary",
            Esterni: "danger",
            default: "warning"
        },
        trattamento: {
            HB: "warning",
            FB: "danger",
            BB: "info",
            HBB: "primary",
            FBB: "danger",
            default: "secondary"
        }
    };

    if (!valore || !tipo || !badgeTypes[tipo][valore]) {
        return ""; // Non creare il badge se il valore o il tipo sono nulli, o se non c'è corrispondenza nei badgeTypes
    }

    const badgeClass = badgeTypes[tipo][valore];
    return `<span class="badge rounded-pill text-bg-${badgeClass}">${valore}</span>`;
}

// Funzione per formattare le note nei popover
function formattaNotaPopover(nota, tipoNota, presenzaId, tavoloId) {
    let notaButton = `<button type="button" class="edit_nota btn btn-link text-primary-emphasis px-0" data-bs-toggle="modal" data-bs-target="#modificaNota" data-tipo="${tipoNota}" data-presenzaid="${presenzaId}" data-tavoloid="${tavoloId}" data-nota="${nota}">${pencil_svg}</button>`;
    let notaPopover = '';

    if (nota) {
        notaPopover = `
                <a tabindex="0" type="button" class="btn btn-link text-success-emphasis px-0" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="right" data-bs-trigger="focus" data-bs-title="Note:" data-bs-content="${nota}">
                    ${riduciTesto(nota)}
                </a>`;
    }

    if (tipoNota === "notaServizio") {
        if (nota !== "" && presenzaId) {
            return notaButton + notaPopover
        } else return ""
    } else {
        return notaButton + notaPopover
    }
}

function riduciTesto(testo) {
    if (testo && testo.length > 12) {
        return testo.substring(0, 10) + '...';
    } else {
        return testo
    }
}

// Funzione per inizializzare i popover
function inizializzaPopovers() {
    const elementiPopover = document.querySelectorAll('[data-bs-toggle="popover"]');
    elementiPopover.forEach(elementoPopover => {
        new bootstrap.Popover(elementoPopover);
    });
}

modificaNotaModal._element.addEventListener('shown.bs.modal', handleModalShown);
modificaNotaModal._element.addEventListener('hide.bs.modal', handleModalHide);
save_btn.addEventListener('click', handleSaveButtonClick);

let currentModalButton = null;

function handleModalShown(event) {
    currentModalButton = event.relatedTarget;
    const nota = currentModalButton.getAttribute('data-nota');
    input_note.value = nota !== "null" ? nota : '';
    input_note.focus();
    input_note.select();
}

function handleModalHide(event) {
    currentModalButton = null;
}

function handleSaveButtonClick() {
    if (!currentModalButton) return;

    const tipo = currentModalButton.getAttribute('data-tipo');
    const presenzaId = currentModalButton.getAttribute('data-presenzaid');
    const tavoloId = currentModalButton.getAttribute('data-tavoloid');
    const nota = input_note.value;
    const url = "#";  // Aggiorna con l'URL appropriato
    const payload = {
        'tipo': tipo,
        'presenzaId': presenzaId,
        'tavoloId': tavoloId,
        'nota': nota
    };

    salvaNota(url, payload);
    modificaNotaModal.hide();
}

function salvaNota(url, payload) {
    console.log(payload);
    const tavoloId = payload.tavoloId;
    // Implementa la chiamata AJAX o fetch qui

    //...

    // cerca quale riga ha il tavoloId corrispondente

    const riga = document.querySelector(`tr[data-tavoloid="${tavoloId}"]`);
    console.log(riga.children[0].innerHTML);


}

// Funzione per alternare lo stato di utilizzabilità
function alternaUtilizzabile(tavoloId, btn) {
    btn.innerHTML = loader;
    ajax(`/tavoli/api/toggle-tavolo-utilizzabile/${tavoloId}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        success: response => {
            btn.innerHTML = response.value.utilizzabile ? check_svg : ban_svg;
        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    });
}

// Funzione per gestire le chiamate POST
function apiPost(url, dati) {
    return new Promise((resolve, reject) => {
        ajax(url, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken },
            data: dati,
            success: response => resolve(response.value),
            error: response => {
                console.error(`Errore! STATUS: ${response.status}`);
                console.error(response.statusText);
                mostraMessaggio("alert-danger", response.statusText, true);
                reject(response.statusText);
            }
        });
    });
}

// Funzione per selezionare tutto il testo in un elemento contentEditable
function selezionaTesto(elemento) {
    const range = document.createRange();
    range.selectNodeContents(elemento);
    const selezione = window.getSelection();
    selezione.removeAllRanges();
    selezione.addRange(range);
}

// Inizializza le righe al caricamento della pagina
document.addEventListener('DOMContentLoaded', inizializzaRighe);
