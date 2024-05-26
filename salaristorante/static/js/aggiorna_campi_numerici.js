
// Rendo editabili le celle numeriche (max_posti, adulti, bambini, infant)

function rendiRigaEditabile(celleEditabili, dati, apiMaps) {
    // Rendi alcune celle editabili
    celleEditabili.forEach(cella => {
        cella.contentEditable = 'true';
        cella.addEventListener('focus', () => selezionaTesto(cella));
        cella.addEventListener('input', () => filtraContenutoNumerico(cella));
        cella.addEventListener('keydown', gestisciEnter);
        cella.addEventListener('blur', () => aggiornaDati(cella, dati, apiMaps));
    });
}

function selezionaTesto(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const selezione = window.getSelection();
    selezione.removeAllRanges();
    selezione.addRange(range);
}

function filtraContenutoNumerico(cella) {
    cella.textContent = cella.textContent.replace(/[^0-9]/g, '');
}

function gestisciEnter(event) {
    // alla pressione del tasto Invio scatena l'evento blur per uscire dalla cella (e aggiornare i dati tramite API)
    if (event.key === 'Enter') {
        event.preventDefault();
        event.target.blur();
    }
}

async function aggiornaDati(cella, dati, apiMaps) {

    // Rileva i dati immessi dall'utente e aggiornali tramite API

    // salvo il valore immesso dall'utente prima di visualizzare il loader
    const newValue = cella.textContent;
    cella.innerHTML = loader;

    // ricavo l'indice della cella in cui l'utente ha scritto
    const fieldIndex = [...cella.parentElement.children].indexOf(cella);

    // tramite l'indice recuperio url e fieldName dalle mappe
    const fieldName = apiMaps.fieldMap[fieldIndex];
    const url = apiMaps.urlMap[fieldIndex];

    if (!fieldName || !url) {
        console.error("Cella non trovata");
        return;
    }
    payload = {
        [fieldName]: newValue,
        tavolo_id: dati.tavolo_id,
        presenza_id: dati.presenza_id
    }
    try {
        const response = await apiPost(url, payload);
        cella.innerHTML = response[fieldName];
    } catch (error) {
        console.error(error);
    }
}
