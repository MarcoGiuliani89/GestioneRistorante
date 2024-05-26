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

// function uncheckAll(name) {
//     document.querySelectorAll(`input[type="checkbox"][name="${name}"]`)
//         .forEach(el => el.checked = false);
// }

// function checkAll(name) {
//     document.querySelectorAll(`input[type="checkbox"][name="${name}"]`)
//         .forEach(el => el.checked = true);
// }

// function selectElementContents(el) {
//     var range = document.createRange();
//     range.selectNodeContents(el);
//     var sel = window.getSelection();
//     sel.removeAllRanges();
//     sel.addRange(range);
// }

// function isEmptyObject(value) {
//     return (
//         Object.prototype.toString.call(value) === '[object Object]' &&
//         JSON.stringify(value) === '{}'
//     );
// }

// function timeNow() {
//     let d = new Date()
//     return `ore: ${d.getHours()}.${d.getMinutes()}.${d.getSeconds()}:${d.getMilliseconds()}`
// }


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