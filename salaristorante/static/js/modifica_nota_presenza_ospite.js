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
    const isNotaValid = nota && !["None", "null"].includes(nota);

    input_note.value = isNotaValid ? nota : '';
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

    const presenzaId = currentModalButton.getAttribute('data-presenzaid');
    const note = input_note.value;
    const payload = {
        'presenza_id': presenzaId,
        'note': note
    };

    salvaNota(payload);
    modificaNotaModal.hide();
}

async function salvaNota(payload) {
    const tr = document.querySelector(`[data-presenzaid="${payload.presenza_id}"]`);
    const cell = tr.querySelector(`td:nth-child(7)`);
    const button = cell.querySelector(`button`);
    const span_nota = cell.querySelector(`.nota_presenza`);
    const url = "/servizi/api/edit-note-presenza/";

    span_nota.innerHTML = loader;
    const response = await apiPost(url, payload);
    span_nota.innerHTML = response.note;
    button.setAttribute('data-nota', response.note);
}

