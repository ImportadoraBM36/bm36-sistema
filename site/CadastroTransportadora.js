document.addEventListener("DOMContentLoaded", () => {

    // ==============================
    // BOTÕES DAS ABAS
    // ==============================

    const abaLista = document.getElementById("tabListaTransportadoras");
    const abaNova = document.getElementById("tabNovaTransportadora");


    // ==============================
    // SEÇÕES DAS ABAS
    // ==============================

    const secaoLista = document.getElementById("secaoListaTransportadoras");
    const secaoNova = document.getElementById("secaoNovaTransportadora");


    // ==============================
    // TRANSPORTADORAS CADASTRADAS
    // ==============================

    abaLista.addEventListener("click", () => {

        secaoLista.style.display = "block";
        secaoNova.style.display = "none";

        abaLista.classList.add("active");
        abaNova.classList.remove("active");

    });


    // ==============================
    // NOVA TRANSPORTADORA
    // ==============================

    abaNova.addEventListener("click", () => {

        secaoLista.style.display = "none";
        secaoNova.style.display = "block";

        abaLista.classList.remove("active");
        abaNova.classList.add("active");

    });

});