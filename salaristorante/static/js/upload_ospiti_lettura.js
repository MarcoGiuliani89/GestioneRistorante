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
                renderTable(preview);
                document.getElementById("previewContainer").style.display = "block";

                // Se vuoi anche mostrare il JSON originale per debug:
                document.getElementById("output").textContent = JSON.stringify(preview, null, 2);
                document.getElementById("rawOutput").style.display = "block";
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(error => {
            console.error("Errore:", error);
        });
});

function renderTable(preview) {
    const headerRow = document.getElementById("tableHeader");
    const tableBody = document.getElementById("tableBody");

    headerRow.innerHTML = "<th>#</th>";
    tableBody.innerHTML = "";

    const allColumns = new Set();

    // Raccogliamo tutte le lettere di colonna (A, B, C...)
    for (const rowKey in preview) {
        const row = preview[rowKey];
        Object.keys(row).forEach(col => allColumns.add(col));
    }

    const sortedColumns = Array.from(allColumns).sort();

    // Crea intestazioni colonna
    for (const col of sortedColumns) {
        const th = document.createElement("th");
        th.textContent = col;
        headerRow.appendChild(th);
    }

    // Crea le righe della tabella
    for (const rowKey in preview) {
        const row = preview[rowKey];
        const tr = document.createElement("tr");

        // Numero riga
        const th = document.createElement("th");
        th.textContent = rowKey;
        tr.appendChild(th);

        for (const col of sortedColumns) {
            const td = document.createElement("td");
            td.textContent = row[col] || "";
            tr.appendChild(td);
        }

        tableBody.appendChild(tr);
    }
}