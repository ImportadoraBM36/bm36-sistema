const API_URL =
    'https://bm36-sistema-production.up.railway.app/api';


// ============================================================
// ELEMENTOS
// ============================================================

const form =
    document.getElementById(
        'clienteForm'
    );

const toggle =
    document.getElementById(
        'typeToggle'
    );

const nameLabel =
    document.getElementById(
        'nameLabel'
    );

const docLabel =
    document.getElementById(
        'docLabel'
    );

const statusSwitch =
    document.getElementById(
        'statusSwitch'
    );

const statusText =
    document.getElementById(
        'statusText'
    );

const cancelBtn =
    document.getElementById(
        'cancelBtn'
    );

const salvarClienteBtn =
    document.getElementById(
        'salvarClienteBtn'
    );

const toast =
    document.getElementById(
        'toast'
    );


// CAMPOS

const nomeCliente =
    document.getElementById(
        'nomeCliente'
    );

const documentoCliente =
    document.getElementById(
        'documentoCliente'
    );

const telefoneCliente =
    document.getElementById(
        'telefoneCliente'
    );

const emailCliente =
    document.getElementById(
        'emailCliente'
    );

const dataNascimentoCliente =
    document.getElementById(
        'dataNascimentoCliente'
    );

const categoriaCliente =
    document.getElementById(
        'categoriaCliente'
    );

const ieCliente =
    document.getElementById(
        'ieCliente'
    );

const cepCliente =
    document.getElementById(
        'cepCliente'
    );

const ruaCliente =
    document.getElementById(
        'ruaCliente'
    );

const numeroCliente =
    document.getElementById(
        'numeroCliente'
    );

const complementoCliente =
    document.getElementById(
        'complementoCliente'
    );

const bairroCliente =
    document.getElementById(
        'bairroCliente'
    );

const cidadeCliente =
    document.getElementById(
        'cidadeCliente'
    );

const ufCliente =
    document.getElementById(
        'ufCliente'
    );

const observacoesCliente =
    document.getElementById(
        'observacoesCliente'
    );


// LISTA

const tabListaClientes =
    document.getElementById(
        'tabListaClientes'
    );

const tabNovoCliente =
    document.getElementById(
        'tabNovoCliente'
    );

const secaoListaClientes =
    document.getElementById(
        'secaoListaClientes'
    );

const secaoFormularioCliente =
    document.getElementById(
        'secaoFormularioCliente'
    );

const buscaClientes =
    document.getElementById(
        'buscaClientes'
    );

const clientesBody =
    document.getElementById(
        'clientesBody'
    );

const clientesContador =
    document.getElementById(
        'clientesContador'
    );

const clientesAnterior =
    document.getElementById(
        'clientesAnterior'
    );

const clientesProximo =
    document.getElementById(
        'clientesProximo'
    );

const clientesNumerosPaginas =
    document.getElementById(
        'clientesNumerosPaginas'
    );


// ============================================================
// ESTADO
// ============================================================

let tipoPessoa =
    'FISICA';

let clientes =
    [];

let clientesFiltrados =
    [];

let paginaClientes =
    1;

const clientesPorPagina =
    10;

let clienteEditandoId =
    null;


// ============================================================
// AUXILIARES
// ============================================================

function somenteNumeros(valor) {

    return String(
        valor || ''
    )
        .replace(
            /\D/g,
            ''
        );

}


function escaparHTML(valor) {

    return String(
        valor ?? ''
    )
        .replaceAll(
            '&',
            '&amp;'
        )
        .replaceAll(
            '<',
            '&lt;'
        )
        .replaceAll(
            '>',
            '&gt;'
        )
        .replaceAll(
            '"',
            '&quot;'
        )
        .replaceAll(
            "'",
            '&#039;'
        );

}


// ============================================================
// MÁSCARAS
// ============================================================

function mascaraCPF(valor) {

    let v =
        somenteNumeros(
            valor
        )
            .slice(
                0,
                11
            );


    v =
        v.replace(
            /(\d{3})(\d)/,
            '$1.$2'
        );


    v =
        v.replace(
            /(\d{3})(\d)/,
            '$1.$2'
        );


    v =
        v.replace(
            /(\d{3})(\d{1,2})$/,
            '$1-$2'
        );


    return v;

}


