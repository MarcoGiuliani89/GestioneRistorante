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
        delete_modal.querySelector('.modal-footer').innerHTML = `<button type="button" class="btn btn-secondary"  data-bs-dismiss="modal">Annulla</button>
        <button type="submit" class="btn btn-primary">Conferma</button>`;
    });
}
