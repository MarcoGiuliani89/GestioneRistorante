const table_tavoli_assegnati = document.getElementById('tavoli_assegnati')

const table_presenze_in_piedi = document.getElementById('presenze_in_piedi')
const presenze_in_piedi_triangle = document.getElementById('presenze_in_piedi_triangle')

const container_tavoli_liberi = document.getElementById('tavoli_disponibili')

const select_inizio = document.querySelector('#inizio_periodo')
const select_fine = document.querySelector('#fine_periodo')
const verifica_tavoli_btn = document.querySelector('#verifica_tavoli_btn')
const alert_inizio_fine = document.querySelector('#alert_inizio_fine')
const saveTavoliBtn = document.querySelector('#assegna_tavoli')


const trash_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"></path><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"></path></svg>`

const calendar_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar4-week" viewBox="0 0 16 16"><path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1z"/><path d="M11 7.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-2 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z"/></svg>`










// ------------------------------------------------------------ //
// ---------------------- TAVOLI LIBERI ----------------------- //
// ------------------------------------------------------------ //
function API_tavoli_assegnati_ospite() {
    ajax(`/tavoli/api/tavoli-assegnati/${ospite_pk}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        success: (response) => {
            popola_tavoli_assegnati_ospite(response.value)
        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)

        }
    })
}

API_tavoli_assegnati_ospite()

function popola_tavoli_assegnati_ospite(tavoli) {
    const tbody = table_tavoli_assegnati.querySelector('tbody')
    tbody.innerHTML = ''

    if (tavoli.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="4"><span class="ps-2 text-warning-emphasis">Ancora nessun tavolo è stato assegnato a questo ospite / gruppo. </span></td>
        `;
        tbody.appendChild(noDataRow);
        return;
    }

    tavoli.forEach((tavolo, index) => {
        const row = document.createElement('tr');

        // Aggiungi le celle alla riga
        row.innerHTML = `
            <td class="text-danger-emphasis">
                <form action="/tavoli/elimina-presenze-tavolo-periodo/" method="POST">
                    <input type="hidden" name="csrfmiddlewaretoken" value="${csrftoken}">          
                    <button type="submit" class="btn btn-link text-danger-emphasis">${trash_icon}</button>
                    <input type="hidden" name="id_tavolo" value="${tavolo.id}">
                    <input type="hidden" name="id_ospite" value="${ospite_pk}">
                    <input type="hidden" name="presenza_ids" value="${tavolo.presenza_ids}">
                    <input type="hidden" name="periodo" value="${tavolo.periodo}">
                </form>
            </td>
            <td>
                <span class="badge rounded-pill text-bg-secondary position-relative fs-6 my-1">
                    ${tavolo.sala_sigla} ${tavolo.codice}
                </span>
            </td>
            <td>${tavolo.periodo}</td>
            <td>${tavolo.max_posti !== null ? tavolo.max_posti : ''}</td>
        `;

        // Aggiungi la riga al tbody
        tbody.appendChild(row);
    });

}











// ------------------------------------------------------------ //
// ----------------- PERIODI OSPITE IN PIEDI ------------------ //
// ------------------------------------------------------------ //

function API_servizi_in_piedi_ospite() {
    ajax(`/tavoli/api/periodi-in-piedi-ospite/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        data: { 'id_ospite': ospite_pk },
        success: (response) => {
            popola_servizi_in_piedi(response.value.periodi_non_assegnati)
        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)
        }
    })
}

API_servizi_in_piedi_ospite()

function popola_servizi_in_piedi(periodi_list) {
    const tbody = table_presenze_in_piedi.querySelector('tbody')
    tbody.innerHTML = ''

    // Se non ci sono periodi con l'ospite in piedi, mostro un messaggio
    if (periodi_list.length === 0) {
        const noDataRow = document.createElement('tr');
        noDataRow.innerHTML = `
            <td colspan="2"><span class="ps-2 text-success-emphasis">Tutte le presenze ai pasti di questo ospite sono assegnate ad almeno un tavolo!</span></td>
        `;
        tbody.appendChild(noDataRow);
        return;
    }

    // Se ci sono periodi, mostro il triangolo di notifica
    presenze_in_piedi_triangle.classList.remove('d-none')

    // Per ogni periodo, mostro una riga della tabella
    periodi_list.forEach((periodo, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><button type="button" class="btn btn-link text-danger-emphasis seleziona_periodo" data-servizio-iniziale="${periodo.servizio_iniziale}" data-servizio-finale="${periodo.servizio_finale}"><span class="me-1">${calendar_icon}</span>Seleziona periodo</button></td>
            <td>${periodo.descrizione}</td>`;
        tbody.appendChild(row);
    });

    // Aggiungi gli event listener ai bottoni
    const pointer_periodo = document.querySelectorAll('.seleziona_periodo');
    pointer_periodo.forEach(bottone => bottone.addEventListener('click', (e) => {
        const servizio_iniziale = e.currentTarget.getAttribute('data-servizio-iniziale');
        const servizio_finale = e.currentTarget.getAttribute('data-servizio-finale');

        // Sfrutto le select e il bottone della modale per impostare i valori su cui cercare i tavoli liberi. Non mi occorre mostrare la modale.
        select_inizio.value = servizio_iniziale
        select_fine.value = servizio_finale

        const flush_collapseThree = document.querySelector('[data-bs-target="#flush-collapseThree"]')

        // apro il panel dell'accordion con i risultati dei tavoli liberi
        flush_collapseThree.click()
        // uso il bottone della modale per aggiornare il periodo di ricerca e chiamare API_tavoli_liberi
        verifica_tavoli_btn.click()
    }));
}










