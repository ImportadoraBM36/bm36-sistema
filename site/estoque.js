const API_URL =
    'http://localhost:3000/api';


let produtos = [];

let produtosFiltrados = [];

let movimentacoes = [];


let paginaEstoque = 1;

let paginaHistorico = 1;


const itensPorPagina =
    20;


let produtoSelecionado =
    null;


let filtroAtual =
    'todos';
// ============================================================
// SINCRONIZAR TEMA DA PÁGINA DE EVENTOS
// ============================================================

function sincronizarTemaEventos() {

    const temaAntigo =
        localStorage.getItem(
            'bm36-tema'
        );

    const temaNovo =
        localStorage.getItem(
            'bm36_theme'
        );


    const escuro =
        temaAntigo === 'escuro'
        ||
        temaNovo === 'dark';


    document.body.classList.toggle(
        'tema-escuro',
        escuro
    );

}
const botaoTemaEventos =
    document.getElementById(
        'themeToggle'
    );


if (botaoTemaEventos) {

    botaoTemaEventos.addEventListener(
        'click',
        () => {

            setTimeout(
                sincronizarTemaEventos,
                50
            );

        }
    );

}


sincronizarTemaEventos();

// =========================
// ELEMENTOS
// =========================

const tabelaEstoque =
    document.getElementById(
        'tabelaEstoque'
    );


const tabelaHistorico =
    document.getElementById(
        'tabelaHistorico'
    );


const buscaEstoque =
    document.getElementById(
        'buscaEstoque'
    );


const contadorEstoque =
    document.getElementById(
        'contadorEstoque'
    );


const contadorHistorico =
    document.getElementById(
        'contadorHistorico'
    );


const paginasEstoque =
    document.getElementById(
        'paginasEstoque'
    );


const paginasHistorico =
    document.getElementById(
        'paginasHistorico'
    );


const estoqueAnterior =
    document.getElementById(
        'estoqueAnterior'
    );


const estoqueProximo =
    document.getElementById(
        'estoqueProximo'
    );


const historicoAnterior =
    document.getElementById(
        'historicoAnterior'
    );


const historicoProximo =
    document.getElementById(
        'historicoProximo'
    );


const filtrosEstoque =
    document.querySelectorAll(
        '.filtro-estoque'
    );


// =========================
// MODAL
// =========================

const btnMovimentarEstoque =
    document.getElementById(
        'btnMovimentarEstoque'
    );


const modalMovimentarEstoque =
    document.getElementById(
        'modalMovimentarEstoque'
    );


const btnFecharModalEstoque =
    document.getElementById(
        'btnFecharModalEstoque'
    );


const btnCancelarMovimentacao =
    document.getElementById(
        'btnCancelarMovimentacao'
    );


const formMovimentarEstoque =
    document.getElementById(
        'formMovimentarEstoque'
    );


const produtoMovimentacao =
    document.getElementById(
        'produtoMovimentacao'
    );


const estoqueAtualModal =
    document.getElementById(
        'estoqueAtualModal'
    );


const tipoMovimentacao =
    document.getElementById(
        'tipoMovimentacao'
    );


const quantidadeMovimentacao =
    document.getElementById(
        'quantidadeMovimentacao'
    );


const motivoMovimentacao =
    document.getElementById(
        'motivoMovimentacao'
    );


// =========================
// CARREGAR PRODUTOS
// =========================

