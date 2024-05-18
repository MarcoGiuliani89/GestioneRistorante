const container_tavoli = document.getElementById('tavoli_disponibili')
function tavoli_liberi(servizio_inizio_id, servizio_fine_id) {
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
tavoli_liberi(ospite_in_pk, ospite_out_pk)

function popola_tavoli_liberi(tavoli) {
    container_tavoli.innerHTML = ''
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

    container_tavoli.appendChild(navTabs);
    container_tavoli.appendChild(tabContent);
    console.log(tavoli_per_sala)
}