// ------------------------------------------------------------ //
// ----------------- SERVIZI PRESENZE OSPITE ------------------ //
// ------------------------------------------------------------ //

function API_servizi_presenze_ospite(pk) {
    ajax(`/servizi/api/servizi-presenze/${pk}/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        success: (response) => {
            popola_select_servizi(response.value)
        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)
        }
    })
}

API_servizi_presenze_ospite(ospite_pk)

function popola_select_servizi(servizi) {
    select_inizio.innerHTML = ''
    select_fine.innerHTML = ''

    servizi.forEach(el => {
        const option = document.createElement('option')
        option.value = el.servizio_id
        option.textContent = el.servizio_text
        select_inizio.appendChild(option)
        select_fine.appendChild(option.cloneNode(true))
    })
    // Dopo aver recuperato il contenuto delle select abilito il bottone della modale
    verifica_tavoli_btn.disabled = false
}

// Al click su 'verifica tavoli':
// 1. Verifico che select_inizio < select_fine
// 2. modifico il valore di s_inizio_pk e s_fine_pk
// 3. modifico il contenuto di #periodo_selezionato
// 4. richiamo l'API per popolare le navs con i tavoli disponibili nel nuovo periodo
// 5. modifico i valori dei campi servizio_inizio_id e servizio_fine_id della form del bottone Salva
//chiudo la modale

verifica_tavoli_btn.addEventListener('click', () => {

    if (select_inizio.selectedIndex > select_fine.selectedIndex) {
        alert_inizio_fine.classList.remove('d-none')
        return
    }

    alert_inizio_fine.classList.add('d-none')
    s_inizio_pk = select_inizio.value
    s_fine_pk = select_fine.value

    const periodo_selezionato_array = document.querySelectorAll('.periodo_selezionato')

    periodo_selezionato_array.forEach(el => {
        if (s_inizio_pk === ospite_in_pk && s_fine_pk === ospite_out_pk) {
            el.innerHTML = "Intero soggiorno"
        }
        else {
            el.innerHTML = `${select_inizio.options[select_inizio.selectedIndex].text} - ${select_fine.options[select_fine.selectedIndex].text}`
        }
    })

    const s_inizio_form_field = document.querySelector('#servizio_inizio_id')
    const s_fine_form_field = document.querySelector('#servizio_fine_id')

    s_inizio_form_field.value = s_inizio_pk
    s_fine_form_field.value = s_fine_pk

    container_tavoli_liberi.innerHTML = `
    <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Loading...</span>
    </div> Loading...`
    // richiamo l'API per trovare i tavoli liberi nel nuovo periodo
    API_tavoli_liberi(s_inizio_pk, s_fine_pk)
})










// ------------------------------------------------------------ //
// -------------------- TAVOLI DISPONIBILI -------------------- //
// ------------------------------------------------------------ //
function API_tavoli_liberi(servizio_inizio_id, servizio_fine_id) {
    ajax(`/tavoli/api/tavoli-disponibili/`, {
        method: 'GET',
        headers: { 'X-CSRFToken': csrftoken },
        data: {
            'servizio_inizio_id': servizio_inizio_id,
            'servizio_fine_id': servizio_fine_id
        },
        success: (response) => {
            popola_tavoli_liberi(response.value)

        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)
        }

    })
}

// Innanzi tutto chiamo l'API con le date di arrivo e partenza dell'ospite (soggiorno intero)
API_tavoli_liberi(ospite_in_pk, ospite_out_pk)

function popola_tavoli_liberi(tavoli) {
    container_tavoli_liberi.innerHTML = ''
    // raggruppo i tavoli per sala
    tavoli_per_sala = tavoli.reduce((acc, tavolo) => {
        //Se la sala non è già presente nell'oggetto la creo con un array vuoto
        if (!acc[tavolo.sala]) {
            acc[tavolo.sala] = []
        }
        //Inserisco il tavolo nell'array della sala
        acc[tavolo.sala].push(tavolo)
        return acc
    }, {})

    // Creo le nav di bootstrap per ogni sala
    const navTabs = document.createElement('ul');
    navTabs.classList.add('nav', 'nav-underline');
    navTabs.setAttribute('id', 'tab-menu');
    navTabs.setAttribute('role', 'tablist');

    const tabContent = document.createElement('div');
    tabContent.classList.add('tab-content');
    tabContent.setAttribute('id', 'tab-content');

    // Creo il tab per ogni sala
    Object.entries(tavoli_per_sala).forEach(([sala, tavoli], index) => {
        const isActive = index === 0;
        const navItem = document.createElement('li');
        navItem.classList.add('nav-item');
        navItem.setAttribute('role', 'presentation');
        const navLink = document.createElement('a');
        navLink.classList.add('nav-link', isActive);
        if (isActive) navLink.classList.add('active');
        navLink.setAttribute('id', `nav-${tavoli[0].sala_sigla}-tab`);
        navLink.setAttribute('data-bs-toggle', 'tab');
        navLink.setAttribute('href', `#content-${tavoli[0].sala_sigla}`);
        navLink.setAttribute('role', 'tab');
        navLink.setAttribute('aria-controls', `content-${tavoli[0].sala_sigla}`);
        navLink.setAttribute('aria-selected', isActive.toString());
        navLink.textContent = tavoli[0].sala_nome;

        navItem.appendChild(navLink);
        navTabs.appendChild(navItem);

        // Creo il contenuto della tab per i tavoli della sala
        const tabPane = document.createElement('div');
        tabPane.classList.add('tab-pane', 'fade');
        if (isActive) tabPane.classList.add('active', 'show');
        tabPane.setAttribute('id', `content-${tavoli[0].sala_sigla}`);
        tabPane.setAttribute('role', 'tabpanel');
        tabPane.setAttribute('aria-labelledby', `tab-${tavoli[0].sala_sigla}`);


        const tavoliList = document.createElement('div');
        tavoliList.classList.add('d-flex', 'flex-wrap', 'gap-3', 'mt-3');

        tavoli.forEach(tavolo => {
            const tavoloBadge = document.createElement('span');
            tavoloBadge.setAttribute('data-tavolo-id', tavolo.id);
            tavoloBadge.setAttribute('data-selected', false);
            tavoloBadge.setAttribute('role', 'button');
            tavoloBadge.classList.add('badge', 'rounded-pill', 'text-bg-secondary', 'position-relative', 'fs-6');
            tavoloBadge.textContent = `${tavolo.sala_sigla} ${tavolo.codice}`;

            if (tavolo.max_posti !== null) {
                const maxPostiBadge = document.createElement('span');
                maxPostiBadge.classList.add('position-absolute', 'top-0', 'start-100', 'translate-middle', 'badge', 'rounded-pill', 'bg-warning', 'text-dark');
                maxPostiBadge.textContent = tavolo.max_posti;
                tavoloBadge.appendChild(maxPostiBadge);
            }

            tavoloBadge.addEventListener('click', () => {
                toggle_tavolo(tavolo.id);
            });

            tavoliList.appendChild(tavoloBadge);
        });

        tabPane.appendChild(tavoliList);
        tabContent.appendChild(tabPane);
    });

    container_tavoli_liberi.appendChild(navTabs);
    container_tavoli_liberi.appendChild(tabContent);
}

