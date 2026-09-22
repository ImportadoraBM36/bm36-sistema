// ============================================================
// CENTRAL DE INFORMAÇÕES
// ============================================================


// ============================================================
// CONFIGURAÇÃO DA API
// ============================================================

const API_BASE =
    'https://bm36-sistema-production.up.railway.app/api';


// ============================================================
// ELEMENTOS
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
// CAMPOS DA EMPRESA
// ============================================================

const campos = {

    nome_empresa:
        document.getElementById("nomeEmpresa"),

    nome_fantasia:
        document.getElementById("nomeFantasia"),

    cnpj:
        document.getElementById("cnpj"),

    inscricao_estadual:
        document.getElementById("inscricaoEstadual"),

    endereco:
        document.getElementById("endereco"),

    numero:
        document.getElementById("numero"),

    complemento:
        document.getElementById("complemento"),

    bairro:
        document.getElementById("bairro"),

    cidade:
        document.getElementById("cidade"),

    estado:
        document.getElementById("estado"),

    cep:
        document.getElementById("cep"),

    telefone:
        document.getElementById("telefone"),

    email:
        document.getElementById("email"),

    site:
        document.getElementById("site"),

    mensagem_padrao_pedido:
        document.getElementById("mensagemPadrao"),
    logo_pdf: document.getElementById("logoPdf"),
    percentual_16001: document.getElementById("percentual16001"),
    percentual_16002: document.getElementById("percentual16002"),
    percentual_18001: document.getElementById("percentual18001"),
    percentual_18002: document.getElementById("percentual18002")

};


// ============================================================
// CAMPOS DE ALTERAÇÃO
// ============================================================

const ultimoAlterador =
    document.getElementById("ultimoAlterador");

const ultimaData =
    document.getElementById("ultimaData");


// ============================================================
// PEGAR TOKEN
// ============================================================

function obterToken() {

    return localStorage.getItem(
        "bm36_token"
    );

}


// ============================================================
// CARREGAR CONFIGURAÇÕES
// ============================================================

async function carregarConfiguracoes() {

    try {

        const token =
            obterToken();


        if (!token) {

            alert(
                "Sua sessão não foi encontrada. Faça login novamente."
            );

            return;

        }


        const resposta =
            await fetch(
                `${API_BASE}/configuracoes-empresa`,
                {

                    method:
                        "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${token}`

                    }

                }
            );


        console.log(
            "STATUS CONFIGURAÇÕES:",
            resposta.status
        );


        const dados =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                dados.mensagem ||
                "Não foi possível carregar as informações da empresa."
            );

            return;

        }


        const configuracao =
            dados.configuracao;


        // ====================================================
        // PREENCHER CAMPOS
        // ====================================================

        campos.nome_empresa.value =
            configuracao.nome_empresa || "";

        campos.nome_fantasia.value =
            configuracao.nome_fantasia || "";

        campos.cnpj.value =
            configuracao.cnpj || "";

        campos.inscricao_estadual.value =
            configuracao.inscricao_estadual || "";

        campos.endereco.value =
            configuracao.endereco || "";

        campos.numero.value =
            configuracao.numero || "";

        campos.complemento.value =
            configuracao.complemento || "";

        campos.bairro.value =
            configuracao.bairro || "";

        campos.cidade.value =
            configuracao.cidade || "";

        campos.estado.value =
            configuracao.estado || "";

        campos.cep.value =
            configuracao.cep || "";

        campos.telefone.value =
            configuracao.telefone || "";

        campos.email.value =
            configuracao.email || "";

        campos.site.value =
            configuracao.site || "";

        campos.mensagem_padrao_pedido.value =
            configuracao.mensagem_padrao_pedido || "";
        campos.percentual_16001.value = configuracao.percentual_16001 ?? 33.33;
        campos.percentual_16002.value = configuracao.percentual_16002 ?? 66.67;
        campos.percentual_18001.value = configuracao.percentual_18001 ?? 100;
        campos.percentual_18002.value = configuracao.percentual_18002 ?? 120;


        // ====================================================
        // ÚLTIMA ALTERAÇÃO
        // ====================================================

        if (
            configuracao.alterado_por_nome
        ) {

            ultimoAlterador.textContent =
                configuracao.alterado_por_nome;

        } else {

            ultimoAlterador.textContent =
                "Não informado";

        }


        if (
            configuracao.alterado_em
        ) {

            const data =
                new Date(
                    configuracao.alterado_em
                );


            ultimaData.textContent =
                data.toLocaleString(
                    "pt-BR"
                );

        } else {

            ultimaData.textContent =
                "Não informado";

        }


    } catch (erro) {

        console.error(
            "Erro ao carregar configurações:",
            erro
        );

        alert(
            "Erro ao conectar com o servidor."
        );

    }

}


