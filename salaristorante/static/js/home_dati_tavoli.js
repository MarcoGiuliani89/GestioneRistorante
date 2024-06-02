// ****************************************************************
// ************************ PIANOTAVOLI ***************************
// ****************************************************************


let righe;
// Inizializzo le righe della tabella dei tavoli
function inizializzaRighe() {
    righe = document.querySelectorAll('tr[data-tavoloid]');
    righe.forEach(riga => {
        const tavoloId = riga.getAttribute('data-tavoloid');
        recuperaDati(tavoloId, riga);
    });
}


function recuperaDati(tavoloId, riga) {

    // Recupera i dati per ciascun tavolo

    ajax(`/tavoli/api/dati-tavolo-servizio/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        data: { 'tavolo_id': tavoloId, 'servizio_id': servizio_id },
        success: response => {
            popolaTabella(response.value, riga);
        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    });
}

function popolaTabella(dati, riga) {

    // Imposta la compilazione della tabella con i dati recuperati

    const children = riga.children;

    const bottoneUtilizzabile = creaBottoneUtilizzabile(dati.utilizzabile, dati.tavolo_id);

    // evidenzia righe con tavoli non utilizabili
    if (!dati.utilizzabile) {
        riga.classList.add('table-secondary');
    }


    const formattedOspite = formattaOspite(dati.ospite);
    const formattedCamere = formattaCamere(dati.ospite);
    const tipologiaBadge = dati.ospite ? creaBadge(dati.ospite.tipologia, 'tipologia') : '';
    const trattamentoBadge = dati.ospite ? creaBadge(dati.ospite.trattamento, 'trattamento') : '';
    const notaPresenzaPopover = formattaNotaPopover(dati.note_servizio, 'notaPresenza', dati.presenza_id, dati.tavolo_id);
    const notaTavoloPopover = formattaNotaPopover(dati.note_tavolo, 'notaTavolo', dati.presenza_id, dati.tavolo_id);

    children[2].appendChild(bottoneUtilizzabile);
    children[3].innerHTML = dati.max_posti;
    children[4].innerHTML = formattedOspite;
    children[5].innerHTML = formattedCamere;
    children[6].innerHTML = tipologiaBadge;
    children[7].innerHTML = trattamentoBadge;
    children[8].innerHTML = dati.adulti;
    children[9].innerHTML = dati.bambini;
    children[10].innerHTML = dati.infant;
    children[11].innerHTML = notaPresenzaPopover;
    children[12].innerHTML = notaTavoloPopover;


    // Imposto l'aggiornamento dei dati numerici tramite API
    // Indico quali sono le celle numeriche che devono diventare editabili

    let celleEditabili = [];

    if (dati.presenza_id) {
        celleEditabili = [riga.children[3], riga.children[8], riga.children[9], riga.children[10]];
    } else celleEditabili = [riga.children[3]];


    // Inizio dalla mappa degli url associandoli all'indice della cella in cui sto scrivendo

    const urlMap = {
        3: "/tavoli/api/edit-max-posti-tavolo/",
        8: "/servizi/api/edit-adulti-presenza/",
        9: "/servizi/api/edit-bambini-presenza/",
        10: "/servizi/api/edit-infant-presenza/"
    };
    // allo stesso modo mappo i nomi dei campi da aggiornare
    const fieldMap = {
        3: 'max_posti',
        8: 'adulti',
        9: 'bambini',
        10: 'infant'
    };

    const apiMaps = {
        urlMap: urlMap,
        fieldMap: fieldMap
    };

    rendiRigaEditabile(celleEditabili, dati, apiMaps);
    inizializzaPopovers();
}

function creaBottoneUtilizzabile(valore, tavoloId) {
    // Crea un pulsante per alternare l'utilizzabilità di un tavolo
    const div = document.createElement('div');
    const svg = valore ? check_svg : ban_svg;

    div.setAttribute('role', 'button');
    div.classList.add('toggle_utilizzabile');
    div.setAttribute('data-tavoloid', tavoloId);
    div.innerHTML = svg;

    div.addEventListener('click', () => alternaUtilizzabile(tavoloId, div));

    return div;
}

function alternaUtilizzabile(tavoloId, btn) {
    const riga = document.querySelector(`tr[data-tavoloid="${tavoloId}"]`);
    // Chiama l'API per alternare lo stato di utilizzabilità
    btn.innerHTML = loader;
    ajax(`/tavoli/api/toggle-tavolo-utilizzabile/${tavoloId}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        success: response => {

            if (response.value.utilizzabile) {
                btn.innerHTML = check_svg;
                riga.classList.remove('table-secondary');
            } else {
                btn.innerHTML = ban_svg;
                riga.classList.add('table-secondary');
            }
        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    });
}


