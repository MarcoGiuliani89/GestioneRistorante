const modificaNotaModal = new bootstrap.Modal(document.getElementById('modificaNota'));
const input_note = modificaNotaModal._element.querySelector('input');
const save_btn = modificaNotaModal._element.querySelector('#salva_nota');
const ospitiInPiediModal = new bootstrap.Modal(document.getElementById('ospitiInPiedi'));

const tavoloBisModal = new bootstrap.Modal(document.getElementById('tavoloBis'));

let righe;

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



ospitiInPiediModal._element.addEventListener('shown.bs.modal', () => {

    // Modale che recupera e mostra l'elenco degli ospiti che non hanno alcun tavolo assegnato nel servizio selezionato (a ciascuno aggiunge un link alla pagina per la assegnazione).

    ospitiInPiediModal.innerHTML = loader;
    ajax(`/ospiti/api/ospiti-in-piedi-servizio/${servizio_id}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        success: response => {
            // crea la lista
            const lista_ospiti = document.createElement('ul');
            lista_ospiti.classList.add('list-group', 'list-group-flush');
            response.value.ospiti_in_piedi.forEach(ospite => {
                const li = document.createElement('li');
                li.classList.add('list-group-item');
                // aggiungi il link
                const link = document.createElement('a');
                link.setAttribute('href', ospite.assegna_tavoli_url);
                link.setAttribute('title', `Assegna tavoli a ${ospite.nome}`);
                link.innerHTML = pin_svg;
                li.innerHTML = ospite.nome + ' ' + link.outerHTML;
                lista_ospiti.appendChild(li);
            })

            // mostra la lista
            ospitiInPiediModal._element.querySelector('.modal-body').innerHTML = lista_ospiti.outerHTML;
        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    })
})

// Span delle celle della tabella presenze totali
const span_tot = document.getElementById('p_tot');
const span_adulti = document.getElementById('p_adulti');
const span_bambini = document.getElementById('p_bambini');
const span_infant = document.getElementById('p_infant');

function recuperaTotale() {

    // Chiamata API per recuperare i totali presenze 

    ajax(`/servizi/api/totale-presenze-per-servizio/${servizio_id}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        success: response => {
            span_tot.innerHTML = response.value.totale_presenze;
            span_adulti.innerHTML = response.value.totale_adulti;
            span_bambini.innerHTML = response.value.totale_bambini;
            span_infant.innerHTML = response.value.totale_infant;
        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    });
}

recuperaTotale();


function arrivi_partenze() {
    ajax(`/ospiti/api/arrivi-partenze-servizio/${servizio_id}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        success: response => {
            popola_arrivi_partenze(response.value);

        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    })
}

arrivi_partenze();

function createTable(data, title, cssClass) {
    const item = document.createElement('div');
    item.className = 'dropdown-item';

    const itemTitle = document.createElement('h5');
    itemTitle.className = cssClass;
    itemTitle.innerText = title;
    item.appendChild(itemTitle);

    if (data.length === 0) {
        const noDataMessage = document.createElement('p');
        noDataMessage.innerText = `Non ci sono ${title.toLowerCase()}.`;
        item.appendChild(noDataMessage);
    } else {
        const table = document.createElement('table');
        table.className = 'table table-sm table-striped align-middle';

        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th scope="col">Tav.</th>
                <th scope="col">Nome</th>
                <th scope="col">A.</th>
                <th scope="col">B.</th>
                <th scope="col">I.</th>
                <th scope="col"></th>
                <th scope="col">Servizio</th> 
            </tr>`;

        const tbody = document.createElement('tbody');
        data.forEach(ospite => {
            const row = document.createElement('tr');
            let tavoli = ""
            switch (ospite.tavoli.length) {
                case 0:
                    break

                case 1:
                    tavoli = ospite.tavoli[0];
                    break

                default:
                    tavoli = `
                    <button class="btn btn-dark" type="button" data-bs-toggle="popover" data-bs-html="true" data-bs-trigger="hover focus" data-bs-content="<ul class='list-group'>` +
                        ospite.tavoli.map(tavolo => `<li class='list-group-item'>${tavolo}</li>`).join('') +
                        `</ul>" data-bs-placement="top">
                      ...
                    </button>
                `;
            }


            row.innerHTML = `
                <td>${tavoli}</td>
                <td>${ospite.nome}</td>
                <td>${ospite.adulti}</td>
                <td>${ospite.bambini}</td>
                <td>${ospite.infant}</td>
                <td>${ospite.trattamento}</td>
                <td>${ospite.pasto_arrivo || ospite.pasto_partenza || ''}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        item.appendChild(table);
    }
    inizializzaPopovers();

    return item;
}

function popola_arrivi_partenze(dati) {
    const arrivi = dati.arrivi;
    const partenze = dati.partenze;

    const container = document.getElementById('arrivi_partenze');
    container.innerHTML = '';

    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';

    const button = document.createElement('button');
    button.className = 'btn btn-dark dropdown-toggle';
    button.type = 'button';
    button.setAttribute('data-bs-toggle', 'dropdown');
    button.setAttribute('aria-expanded', 'false');
    button.innerText = 'Visualizza';

    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu dropdown-menu-end';

    const partenzeItem = createTable(partenze, 'Partenze', 'text-danger-emphasis');
    const arriviItem = createTable(arrivi, 'Arrivi', 'text-success-emphasis');

    dropdownMenu.appendChild(partenzeItem);
    dropdownMenu.appendChild(arriviItem);
    dropdown.appendChild(button);
    dropdown.appendChild(dropdownMenu);
    container.appendChild(dropdown);
}

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

    ajax(`/tavoli/api/dati-tavolo-servizio/${tavoloId}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
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
}

function creaBottoneUtilizzabile(valore, tavoloId) {

    //Crea un pulsante per alternare l'utilizzabilità di un tavolo
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

    // Chiama l'API per alternare lo stato di utilizzabilità
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

    let ospiteHtml = `${creaPopover(popover_options)}<strong>${ospite.nome}</strong>`;

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

    inizializzaPopovers();

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


// Inizializzare la modale e il suo bottone
modificaNotaModal._element.addEventListener('shown.bs.modal', handleModalShown);
modificaNotaModal._element.addEventListener('hide.bs.modal', handleModalHide);
save_btn.addEventListener('click', handleSaveButtonClick);
modificaNotaModal._element.addEventListener('keydown', handleModalKeyDown);

let currentModalButton = null;

function handleModalShown(event) {
    currentModalButton = event.relatedTarget;
    const nota = currentModalButton.getAttribute('data-nota');
    input_note.value = (nota === "None" || nota === null) ? '' : nota;
    input_note.focus();
    input_note.select();
}

function handleModalHide() {
    currentModalButton = null;
}

function handleModalKeyDown(event) {
    if (event.key === 'Escape') {
        modificaNotaModal.hide();
    } else if (event.key === 'Enter') {
        handleSaveButtonClick();
    }
}

function handleSaveButtonClick() {
    if (!currentModalButton) return;

    const tipo = currentModalButton.getAttribute('data-tipo');
    const presenzaId = currentModalButton.getAttribute('data-presenzaid');
    const tavoloId = currentModalButton.getAttribute('data-tavoloid');
    const servizioId = currentModalButton.getAttribute('data-servizioid');
    const note = input_note.value;
    const payload = {
        'tipo': tipo,
        'presenza_id': presenzaId,
        'tavolo_id': tavoloId,
        'servizio_id': servizioId,
        'note': note
    };

    salvaNota(payload);
    modificaNotaModal.hide();
}

async function salvaNota(payload) {
    const { tipo, presenza_id, tavolo_id } = payload;
    const config = getConfig(tipo);
    if (!config) return;

    const { url, CellIndex } = config;

    try {

        if (tipo != "notaServizio") {
            // Cerca quale riga ha il tavolo_id corrispondente
            const riga = findTableRow(tavolo_id);
            if (!riga) return;

            const cella = riga.children[CellIndex];
            if (!cella) return;

            cella.innerHTML = loader;
            // Implementa la chiamata AJAX
            const response = await apiPost(url, payload);
            cella.innerHTML = formattaNotaPopover(response.note, tipo, presenza_id, tavolo_id);
            inizializzaPopovers();
        } else {
            const span = document.getElementById("nota_servizio");
            const icons = document.getElementById("triangolo_attenzione");
            const edit_btn = document.getElementById("modifica_nota");
            span.innerHTML = loader;
            // Implementa la chiamata AJAX
            const response = await apiPost(url, payload);
            if (!response.note || response.note == "") {
                icons.classList.add("d-none");
                edit_btn.setAttribute("data-nota", null);
            }
            else {
                edit_btn.setAttribute("data-nota", response.note);
                icons.classList.remove("d-none");
            }
            span.innerHTML = response.note
        }

    } catch (error) {
        console.error("Errore durante la chiamata API:", error);
    }
}
function getConfig(tipo) {
    const tipoConfig = {
        notaPresenza: { url: "/servizi/api/edit-note-presenza/", CellIndex: 11 },
        notaTavolo: { url: "/tavoli/api/edit-note-tavolo/", CellIndex: 12 },
        notaServizio: { url: "/servizi/api/edit-note-servizio/", CellIndex: null }
    };
    return tipoConfig[tipo];
}

function findTableRow(tavoloId) {
    return document.querySelector(`tr[data-tavoloid="${tavoloId}"]`);
}


// Inizializza le righe al caricamento della pagina
document.addEventListener('DOMContentLoaded', inizializzaRighe);
