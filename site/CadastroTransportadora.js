document.addEventListener("DOMContentLoaded", () => {

    // Botões das abas
    const abaLista = document.querySelector('[data-tab="lista"]');
    const abaNova = document.querySelector('[data-tab="nova"]');

    // Seções que serão trocadas
   const abaLista = document.getElementById("tabTransportadorasCadastradas");
const abaNova = document.getElementById("tabNovaTransportadora");

    // Clique em "Transportadoras cadastradas"
    abaLista.addEventListener("click", () => {

        secaoLista.style.display = "block";
        secaoNova.style.display = "none";

        abaLista.classList.add("active");
        abaNova.classList.remove("active");
    });

    // Clique em "+ Nova transportadora"
    abaNova.addEventListener("click", () => {

        secaoLista.style.display = "none";
        secaoNova.style.display = "block";

        abaLista.classList.remove("active");
        abaNova.classList.add("active");
    });

});