function mascaraCNPJ(valor) {

    let v =
        somenteNumeros(
            valor
        )
            .slice(
                0,
                14
            );


    v =
        v.replace(
            /^(\d{2})(\d)/,
            '$1.$2'
        );


    v =
        v.replace(
            /^(\d{2})\.(\d{3})(\d)/,
            '$1.$2.$3'
        );


    v =
        v.replace(
            /\.(\d{3})(\d)/,
            '.$1/$2'
        );


    v =
        v.replace(
            /(\d{4})(\d)/,
            '$1-$2'
        );


    return v;

}


function mascaraTelefone(valor) {

    let v =
        somenteNumeros(valor);


    // Alguns relatórios antigos gravam o DDD com dois zeros à esquerda,
    // por exemplo "(0054) 358-1351 358". Remove esse prefixo inválido e
    // conserva DDD + telefone fixo (10 dígitos).
    if (v.startsWith('00')) {
        v = v.replace(/^00+/, '').slice(0, 10);
    } else {
        v = v.slice(0, 11);
    }


    if (
        v.length <= 10
    ) {

        v =
            v.replace(
                /^(\d{2})(\d)/,
                '($1) $2'
            );


        v =
            v.replace(
                /(\d{4})(\d)/,
                '$1-$2'
            );


        return v;

    }


    v =
        v.replace(
            /^(\d{2})(\d)/,
            '($1) $2'
        );


    v =
        v.replace(
            /(\d{5})(\d)/,
            '$1-$2'
        );


    return v;

}


function mascaraCEP(valor) {

    const v =
        somenteNumeros(
            valor
        )
            .slice(
                0,
                8
            );


    if (
        v.length <= 5
    ) {

        return v;

    }


    return (
        v.slice(0, 5)
        +
        '-'
        +
        v.slice(5)
    );

}


function formatarDocumento(valor) {

    const numeros =
        somenteNumeros(
            valor
        );


    if (
        numeros.length === 11
    ) {

        return mascaraCPF(
            numeros
        );

    }


    if (
        numeros.length === 14
    ) {

        return mascaraCNPJ(
            numeros
        );

    }


    return valor || '-';

}


// ============================================================
// EVENTOS DE MÁSCARA
// ============================================================

documentoCliente.addEventListener(
    'input',
    () => {

        documentoCliente.value =
            tipoPessoa === 'FISICA'
                ? mascaraCPF(
                    documentoCliente.value
                )
                : mascaraCNPJ(
                    documentoCliente.value
                );

    }
);


telefoneCliente.addEventListener(
    'input',
    () => {

        telefoneCliente.value =
            mascaraTelefone(
                telefoneCliente.value
            );

    }
);


cepCliente.addEventListener(
    'input',
    () => {

        cepCliente.value =
            mascaraCEP(
                cepCliente.value
            );

    }
);


emailCliente.addEventListener(
    'input',
    () => {

        emailCliente.value =
            emailCliente.value
                .replace(
                    /\s/g,
                    ''
                )
                .toLowerCase();

    }
);


