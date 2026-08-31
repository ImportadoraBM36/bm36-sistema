const API_URL =
    'https://bm36-sistema-production.up.railway.app/api';


let produtos = [];
let produtosFiltrados = [];

let paginaAtual = 1;
const produtosPorPagina = 20;

let produtoSelecionado = null;
let modoFormulario = 'novo';


// =========================
// ELEMENTOS DA PÁGINA
// =========================

const tabela =
    document.getElementById('tabelaProdutos');

const busca =
    document.getElementById('buscaProduto');

const contador =
    document.getElementById('contadorProdutos');

const btnAnterior =
    document.getElementById('paginaAnterior');

const btnProxima =
    document.getElementById('proximaPagina');

const numerosPaginas =
    document.getElementById('numerosPaginas');

const btnAlterar =
    document.getElementById('btnAlterar');


// =========================
// ELEMENTOS DO MODAL
// =========================

const btnNovoProduto =
    document.getElementById('btnNovoProduto');

const modalNovoProduto =
    document.getElementById('modalNovoProduto');

const btnFecharModal =
    document.getElementById('btnFecharModal');

const btnCancelarProduto =
    document.getElementById('btnCancelarProduto');

const formNovoProduto =
    document.getElementById('formNovoProduto');

const tituloModal =
    document.querySelector('.modal-header h2');

const btnSalvarProduto =
    formNovoProduto.querySelector('.btn-salvar');


// =========================
// CARREGAR PRODUTOS
// =========================

