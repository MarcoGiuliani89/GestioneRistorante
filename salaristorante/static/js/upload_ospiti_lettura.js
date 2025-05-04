document.getElementById("uploadForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const fileInput = document.getElementById("fileInput");
    const file = fileInput.files[0];
    if (!file) return;

    let formData = new FormData();
    formData.append("file", file);

    fetch(url_importa_ospiti, {
        method: "POST",
        body: formData,
        headers: { "X-CSRFToken": csrf_token }
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success") {
                const preview = data.preview;
                const campi = data.campi_mappatura;
                const mappaturaSalvata = data.mappatura_salvata || {};

                console.log(campi);
                console.log(mappaturaSalvata);

                renderTable(preview, campi, mappaturaSalvata);
                document.getElementById("previewContainer").style.display = "block";

                // Mostra il JSON originale per debug:
                // document.getElementById("output").textContent = JSON.stringify(preview, null, 2);
                // document.getElementById("rawOutput").style.display = "block";
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(error => {
            console.error("Errore:", error);
        });
});

function renderTable(preview, campiValidi, mapping = {}) {
    const selectRow = document.getElementById("selectRow");
    const tableHeader = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");

    // Pulisce eventuali righe esistenti
    selectRow.innerHTML = "";
    tableHeader.innerHTML = "";
    tableBody.innerHTML = "";

    const allColumns = new Set();

    // Raccogliamo tutte le colonne uniche
    for (const rowKey in preview) {
        Object.keys(preview[rowKey]).forEach(col => allColumns.add(col));
    }

    const sortedColumns = Array.from(allColumns).sort();

    // 🔹 RIGA DROPDOWN DI MAPPING

    // Nella prima cella metto il bottone per aggiornare la mappatura
    const saveButton = document.createElement("button");
    saveButton.id = "saveMappingBtn";
    saveButton.className = "btn btn-primary btn-sm";
    saveButton.textContent = "Salva mappatura";
    saveButton.addEventListener("click", () => salvaMappatura());

    const saveTh = document.createElement("th");
    saveTh.appendChild(saveButton);
    selectRow.appendChild(saveTh);

    // Aggiungiamo un dropdown per ogni colonna
    sortedColumns.forEach(col => {
        const th = document.createElement("th");

        // Crea il dropdown per ogni colonna
        const select = document.createElement("select");
        select.className = "form-select form-select-sm";
        select.name = `mapping_${col}`;

        const emptyOption = document.createElement("option");
        emptyOption.value = "";
        emptyOption.textContent = "---";
        select.appendChild(emptyOption);

        // Aggiungi tutte le opzioni per la mappatura dei campi
        for (const fieldName in campiValidi) {
            const option = document.createElement("option");
            option.value = fieldName;
            option.textContent = campiValidi[fieldName];

            // Preseleziona il valore se c'è una mappatura già esistente
            if (mapping[col] === fieldName) {
                option.selected = true;
            }

            select.appendChild(option);
        }

        // Aggiungi il select al th della colonna
        th.appendChild(select);
        selectRow.appendChild(th);
    });


    // 🔹 RIGA INTESTAZIONE COLONNE

    // Prima cella con #
    const hashTh = document.createElement("th");
    hashTh.textContent = "#";
    hashTh.classList.add("table-light");
    tableHeader.appendChild(hashTh);

    // Intestazioni per ogni colonna (A, B, C...)
    sortedColumns.forEach(col => {
        const th = document.createElement("th");
        th.textContent = col;
        tableHeader.appendChild(th);
    });


    // 🔹 CORPO TABELLA
    for (const rowKey in preview) {
        const row = preview[rowKey];
        const tr = document.createElement("tr");

        // Numero riga
        const th = document.createElement("th");
        th.textContent = rowKey;
        th.classList.add("table-light");
        tr.appendChild(th);

        // Crea una cella per ogni colonna con i valori
        sortedColumns.forEach(col => {
            const td = document.createElement("td");
            td.textContent = row[col] || "";
            tr.appendChild(td);
        });

        tableBody.appendChild(tr);
    }
}


function salvaMappatura() {
    // Raccogliamo tutti i valori delle select
    const mapping = {};
    const selects = document.querySelectorAll("select[name^='mapping_']");

    selects.forEach(select => {
        const columnName = select.name.replace("mapping_", ""); // Ottieni il nome della colonna (A, B, C...)
        mapping[columnName] = select.value; // Assegna il valore della select
    });

    // Prepara i dati per inviarli all'API
    const payload = {
        mapping: mapping
    };

    // Invio della richiesta POST per salvare la mappatura
    fetch(url_mappatura, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrf_token
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Mappatura aggiornata con successo!");
            } else {
                alert("Errore durante l'aggiornamento della mappatura: " + (data.error || "Sconosciuto"));
            }
        })
        .catch(error => {
            console.error("Errore nella richiesta:", error);
            alert("Si è verificato un errore nella comunicazione con il server.");
        });
}

