// ****************************************************************
// ********************** OSPITI IN PIEDI *************************
// ****************************************************************

const ospitiInPiediModal = new bootstrap.Modal(document.getElementById('ospitiInPiedi'));

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


// ****************************************************************
// ********************** TOTALI PRESENZE *************************
// ****************************************************************

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


// ****************************************************************
// ********************** ARRIVI PARTENZE *************************
// ****************************************************************

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
