document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // BOTÕES DAS ABAS
    // ==============================

    const abaLista = document.getElementById("tabListaTransportadoras");
    const abaNova = document.getElementById("tabNovaTransportadora");


    // ==============================
    // SEÇÕES DAS TELAS
    // ==============================

    const secaoLista = document.getElementById("secaoListaTransportadoras");
    const secaoFormulario = document.getElementById("secaoFormularioTransportadora");


    // ==============================
    // ABRIR LISTA DE TRANSPORTADORAS
    // ==============================

    abaLista.addEventListener("click", () => {

        secaoLista.style.display = "block";
        secaoFormulario.style.display = "none";

        abaLista.classList.add("active");
        abaNova.classList.remove("active");

    });


    // ==============================
    // ABRIR NOVA TRANSPORTADORA
    // ==============================

    abaNova.addEventListener("click", () => {

        secaoLista.style.display = "none";
        secaoFormulario.style.display = "block";

        abaLista.classList.remove("active");
        abaNova.classList.add("active");

    });
document.addEventListener("DOMContentLoaded", () => {

    const abaNova = document.getElementById("tabNovaTransportadora");
    const secaoFormulario = document.getElementById("secaoFormularioTransportadora");

    abaNova.addEventListener("click", () => {

        console.log("Cliquei em Nova Transportadora");
        console.log("Formulário:", secaoFormulario);

        secaoFormulario.style.display = "block";

    });

});
});