// ============================================================
// ABRIR MODAL
// ============================================================

btnSalvar.addEventListener(
    "click",
    () => {

        modalSenha.classList.add(
            "active"
        );


        senhaAdm.value = "";


        setTimeout(
            () => {

                senhaAdm.focus();

            },
            100
        );

    }
);


// ============================================================
// FECHAR MODAL
// ============================================================

function fecharModalSenha() {

    modalSenha.classList.remove(
        "active"
    );


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
// SALVAR CONFIGURAÇÕES
// ============================================================

async function salvarConfiguracoes() {

    try {

        const token =
            obterToken();


        if (!token) {

            alert(
                "Sua sessão expirou. Faça login novamente."
            );

            return;

        }


        const senha =
            senhaAdm.value.trim();


        if (!senha) {

            alert(
                "Digite sua senha de administrador."
            );

            senhaAdm.focus();

            return;

        }


        // ====================================================
        // MONTAR DADOS
        // ====================================================

        const logo = campos.logo_pdf.files[0];
        if (logo && logo.size > 2 * 1024 * 1024) { alert('A logo deve ter no máximo 2 MB.'); return; }
        const logoPdf = logo ? await new Promise((resolve, reject) => { const leitor = new FileReader(); leitor.onload = () => resolve(leitor.result); leitor.onerror = reject; leitor.readAsDataURL(logo); }) : null;
        const dados = {

            senha:
                senha,

            nome_empresa:
                campos.nome_empresa.value.trim(),

            nome_fantasia:
                campos.nome_fantasia.value.trim(),

            cnpj:
                campos.cnpj.value.trim(),

            inscricao_estadual:
                campos.inscricao_estadual.value.trim(),

            endereco:
                campos.endereco.value.trim(),

            numero:
                campos.numero.value.trim(),

            complemento:
                campos.complemento.value.trim(),

            bairro:
                campos.bairro.value.trim(),

            cidade:
                campos.cidade.value.trim(),

            estado:
                campos.estado.value.trim(),

            cep:
                campos.cep.value.trim(),

            telefone:
                campos.telefone.value.trim(),

            email:
                campos.email.value.trim(),

            site:
                campos.site.value.trim(),

            mensagem_padrao_pedido: campos.mensagem_padrao_pedido.value.trim(),
            logo_pdf: logoPdf,
            percentual_16001: Number(campos.percentual_16001.value),
            percentual_16002: Number(campos.percentual_16002.value),
            percentual_18001: Number(campos.percentual_18001.value),
            percentual_18002: Number(campos.percentual_18002.value)

        };


        // ====================================================
        // ENVIAR PARA O BACKEND
        // ====================================================

        const resposta =
            await fetch(
                `${API_BASE}/configuracoes-empresa`,
                {

                    method:
                        "PUT",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify(
                            dados
                        )

                }
            );


        const resultado =
            await resposta.json();


        // ====================================================
        // ERRO
        // ====================================================

        if (!resposta.ok) {

            alert(
                resultado.mensagem ||
                "Não foi possível salvar as alterações."
            );

            return;

        }


        // ====================================================
        // SUCESSO
        // ====================================================

        alert(
            "Informações da empresa atualizadas com sucesso!"
        );


        fecharModalSenha();


        // ====================================================
        // ATUALIZAR INFORMAÇÕES DE ALTERAÇÃO
        // ====================================================

        await carregarConfiguracoes();


    } catch (erro) {

        console.error(
            "Erro ao salvar configurações:",
            erro
        );

        alert(
            "Erro ao conectar com o servidor."
        );

    }

}


// ============================================================
// CONFIRMAR SENHA
// ============================================================

confirmarSenha.addEventListener(
    "click",
    salvarConfiguracoes
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

            salvarConfiguracoes();

        }

    }
);


// ============================================================
// CARREGAR AO ABRIR A PÁGINA
// ============================================================

carregarConfiguracoes();
