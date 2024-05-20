const table_tavoli_assegnati = document.getElementById('tavoli_assegnati')
const container_tavoli_liberi = document.getElementById('tavoli_disponibili')

const trash_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"></path><path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"></path></svg>`

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
            console.log(`Errore! STATUS: ${response.status}`)
            console.log(response.statusText)
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
                    <button type="submit" class="btn btn-link text-danger-emphasis my-1 ms-2">${trash_icon}</button>
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
        console.log(tavolo)
    });

}


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
            console.log(`Errore! STATUS: ${response.status}`)
            console.log(response.statusText)
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
            tavoloBadge.setAttribute('role', 'button');
            tavoloBadge.classList.add('badge', 'rounded-pill', 'text-bg-secondary', 'position-relative', 'fs-6');
            tavoloBadge.textContent = `${tavolo.sala_sigla} ${tavolo.codice}`;

            if (tavolo.max_posti !== null) {
                const maxPostiBadge = document.createElement('span');
                maxPostiBadge.classList.add('position-absolute', 'top-0', 'start-100', 'translate-middle', 'badge', 'rounded-pill', 'bg-warning', 'text-dark');
                maxPostiBadge.textContent = tavolo.max_posti;
                tavoloBadge.appendChild(maxPostiBadge);
            }

            tavoliList.appendChild(tavoloBadge);
        });

        tabPane.appendChild(tavoliList);
        tabContent.appendChild(tabPane);
    });

    container_tavoli_liberi.appendChild(navTabs);
    container_tavoli_liberi.appendChild(tabContent);

    // Assegno l'event listener ai tavoli
}