function toggle_tavolo(tavolo_id) {
    // Trova l'elemento del tavolo utilizzando il data attribute
    const tavoloBadge = document.querySelector(`[data-tavolo-id='${tavolo_id}']`);
    const selected = tavoloBadge.getAttribute('data-selected') === 'true';

    // Cambia la classe del tavolo
    if (selected) {
        tavoloBadge.classList.remove('text-bg-primary');
        tavoloBadge.classList.add('text-bg-secondary');
    } else {
        tavoloBadge.classList.remove('text-bg-secondary');
        tavoloBadge.classList.add('text-bg-primary');
    }

    // Cambia l'attributo data-selected
    tavoloBadge.setAttribute('data-selected', !selected);

    // Trova l'input nascosto
    const hiddenInput = document.getElementById('tavoli_selezionati_ids');
    let selectedTavoli = JSON.parse(hiddenInput.value);

    // Aggiungi o rimuovi il tavolo.id dal value
    if (!selected) {
        selectedTavoli.push(tavolo_id);
    } else {
        selectedTavoli = selectedTavoli.filter(id => id !== tavolo_id);
    }

    // Aggiorna il value dell'input nascosto
    hiddenInput.value = JSON.stringify(selectedTavoli);

    // Disabilita o abilita il pulsante di salvataggio
    if (selectedTavoli.length === 0) {
        saveTavoliBtn.disabled = true;
    } else {
        saveTavoliBtn.disabled = false;
    }
}