function formattaOspite(ospite) {
    // Funzione per formattare le informazioni dell'ospite, il popover delle date ed eventualmente quello delle note ospite
    if (!ospite) return "";

    let in_svg_color, out_svg_color, popover_color;

    if (servizio_id == ospite.arrivo_id) {
        in_svg_color = popover_color = "text-success-emphasis";
        out_svg_color = "text-light";
    } else if (servizio_id == ospite.partenza_id) {
        out_svg_color = popover_color = "text-danger-emphasis";
        in_svg_color = "text-light";
    } else {
        in_svg_color = out_svg_color = popover_color = "text-light";
    }

    const popover_content = `
        <ul class="list-group">
            <li class="list-group-item ${in_svg_color}">${ospite.arrivo}</li>
            <li class="list-group-item ${out_svg_color}">${ospite.partenza}</li>
        </ul>
    `;

    const popover_options = {
        container: 'body',
        html: true,
        title: `${ospite.nome}:`,
        content: popover_content,
        customClass: ['btn', 'btn-link', popover_color, "me-1"],
        placement: 'top',
        inner_html: calendar_svg
    };

    let ospiteHtml = `${creaPopover(popover_options)}<strong><a href="/servizi/presenze-ospite/${ospite.id}/" class="text-decoration-none text-light">${ospite.nome}</strong>`;

    if (ospite.note) {
        ospiteHtml += `
            <a tabindex="0" type="button" class="btn btn-link text-light p-1" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="left" data-bs-trigger="focus" data-bs-title="${ospite.nome}:" data-bs-content="${ospite.note}">
                ${info_svg}
            </a>`;
    }

    return ospiteHtml;
}

function creaPopover(options) {
    const popoverButton = document.createElement('a');
    popoverButton.setAttribute('tabindex', '0');
    popoverButton.setAttribute('type', 'button');
    popoverButton.classList.add(...options.customClass);
    popoverButton.setAttribute('data-bs-container', options.container);
    popoverButton.setAttribute('data-bs-html', options.html);
    popoverButton.setAttribute('data-bs-toggle', 'popover');
    popoverButton.setAttribute('data-bs-placement', options.placement);
    popoverButton.setAttribute('data-bs-trigger', 'focus');
    popoverButton.setAttribute('data-bs-title', options.title);
    popoverButton.setAttribute('data-bs-content', options.content);
    popoverButton.setAttribute('data-bs-trigger', options.trigger || 'focus');
    popoverButton.innerHTML = options.inner_html;

    return popoverButton.outerHTML;
}
function inizializzaPopovers() {
    const elementiPopover = document.querySelectorAll('[data-bs-toggle="popover"]');
    elementiPopover.forEach(elementoPopover => {
        new bootstrap.Popover(elementoPopover);
    });
}

function formattaCamere(ospite) {
    if (!ospite || !ospite.rooms) return "";

    const listaCamere = ospite.rooms.split(",");
    if (listaCamere.length === 1) return listaCamere[0];

    const popover_options = {
        container: 'body',
        html: false,
        title: `Camere di ${ospite.nome}`,
        content: ospite.rooms,
        customClass: ['btn', 'btn-link', "me-1"],
        placement: 'top',
        inner_html: `#${listaCamere.length}`
    };

    return creaPopover(popover_options);
}



function creaBadge(valore, tipo) {
    // Funzione per creare un badge colorato
    // mappe colori
    const badgeTypes = {
        tipologia: {
            Individuali: "primary",
            Gruppo: "secondary",
            Esterni: "danger",
            Staff: "warning",
            default: "success"
        },
        trattamento: {
            BB: "warning",
            HB: "info",
            FB: "light",
            HBB: "primary",
            FBB: "danger",
            default: "success"
        }
    };

    if (!valore || !tipo || !badgeTypes[tipo][valore]) {
        return ""; // Non creare il badge se il valore o il tipo sono nulli
    }

    const badgeClass = badgeTypes[tipo][valore];
    return `<span class="badge rounded-pill text-bg-${badgeClass}">${valore}</span>`;
}

// Funzione per formattare le note nei popover
function formattaNotaPopover(nota, tipoNota, presenzaId, tavoloId) {
    // NB: Note tavolo è sempre modificabile e avrà il bottone in ogni caso, Note servizio è modificabile solo se esiste la presenza di un ospite nel Servizio selezionato.
    const [nota_rid, ridotto] = riduciTesto(nota);
    const notaButton = `<button type="button" class="edit_nota btn btn-link text-primary-emphasis px-0 me-1" data-bs-toggle="modal" data-bs-target="#modificaNota" data-tipo="${tipoNota}" data-presenzaid="${presenzaId}" data-tavoloid="${tavoloId}" data-nota="${nota}">${pencil_svg}</button>`;

    if (!nota) {
        return tipoNota === "notaTavolo" ? notaButton : presenzaId ? notaButton : "";
    }

    if (!ridotto) {
        return notaButton + nota;
    }

    const popover_options = {
        container: 'body',
        html: false,
        title: "Note:",
        content: nota,
        customClass: ['btn', 'btn-link'],
        placement: 'left',
        inner_html: nota_rid
    };

    return notaButton + creaPopover(popover_options);
}

function riduciTesto(testo) {
    if (testo && testo.length > 12) {
        return [testo.substring(0, 10) + '...', true];
    } else {
        return [testo, false];
    }
}


// Inizializza le righe al caricamento della pagina
document.addEventListener('DOMContentLoaded', inizializzaRighe);




// ****************************************************************
// ******************* TAVOLI BIS MODAL ***************************
// ****************************************************************

const tavoloBisModal = new bootstrap.Modal(document.getElementById('tavoloBis'));

tavoloBisModal._element.addEventListener('shown.bs.modal', (event) => {
    const modalBody = tavoloBisModal._element.querySelector('.modal-body');
    const modalFooter = tavoloBisModal._element.querySelector('.modal-footer');
    codice = event.relatedTarget.getAttribute('data-codice');
    // tieni solo la parte di codice composta da numeri interi
    codice = codice.replace(/[^0-9]/g, '');
    modalBody.innerHTML = `Vuoi davvero creare un tavolo ${codice} bis ?`;
    modalFooter.innerHTML = `<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
    <a type="button" class="btn btn-primary" href="/tavoli/bissa-tavolo/${codice}/">Conferma</a>`;
});
