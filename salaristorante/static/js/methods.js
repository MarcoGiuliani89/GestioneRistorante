function mostraMessaggio(c, text, permanent = false) {
    const cont = document.getElementById("jsAlert");
    switch (c) {
        case 'alert-primary':
            def_text = ""
            color = "primary"
            break;

        case 'alert-secondary':
            def_text = ""
            color = "secondary"
            break;
        case 'alert-success':
            def_text = "<strong>Ok!</strong>"
            color = "success"
            break;

        case 'alert-danger':
            def_text = "<strong>Errore!</strong>"
            color = "danger"
            break;

        case 'alert-warning':
            def_text = "<strong>Attenzione!</strong>"
            color = "warning"
            break;

        case 'alert-info':
            def_text = "<strong>Info</strong>"
            color = "info"
            break;
        case 'alert-light':
            def_text = ""
            color = "light"
            break;

        case 'alert-dark':
            def_text = ""
            color = "dark"
            break;

    }
    text = (text === undefined) ? def_text : `${def_text} ${text}`;
    cont.innerHTML = `
    <div class="alert alert-dismissible fade show ${c}" role="alert" data-mdb-color="${color}">
    <button type="button" class="btn-close" data-bs-dismiss="alert" data-mdb-dismiss="alert" aria-label="close"></button>
    ${text}</div>`

    if (!permanent) {
        setTimeout(() => {
            cont.innerHTML = ""
        }, 6000);
    }
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

function searchInTable(inputID, tableclass) {
    const input = document.getElementById(inputID);
    // Tolgo i caratteri speciali e converto tutto maiuscolo
    const filter = input.value.toUpperCase().replace(/[^a-zA-Z0-9]/g, "");

    const tablelist = document.getElementsByClassName(tableclass);

    for (const t of tablelist) {
        const tbody = t.querySelector("tbody")
        const tr = tbody.getElementsByTagName("tr");
        // Ciclo le righe e nascondo quelle che non corrispondono alla ricerca
        for (let i = 0; i < tr.length; i++) {
            const children = tr[i].children;
            for (x = 0; x < children.length; x++) {
                if (children[x]) {
                    const txtValue = children[x].textContent || children[x].innerText;
                    //Tolgo i caratteri speciali, converto in maiuscolo e comparo la stringa con il filtro
                    if (txtValue.toUpperCase().replace(/[^a-zA-Z0-9]/g, "").indexOf(filter) > -1) {
                        tr[i].style.display = "";
                        break // se trovo un match in una cella passo alla riga successiva
                    } else {
                        // se non trovo un match nascondo la riga
                        tr[i].style.display = "none";
                    }
                }
            }
        }
    }
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

function formattaCamere(ospite, hover = false) {
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
        inner_html: `#${listaCamere.length}`,
        trigger: hover ? 'hover' : 'focus'
    };

    return creaPopover(popover_options);
}

function riduciTesto(testo) {
    if (testo && testo.length > 12) {
        return [testo.substring(0, 10) + '...', true];
    } else {
        return [testo, false];
    }
}