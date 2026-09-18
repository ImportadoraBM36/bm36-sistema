// ============================================================
// CENTRAL DE INFORMAÇÕES
// ============================================================


const btnSalvar =
    document.getElementById("btnSalvar");

const modalSenha =
    document.getElementById("modalSenha");

const fecharModal =
    document.getElementById("fecharModal");

const cancelarSenha =
    document.getElementById("cancelarSenha");

const confirmarSenha =
    document.getElementById("confirmarSenha");

const senhaAdm =
    document.getElementById("senhaAdm");


// ============================================================
// ABRIR MODAL
// ============================================================

btnSalvar.addEventListener("click", () => {

    modalSenha.classList.add("active");

    senhaAdm.value = "";

    setTimeout(() => {

        senhaAdm.focus();

    }, 100);

});


// ============================================================
// FECHAR MODAL
// ============================================================

function fecharModalSenha() {

    modalSenha.classList.remove("active");

    senhaAdm.value = "";

}


fecharModal.addEventListener(
    "click",
    fecharModalSenha
);


cancelarSenha.addEventListener(
    "click",
    fecharModalSenha
);


// ============================================================
// CLICAR FORA DO MODAL
// ============================================================

modalSenha.addEventListener(
    "click",
    (event) => {

        if (
            event.target === modalSenha
        ) {

            fecharModalSenha();

        }

    }
);


// ============================================================
// CONFIRMAR
// ============================================================
//
// POR ENQUANTO É APENAS VISUAL.
// A VERIFICAÇÃO REAL DA SENHA SERÁ FEITA
// NO BACKEND.
//
// ============================================================

confirmarSenha.addEventListener(
    "click",
    () => {

        const senha =
            senhaAdm.value.trim();


        if (!senha) {

            alert(
                "Digite sua senha de administrador."
            );

            senhaAdm.focus();

            return;

        }


        alert(
            "A tela está pronta. A validação da senha será conectada ao sistema na próxima etapa."
        );


        fecharModalSenha();

    }
);


// ============================================================
// ENTER NA SENHA
// ============================================================

senhaAdm.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            confirmarSenha.click();

        }

    }
);
