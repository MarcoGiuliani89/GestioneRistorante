// ****************************************************************
// ***************** MODALE MODIFICA NOTE *************************
// ****************************************************************

const modificaNotaModal = new bootstrap.Modal(document.getElementById('modificaNota'));
const input_note = modificaNotaModal._element.querySelector('input');
const save_btn = modificaNotaModal._element.querySelector('#salva_nota');

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