async function carregarEstoque() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/produtos`
            );


        if (!resposta.ok) {

            throw new Error(
                'Erro ao carregar produtos.'
            );

        }


        produtos =
            await resposta.json();


        aplicarFiltros();


    } catch (erro) {

        console.error(
            'Erro ao carregar estoque:',
            erro
        );


        tabelaEstoque.innerHTML = `
            <tr>
                <td colspan="7">
                    Não foi possível carregar o estoque.
                </td>
            </tr>
        `;

    }

}


// =========================
// FILTRAR PRODUTOS
// =========================

function aplicarFiltros() {

    const termo =
        buscaEstoque
            .value
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


                const origem =
                    String(
                        produto.origem || ''
                    )
                        .toLowerCase();


                const embalagem =
                    String(
                        produto.quantidade_por_caixa || ''
                    )
                        .toLowerCase();


                const estoque =
                    Number(
                        produto.estoque_atual || 0
                    );


                const minimo =
                    Number(
                        produto.estoque_minimo || 0
                    );


                const correspondeBusca =
                    codigo.includes(termo)
                    ||
                    nome.includes(termo)
                    ||
                    origem.includes(termo)
                    ||
                    embalagem.includes(termo);


                let correspondeFiltro =
                    true;


                if (
                    filtroAtual ===
                    'baixo'
                ) {

                    correspondeFiltro =
                        estoque > 0
                        &&
                        estoque <= minimo;

                }


                if (
                    filtroAtual ===
                    'sem'
                ) {

                    correspondeFiltro =
                        estoque <= 0;

                }


                return (
                    correspondeBusca
                    &&
                    correspondeFiltro
                );

            }
        );


    paginaEstoque =
        1;


    produtoSelecionado =
        null;


    renderizarEstoque();

}


// =========================
// BOTÕES DOS FILTROS
// =========================

filtrosEstoque.forEach(
    botao => {

        botao.addEventListener(
            'click',
            () => {

                filtrosEstoque.forEach(
                    item => {

                        item.classList.remove(
                            'ativo'
                        );

                    }
                );


                botao.classList.add(
                    'ativo'
                );


                filtroAtual =
                    botao.dataset.filtro;


                aplicarFiltros();

            }
        );

    }
);


// =========================
// BUSCA
// =========================

buscaEstoque.addEventListener(
    'input',
    aplicarFiltros
);


// =========================
// RENDERIZAR ESTOQUE
// =========================

function renderizarEstoque() {

    tabelaEstoque.innerHTML =
        '';


    const inicio =
        (paginaEstoque - 1)
        *
        itensPorPagina;


    const fim =
        inicio
        +
        itensPorPagina;


    const pagina =
        produtosFiltrados.slice(
            inicio,
            fim
        );


    if (
        pagina.length === 0
    ) {

        tabelaEstoque.innerHTML = `
            <tr>
                <td colspan="7">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;


        atualizarRodapeEstoque();

        return;

    }


    pagina.forEach(
        produto => {

            const estoque =
                Number(
                    produto.estoque_atual || 0
                );


            const minimo =
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
            // STATUS
            // =========================

            let status =
                'NORMAL';


            let classe =
                'normal';


            if (
                estoque <= 0
            ) {

                status =
                    'SEM ESTOQUE';


                classe =
                    'sem-estoque';


            } else if (
                estoque <= minimo
            ) {

                status =
                    'ESTOQUE BAIXO';


                classe =
                    'baixo';

            }


            const linha =
                document.createElement(
                    'tr'
                );


            linha.innerHTML = `

                <td>
                    ${produto.codigo || '-'}
                </td>

                <td>
                    ${produto.nome || '-'}
                </td>

                <td>
                    ${produto.origem || '-'}
                </td>

                <td class="embalagem-estoque">
                    ${embalagem}
                </td>

                <td>
                    ${estoque}
                </td>

                <td>
                    ${minimo}
                </td>

                <td>

                    <span class="status ${classe}">
                        ${status}
                    </span>

                </td>
            `;


            // =========================
            // SELECIONAR PRODUTO
            // =========================

            linha.addEventListener(
                'click',
                () => {

                    document
                        .querySelectorAll(
                            '.tabela-estoque tbody tr'
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


            tabelaEstoque.appendChild(
                linha
            );

        }
    );


    atualizarRodapeEstoque();

}


// =========================
// RODAPÉ ESTOQUE
// =========================

function atualizarRodapeEstoque() {

    const total =
        produtosFiltrados.length;


    if (
        total === 0
    ) {

        contadorEstoque.textContent =
            'Nenhum produto encontrado';


        paginasEstoque.innerHTML =
            '';


        estoqueAnterior.disabled =
            true;


        estoqueProximo.disabled =
            true;


        return;

    }


    const totalPaginas =
        Math.ceil(
            total /
            itensPorPagina
        );


    const inicio =
        (paginaEstoque - 1)
        *
        itensPorPagina
        +
        1;


    const fim =
        Math.min(
            paginaEstoque
            *
            itensPorPagina,
            total
        );


    contadorEstoque.textContent =
        `Mostrando ${inicio}–${fim} de ${total} produtos`;


    renderizarPaginasEstoque(
        totalPaginas
    );

}


// =========================
// PAGINAÇÃO ESTOQUE
// =========================

function renderizarPaginasEstoque(
    totalPaginas
) {

    paginasEstoque.innerHTML =
        '';


    let inicio =
        Math.max(
            1,
            paginaEstoque - 2
        );


    let fim =
        Math.min(
            totalPaginas,
            paginaEstoque + 2
        );


    if (
        paginaEstoque <= 3
    ) {

        inicio =
            1;


        fim =
            Math.min(
                5,
                totalPaginas
            );

    }


    if (
        paginaEstoque >=
        totalPaginas - 2
    ) {

        inicio =
            Math.max(
                1,
                totalPaginas - 4
            );


        fim =
            totalPaginas;

    }


    for (
        let pagina = inicio;
        pagina <= fim;
        pagina++
    ) {

        const botao =
            document.createElement(
                'button'
            );


        botao.textContent =
            pagina;


        if (
            pagina ===
            paginaEstoque
        ) {

            botao.classList.add(
                'ativa'
            );

        }


        botao.addEventListener(
            'click',
            () => {

                paginaEstoque =
                    pagina;


                produtoSelecionado =
                    null;


                renderizarEstoque();

            }
        );


        paginasEstoque.appendChild(
            botao
        );

    }


    estoqueAnterior.disabled =
        paginaEstoque === 1;


    estoqueProximo.disabled =
        paginaEstoque ===
        totalPaginas;

}


// =========================
// SETA ANTERIOR ESTOQUE
// =========================

estoqueAnterior.addEventListener(
    'click',
    () => {

        if (
            paginaEstoque > 1
        ) {

            paginaEstoque--;


            produtoSelecionado =
                null;


            renderizarEstoque();

        }

    }
);


// =========================
// SETA PRÓXIMA ESTOQUE
// =========================

estoqueProximo.addEventListener(
    'click',
    () => {

        const totalPaginas =
            Math.ceil(
                produtosFiltrados.length
                /
                itensPorPagina
            );


        if (
            paginaEstoque <
            totalPaginas
        ) {

            paginaEstoque++;


            produtoSelecionado =
                null;


            renderizarEstoque();

        }

    }
);


// ============================================================
// HISTÓRICO
// ============================================================


// =========================
// CARREGAR HISTÓRICO
// =========================

async function carregarHistorico() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/estoque/movimentacoes`
            );


        if (!resposta.ok) {

            throw new Error(
                'Erro ao carregar movimentações.'
            );

        }


        movimentacoes =
            await resposta.json();


        paginaHistorico =
            1;


        renderizarHistorico();


    } catch (erro) {

        console.error(
            'Erro histórico:',
            erro
        );


        tabelaHistorico.innerHTML = `
            <tr>
                <td colspan="5">
                    Não foi possível carregar o histórico.
                </td>
            </tr>
        `;

    }

}


// =========================
// RENDERIZAR HISTÓRICO
// =========================

function renderizarHistorico() {

    tabelaHistorico.innerHTML =
        '';


    const inicio =
        (paginaHistorico - 1)
        *
        itensPorPagina;


    const fim =
        inicio
        +
        itensPorPagina;


    const pagina =
        movimentacoes.slice(
            inicio,
            fim
        );


    if (
        pagina.length === 0
    ) {

        tabelaHistorico.innerHTML = `
            <tr>
                <td colspan="5">
                    Nenhuma movimentação encontrada.
                </td>
            </tr>
        `;


        atualizarRodapeHistorico();

        return;

    }


    pagina.forEach(
        movimento => {

            const linha =
                document.createElement(
                    'tr'
                );


            const data =
                new Date(
                    movimento.criado_em
                )
                    .toLocaleString(
                        'pt-BR'
                    );


            const quantidade =
                Number(
                    movimento.quantidade || 0
                );


            const negativo =
                [
                    'SAIDA',
                    'VENDA',
                    'AJUSTE_NEGATIVO'
                ]
                    .includes(
                        movimento.tipo
                    );


            const sinal =
                negativo
                    ? '-'
                    : '+';


            linha.innerHTML = `

                <td>
                    ${data}
                </td>

                <td>
                    ${movimento.produto_nome || '-'}
                </td>

                <td>
                    ${movimento.tipo || '-'}
                </td>

                <td>
                    ${sinal}${quantidade}
                </td>

                <td>
                    ${movimento.motivo || '-'}
                </td>
            `;


            tabelaHistorico.appendChild(
                linha
            );

        }
    );


    atualizarRodapeHistorico();

}


// =========================
// RODAPÉ HISTÓRICO
// =========================

function atualizarRodapeHistorico() {

    const total =
        movimentacoes.length;


    if (
        total === 0
    ) {

        contadorHistorico.textContent =
            'Nenhuma movimentação';


        paginasHistorico.innerHTML =
            '';


        historicoAnterior.disabled =
            true;


        historicoProximo.disabled =
            true;


        return;

    }


    const totalPaginas =
        Math.ceil(
            total /
            itensPorPagina
        );


    const inicio =
        (paginaHistorico - 1)
        *
        itensPorPagina
        +
        1;


    const fim =
        Math.min(
            paginaHistorico
            *
            itensPorPagina,
            total
        );


    contadorHistorico.textContent =
        `Mostrando ${inicio}–${fim} de ${total} movimentações`;


    paginasHistorico.innerHTML =
        '';


    let paginaInicial =
        Math.max(
            1,
            paginaHistorico - 2
        );


    let paginaFinal =
        Math.min(
            totalPaginas,
            paginaHistorico + 2
        );


    if (
        paginaHistorico <= 3
    ) {

        paginaInicial =
            1;


        paginaFinal =
            Math.min(
                5,
                totalPaginas
            );

    }


    if (
        paginaHistorico >=
        totalPaginas - 2
    ) {

        paginaInicial =
            Math.max(
                1,
                totalPaginas - 4
            );


        paginaFinal =
            totalPaginas;

    }


    for (
        let pagina = paginaInicial;
        pagina <= paginaFinal;
        pagina++
    ) {

        const botao =
            document.createElement(
                'button'
            );


        botao.textContent =
            pagina;


        if (
            pagina ===
            paginaHistorico
        ) {

            botao.classList.add(
                'ativa'
            );

        }


        botao.addEventListener(
            'click',
            () => {

                paginaHistorico =
                    pagina;


                renderizarHistorico();

            }
        );


        paginasHistorico.appendChild(
            botao
        );

    }


    historicoAnterior.disabled =
        paginaHistorico === 1;


    historicoProximo.disabled =
        paginaHistorico ===
        totalPaginas;

}


// =========================
// SETA ANTERIOR HISTÓRICO
// =========================

historicoAnterior.addEventListener(
    'click',
    () => {

        if (
            paginaHistorico > 1
        ) {

            paginaHistorico--;


            renderizarHistorico();

        }

    }
);


// =========================
// SETA PRÓXIMA HISTÓRICO
// =========================

historicoProximo.addEventListener(
    'click',
    () => {

        const totalPaginas =
            Math.ceil(
                movimentacoes.length
                /
                itensPorPagina
            );


        if (
            paginaHistorico <
            totalPaginas
        ) {

            paginaHistorico++;


            renderizarHistorico();

        }

    }
);


// ============================================================
// MODAL
// ============================================================


// =========================
// ABRIR MODAL
// =========================

function abrirModalEstoque() {

    if (
        !produtoSelecionado
    ) {

        alert(
            'Selecione um produto na tabela primeiro.'
        );


        return;

    }


    produtoMovimentacao.value =
        `${produtoSelecionado.codigo} - ${produtoSelecionado.nome}`;


    produtoMovimentacao.disabled =
        true;


    estoqueAtualModal.textContent =
        Number(
            produtoSelecionado.estoque_atual || 0
        );


    modalMovimentarEstoque
        .classList
        .add(
            'aberto'
        );


    document.body.style.overflow =
        'hidden';

}


// =========================
// FECHAR MODAL
// =========================

function fecharModalEstoque() {

    modalMovimentarEstoque
        .classList
        .remove(
            'aberto'
        );


    document.body.style.overflow =
        '';

}


// =========================
// EVENTOS MODAL
// =========================

btnMovimentarEstoque
    .addEventListener(
        'click',
        abrirModalEstoque
    );


btnFecharModalEstoque
    .addEventListener(
        'click',
        fecharModalEstoque
    );


btnCancelarMovimentacao
    .addEventListener(
        'click',
        fecharModalEstoque
    );


modalMovimentarEstoque
    .addEventListener(
        'click',
        evento => {

            if (
                evento.target ===
                modalMovimentarEstoque
            ) {

                fecharModalEstoque();

            }

        }
    );


// =========================
// ESC FECHA MODAL
// =========================

document.addEventListener(
    'keydown',
    evento => {

        if (
            evento.key === 'Escape'
            &&
            modalMovimentarEstoque
                .classList
                .contains('aberto')
        ) {

            fecharModalEstoque();

        }

    }
);


// ============================================================
// SALVAR MOVIMENTAÇÃO
// ============================================================

formMovimentarEstoque
    .addEventListener(
        'submit',
        async evento => {

            evento.preventDefault();


            if (
                !produtoSelecionado
            ) {

                return;

            }


            const quantidade =
                Number(
                    quantidadeMovimentacao
                        .value
                );


            if (
                Number.isNaN(
                    quantidade
                )
                ||
                quantidade <= 0
            ) {

                alert(
                    'Informe uma quantidade válida.'
                );


                return;

            }


            const dados = {

                produto_id:
                    produtoSelecionado.id,

                tipo:
                    tipoMovimentacao.value,

                quantidade:
                    quantidade,

                motivo:
                    motivoMovimentacao
                        .value
                        .trim()

            };


            try {

                const resposta =
                    await fetch(
                        `${API_URL}/estoque/movimentacoes`,
                        {
                            method:
                                'POST',

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


                if (
                    !resposta.ok
                ) {

                    alert(
                        resultado.mensagem
                        ||
                        'Erro ao registrar movimentação.'
                    );


                    return;

                }


                alert(
                    'Movimentação registrada com sucesso!'
                );


                formMovimentarEstoque
                    .reset();


                fecharModalEstoque();


                produtoSelecionado =
                    null;


                await carregarEstoque();


                await carregarHistorico();


            } catch (erro) {

                console.error(
                    'Erro ao registrar movimentação:',
                    erro
                );


                alert(
                    'Erro ao conectar com o servidor.'
                );

            }

        }
    );


// ============================================================
// INICIAR
// ============================================================

carregarEstoque();

carregarHistorico();