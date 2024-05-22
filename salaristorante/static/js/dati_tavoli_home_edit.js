function toggleUtilizzabile(tavolo_id, btn) {
    btn.innerHTML = loader
    ajax(`/tavoli/api/toggle-tavolo-utilizzabile/${tavolo_id}/`, {
        method: 'POST',
        headers: { 'X-CSRFToken': csrftoken },
        success: (response) => {
            if (response.value.utilizzabile) {
                btn.innerHTML = check_svg
            } else {
                btn.innerHTML = ban_svg
            }
        },
        error: (response) => {
            console.error(`Errore! STATUS: ${response.status}`)
            console.error(response.statusText)
            mostraMessaggio("alert-danger", response.statusText, true)
        }
    })
}