nomeCliente.addEventListener(
    'input',
    () => {

        nomeCliente.value =
            nomeCliente.value
                .replace(
                    /[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g,
                    ''
                )
                .replace(
                    /\s{2,}/g,
                    ' '
                );

    }
);


// ============================================================
// PF / PJ
// ============================================================

function definirTipoPessoa(
    tipo,
    limparDocumento = false
) {

    tipoPessoa =
        tipo;


    toggle
        .querySelectorAll(
            'button'
        )
        .forEach(
            botao =>
                botao.classList.remove(
                    'active'
                )
        );


    if (
        tipo ===
        'FISICA'
    ) {

        toggle
            .querySelector(
                '[data-type="pf"]'
            )
            ?.classList.add(
                'active'
            );


        nameLabel.textContent =
            'Nome completo';


        docLabel.textContent =
            'CPF';


        documentoCliente.placeholder =
            '000.000.000-00';


        documentoCliente.maxLength =
            14;

    } else {

        toggle
            .querySelector(
                '[data-type="pj"]'
            )
            ?.classList.add(
                'active'
            );


        nameLabel.textContent =
            'Razão social';


        docLabel.textContent =
            'CNPJ';


        documentoCliente.placeholder =
            '00.000.000/0000-00';


        documentoCliente.maxLength =
            18;

    }


    if (
        limparDocumento
    ) {

        documentoCliente.value =
            '';

    }

}


toggle.addEventListener(
    'click',
    evento => {

        const btn =
            evento.target.closest(
                'button'
            );


        if (!btn) {

            return;

        }


        definirTipoPessoa(
            btn.dataset.type === 'pj'
                ? 'JURIDICA'
                : 'FISICA',
            true
        );

    }
);


// ============================================================
// STATUS
// ============================================================

function definirStatus(
    ativo
) {

    statusSwitch.classList.toggle(
        'on',
        ativo
    );


    statusText.textContent =
        ativo
            ? 'Cliente ativo'
            : 'Cliente inativo';


    statusText.classList.toggle(
        'inactive',
        !ativo
    );

}


statusSwitch.addEventListener(
    'click',
    () => {

        definirStatus(
            !statusSwitch.classList.contains(
                'on'
            )
        );

    }
);


// ============================================================
// VIA CEP
// ============================================================

async function buscarCEP() {

    const cep =
        somenteNumeros(
            cepCliente.value
        );


    if (
        cep.length !== 8
    ) {

        return;

    }


    removerAvisoCEP();


    try {

        const resposta =
            await fetch(
                `https://viacep.com.br/ws/${cep}/json/`
            );


        const dados =
            await resposta.json();


        if (
            !resposta.ok
            ||
            dados.erro
        ) {

            mostrarAvisoCEP(
                'CEP não encontrado. Preencha o endereço manualmente.'
            );

            return;

        }


        ruaCliente.value =
            dados.logradouro || '';


        bairroCliente.value =
            dados.bairro || '';


        cidadeCliente.value =
            dados.localidade || '';


        ufCliente.value =
            dados.uf || '';


        numeroCliente.focus();


    } catch (erro) {

        console.error(
            'Erro ViaCEP:',
            erro
        );


        mostrarAvisoCEP(
            'Não foi possível consultar o CEP. Preencha manualmente.'
        );

    }

}


cepCliente.addEventListener(
    'blur',
    buscarCEP
);


function removerAvisoCEP() {

    document
        .getElementById(
            'avisoCep'
        )
        ?.remove();

}


function mostrarAvisoCEP(
    mensagem
) {

    removerAvisoCEP();


    const aviso =
        document.createElement(
            'div'
        );


    aviso.id =
        'avisoCep';


    aviso.className =
        'aviso-cep';


    aviso.textContent =
        mensagem;


    cepCliente
        .closest(
            '.field'
        )
        .appendChild(
            aviso
        );

}


// ============================================================
// ABAS
// ============================================================

function mostrarLista() {

    secaoListaClientes.classList.remove(
        'escondido'
    );


    secaoFormularioCliente.classList.add(
        'escondido'
    );


    tabListaClientes.classList.add(
        'active'
    );


    tabNovoCliente.classList.remove(
        'active'
    );


    resetarFormulario();


    carregarClientes();

}


function mostrarFormulario(
    editando = false
) {

    secaoListaClientes.classList.add(
        'escondido'
    );


    secaoFormularioCliente.classList.remove(
        'escondido'
    );


    tabListaClientes.classList.remove(
        'active'
    );


    tabNovoCliente.classList.add(
        'active'
    );


    if (!editando) {

        resetarFormulario();

    }


    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

}


tabListaClientes.addEventListener(
    'click',
    mostrarLista
);


tabNovoCliente.addEventListener(
    'click',
    () => {

        clienteEditandoId =
            null;


        mostrarFormulario();

    }
);


// ============================================================
// CARREGAR CLIENTES
// ============================================================

async function carregarClientes() {

    try {

        clientesBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Carregando clientes...
                </td>
            </tr>
        `;


        const resposta =
            await fetch(
                `${API_URL}/clientes`
            );


        if (!resposta.ok) {

            throw new Error(
                'Erro ao carregar clientes.'
            );

        }


        clientes =
            await resposta.json();


        aplicarFiltroClientes();


    } catch (erro) {

        console.error(
            erro
        );


        clientesBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Não foi possível carregar os clientes.
                </td>
            </tr>
        `;

    }

}


// ============================================================
// BUSCA
// ============================================================

function aplicarFiltroClientes() {

    const termo =
        buscaClientes.value
            .trim()
            .toLowerCase();


    const numeros =
        somenteNumeros(
            termo
        );


    clientesFiltrados =
        clientes.filter(
            cliente => {

                const nome =
                    String(
                        cliente.nome || ''
                    )
                        .toLowerCase();


                const documento =
                    somenteNumeros(
                        cliente.documento
                    );


                const telefone =
                    somenteNumeros(
                        cliente.telefone
                    );


                return (
                    !termo
                    ||
                    nome.includes(
                        termo
                    )
                    ||
                    (
                        numeros
                        &&
                        documento.includes(
                            numeros
                        )
                    )
                    ||
                    (
                        numeros
                        &&
                        telefone.includes(
                            numeros
                        )
                    )
                );

            }
        );


    paginaClientes =
        1;


    renderizarClientes();

}


buscaClientes.addEventListener(
    'input',
    aplicarFiltroClientes
);


// ============================================================
// RENDER CLIENTES
// ============================================================

function renderizarClientes() {

    clientesBody.innerHTML =
        '';


    const inicio =
        (
            paginaClientes -
            1
        )
        *
        clientesPorPagina;


    const pagina =
        clientesFiltrados.slice(
            inicio,
            inicio +
            clientesPorPagina
        );


    if (
        pagina.length === 0
    ) {

        clientesBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Nenhum cliente encontrado.
                </td>
            </tr>
        `;


        atualizarPaginacaoClientes();

        return;

    }


    pagina.forEach(
        cliente => {

            const tr =
                document.createElement(
                    'tr'
                );


            tr.innerHTML = `

                <td>

                    <span class="cliente-nome-tabela">
                        ${escaparHTML(
                            cliente.nome || '-'
                        )}
                    </span>

                </td>


                <td class="cliente-documento-tabela">

                    ${formatarDocumento(
                        cliente.documento
                    )}

                </td>


                <td>

                    ${
                        cliente.telefone
                            ? mascaraTelefone(
                                cliente.telefone
                            )
                            : '-'
                    }

                </td>


                <td>

                    ${escaparHTML(
                        cliente.cidade || '-'
                    )}

                </td>


                <td>

                    <span
                        class="cliente-status ${
                            cliente.ativo
                                ? 'ativo'
                                : 'inativo'
                        }"
                    >

                        ${
                            cliente.ativo
                                ? 'ATIVO'
                                : 'INATIVO'
                        }

                    </span>

                </td>


                <td>

                    <button
                        type="button"
                        class="btn-editar-cliente"
                        data-id="${cliente.id}"
                    >
                        EDITAR
                    </button>

                </td>

            `;


            clientesBody.appendChild(
                tr
            );

        }
    );


    atualizarPaginacaoClientes();

}


// ============================================================
// PAGINAÇÃO
// ============================================================

function atualizarPaginacaoClientes() {

    const total =
        clientesFiltrados.length;


    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                total /
                clientesPorPagina
            )
        );


    if (
        paginaClientes >
        totalPaginas
    ) {

        paginaClientes =
            totalPaginas;

    }


    if (
        total === 0
    ) {

        clientesContador.textContent =
            'Nenhum cliente';

    } else {

        const inicio =
            (
                paginaClientes -
                1
            )
            *
            clientesPorPagina
            +
            1;


        const fim =
            Math.min(
                paginaClientes *
                clientesPorPagina,
                total
            );


        clientesContador.textContent =
            `Mostrando ${inicio}-${fim} de ${total} clientes`;

    }


    clientesAnterior.disabled =
        paginaClientes <= 1;


    clientesProximo.disabled =
        paginaClientes >=
        totalPaginas;


    clientesNumerosPaginas.innerHTML =
        '';


    const paginasVisiveis = new Set([
        1,
        totalPaginas,
        paginaClientes - 1,
        paginaClientes,
        paginaClientes + 1
    ]);

    const paginasOrdenadas = [...paginasVisiveis]
        .filter(numero => numero >= 1 && numero <= totalPaginas)
        .sort((a, b) => a - b);

    let paginaAnteriorExibida = 0;

    paginasOrdenadas.forEach(i => {

        if (i - paginaAnteriorExibida > 1) {
            const reticencias = document.createElement('span');
            reticencias.className = 'clientes-paginacao-reticencias';
            reticencias.textContent = '…';
            reticencias.setAttribute('aria-hidden', 'true');
            clientesNumerosPaginas.appendChild(reticencias);
        }

        const botao =
            document.createElement(
                'button'
            );


        botao.type =
            'button';


        botao.textContent =
            i;


        if (
            i === paginaClientes
        ) {

            botao.classList.add(
                'active'
            );

        }


        botao.addEventListener(
            'click',
            () => {

                paginaClientes =
                    i;


                renderizarClientes();

            }
        );


        clientesNumerosPaginas
            .appendChild(
                botao
            );

        paginaAnteriorExibida = i;

    });

}


clientesAnterior.addEventListener(
    'click',
    () => {

        if (
            paginaClientes > 1
        ) {

            paginaClientes--;


            renderizarClientes();

        }

    }
);


clientesProximo.addEventListener(
    'click',
    () => {

        const totalPaginas =
            Math.ceil(
                clientesFiltrados.length /
                clientesPorPagina
            );


        if (
            paginaClientes <
            totalPaginas
        ) {

            paginaClientes++;


            renderizarClientes();

        }

    }
);


// ============================================================
// EDITAR CLIENTE
// ============================================================

clientesBody.addEventListener(
    'click',
    async evento => {

        const botao =
            evento.target.closest(
                '.btn-editar-cliente'
            );


        if (!botao) {

            return;

        }


        await abrirEdicaoCliente(
            Number(
                botao.dataset.id
            )
        );

    }
);


async function abrirEdicaoCliente(
    id
) {

    try {

        const resposta =
            await fetch(
                `${API_URL}/clientes/${id}`
            );


        const cliente =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                cliente.mensagem
                ||
                'Não foi possível carregar o cliente.'
            );

            return;

        }


        clienteEditandoId =
            cliente.id;


        definirTipoPessoa(
            cliente.tipo_pessoa ===
                'JURIDICA'
                ? 'JURIDICA'
                : 'FISICA'
        );


        nomeCliente.value =
            cliente.nome || '';


        documentoCliente.value =
            tipoPessoa === 'FISICA'
                ? mascaraCPF(
                    cliente.documento
                )
                : mascaraCNPJ(
                    cliente.documento
                );


        telefoneCliente.value =
            mascaraTelefone(
                cliente.telefone || ''
            );


        emailCliente.value =
            cliente.email || '';


        dataNascimentoCliente.value =
            cliente.data_nascimento
                ? String(
                    cliente.data_nascimento
                )
                    .slice(
                        0,
                        10
                    )
                : '';


        categoriaCliente.value =
            cliente.categoria
            ||
            'Varejo';


        ieCliente.value =
            cliente.ie || '';


        cepCliente.value =
            mascaraCEP(
                cliente.cep || ''
            );


        ruaCliente.value =
            cliente.rua || '';


        numeroCliente.value =
            cliente.numero || '';


        complementoCliente.value =
            cliente.complemento || '';


        bairroCliente.value =
            cliente.bairro || '';


        cidadeCliente.value =
            cliente.cidade || '';


        ufCliente.value =
            cliente.uf || '';


        observacoesCliente.value =
            cliente.observacoes || '';


        definirStatus(
            cliente.ativo !== false
        );


        salvarClienteBtn.textContent =
            'Salvar Alterações';


        cancelBtn.textContent =
            'Cancelar edição';


        mostrarFormulario(
            true
        );


    } catch (erro) {

        console.error(
            erro
        );


        alert(
            'Não foi possível carregar o cliente.'
        );

    }

}


// ============================================================
// RESET
// ============================================================

function resetarFormulario() {

    form.reset();


    clienteEditandoId =
        null;


    definirTipoPessoa(
        'FISICA'
    );


    definirStatus(
        true
    );


    removerAvisoCEP();


    salvarClienteBtn.textContent =
        'Salvar Cliente';


    cancelBtn.textContent =
        'Cancelar';

}


// ============================================================
// DADOS FORMULÁRIO
// ============================================================

function obterDadosCliente() {

    return {

        tipo_pessoa:
            tipoPessoa,

        nome:
            nomeCliente.value.trim(),

        documento:
            somenteNumeros(
                documentoCliente.value
            ),

        telefone:
            somenteNumeros(
                telefoneCliente.value
            ),

        email:
            emailCliente.value.trim(),

        data_nascimento:
            dataNascimentoCliente.value
            ||
            null,

        categoria:
            categoriaCliente.value
            ||
            null,

        ie:
            ieCliente.value.trim(),

        cep:
            somenteNumeros(
                cepCliente.value
            ),

        rua:
            ruaCliente.value.trim(),

        numero:
            numeroCliente.value.trim(),

        complemento:
            complementoCliente.value.trim(),

        bairro:
            bairroCliente.value.trim(),

        cidade:
            cidadeCliente.value.trim(),

        uf:
            ufCliente.value
            ||
            null,

        observacoes:
            observacoesCliente.value.trim(),

        ativo:
            statusSwitch
                .classList
                .contains(
                    'on'
                )

    };

}


// ============================================================
// SALVAR / ALTERAR
// ============================================================

form.addEventListener(
    'submit',
    async evento => {

        evento.preventDefault();


        const dados =
            obterDadosCliente();


        const editando =
            clienteEditandoId !==
            null;


        const url =
            editando
                ?
                `${API_URL}/clientes/${clienteEditandoId}`
                :
                `${API_URL}/clientes`;


        const metodo =
            editando
                ? 'PUT'
                : 'POST';


        try {

            salvarClienteBtn.disabled =
                true;


            salvarClienteBtn.textContent =
                editando
                    ? 'Salvando alterações...'
                    : 'Salvando...';


            const resposta =
                await fetch(
                    url,
                    {

                        method:
                            metodo,

                        headers: {

                            'Content-Type':
                                'application/json'

                        },

                        body:
                            JSON.stringify(
                                dados
                            )

                    }
                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                alert(
                    resultado.mensagem
                    ||
                    'Não foi possível salvar o cliente.'
                );

                return;

            }


            mostrarToast(
                resultado.mensagem
                ||
                (
                    editando
                        ? 'Cliente alterado com sucesso!'
                        : 'Cliente cadastrado com sucesso!'
                )
            );


            mostrarLista();


        } catch (erro) {

            console.error(
                'Erro ao salvar cliente:',
                erro
            );


            alert(
                'Não foi possível conectar com a API.'
            );


        } finally {

            salvarClienteBtn.disabled =
                false;

        }

    }
);


// ============================================================
// CANCELAR
// ============================================================

cancelBtn.addEventListener(
    'click',
    () => {

        if (
            clienteEditandoId !==
            null
        ) {

            mostrarLista();

            return;

        }


        resetarFormulario();

    }
);


// ============================================================
// TOAST
// ============================================================

function mostrarToast(
    mensagem
) {

    const span =
        toast.querySelector(
            'span'
        );


    if (span) {

        span.textContent =
            mensagem;

    }


    toast.classList.add(
        'show'
    );


    setTimeout(
        () => {

            toast.classList.remove(
                'show'
            );

        },
        2600
    );

}


// ============================================================
// INICIAR
// ============================================================

carregarClientes();
