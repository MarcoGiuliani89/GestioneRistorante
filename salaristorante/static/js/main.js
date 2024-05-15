// Footer in fondo alla pagina anche in pagine corte 

window.addEventListener('DOMContentLoaded', function () {

    const docHeight = window.innerHeight;
    const footer = document.getElementById('footer');
    const footerHeight = footer.offsetHeight;
    const footerTop = footer.offsetTop + footerHeight;
    const marginTop = docHeight - footerTop + 15;

    if (footerTop < docHeight) {
        footer.style.marginTop = `${marginTop}px`;
    } else {
        footer.style.marginTop = '0px';
    }

    // Uncomment for debugging purposes
    //console.log("docheight:", docHeight, "\nfooterheight:", footerHeight, "\nfootertop:", footerTop, "\nnew docheight:", window.innerHeight, "\nmargintop:", marginTop);

});