async function carregarProdutos() {

    try {

        const resposta =
            await fetch(`${API_URL}/produtos`);


        if (!resposta.ok) {

            throw new Error(
                'Erro ao carregar produtos'
            );

        }


        produtos =
            await resposta.json();


        produtosFiltrados =
            [...produtos];


        produtoSelecionado =
            null;


        paginaAtual =
            1;


        renderizarTabela();


    } catch (erro) {

        console.error(
            'Erro ao carregar produtos:',
            erro
        );


        tabela.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="erro"
                >
                    Não foi possível carregar os produtos.
                </td>
            </tr>
        `;


        contador.textContent =
            'Erro ao carregar produtos';


        numerosPaginas.innerHTML =
            '';


        btnAnterior.disabled =
            true;


        btnProxima.disabled =
            true;

    }

}


// =========================
// RENDERIZAR TABELA
// =========================

function renderizarTabela() {

    tabela.innerHTML = '';


    const inicio =
        (paginaAtual - 1) *
        produtosPorPagina;


    const fim =
        inicio +
        produtosPorPagina;


    const produtosPagina =
        produtosFiltrados.slice(
            inicio,
            fim
        );


    if (
        produtosPagina.length === 0
    ) {

        tabela.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="sem-resultados"
                >
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;


        atualizarRodape();

        return;

    }


    produtosPagina.forEach(
        produto => {

            const linha =
                document.createElement('tr');


            // Guarda o ID na linha
            linha.dataset.id =
                produto.id;


            // =========================
            // SELECIONAR PRODUTO
            // =========================

            linha.addEventListener(
                'click',
                () => {

                    document
                        .querySelectorAll(
                            '.tabela-produtos tbody tr'
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    'produto-selecionado'
                                );

                            }
                        );


                    linha.classList.add(
                        'produto-selecionado'
                    );


                    produtoSelecionado =
                        produto;

                }
            );


            // =========================
            // PREÇO
            // =========================

            const preco =
                Number(
                    produto.preco_venda || 0
                )
                    .toLocaleString(
                        'pt-BR',
                        {
                            style: 'currency',
                            currency: 'BRL'
                        }
                    );


            // =========================
            // ESTOQUE
            // =========================

            const estoque =
                Number(
                    produto.estoque_atual || 0
                );


            const estoqueMinimo =
                Number(
                    produto.estoque_minimo || 0
                );


            // =========================
            // EMBALAGEM
            // =========================

            const quantidadePorCaixa =
                Number(
                    produto.quantidade_por_caixa || 0
                );


            const embalagem =
                quantidadePorCaixa > 0
                    ? `${quantidadePorCaixa} un./caixa`
                    : '-';


            // =========================
            // LINHA DA TABELA
            // =========================

            linha.innerHTML = `
                <td>
                    ${produto.codigo_fabricante || '-'}
                </td>

                <td>
                    ${produto.codigo || '-'}
                </td>

                <td>
                    ${produto.nome || '-'}
                </td>

                <td>
                    ${produto.categoria_nome || '-'}
                </td>

                <td class="embalagem-produto">
                    ${embalagem}
                </td>

                <td>
                    ${preco}
                </td>

                <td class="${
                    estoque <= 0
                        ? 'sem-estoque'
                        : estoque <= estoqueMinimo
                        ? 'estoque-baixo'
                        : ''
                }">
                    ${estoque}
                </td>
            `;


            tabela.appendChild(
                linha
            );

        }
    );


    atualizarRodape();

}


// =========================
// RODAPÉ
// =========================

function atualizarRodape() {

    const total =
        produtosFiltrados.length;


    if (
        total === 0
    ) {

        contador.textContent =
            'Nenhum produto encontrado';


        numerosPaginas.innerHTML =
            '';


        btnAnterior.disabled =
            true;


        btnProxima.disabled =
            true;


        return;

    }


    const totalPaginas =
        Math.ceil(
            total /
            produtosPorPagina
        );


    if (
        paginaAtual >
        totalPaginas
    ) {

        paginaAtual =
            totalPaginas;

    }


    const inicio =
        (paginaAtual - 1) *
        produtosPorPagina + 1;


    const fim =
        Math.min(
            paginaAtual *
            produtosPorPagina,
            total
        );


    contador.textContent =
        `Mostrando ${inicio}–${fim} de ${total} produtos`;


    renderizarPaginacao(
        totalPaginas
    );

}


// =========================
// PAGINAÇÃO
// =========================

function renderizarPaginacao(
    totalPaginas
) {

    numerosPaginas.innerHTML =
        '';


    function criarBotaoPagina(
        numero
    ) {

        const botao =
            document.createElement(
                'button'
            );


        botao.textContent =
            numero;


        if (
            numero === paginaAtual
        ) {

            botao.classList.add(
                'ativa'
            );

        }


        botao.addEventListener(
            'click',
            () => {

                paginaAtual =
                    numero;


                produtoSelecionado =
                    null;


                renderizarTabela();


                rolarParaTabela();

            }
        );


        numerosPaginas.appendChild(
            botao
        );

    }


    function criarReticencias() {

        const reticencias =
            document.createElement(
                'span'
            );


        reticencias.textContent =
            '...';


        numerosPaginas.appendChild(
            reticencias
        );

    }


    if (
        totalPaginas <= 9
    ) {

        for (
            let pagina = 1;
            pagina <= totalPaginas;
            pagina++
        ) {

            criarBotaoPagina(
                pagina
            );

        }

    } else {

        criarBotaoPagina(1);


        let inicio =
            Math.max(
                2,
                paginaAtual - 2
            );


        let fim =
            Math.min(
                totalPaginas - 1,
                paginaAtual + 2
            );


        if (
            paginaAtual <= 4
        ) {

            inicio = 2;
            fim = 6;

        }


        if (
            paginaAtual >=
            totalPaginas - 3
        ) {

            inicio =
                totalPaginas - 5;

            fim =
                totalPaginas - 1;

        }


        if (
            inicio > 2
        ) {

            criarReticencias();

        }


        for (
            let pagina = inicio;
            pagina <= fim;
            pagina++
        ) {

            criarBotaoPagina(
                pagina
            );

        }


        if (
            fim <
            totalPaginas - 1
        ) {

            criarReticencias();

        }


        criarBotaoPagina(
            totalPaginas
        );

    }


    btnAnterior.disabled =
        paginaAtual === 1;


    btnProxima.disabled =
        paginaAtual ===
        totalPaginas;

}


// =========================
// ROLAR PARA TABELA
// =========================

function rolarParaTabela() {

    const painel =
        document.querySelector(
            '.painel-produtos'
        );


    if (!painel) {
        return;
    }


    const posicao =
        painel
            .getBoundingClientRect()
            .top
        +
        window.scrollY
        -
        110;


    window.scrollTo({
        top: posicao,
        behavior: 'smooth'
    });

}


// =========================
// PESQUISA
// =========================

busca.addEventListener(
    'input',
    () => {

        const termo =
            busca.value
                .trim()
                .toLowerCase();


        produtosFiltrados =
            produtos.filter(
                produto => {

                    const codigo =
                        String(
                            produto.codigo || ''
                        )
                            .toLowerCase();


                    const nome =
                        String(
                            produto.nome || ''
                        )
                            .toLowerCase();


                    const descricao =
                        String(
                            produto.descricao || ''
                        )
                            .toLowerCase();


                    const fabricante =
                        String(
                            produto.codigo_fabricante || ''
                        )
                            .toLowerCase();


                    return (
                        codigo.includes(termo)
                        ||
                        nome.includes(termo)
                        ||
                        descricao.includes(termo)
                        ||
                        fabricante.includes(termo)
                    );

                }
            );


        paginaAtual =
            1;


        produtoSelecionado =
            null;


        renderizarTabela();

    }
);


// =========================
// LEITOR DE CÓDIGO DE BARRAS
// =========================

const abrirScannerProdutosBtn =
    document.getElementById('abrirScannerProdutosBtn');

const fecharScannerProdutosBtn =
    document.getElementById('fecharScannerProdutosBtn');

const scannerProdutosOverlay =
    document.getElementById('scannerProdutosOverlay');

const scannerProdutosStatus =
    document.getElementById('scannerProdutosStatus');

let scannerProdutos = null;
let scannerProdutosAtivo = false;

async function fecharScannerProdutos() {

    scannerProdutosAtivo = false;

    try {
        if (scannerProdutos) {
            await scannerProdutos.stop();
            await scannerProdutos.clear();
        }
    } catch (erro) {
        // O leitor pode já estar parado ao fechar o modal.
    }

    scannerProdutos = null;
    scannerProdutosOverlay.classList.remove('show');
    scannerProdutosOverlay.setAttribute('aria-hidden', 'true');
}

async function abrirScannerProdutos() {

    if (typeof Html5Qrcode === 'undefined') {
        scannerProdutosStatus.textContent = 'O leitor de código não foi carregado. Atualize a página e tente novamente.';
        return;
    }

    scannerProdutosOverlay.classList.add('show');
    scannerProdutosOverlay.setAttribute('aria-hidden', 'false');
    scannerProdutosStatus.textContent = 'Iniciando câmera...';

    const formatos = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODABAR
    ];

    try {
        scannerProdutos = new Html5Qrcode('readerProdutos', { formatsToSupport: formatos });
        scannerProdutosAtivo = true;

        await scannerProdutos.start(
            { facingMode: 'environment' },
            { fps: 15, qrbox: { width: 320, height: 150 } },
            async codigo => {
                if (!scannerProdutosAtivo) return;

                busca.value = String(codigo).trim().replace(/\s/g, '');
                busca.dispatchEvent(new Event('input', { bubbles: true }));
                await fecharScannerProdutos();
                busca.focus();
            },
            () => {}
        );

        scannerProdutosStatus.textContent = 'Centralize o código de barras dentro da área.';
    } catch (erro) {
        console.error('Erro ao abrir leitor de código:', erro);
        scannerProdutosAtivo = false;
        scannerProdutosStatus.textContent = 'Não foi possível acessar a câmera deste dispositivo.';
    }
}

abrirScannerProdutosBtn?.addEventListener('click', abrirScannerProdutos);
fecharScannerProdutosBtn?.addEventListener('click', fecharScannerProdutos);

scannerProdutosOverlay?.addEventListener('click', evento => {
    if (evento.target === scannerProdutosOverlay) fecharScannerProdutos();
});


// =========================
// SETA ANTERIOR
// =========================

btnAnterior.addEventListener(
    'click',
    () => {

        if (
            paginaAtual > 1
        ) {

            paginaAtual--;


            produtoSelecionado =
                null;


            renderizarTabela();


            rolarParaTabela();

        }

    }
);


// =========================
// SETA PRÓXIMA
// =========================

btnProxima.addEventListener(
    'click',
    () => {

        const totalPaginas =
            Math.ceil(
                produtosFiltrados.length /
                produtosPorPagina
            );


        if (
            paginaAtual <
            totalPaginas
        ) {

            paginaAtual++;


            produtoSelecionado =
                null;


            renderizarTabela();


            rolarParaTabela();

        }

    }
);


// =========================
// MODAL
// =========================

function abrirModalProduto() {

    modalNovoProduto.classList.add(
        'aberto'
    );


    document.body.style.overflow =
        'hidden';


    setTimeout(
        () => {

            const campoCodigo =
                document.getElementById(
                    'novoCodigo'
                );


            if (campoCodigo) {

                campoCodigo.focus();

            }

        },
        50
    );

}


function fecharModalProduto() {

    modalNovoProduto.classList.remove(
        'aberto'
    );


    document.body.style.overflow =
        '';

}


// =========================
// NOVO PRODUTO
// =========================

btnNovoProduto.addEventListener(
    'click',
    () => {

        modoFormulario =
            'novo';


        produtoSelecionado =
            null;


        formNovoProduto.reset();


        tituloModal.textContent =
            'Novo Produto';


        btnSalvarProduto.textContent =
            'SALVAR';


        const campoCodigo =
            document.getElementById(
                'novoCodigo'
            );


        campoCodigo.disabled =
            false;


        const campoEstoque =
            document.getElementById(
                'novoEstoque'
            );


        campoEstoque.disabled =
            false;


        campoEstoque.value =
            0;


        abrirModalProduto();

    }
);


// =========================
// ALTERAR PRODUTO
// =========================

btnAlterar.addEventListener(
    'click',
    () => {

        if (!produtoSelecionado) {

            alert(
                'Selecione um produto na tabela para alterá-lo.'
            );

            return;

        }


        modoFormulario =
            'editar';


        tituloModal.textContent =
            'Alterar Produto';

        btnSalvarProduto.textContent =
            'SALVAR ALTERAÇÕES';


        document.getElementById('novoCodigo').value =
            produtoSelecionado.codigo || '';

        document.getElementById('novoCodigo').disabled =
            true;

        document.getElementById('novoNome').value =
            produtoSelecionado.nome || '';

        document.getElementById('novoCodigoFabricante').value =
            produtoSelecionado.codigo_fabricante || '';

        document.getElementById('novoCorredor').value =
            produtoSelecionado.corredor || '';

        document.getElementById('novaPrateleira').value =
            produtoSelecionado.prateleira || '';

        document.getElementById('novaPosicao').value =
            produtoSelecionado.posicao || '';

        document.getElementById('novaOrigem').value =
            produtoSelecionado.origem || '';

        document.getElementById('novaQuantidadeCaixa').value =
            produtoSelecionado.quantidade_por_caixa || 0;

        document.getElementById('novoPreco').value =
            produtoSelecionado.preco_venda || 0;

        document.getElementById('novoEstoqueMinimo').value =
            produtoSelecionado.estoque_minimo || 0;

        document.getElementById('novoEstoque').value =
            produtoSelecionado.estoque_atual || 0;

        document.getElementById('novoEstoque').disabled =
            false;


        abrirModalProduto();

    }
);


// =========================
// FECHAR MODAL
// =========================

btnFecharModal.addEventListener(
    'click',
    fecharModalProduto
);


btnCancelarProduto.addEventListener(
    'click',
    fecharModalProduto
);


modalNovoProduto.addEventListener(
    'click',
    evento => {

        if (
            evento.target ===
            modalNovoProduto
        ) {

            fecharModalProduto();

        }

    }
);


document.addEventListener(
    'keydown',
    evento => {

        if (
            evento.key === 'Escape'
            &&
            modalNovoProduto
                .classList
                .contains('aberto')
        ) {

            fecharModalProduto();

        }

    }
);


// =========================
// SALVAR PRODUTO
// =========================

formNovoProduto.addEventListener(
    'submit',
    async evento => {

        evento.preventDefault();


        const produto = {

            codigo:
                document
                    .getElementById(
                        'novoCodigo'
                    )
                    .value
                    .trim(),

            nome:
                document
                    .getElementById(
                        'novoNome'
                    )
                    .value
                    .trim(),

            codigo_fabricante:
                document
                    .getElementById(
                        'novoCodigoFabricante'
                    )
                    .value
                    .trim(),

            corredor:
                document
                    .getElementById('novoCorredor')
                    .value
                    .trim(),

            prateleira:
                document
                    .getElementById('novaPrateleira')
                    .value
                    .trim(),

            posicao:
                document
                    .getElementById('novaPosicao')
                    .value
                    .trim(),

            origem:
                document
                    .getElementById(
                        'novaOrigem'
                    )
                    .value,

            quantidade_por_caixa:
                Number(
                    document
                        .getElementById(
                            'novaQuantidadeCaixa'
                        )
                        .value || 0
                ),

            preco_venda:
                Number(
                    document
                        .getElementById(
                            'novoPreco'
                        )
                        .value || 0
                ),

            estoque_minimo:
                Number(
                    document
                        .getElementById(
                            'novoEstoqueMinimo'
                        )
                        .value || 0
                ),

         estoque_atual: Number(
    document.getElementById('novoEstoque').value || 0
)

        };


        try {

            let url =
                `${API_URL}/produtos`;


            let metodo =
                'POST';


            if (
                modoFormulario ===
                'editar'
            ) {

                url =
                    `${API_URL}/produtos/${produtoSelecionado.id}`;


                metodo =
                    'PUT';

            }


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
                                produto
                            )
                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok
            ) {

                alert(
                    resultado.mensagem ||
                    'Não foi possível salvar o produto.'
                );

                return;

            }


            if (
                modoFormulario ===
                'editar'
            ) {

                alert(
                    'Produto alterado com sucesso!'
                );

            } else {

                alert(
                    'Produto cadastrado com sucesso!'
                );

            }


            formNovoProduto.reset();


            fecharModalProduto();


            document
                .getElementById(
                    'novoCodigo'
                )
                .disabled =
                false;


            document
                .getElementById(
                    'novoEstoque'
                )
                .disabled =
                false;


            produtoSelecionado =
                null;


            modoFormulario =
                'novo';


            await carregarProdutos();


        } catch (erro) {

            console.error(
                'Erro ao salvar produto:',
                erro
            );


            alert(
                'Não foi possível conectar com o servidor.'
            );

        }

    }
);


// =========================
// INICIAR
// =========================

carregarProdutos();
