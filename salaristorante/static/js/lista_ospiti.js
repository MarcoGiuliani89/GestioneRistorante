//TAVOLI OSPITE
tdtavoli = document.querySelectorAll('td.tavoli');
tdtavoli.forEach(tdtavolo => {
    const pk_ospite = tdtavolo.getAttribute('data-pkospite');
    API_tavoli_assegnati(pk_ospite, tdtavolo);
})
function API_tavoli_assegnati(ospite_pk, cella) {
    ajax(`/tavoli/api/tavoli-assegnati/${ospite_pk}/`, {
        method: 'GET',
        success: (response) => {
            const presenze_in_piedi = (cella.dataset.presenze_in_piedi === "True");
            cella.innerHTML = formattaTavoli(response.value, presenze_in_piedi);
            inizializzaPopovers();
        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)

        }
    })
}

function formattaTavoli(tavoli, presenze_in_piedi) {
    // Crea l'alert se presenze_in_piedi è vero, altrimenti una stringa vuota
    const alertMessage = presenze_in_piedi ? `
        <a href="/ospiti/${tavoli[0].ospite_id}/assegna_tavoli/" class="me-1" title="Assegna le presenze in piedi!">⚠️</a>` : '';
    switch (tavoli.length) {
        case 0:
            return '❌';
        case 1:
            return alertMessage + `${tavoli[0].sala_sigla} ${tavoli[0].codice}`;
        default:
            return alertMessage + `${tavoli_multipli(tavoli)}`;
    }
}

function tavoli_multipli(tavoli) {
    if (!tavoli || tavoli.length === 0) return "";

    // Creiamo il pulsante
    const button = document.createElement('button');
    button.className = 'btn btn-link p-0 text-decoration-none';
    button.innerHTML = `#${tavoli.length}`; // Testo del pulsante
    button.setAttribute('type', 'button');
    button.setAttribute('data-bs-toggle', 'modal');
    button.setAttribute('data-bs-target', '#tavoliMultipliModal');

    // Salviamo i tavoli e il nome del cliente in un dataset come stringa JSON
    button.dataset.tavoli = JSON.stringify(tavoli);
    button.dataset.nome_ospite = tavoli[0].ospite_nome;


    return button.outerHTML;
}
document.addEventListener('DOMContentLoaded', function () {
    const tavoliModal = document.getElementById('tavoliMultipliModal');

    tavoliModal.addEventListener('show.bs.modal', function (event) {
        // Identifica il bottone che ha attivato la modale
        const button = event.relatedTarget;

        // Recupera i tavoli salvati al suo interno
        const tavoli = JSON.parse(button.dataset.tavoli);

        mostraTavoliModal(tavoli);
    });
});

function mostraTavoliModal(tavoli) {
    if (!tavoli || tavoli.length === 0) return;

    // Aggiorniamo il titolo della modale
    const modalTitle = document.querySelector('#tavoliMultipliModal .modal-title');
    modalTitle.textContent = `Tavoli assegnati a ${tavoli[0].ospite_nome}`;


    // Selezioniamo il body della modale
    const modalBody = document.querySelector('#tavoliMultipliModal .modal-body');
    modalBody.innerHTML = '';

    // Creiamo la tabella
    const table = document.createElement('table');
    table.classList.add('table', 'table-sm', 'table_tavoli');

    // Intestazione della tabella
    table.innerHTML = `
        <thead>
            <tr>
                <th>Tavolo</th>
                <th>Periodo</th>
            </tr>
        </thead>
    `;

    // Corpo della tabella
    const tbody = document.createElement('tbody');
    tavoli.forEach(tavolo => {
        const tr = document.createElement('tr');

        const tdCodice = document.createElement('td');
        tdCodice.innerHTML = `<span class="badge rounded-pill text-bg-secondary">${tavolo.sala_sigla} ${tavolo.codice}</span>`;

        const tdPeriodo = document.createElement('td');
        tdPeriodo.className = 'text-muted fs-7';
        tdPeriodo.textContent = tavolo.periodo;

        tr.appendChild(tdCodice);
        tr.appendChild(tdPeriodo);
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    modalBody.appendChild(table);
}


// CAMRE OSPITE
tdrooms = document.querySelectorAll('td.rooms');
tdrooms.forEach(tdroom => {
    const pk_ospite = tdroom.getAttribute('data-pkospite');
    recuperaCamere(pk_ospite, tdroom);

});

function recuperaCamere(pk_ospite, cella) {

    // Recupera i dati per ciascun tavolo

    ajax(`/ospiti/api/ospite-rooms/${pk_ospite}`, {
        method: 'GET',
        success: response => {
            cella.innerHTML = formattaCamere(response.value);
            inizializzaPopovers();
        },
        error: response => {
            console.error(`Errore! STATUS: ${response.status}`);
            console.error(response.statusText);
            mostraMessaggio("alert-danger", response.statusText, true);
        }
    });
}

// ELIMINA OSPITE
const delete_modal = document.getElementById('deleteModal');
const delete_form = document.getElementById('deleteForm');

if (delete_modal) {
    delete_modal.addEventListener('show.bs.modal', event => {
        const button = event.relatedTarget;
        const pk_ospite = button.dataset.pkospite;
        const nome = button.dataset.nome;

        delete_form.action = `/ospiti/${pk_ospite}/cancella/`;

        delete_modal.querySelector('.modal-body').innerHTML = `Sei sicuro di voler eliminare l'ospite <strong>${nome}</strong>?`;
        delete_modal.querySelector('.modal-footer').innerHTML = `
            <button type="button" id="cancelDeleteBtn" class="btn btn-secondary" data-bs-dismiss="modal">Annulla</button>
            <button type="submit" id="confirmDeleteBtn" class="btn btn-primary">Conferma</button>
        `;
    });

    delete_form.addEventListener('submit', event => {
        const confirmButton = document.getElementById('confirmDeleteBtn');
        const cancelButton = document.getElementById('cancelDeleteBtn');
        const closeButton = delete_modal.querySelector('.btn-close'); // Bottone "X"

        // Disabilita i bottoni per evitare il doppio click
        confirmButton.disabled = true;
        confirmButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Sto eliminando...';
        cancelButton.disabled = true;

        // Disabilita il bottone "X" senza rimuoverlo
        if (closeButton) {
            closeButton.disabled = true;
            closeButton.style.pointerEvents = 'none'; // Impedisce il click
            closeButton.style.opacity = '0.5'; // Cambia l'opacità
        }

        // Impedisce la chiusura della modale con clic esterno o ESC
        delete_modal.setAttribute('data-bs-backdrop', 'static');
        delete_modal.setAttribute('data-bs-keyboard', 'false');
    });
}


