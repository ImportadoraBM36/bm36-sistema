document.addEventListener("DOMContentLoaded", () => {

    // ============================================================
    // CONFIGURAÇÃO DA API
    // ============================================================

    const API_URL = "https://bm36-sistema-production.up.railway.app/api";
    const ENDPOINT_TRANSPORTADORAS = `${API_URL}/transportadoras`;


    // ============================================================
    // ELEMENTOS - ABAS / SEÇÕES
    // ============================================================

    const abaLista = document.getElementById("tabListaTransportadoras");
    const abaNova = document.getElementById("tabNovaTransportadora");

    const secaoLista = document.getElementById("secaoListaTransportadoras");
    const secaoFormulario = document.getElementById("secaoFormularioTransportadora");


    // ============================================================
    // ELEMENTOS - LISTA
    // ============================================================

    const inputBusca = document.getElementById("buscaTransportadoras");
    const corpoTabela = document.getElementById("transportadorasBody");
    const contador = document.getElementById("transportadorasContador");

    const btnPaginaAnterior = document.getElementById("transportadorasAnterior");
    const btnPaginaProxima = document.getElementById("transportadorasProximo");
    const paginasWrapper = document.getElementById("transportadorasNumerosPaginas");


    // ============================================================
    // ELEMENTOS - FORMULÁRIO
    // ============================================================

    const form = document.getElementById("transportadoraForm");

    const campoBreadcrumbAcao = document.getElementById("formBreadcrumbAcao");
    const campoPageTitle = document.getElementById("formPageTitle");
    const campoPageSub = document.getElementById("formPageSub");
    const btnSalvar = document.getElementById("salvarTransportadoraBtn");
    const btnCancelar = document.getElementById("cancelBtn");

    const campos = {
        nome: document.getElementById("nomeTransportadora"),
        cnpj: document.getElementById("cnpjTransportadora"),
        ie: document.getElementById("ieTransportadora"),
        telefone: document.getElementById("telefoneTransportadora"),
        email: document.getElementById("emailTransportadora"),
        contato: document.getElementById("contatoTransportadora"),
        categoria: document.getElementById("categoriaTransportadora"),
        cep: document.getElementById("cepTransportadora"),
        rua: document.getElementById("ruaTransportadora"),
        numero: document.getElementById("numeroTransportadora"),
        complemento: document.getElementById("complementoTransportadora"),
        bairro: document.getElementById("bairroTransportadora"),
        cidade: document.getElementById("cidadeTransportadora"),
        uf: document.getElementById("ufTransportadora"),
        observacoes: document.getElementById("observacoesTransportadora"),
    };

    const statusSwitch = document.getElementById("statusSwitch");
    const statusText = document.getElementById("statusText");

    const toast = document.getElementById("toast");
    const toastMensagem = toast ? toast.querySelector("span") : null;

    const TEXTO_SUB_PADRAO =
        "Preencha os dados para adicionar uma nova transportadora. Só Nome/Razão Social e Telefone são obrigatórios — o resto você preenche quando tiver a informação.";


    // ============================================================
    // MÁSCARAS
    // ============================================================

    function somenteNumeros(valor) {
        return String(valor || "").replace(/\D/g, "");
    }

    function mascaraCNPJ(valor) {
        let v = somenteNumeros(valor).slice(0, 14);

        v = v.replace(/^(\d{2})(\d)/, "$1.$2");
        v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
        v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
        v = v.replace(/(\d{4})(\d)/, "$1-$2");

        return v;
    }

    function mascaraTelefone(valor) {
        let v = somenteNumeros(valor).slice(0, 11);

        if (v.length <= 10) {
            v = v.replace(/^(\d{2})(\d)/, "($1) $2");
            v = v.replace(/(\d{4})(\d)/, "$1-$2");
            return v;
        }

        v = v.replace(/^(\d{2})(\d)/, "($1) $2");
        v = v.replace(/(\d{5})(\d)/, "$1-$2");

        return v;
    }

    function mascaraCEP(valor) {
        const v = somenteNumeros(valor).slice(0, 8);

        if (v.length <= 5) return v;

        return v.slice(0, 5) + "-" + v.slice(5);
    }


    // ============================================================
    // ESTADO
    // ============================================================

    const state = {
        transportadoras: [],
        editandoId: null,
        statusAtivo: true,
        paginaAtual: 1,
        itensPorPagina: 8,
        termoBusca: "",
    };


    // ============================================================
    // TOAST
    // ============================================================

    let toastTimeout = null;

    function mostrarToast(mensagem) {
        if (!toast) return;

        if (toastMensagem) {
            toastMensagem.textContent = mensagem;
        }

        toast.classList.add("show");

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 3200);
    }


    // ============================================================
    // ABAS
    // ============================================================

    function mostrarLista() {
        secaoLista.style.display = "block";
        secaoFormulario.classList.add("escondido");

        abaLista.classList.add("active");
        abaNova.classList.remove("active");
    }

    function mostrarFormulario() {
        secaoLista.style.display = "none";
        secaoFormulario.classList.remove("escondido");

        abaLista.classList.remove("active");
        abaNova.classList.add("active");
    }

    abaLista.addEventListener("click", () => {
        mostrarLista();
    });

    abaNova.addEventListener("click", () => {
        abrirNovaTransportadora();
    });


    // ============================================================
    // CARREGAR LISTA (GET)
    // ============================================================

    async function carregarTransportadoras() {
        corpoTabela.innerHTML = `
            <tr>
                <td colspan="7" class="transportadoras-vazio">Carregando transportadoras...</td>
            </tr>
        `;

        try {
            const resposta = await fetch(ENDPOINT_TRANSPORTADORAS);

            if (!resposta.ok) {
                throw new Error(`Erro ${resposta.status}`);
            }

            const dados = await resposta.json();

            state.transportadoras = Array.isArray(dados) ? dados : (dados.transportadoras || []);

            state.paginaAtual = 1;
            renderizarTabela();

        } catch (erro) {
            console.error("Erro ao carregar transportadoras:", erro);

            corpoTabela.innerHTML = `
                <tr>
                    <td colspan="7" class="transportadoras-erro">
                        Não foi possível carregar as transportadoras. Tente novamente.
                    </td>
                </tr>
            `;

            contador.textContent = "Erro ao carregar";
            paginasWrapper.innerHTML = "";
        }
    }


    // ============================================================
    // FILTRO + RENDER DA TABELA
    // ============================================================

    function transportadorasFiltradas() {
        const termo = state.termoBusca.trim().toLowerCase();

        if (!termo) return state.transportadoras;

        return state.transportadoras.filter((item) => {
            const id = String(item.id ?? "").toLowerCase();
            const nome = String(item.nome ?? "").toLowerCase();
            const cnpj = String(item.cnpj ?? "").toLowerCase();
            const telefone = String(item.telefone ?? "").toLowerCase();

            return (
                id.includes(termo) ||
                nome.includes(termo) ||
                cnpj.includes(termo) ||
                telefone.includes(termo)
            );
        });
    }

    function renderizarTabela() {
        const filtradas = transportadorasFiltradas();
        const total = filtradas.length;

        const totalPaginas = Math.max(1, Math.ceil(total / state.itensPorPagina));

        if (state.paginaAtual > totalPaginas) {
            state.paginaAtual = totalPaginas;
        }

        const inicio = (state.paginaAtual - 1) * state.itensPorPagina;
        const pagina = filtradas.slice(inicio, inicio + state.itensPorPagina);

        if (total === 0) {
            corpoTabela.innerHTML = `
                <tr>
                    <td colspan="7" class="transportadoras-vazio">
                        Nenhuma transportadora encontrada.
                    </td>
                </tr>
            `;
        } else {
            corpoTabela.innerHTML = pagina.map((item) => {
                const ativo = item.ativo !== false;

                return `
                    <tr>
                        <td>${escaparHtml(item.id ?? "-")}</td>
                        <td class="transportadora-nome-tabela">${escaparHtml(item.nome || "-")}</td>
                        <td class="transportadora-documento-tabela">${escaparHtml(formatarCnpj(item.cnpj))}</td>
                        <td>${escaparHtml(item.telefone || "-")}</td>
                        <td>${escaparHtml(item.cidade || "-")}</td>
                        <td>
                            <span class="transportadora-status ${ativo ? "ativo" : "inativo"}">
                                ${ativo ? "Ativo" : "Inativo"}
                            </span>
                        </td>
                        <td>
                            <div class="transportadora-acoes-tabela">
                                <button type="button" class="btn-editar-transportadora" data-editar="${item.id}">
                                    Editar
                                </button>
                                <button type="button" class="btn-excluir-transportadora" data-excluir="${item.id}">
                                    Excluir
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        contador.textContent = total === 0
            ? "Nenhuma transportadora"
            : `Mostrando ${pagina.length} de ${total} transportadora${total === 1 ? "" : "s"}`;

        renderizarPaginacao(totalPaginas);
    }

    function formatarCnpj(cnpj) {
        if (!cnpj) return "Não informado";
        return cnpj;
    }

    function escaparHtml(valor) {
        return String(valor)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }


    // ============================================================
    // PAGINAÇÃO
    // ============================================================

    function renderizarPaginacao(totalPaginas) {
        paginasWrapper.innerHTML = "";

        for (let i = 1; i <= totalPaginas; i++) {
            const botao = document.createElement("button");
            botao.type = "button";
            botao.textContent = i;

            if (i === state.paginaAtual) {
                botao.classList.add("active");
            }

            botao.addEventListener("click", () => {
                state.paginaAtual = i;
                renderizarTabela();
            });

            paginasWrapper.appendChild(botao);
        }

        btnPaginaAnterior.disabled = state.paginaAtual <= 1;
        btnPaginaProxima.disabled = state.paginaAtual >= totalPaginas;
    }

    btnPaginaAnterior.addEventListener("click", () => {
        if (state.paginaAtual > 1) {
            state.paginaAtual -= 1;
            renderizarTabela();
        }
    });

    btnPaginaProxima.addEventListener("click", () => {
        state.paginaAtual += 1;
        renderizarTabela();
    });


    // ============================================================
    // BUSCA
    // ============================================================

    inputBusca.addEventListener("input", (evento) => {
        state.termoBusca = evento.target.value;
        state.paginaAtual = 1;
        renderizarTabela();
    });


    // ============================================================
    // AÇÕES DA TABELA (EDITAR / EXCLUIR) - delegação de evento
    // ============================================================

    corpoTabela.addEventListener("click", (evento) => {
        const btnEditar = evento.target.closest("[data-editar]");
        if (btnEditar) {
            abrirEdicao(btnEditar.getAttribute("data-editar"));
            return;
        }

        const btnExcluir = evento.target.closest("[data-excluir]");
        if (btnExcluir) {
            excluirTransportadora(btnExcluir.getAttribute("data-excluir"));
        }
    });


    // ============================================================
    // ABRIR FORMULÁRIO - NOVA TRANSPORTADORA
    // ============================================================

    function abrirNovaTransportadora() {
        state.editandoId = null;

        limparFormulario();

        campoBreadcrumbAcao.textContent = "Novo cadastro";
        campoPageTitle.textContent = "Cadastro de Transportadora";
        campoPageSub.textContent = TEXTO_SUB_PADRAO;
        btnSalvar.textContent = "Salvar Transportadora";

        mostrarFormulario();
    }


    // ============================================================
    // ABRIR FORMULÁRIO - EDITAR TRANSPORTADORA EXISTENTE
    // ============================================================

    function abrirEdicao(id) {
        const item = state.transportadoras.find((t) => String(t.id) === String(id));

        if (!item) {
            mostrarToast("Transportadora não encontrada.");
            return;
        }

        state.editandoId = id;

        preencherFormulario(item);

        campoBreadcrumbAcao.textContent = "Editar transportadora";
        campoPageTitle.textContent = item.nome || "Editar Transportadora";
        campoPageSub.textContent = "Altere os dados e salve para atualizar o cadastro.";
        btnSalvar.textContent = "Salvar Alterações";

        mostrarFormulario();
    }

    function preencherFormulario(item) {
        campos.nome.value = item.nome || "";
        campos.cnpj.value = mascaraCNPJ(item.cnpj || "");
        campos.ie.value = item.ie || "";
        campos.telefone.value = mascaraTelefone(item.telefone || "");
        campos.email.value = item.email || "";
        campos.contato.value = item.contato || "";
        campos.categoria.value = item.categoria || "Rodoviário";
        campos.cep.value = mascaraCEP(item.cep || "");
        campos.rua.value = item.rua || "";
        campos.numero.value = item.numero || "";
        campos.complemento.value = item.complemento || "";
        campos.bairro.value = item.bairro || "";
        campos.cidade.value = item.cidade || "";
        campos.uf.value = item.uf || "";
        campos.observacoes.value = item.observacoes || "";

        definirStatus(item.ativo !== false);
    }

    function limparFormulario() {
        form.reset();
        definirStatus(true);
        removerAvisoCEP();
    }


    // ============================================================
    // EVENTOS DE MÁSCARA
    // ============================================================

    campos.cnpj.addEventListener("input", () => {
        campos.cnpj.value = mascaraCNPJ(campos.cnpj.value);
    });

    campos.telefone.addEventListener("input", () => {
        campos.telefone.value = mascaraTelefone(campos.telefone.value);
    });

    campos.cep.addEventListener("input", () => {
        campos.cep.value = mascaraCEP(campos.cep.value);
    });


    // ============================================================
    // VIA CEP - preenche rua, bairro, cidade e UF automaticamente
    // ============================================================

    async function buscarCEP() {
        const cep = somenteNumeros(campos.cep.value);

        if (cep.length !== 8) return;

        removerAvisoCEP();

        try {
            const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const dados = await resposta.json();

            if (!resposta.ok || dados.erro) {
                mostrarAvisoCEP("CEP não encontrado. Preencha o endereço manualmente.");
                return;
            }

            campos.rua.value = dados.logradouro || "";
            campos.bairro.value = dados.bairro || "";
            campos.cidade.value = dados.localidade || "";
            campos.uf.value = dados.uf || "";

            campos.numero.focus();

        } catch (erro) {
            console.error("Erro ViaCEP:", erro);
            mostrarAvisoCEP("Não foi possível consultar o CEP. Preencha manualmente.");
        }
    }

    campos.cep.addEventListener("blur", buscarCEP);

    function removerAvisoCEP() {
        document.getElementById("avisoCepTransportadora")?.remove();
    }

    function mostrarAvisoCEP(mensagem) {
        removerAvisoCEP();

        const aviso = document.createElement("div");
        aviso.id = "avisoCepTransportadora";
        aviso.className = "aviso-cep";
        aviso.textContent = mensagem;

        campos.cep.closest(".field").appendChild(aviso);
    }


    // ============================================================
    // STATUS (ATIVO / INATIVO)
    // ============================================================

    function definirStatus(ativo) {
        state.statusAtivo = ativo;

        statusSwitch.classList.toggle("on", ativo);
        statusText.classList.toggle("inactive", !ativo);
        statusText.textContent = ativo ? "Transportadora ativa" : "Transportadora inativa";
    }

    statusSwitch.addEventListener("click", () => {
        definirStatus(!state.statusAtivo);
    });


    // ============================================================
    // CANCELAR
    // ============================================================

    btnCancelar.addEventListener("click", () => {
        mostrarLista();
    });


    // ============================================================
    // SALVAR (CRIAR / EDITAR) - POST ou PUT
    // ============================================================
    // Só nome e telefone são obrigatórios (via atributo "required"
    // no HTML). O resto vai como null/vazio se não for preenchido,
    // e a API já aceita isso.

    form.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!form.reportValidity()) {
            return;
        }

        const payload = {
            nome: campos.nome.value.trim(),
            cnpj: somenteNumeros(campos.cnpj.value) || null,
            ie: campos.ie.value.trim() || null,
            telefone: somenteNumeros(campos.telefone.value),
            email: campos.email.value.trim() || null,
            contato: campos.contato.value.trim() || null,
            categoria: campos.categoria.value || null,
            cep: somenteNumeros(campos.cep.value) || null,
            rua: campos.rua.value.trim() || null,
            numero: campos.numero.value.trim() || null,
            complemento: campos.complemento.value.trim() || null,
            bairro: campos.bairro.value.trim() || null,
            cidade: campos.cidade.value.trim() || null,
            uf: campos.uf.value || null,
            observacoes: campos.observacoes.value.trim() || null,
            ativo: state.statusAtivo,
        };

        const editando = Boolean(state.editandoId);

        const url = editando
            ? `${ENDPOINT_TRANSPORTADORAS}/${state.editandoId}`
            : ENDPOINT_TRANSPORTADORAS;

        const metodo = editando ? "PUT" : "POST";

        btnSalvar.disabled = true;

        try {
            const resposta = await fetch(url, {
                method: metodo,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const corpo = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                mostrarToast(corpo.mensagem || "Não foi possível salvar a transportadora.");
                return;
            }

            mostrarToast(corpo.mensagem || (editando
                ? "Transportadora atualizada com sucesso!"
                : "Transportadora cadastrada com sucesso!"));

            await carregarTransportadoras();
            mostrarLista();

        } catch (erro) {
            console.error("Erro ao salvar transportadora:", erro);
            mostrarToast("Não foi possível salvar a transportadora. Verifique sua conexão.");
        } finally {
            btnSalvar.disabled = false;
        }
    });


    // ============================================================
    // EXCLUIR (DELETE)
    // ============================================================

    async function excluirTransportadora(id) {
        const item = state.transportadoras.find((t) => String(t.id) === String(id));
        const nome = item ? item.nome : "esta transportadora";

        const confirmar = confirm(`Tem certeza que deseja excluir ${nome}?`);
        if (!confirmar) return;

        try {
            const resposta = await fetch(`${ENDPOINT_TRANSPORTADORAS}/${id}`, {
                method: "DELETE",
            });

            const corpo = await resposta.json().catch(() => ({}));

            if (!resposta.ok) {
                mostrarToast(corpo.mensagem || "Não foi possível excluir a transportadora.");
                return;
            }

            mostrarToast(corpo.mensagem || "Transportadora excluída.");
            await carregarTransportadoras();

        } catch (erro) {
            console.error("Erro ao excluir transportadora:", erro);
            mostrarToast("Não foi possível excluir a transportadora. Verifique sua conexão.");
        }
    }


    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================

    campoPageSub.textContent = TEXTO_SUB_PADRAO;

    mostrarLista();
    carregarTransportadoras();

});