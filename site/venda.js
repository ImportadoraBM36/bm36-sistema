const API_URL =
    'https://bm36-sistema-production.up.railway.app/api';
// ============================================================
// ESTADO
// ============================================================

let clientes = [];

let clienteSelecionado =
    null;

let catalog = [];

let produtosFiltradosVenda =
    [];

let paginaProdutosVenda =
    1;


function itensPorPaginaVenda() {

    return window.matchMedia(
        '(max-width: 700px)'
    ).matches
        ? 4
        : 6;

}


let listaProdutosCompacta =
    window.matchMedia(
        '(max-width: 700px)'
    ).matches;


let cart =
    [];


// ============================================================
// ELEMENTOS
// ============================================================

const clienteSearch =
    document.getElementById(
        'clienteSearch'
    );


const clientesResultados =
    document.getElementById(
        'clientesResultados'
    );


const clienteSelecionadoBox =
    document.getElementById(
        'clienteSelecionadoBox'
    );


const resumoCliente =
    document.getElementById(
        'resumoCliente'
    );


const productSearch =
    document.getElementById(
        'productSearch'
    );


const productsBody =
    document.getElementById(
        'productsBody'
    );


const itemsBody =
    document.getElementById(
        'itemsBody'
    );


const emptyNote =
    document.getElementById(
        'emptyNote'
    );


const contadorProdutosVenda =
    document.getElementById(
        'contadorProdutosVenda'
    );


const paginasProdutosVenda =
    document.getElementById(
        'paginasProdutosVenda'
    );


const produtoAnterior =
    document.getElementById(
        'produtoAnterior'
    );


const produtoProximo =
    document.getElementById(
        'produtoProximo'
    );


const finalizarBtn =
    document.getElementById(
        'finalizarBtn'
    );


const cancelarBtn =
    document.getElementById(
        'cancelarBtn'
    );


// ============================================================
// MODAL
// ============================================================

const modalAviso =
    document.getElementById(
        'modalAviso'
    );


const modalAvisoTitulo =
    document.getElementById(
        'modalAvisoTitulo'
    );


const modalAvisoMensagem =
    document.getElementById(
        'modalAvisoMensagem'
    );


const btnFecharModalAviso =
    document.getElementById(
        'btnFecharModalAviso'
    );


const btnCancelarModalAviso =
    document.getElementById(
        'btnCancelarModalAviso'
    );


const btnConfirmarModalAviso =
    document.getElementById(
        'btnConfirmarModalAviso'
    );


let acaoConfirmadaModal =
    null;


// ============================================================
// MODAL
// ============================================================

function abrirModalAviso({

    titulo = 'Atenção',

    mensagem = '',

    textoConfirmar = 'OK',

    mostrarCancelar = false,

    aoConfirmar = null

}) {

    modalAvisoTitulo.textContent =
        titulo;


    modalAvisoMensagem.textContent =
        mensagem;


    btnConfirmarModalAviso.textContent =
        textoConfirmar;


    btnCancelarModalAviso.style.display =
        mostrarCancelar
            ? 'inline-flex'
            : 'none';


    btnConfirmarModalAviso.disabled =
        false;


    acaoConfirmadaModal =
        aoConfirmar;


    modalAviso
        .classList
        .add(
            'aberto'
        );


    document.body.style.overflow =
        'hidden';

}


function fecharModalAviso() {

    modalAviso
        .classList
        .remove(
            'aberto'
        );


    document.body.style.overflow =
        '';


    acaoConfirmadaModal =
        null;

}


btnFecharModalAviso
    .addEventListener(
        'click',
        fecharModalAviso
    );


btnCancelarModalAviso
    .addEventListener(
        'click',
        fecharModalAviso
    );


btnConfirmarModalAviso
    .addEventListener(
        'click',
        () => {

            const acao =
                acaoConfirmadaModal;


            fecharModalAviso();


            if (
                typeof acao ===
                'function'
            ) {

                acao();

            }

        }
    );


modalAviso.addEventListener(
    'click',
    evento => {

        if (
            evento.target ===
            modalAviso
        ) {

            fecharModalAviso();

        }

    }
);


document.addEventListener(
    'keydown',
    evento => {

        if (
            evento.key ===
            'Escape'
            &&
            modalAviso
                .classList
                .contains(
                    'aberto'
                )
        ) {

            fecharModalAviso();

        }

    }
);


// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function fmt(
    valor
) {

    return Number(
        valor || 0
    )
        .toLocaleString(
            'pt-BR',
            {
                style:
                    'currency',

                currency:
                    'BRL'
            }
        );

}


function formatarDocumento(
    documento
) {

    if (!documento) {

        return '-';

    }


    const numeros =
        String(
            documento
        )
            .replace(
                /\D/g,
                ''
            );


    if (
        numeros.length ===
        11
    ) {

        return numeros.replace(
            /(\d{3})(\d{3})(\d{3})(\d{2})/,
            '$1.$2.$3-$4'
        );

    }


    if (
        numeros.length ===
        14
    ) {

        return numeros.replace(
            /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            '$1.$2.$3/$4-$5'
        );

    }


    return documento;

}


function textoEmbalagem(
    quantidade
) {

    const qtd =
        Number(
            quantidade || 0
        );


    if (
        qtd <= 0
    ) {

        return '-';

    }


    return `${qtd} un./caixa`;

}


// ============================================================
// CLIENTES
// ============================================================

async function carregarClientes() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/clientes`
            );


        if (
            !resposta.ok
        ) {

            throw new Error(
                'Erro ao carregar clientes.'
            );

        }


        clientes =
            await resposta.json();


    } catch (erro) {

        console.error(
            'Erro clientes:',
            erro
        );


        abrirModalAviso({

            titulo:
                'Erro ao carregar clientes',

            mensagem:
                'Não foi possível carregar os clientes.',

            textoConfirmar:
                'FECHAR'

        });

    }

}


// ============================================================
// BUSCAR CLIENTE
// ============================================================

clienteSearch.addEventListener(
    'input',
    () => {

        const termo =
            clienteSearch
                .value
                .trim()
                .toLowerCase();


        if (
            !termo
        ) {

            clientesResultados
                .classList
                .remove(
                    'aberto'
                );


            clientesResultados.innerHTML =
                '';


            return;

        }


        const termoDocumento =
            termo.replace(
                /\D/g,
                ''
            );


        const resultado =
            clientes
                .filter(
                    cliente => {

                        const nome =
                            String(
                                cliente.nome ||
                                ''
                            )
                                .toLowerCase();


                        const documento =
                            String(
                                cliente.documento ||
                                ''
                            )
                                .replace(
                                    /\D/g,
                                    ''
                                );


                        return (
                            nome.includes(
                                termo
                            )
                            ||
                            (
                                termoDocumento
                                &&
                                documento.includes(
                                    termoDocumento
                                )
                            )
                        );

                    }
                )
                .slice(
                    0,
                    10
                );


        renderizarClientes(
            resultado
        );

    }
);


// ============================================================
// RENDER CLIENTES
// ============================================================

function renderizarClientes(
    lista
) {

    clientesResultados.innerHTML =
        '';


    if (
        lista.length ===
        0
    ) {

        clientesResultados.innerHTML = `
            <div class="cliente-resultado">
                Nenhum cliente encontrado.
            </div>
        `;


        clientesResultados
            .classList
            .add(
                'aberto'
            );


        return;

    }


    lista.forEach(
        cliente => {

            const item =
                document.createElement(
                    'div'
                );


            item.className =
                'cliente-resultado';


            const clienteAtivo =
                cliente.ativo ===
                true;


            item.innerHTML = `

                <div class="cliente-resultado-info">

                    <span class="cliente-resultado-nome">
                        ${cliente.nome}
                    </span>

                    <span class="cliente-resultado-documento">
                        ${formatarDocumento(
                            cliente.documento
                        )}
                    </span>

                </div>


                <span class="cliente-resultado-categoria">

                    ${
                        clienteAtivo
                            ? 'ATIVO'
                            : 'INATIVO'
                    }

                </span>
            `;


            item.addEventListener(
                'click',
                () => {

                    selecionarCliente(
                        cliente
                    );

                }
            );


            clientesResultados
                .appendChild(
                    item
                );

        }
    );


    clientesResultados
        .classList
        .add(
            'aberto'
        );

}


// ============================================================
// SELECIONAR CLIENTE
// ============================================================

function selecionarCliente(
    cliente
) {

    clienteSelecionado =
        cliente;


    clienteSearch.value =
        '';


    clientesResultados
        .classList
        .remove(
            'aberto'
        );


    clientesResultados.innerHTML =
        '';


    const clienteAtivo =
        cliente.ativo ===
        true;


    clienteSelecionadoBox.innerHTML = `

        <div class="cliente-selecionado">

            <div class="cliente-selecionado-info">

                <span class="cliente-selecionado-nome">
                    ${cliente.nome}
                </span>


                <div class="cliente-selecionado-detalhes">

                    <span>
                        ${formatarDocumento(
                            cliente.documento
                        )}
                    </span>

                    <span>
                        ${
                            cliente.telefone ||
                            'Sem telefone'
                        }
                    </span>

                    <span>
                        ${
                            clienteAtivo
                                ? 'ATIVO'
                                : 'INATIVO'
                        }
                    </span>

                </div>

            </div>


            <button
                id="btnTrocarCliente"
                class="btn-trocar-cliente"
                type="button"
            >
                TROCAR CLIENTE
            </button>

        </div>
    `;


    resumoCliente.textContent =
        cliente.nome;


    document
        .getElementById(
            'btnTrocarCliente'
        )
        .addEventListener(
            'click',
            removerClienteSelecionado
        );

}


// ============================================================
// REMOVER CLIENTE
// ============================================================

function removerClienteSelecionado() {

    clienteSelecionado =
        null;


    resumoCliente.textContent =
        'Nenhum selecionado';


    clienteSelecionadoBox.innerHTML = `

        <div class="cliente-vazio">

            <span>
                Nenhum cliente selecionado.
            </span>

            <small>
                Pesquise acima para selecionar um cliente.
            </small>

        </div>
    `;

}


// ============================================================
// PRODUTOS
// ============================================================

async function carregarProdutos() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/produtos`
            );


        if (
            !resposta.ok
        ) {

            throw new Error(
                'Erro ao carregar produtos.'
            );

        }


        const dados =
            await resposta.json();


        catalog =
            dados.map(
                produto => ({

                    id:
                        produto.id,

                    code:
                        String(
                            produto.codigo ||
                            ''
                        ),

                    /*
                     * Código de barras / código do fabricante.
                     *
                     * Mantemos várias possibilidades porque
                     * o backend pode retornar o campo com
                     * nomes diferentes.
                     */
                    manufacturerCode:
                        String(
                            produto.manufacturerCode ||
                            produto.manufacturer_code ||
                            produto.codigo_fabricante ||
                            produto.codigo_barras ||
                            produto.barcode ||
                            ''
                        ),

                    name:
                        produto.nome ||
                        '-',

                    origin:
                        produto.origem ||
                        '-',

                    price:
                        Number(
                            produto.preco_venda ||
                            0
                        ),

                    stock:
                        Number(
                            produto.estoque_atual ||
                            0
                        ),

                    packageSize:
                        Number(
                            produto.quantidade_por_caixa ||
                            0
                        )

                })
            );


        produtosFiltradosVenda =
            [...catalog];


        paginaProdutosVenda =
            1;


        renderProducts();


    } catch (erro) {

        console.error(
            'Erro produtos:',
            erro
        );


        productsBody.innerHTML = `

            <tr>

                <td colspan="6">
                    Não foi possível carregar os produtos.
                </td>

            </tr>
        `;

    }

}


// ============================================================
// FILTRAR / RENDERIZAR PRODUTOS
// ============================================================

function renderProducts() {

    const termo =
        productSearch
            .value
            .trim()
            .toLowerCase();


    produtosFiltradosVenda =
        catalog.filter(
            produto => {

                return (
                    produto.name
                        .toLowerCase()
                        .includes(
                            termo
                        )
                    ||
                    produto.code
                        .toLowerCase()
                        .includes(
                            termo
                        )
                    ||
                    produto.manufacturerCode
                        .toLowerCase()
                        .includes(
                            termo
                        )
                    ||
                    produto.origin
                        .toLowerCase()
                        .includes(
                            termo
                        )
                );

            }
        );


    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                produtosFiltradosVenda.length
                /
                itensPorPaginaVenda()
            )
        );


    if (
        paginaProdutosVenda >
        totalPaginas
    ) {

        paginaProdutosVenda =
            totalPaginas;

    }


    productsBody.innerHTML =
        '';


    const inicio =
        (
            paginaProdutosVenda -
            1
        )
        *
        itensPorPaginaVenda();


    const fim =
        inicio +
        itensPorPaginaVenda();


    const pagina =
        produtosFiltradosVenda.slice(
            inicio,
            fim
        );


    if (
        pagina.length ===
        0
    ) {

        productsBody.innerHTML = `

            <tr>

                <td colspan="6">
                    Nenhum produto encontrado.
                </td>

            </tr>
        `;


        atualizarPaginacaoProdutosVenda();

        return;

    }


    pagina.forEach(
        produto => {

            const tr =
                document.createElement(
                    'tr'
                );


            const semEstoque =
                produto.stock <=
                0;


            tr.innerHTML = `

                <td class="code">
                    ${produto.code}
                </td>


                <td class="name">
                    ${produto.name}
                </td>


                <td class="embalagem-venda">
                    ${textoEmbalagem(
                        produto.packageSize
                    )}
                </td>


                <td>
                    ${fmt(
                        produto.price
                    )}
                </td>


                <td class="est">

                    <div class="estoque-venda-info">

                        <span>
                            ${produto.stock}
                        </span>


                        ${
                            semEstoque
                                ? `
                                    <span class="aviso-sem-estoque">
                                        SEM ESTOQUE
                                    </span>
                                `
                                : ''
                        }

                    </div>

                </td>


                <td>

                    <button
                        class="add-btn ${
                            semEstoque
                                ? 'add-btn-sem-estoque'
                                : ''
                        }"
                        data-id="${produto.id}"
                        type="button"
                    >
                        +
                    </button>

                </td>
            `;


            productsBody.appendChild(
                tr
            );

        }
    );


    atualizarPaginacaoProdutosVenda();

}

// ============================================================
// BUSCA
// ============================================================

productSearch.addEventListener(
    'input',
    () => {

        paginaProdutosVenda =
            1;


        renderProducts();

    }
);


window.addEventListener(
    'resize',
    () => {

        const modoCompactoAtual =
            window.matchMedia(
                '(max-width: 700px)'
            ).matches;

        if (
            modoCompactoAtual ===
            listaProdutosCompacta
        ) {
            return;
        }

        listaProdutosCompacta =
            modoCompactoAtual;

        paginaProdutosVenda =
            1;

        if (catalog.length) {
            renderProducts();
        }

    }
);


// ============================================================
// PAGINAÇÃO
// ============================================================

function atualizarPaginacaoProdutosVenda() {

    const total =
        produtosFiltradosVenda.length;


    if (
        total ===
        0
    ) {

        contadorProdutosVenda.textContent =
            'Nenhum produto';


        paginasProdutosVenda.innerHTML =
            '';


        produtoAnterior.disabled =
            true;


        produtoProximo.disabled =
            true;


        return;

    }


    const totalPaginas =
        Math.ceil(
            total /
            itensPorPaginaVenda()
        );


    const inicio =
        (
            paginaProdutosVenda -
            1
        )
        *
        itensPorPaginaVenda()
        +
        1;


    const fim =
        Math.min(
            paginaProdutosVenda
            *
            itensPorPaginaVenda(),
            total
        );


    contadorProdutosVenda.textContent =
        `Mostrando ${inicio}–${fim} de ${total} produtos`;


    paginasProdutosVenda.innerHTML =
        '';


    let inicial =
        Math.max(
            1,
            paginaProdutosVenda -
            2
        );


    let final =
        Math.min(
            totalPaginas,
            paginaProdutosVenda +
            2
        );


    if (
        paginaProdutosVenda <=
        3
    ) {

        inicial =
            1;


        final =
            Math.min(
                5,
                totalPaginas
            );

    }


    if (
        paginaProdutosVenda >=
        totalPaginas -
        2
    ) {

        inicial =
            Math.max(
                1,
                totalPaginas -
                4
            );


        final =
            totalPaginas;

    }


    for (
        let pagina =
            inicial;
        pagina <= final;
        pagina++
    ) {

        const btn =
            document.createElement(
                'button'
            );


        btn.type =
            'button';


        btn.textContent =
            pagina;


        if (
            pagina ===
            paginaProdutosVenda
        ) {

            btn.classList.add(
                'ativa'
            );

        }


        btn.addEventListener(
            'click',
            () => {

                paginaProdutosVenda =
                    pagina;


                renderProducts();

            }
        );


        paginasProdutosVenda
            .appendChild(
                btn
            );

    }


    produtoAnterior.disabled =
        paginaProdutosVenda ===
        1;


    produtoProximo.disabled =
        paginaProdutosVenda ===
        totalPaginas;

}


produtoAnterior.addEventListener(
    'click',
    () => {

        if (
            paginaProdutosVenda >
            1
        ) {

            paginaProdutosVenda--;

            renderProducts();

        }

    }
);


produtoProximo.addEventListener(
    'click',
    () => {

        const totalPaginas =
            Math.ceil(
                produtosFiltradosVenda.length
                /
                itensPorPaginaVenda()
            );


        if (
            paginaProdutosVenda <
            totalPaginas
        ) {

            paginaProdutosVenda++;

            renderProducts();

        }

    }
);


// ============================================================
// ADICIONAR PRODUTO
// ============================================================

const modalQuantidade =
    document.getElementById(
        'modalQuantidade'
    );

const modalQuantidadeNome =
    document.getElementById('modalQuantidadeNome');

const modalQuantidadeCodigo =
    document.getElementById('modalQuantidadeCodigo');

const modalQuantidadeEmbalagem =
    document.getElementById('modalQuantidadeEmbalagem');

const modalQuantidadePreco =
    document.getElementById('modalQuantidadePreco');

const modalQuantidadeEstoque =
    document.getElementById('modalQuantidadeEstoque');

const inputQuantidadeProduto =
    document.getElementById('inputQuantidadeProduto');

const btnFecharModalQuantidade =
    document.getElementById('btnFecharModalQuantidade');

const btnCancelarModalQuantidade =
    document.getElementById('btnCancelarModalQuantidade');

const btnAdicionarModalQuantidade =
    document.getElementById('btnAdicionarModalQuantidade');

let produtoParaAdicionar =
    null;


function fecharModalQuantidade() {

    modalQuantidade.classList.remove('aberto');
    modalQuantidade.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';

    produtoParaAdicionar = null;

}


function abrirModalQuantidade(produto) {

    produtoParaAdicionar = produto;

    modalQuantidadeNome.textContent =
        produto.name || 'Produto';

    modalQuantidadeCodigo.textContent =
        `Código: ${produto.code || produto.manufacturerCode || '-'}`;

    modalQuantidadeEmbalagem.textContent =
        textoEmbalagem(produto.packageSize);

    modalQuantidadePreco.textContent =
        fmt(produto.price);

    modalQuantidadeEstoque.textContent =
        `Estoque atual: ${Number(produto.stock || 0)}`;

    modalQuantidadeEstoque.classList.toggle(
        'sem-estoque',
        Number(produto.stock || 0) <= 0
    );

    inputQuantidadeProduto.value = 1;

    modalQuantidade.classList.add('aberto');
    modalQuantidade.setAttribute('aria-hidden', 'false');

    document.body.style.overflow = 'hidden';

    setTimeout(
        () => {
            inputQuantidadeProduto.focus();
            inputQuantidadeProduto.select();
        },
        50
    );

}


function confirmarAdicionarProduto() {

    const quantidade =
        Math.floor(
            Number(inputQuantidadeProduto.value)
        );

    if (
        !Number.isInteger(quantidade)
        ||
        quantidade < 1
    ) {

        inputQuantidadeProduto.focus();

        return;

    }

    const produto = produtoParaAdicionar;

    fecharModalQuantidade();

    if (produto) {

        adicionarProdutoAoCarrinho(
            produto,
            quantidade
        );

    }

}


btnFecharModalQuantidade.addEventListener(
    'click',
    fecharModalQuantidade
);

btnCancelarModalQuantidade.addEventListener(
    'click',
    fecharModalQuantidade
);

btnAdicionarModalQuantidade.addEventListener(
    'click',
    confirmarAdicionarProduto
);

inputQuantidadeProduto.addEventListener(
    'keydown',
    evento => {

        if (evento.key === 'Enter') {

            evento.preventDefault();
            confirmarAdicionarProduto();

        }

    }
);

modalQuantidade.addEventListener(
    'click',
    evento => {

        if (evento.target === modalQuantidade) {

            fecharModalQuantidade();

        }

    }
);

document.addEventListener(
    'keydown',
    evento => {

        if (
            evento.key === 'Escape'
            &&
            modalQuantidade.classList.contains('aberto')
        ) {

            fecharModalQuantidade();

        }

    }
);


productsBody.addEventListener(
    'click',
    evento => {

        const btn =
            evento.target.closest(
                '.add-btn'
            );


        if (
            !btn
        ) {

            return;

        }


        const produtoId =
            Number(
                btn.dataset.id
            );


        const produto =
            catalog.find(
                item =>
                    Number(
                        item.id
                    )
                    ===
                    produtoId
            );


        if (
            !produto
        ) {

            return;

        }


        abrirModalQuantidade(produto);

    }
);


// ============================================================
// ADICIONAR AO CARRINHO
// ============================================================

function adicionarProdutoAoCarrinho(
    produto,
    quantidade = 1
) {

    const existente =
        cart.find(
            item =>
                Number(
                    item.id
                )
                ===
                Number(
                    produto.id
                )
        );


    if (
        existente
    ) {

        existente.qty += quantidade;


    } else {

        cart.push({

            ...produto,

            qty:
                quantidade

        });

    }


    renderCart();

}


// ============================================================
// INFORMAÇÕES SOBRE CAIXAS
// ============================================================

function quantidadeCaixas(
    item
) {

    if (
        item.packageSize <=
        0
    ) {

        return 0;

    }


    return Math.floor(
        item.qty /
        item.packageSize
    );

}


function unidadesAvulsas(
    item
) {

    if (
        item.packageSize <=
        0
    ) {

        return item.qty;

    }


    return (
        item.qty %
        item.packageSize
    );

}


// ============================================================
// RENDER CARRINHO
// ============================================================

function renderCart() {

    itemsBody.innerHTML =
        '';


    emptyNote.style.display =
        cart.length
            ? 'none'
            : 'block';


    cart.forEach(
        item => {

            const subtotal =
                item.price *
                item.qty;


            const caixas =
                quantidadeCaixas(
                    item
                );


            const avulsas =
                unidadesAvulsas(
                    item
                );


            const estoqueInsuficiente =
                item.qty >
                item.stock;


            const tr =
                document.createElement(
                    'tr'
                );


            tr.innerHTML = `

                <td>

                    <strong>
                        ${item.name}
                    </strong>

                    ${
                        estoqueInsuficiente
                            ? `
                                <div class="item-aviso-estoque">
                                    Estoque: ${item.stock}
                                </div>
                            `
                            : ''
                    }

                </td>


                <td class="embalagem-venda">
                    ${textoEmbalagem(
                        item.packageSize
                    )}
                </td>


                <td>
                    ${fmt(
                        item.price
                    )}
                </td>


                <!-- CAIXAS -->

                <td>

                    ${
                        item.packageSize > 0
                            ? `

                                <div class="box-control">

                                    <button
                                        data-act="box-dec"
                                        data-id="${item.id}"
                                        type="button"
                                    >
                                        −
                                    </button>


                                    <span>
                                        ${caixas}
                                    </span>


                                    <button
                                        data-act="box-inc"
                                        data-id="${item.id}"
                                        type="button"
                                    >
                                        +
                                    </button>

                                </div>


                                ${
                                    avulsas > 0
                                        ? `
                                            <small class="avulsas-info">
                                                + ${avulsas} avul.
                                            </small>
                                        `
                                        : ''
                                }

                            `
                            : `
                                <span class="sem-embalagem">
                                    —
                                </span>
                            `
                    }

                </td>


                <!-- QUANTIDADE -->

                <td>

                    <input
                        class="qty-input"
                        type="number"
                        min="1"
                        step="1"
                        value="${item.qty}"
                        data-id="${item.id}"
                    >

                </td>


                <td>
                    ${fmt(
                        subtotal
                    )}
                </td>


                <td>

                    <button
                        class="del-btn"
                        data-act="del"
                        data-id="${item.id}"
                        type="button"
                    >
                        🗑
                    </button>

                </td>
            `;


            itemsBody.appendChild(
                tr
            );

        }
    );


    renderSummary();

}


// ============================================================
// CONTROLE POR CAIXAS
// ============================================================

itemsBody.addEventListener(
    'click',
    evento => {

        const btn =
            evento.target.closest(
                'button[data-act]'
            );


        if (
            !btn
        ) {

            return;

        }


        const id =
            Number(
                btn.dataset.id
            );


        const item =
            cart.find(
                produto =>
                    Number(
                        produto.id
                    )
                    ===
                    id
            );


        if (
            !item
        ) {

            return;

        }


        // =========================
        // + 1 CAIXA
        // =========================

        if (
            btn.dataset.act ===
            'box-inc'
        ) {

            if (
                item.packageSize >
                0
            ) {

                const caixas =
                    quantidadeCaixas(
                        item
                    );


                item.qty =
                    (
                        caixas +
                        1
                    )
                    *
                    item.packageSize;

            }

        }


        // =========================
        // - 1 CAIXA
        // =========================

        if (
            btn.dataset.act ===
            'box-dec'
        ) {

            if (
                item.packageSize >
                0
            ) {

                const caixas =
                    quantidadeCaixas(
                        item
                    );


                const novasCaixas =
                    Math.max(
                        0,
                        caixas -
                        1
                    );


                /*
                    Se chegou a zero caixas,
                    deixamos pelo menos 1 unidade.
                */

                item.qty =
                    novasCaixas > 0
                        ? novasCaixas *
                            item.packageSize
                        : 1;

            }

        }


        // =========================
        // REMOVER
        // =========================

        if (
            btn.dataset.act ===
            'del'
        ) {

            cart =
                cart.filter(
                    produto =>
                        Number(
                            produto.id
                        )
                        !==
                        id
                );

        }


        renderCart();

    }
);


// ============================================================
// QUANTIDADE DIGITADA
// ============================================================

itemsBody.addEventListener(
    'change',
    evento => {

        const input =
            evento.target.closest(
                '.qty-input'
            );


        if (
            !input
        ) {

            return;

        }


        const id =
            Number(
                input.dataset.id
            );


        const item =
            cart.find(
                produto =>
                    Number(
                        produto.id
                    )
                    ===
                    id
            );


        if (
            !item
        ) {

            return;

        }


        let quantidade =
            Math.floor(
                Number(
                    input.value
                )
            );


        if (
            !Number.isFinite(
                quantidade
            )
            ||
            quantidade <
            1
        ) {

            quantidade =
                1;

        }


        item.qty =
            quantidade;


        renderCart();

    }
);

// ============================================================
// RESUMO
// ============================================================
function renderSummary() {

    const itens =
        cart.length;


    const quantidade =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                item.qty,
            0
        );


    const subtotal =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    item.qty *
                    item.price
                ),
            0
        );


    // Desconto geral em porcentagem
    const inputDesconto =
        document.getElementById(
            'inputDesconto'
        );


    const descontoGeral =
        inputDesconto
            ? Math.min(
                100,
                Math.max(
                    0,
                    lerPercentual(
                        inputDesconto.value
                    )
                )
            )
            : 0;


    // Valor do desconto geral em reais
    const valorDescontoGeral =
        subtotal *
        (
            descontoGeral /
            100
        );


    // Desconto individual dos produtos
    const descontoItens =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    Number(item.price || 0) *
                    Number(item.qty || 0) *
                    Math.min(
                        100,
                        Math.max(
                            0,
                            Number(
                                item.descontoPercentual || 0
                            )
                        )
                    ) /
                    100
                ),
            0
        );


    // Soma dos descontos
    const valorDescontoTotal =
        Math.min(
            subtotal,
            descontoItens +
            valorDescontoGeral
        );


    const total =
        Math.max(
            0,
            subtotal -
            valorDescontoTotal
        );


    document
        .getElementById(
            'sumItens'
        )
        .textContent =
        itens;


    document
        .getElementById(
            'sumQtd'
        )
        .textContent =
        quantidade;


    document
        .getElementById(
            'sumSubtotal'
        )
        .textContent =
        fmt(
            subtotal
        );


    document
        .getElementById(
            'sumDesconto'
        )
        .textContent =
        `${formatarPercentual(descontoGeral)}%`;


    document
        .getElementById(
            'sumTotal'
        )
        .textContent =
        fmt(
            total
        );

}


inputDesconto?.addEventListener(
    'input',
    renderSummary
);


inputDesconto?.addEventListener(
    'input',
    renderSummary
);






// ============================================================
// CANCELAR VENDA
// ============================================================

cancelarBtn.addEventListener(
    'click',
    () => {

        if (
            cart.length ===
            0
            &&
            !clienteSelecionado
        ) {

            return;

        }


        abrirModalAviso({

            titulo:
                'Cancelar venda',

            mensagem:
                'Todos os produtos e o cliente selecionado serão removidos.\n\nDeseja cancelar esta venda?',

            textoConfirmar:
                'CANCELAR VENDA',

            mostrarCancelar:
                true,

            aoConfirmar:
                () => {

                    cart =
                        [];


                    removerClienteSelecionado();


                    productSearch.value =
                        '';


                    paginaProdutosVenda =
                        1;


                    renderProducts();

                    renderCart();

                }

        });

    }
);


// ============================================================
// FINALIZAR VENDA
// ============================================================

finalizarBtn.addEventListener(
    'click',
    () => {

        if (
            !clienteSelecionado
        ) {

            abrirModalAviso({

                titulo:
                    'Cliente não selecionado',

                mensagem:
                    'Selecione um cliente antes de finalizar a venda.',

                textoConfirmar:
                    'OK'

            });


            return;

        }


        if (
            clienteSelecionado.ativo !==
            true
        ) {

            abrirModalAviso({

                titulo:
                    'Cliente inativo',

                mensagem:
                    'Este cliente está inativo e não pode ser usado em uma nova venda.',

                textoConfirmar:
                    'OK'

            });


            return;

        }


        if (
            cart.length ===
            0
        ) {

            abrirModalAviso({

                titulo:
                    'Venda sem produtos',

                mensagem:
                    'Adicione pelo menos um produto antes de finalizar a venda.',

                textoConfirmar:
                    'OK'

            });


            return;

        }


        /*
            Produtos cuja quantidade
            pedida ultrapassa o estoque.

            NÃO bloqueamos a venda.
        */

        const produtosEstoqueInsuficiente =
            cart.filter(
                item =>
                    item.qty >
                    item.stock
            );


        if (
            produtosEstoqueInsuficiente.length >
            0
        ) {

            const nomes =
                produtosEstoqueInsuficiente
                    .slice(
                        0,
                        5
                    )
                    .map(
                        item =>
                            `${item.name}: ${item.qty} solicitado / ${item.stock} em estoque`
                    )
                    .join(
                        '\n'
                    );


            abrirModalAviso({

                titulo:
                    'Atenção ao estoque',

                mensagem:
                    `Existem produtos com estoque insuficiente:\n\n${nomes}\n\nA venda poderá continuar mesmo assim.`,

                textoConfirmar:
                    'CONTINUAR',

                mostrarCancelar:
                    true,

                aoConfirmar:
                    prepararVenda

            });


            return;

        }


        prepararVenda();

    }
);


// ============================================================
// ENVIAR VENDA AO BACKEND
// ============================================================

async function prepararVenda() {

    const subtotal =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    Number(item.price || 0) *
                    Number(item.qty || 0)
                ),
            0
        );


    const inputDesconto =
        document.getElementById(
            'inputDesconto'
        );


    const descontoPercentual =
        inputDesconto
            ? Math.min(
                100,
                Math.max(
                    0,
                    lerPercentual(
                        inputDesconto.value
                    )
                )
            )
            : 0;


    const descontoItens =
        cart.reduce(
            (
                total,
                item
            ) =>
                total +
                (
                    Number(item.price || 0) *
                    Number(item.qty || 0) *
                    Math.min(
                        100,
                        Math.max(
                            0,
                            Number(
                                item.descontoPercentual || 0
                            )
                        )
                    ) /
                    100
                ),
            0
        );


    const valorDescontoGeral =
        subtotal *
        (
            descontoPercentual /
            100
        );


    const valorDesconto =
        Math.min(
            subtotal,
            descontoItens +
            valorDescontoGeral
        );


    const total =
        Math.max(
            0,
            subtotal -
            valorDesconto
        );


   const dadosVenda = {

    cliente_id:
        clienteSelecionado.id,

    desconto:
        valorDesconto,

    itens:
        cart.map(
            item => ({

                produto_id:
                    item.id,

                quantidade:
                    item.qty

            })
        )

};

    try {

        abrirModalAviso({

            titulo:
                'Finalizando venda',

            mensagem:
                'Aguarde enquanto a venda é registrada...',

            textoConfirmar:
                'AGUARDE',

            mostrarCancelar:
                false

        });


        btnConfirmarModalAviso.disabled =
            true;


        const token =
            localStorage.getItem(
                'bm36_token'
            );


        if (!token) {

            abrirModalAviso({

                titulo:
                    'Sessão expirada',

                mensagem:
                    'Sua sessão não foi encontrada. Faça login novamente.',

                textoConfirmar:
                    'OK',

                aoConfirmar:
                    () => {

                        window.location.href =
                            './index.html';

                    }

            });


            return;

        }


        const resposta =
            await fetch(
                `${API_URL}/vendas`,
                {
                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        'Authorization':
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify(
                            dadosVenda
                        )
                }
            );


        const resultado =
            await resposta.json();


        btnConfirmarModalAviso.disabled =
            false;


        if (
            !resposta.ok
        ) {

            abrirModalAviso({

                titulo:
                    'Não foi possível finalizar',

                mensagem:
                    resultado.mensagem ||
                    'Ocorreu um erro ao registrar a venda.',

                textoConfirmar:
                    'FECHAR'

            });


            return;

        }


        abrirModalAviso({

            titulo:
                'Venda finalizada!',

            mensagem:
                `Venda #${resultado.venda.id} registrada com sucesso.\n\n` +
                `Cliente: ${resultado.venda.cliente_nome}\n` +
                `Total: ${fmt(
                    resultado.venda.total
                )}`,

            textoConfirmar:
                'NOVA VENDA',

            mostrarCancelar:
                false,

            aoConfirmar:
                async () => {

                    cart =
                        [];


                    removerClienteSelecionado();


                    productSearch.value =
                        '';


                    paginaProdutosVenda =
                        1;


                    /*
                        Atualiza o estoque depois
                        da venda.
                    */

                    await carregarProdutos();


                    renderCart();

                }

        });


    } catch (erro) {

        btnConfirmarModalAviso.disabled =
            false;


        console.error(
            'Erro ao finalizar venda:',
            erro
        );


        abrirModalAviso({

            titulo:
                'Erro de conexão',

            mensagem:
                'Não foi possível conectar com o servidor para finalizar a venda.',

            textoConfirmar:
                'FECHAR'

        });

    }

}


// ============================================================
// SCANNER DE CÓDIGO DE BARRAS
// ============================================================

const abrirScannerBtn =
    document.getElementById(
        'abrirScannerBtn'
    );


const fecharScannerBtn =
    document.getElementById(
        'fecharScannerBtn'
    );


const scannerOverlay =
    document.getElementById(
        'scannerOverlay'
    );


const scannerStatus =
    document.getElementById(
        'scannerStatus'
    );


let scanner =
    null;


let scannerAtivo =
    false;


    // ============================================================
// ABRIR SCANNER
// ============================================================

async function abrirScanner() {

    scannerOverlay.classList.add(
        'show'
    );


    scannerStatus.textContent =
        'Iniciando câmera...';


    try {

        if (!scanner) {

            scanner =
                new Html5Qrcode(
                    'reader',
                    {
                        formatsToSupport: [

                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,

                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.UPC_E,

                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.CODE_39,

                            Html5QrcodeSupportedFormats.ITF,
                            Html5QrcodeSupportedFormats.CODABAR

                        ]
                    }
                );

        }


        scannerAtivo =
            true;


        await scanner.start(

            {
                facingMode: {
                    exact:
                        'environment'
                }
            },

            {

                fps:
                    15,

                aspectRatio:
                    1.777778,

                qrbox:
                    function (
                        largura,
                        altura
                    ) {

                        const larguraScanner =
                            Math.floor(
                                largura * 0.90
                            );


                        const alturaScanner =
                            Math.min(
                                180,
                                Math.floor(
                                    altura * 0.35
                                )
                            );


                        return {

                            width:
                                larguraScanner,

                            height:
                                alturaScanner

                        };

                    }

            },

            async (
                codigoDecodificado,
                resultado
            ) => {

                if (
                    !scannerAtivo
                ) {

                    return;

                }


                scannerStatus.textContent =
                    `Código encontrado: ${codigoDecodificado}`;


                console.log(
                    'Código lido:',
                    codigoDecodificado
                );


                await fecharScanner();


                await buscarProdutoPorCodigo(
                    codigoDecodificado
                );

            },

            erroLeitura => {

                /*
                    É normal cair aqui enquanto
                    nenhum código foi encontrado.
                */

            }

        );


        scannerStatus.textContent =
            'Centralize o código de barras dentro da área.';


    } catch (erro) {

        console.error(
            'Erro ao abrir câmera:',
            erro
        );


        scannerAtivo =
            false;


        scannerStatus.textContent =
            'Tentando acessar outra câmera...';


        /*
            Alguns dispositivos não aceitam
            facingMode exact.

            Então tentamos novamente usando
            apenas environment.
        */

        try {

            if (scanner) {

                try {

                    scanner.clear();

                } catch (erroClear) {

                    console.log(
                        'Scanner já estava limpo.'
                    );

                }

            }


            scanner =
                new Html5Qrcode(
                    'reader',
                    {
                        formatsToSupport: [

                            Html5QrcodeSupportedFormats.EAN_13,
                            Html5QrcodeSupportedFormats.EAN_8,

                            Html5QrcodeSupportedFormats.UPC_A,
                            Html5QrcodeSupportedFormats.UPC_E,

                            Html5QrcodeSupportedFormats.CODE_128,
                            Html5QrcodeSupportedFormats.CODE_39,

                            Html5QrcodeSupportedFormats.ITF,
                            Html5QrcodeSupportedFormats.CODABAR

                        ]
                    }
                );


            scannerAtivo =
                true;


            await scanner.start(

                {
                    facingMode:
                        'environment'
                },

                {

                    fps:
                        15,

                    qrbox: {

                        width:
                            320,

                        height:
                            150

                    }

                },

                async codigo => {

                    if (
                        !scannerAtivo
                    ) {

                        return;

                    }


                    console.log(
                        'Código lido:',
                        codigo
                    );


                    await fecharScanner();


                    await buscarProdutoPorCodigo(
                        codigo
                    );

                },

                () => {

                    /*
                        Ignora erro de leitura
                        enquanto procura o código.
                    */

                }

            );


            scannerStatus.textContent =
                'Centralize o código de barras dentro da área.';


        } catch (segundoErro) {

            scannerAtivo =
                false;


            console.error(
                'Erro definitivo ao abrir scanner:',
                segundoErro
            );


            scannerStatus.textContent =
                'Não foi possível usar a câmera deste dispositivo.';

        }

    }

}


// ============================================================
// FECHAR SCANNER
// ============================================================

async function fecharScanner() {

    try {

        if (
            scanner &&
            scannerAtivo
        ) {

            scannerAtivo =
                false;


            await scanner.stop();

        }


        if (scanner) {

            try {

                scanner.clear();

            } catch (erro) {

                console.log(
                    'Scanner já estava limpo.'
                );

            }

        }


    } catch (erro) {

        console.error(
            'Erro ao fechar scanner:',
            erro
        );

    }


    scanner =
        null;


    scannerAtivo =
        false;


    scannerOverlay.classList.remove(
        'show'
    );

}


// ============================================================
// BUSCAR PRODUTO PELO CÓDIGO LIDO
// ============================================================

async function buscarProdutoPorCodigo(
    codigo
) {

    const codigoLimpo =
        String(
            codigo || ''
        )
            .trim()
            .replace(
                /\s/g,
                ''
            );


    console.log(
        'Código lido pela câmera:',
        codigoLimpo
    );


    /*
        Procura pelo código interno
        OU pelo código do fabricante /
        código de barras.
    */

    const produto =
        catalog.find(
            item => {

                const codigoInterno =
                    String(
                        item.code || ''
                    )
                        .trim()
                        .replace(
                            /\s/g,
                            ''
                        );


                const codigoFabricante =
                    String(
                        item.manufacturerCode || ''
                    )
                        .trim()
                        .replace(
                            /\s/g,
                            ''
                        );


                return (
                    codigoInterno ===
                    codigoLimpo
                    ||
                    codigoFabricante ===
                    codigoLimpo
                );

            }
        );


    /*
        Código foi reconhecido pela câmera,
        mas não existe no cadastro.
    */

    if (!produto) {

        console.log(
            'Produto não encontrado para o código:',
            codigoLimpo
        );


        abrirModalAviso({

            titulo:
                'Produto não encontrado',

            mensagem:
                `A câmera leu o código:\n\n` +
                `${codigoLimpo}\n\n` +
                `Mas nenhum produto possui esse código cadastrado.`,

            textoConfirmar:
                'OK'

        });


        return;

    }


    console.log(
        'Produto encontrado:',
        produto
    );


    abrirModalQuantidade(produto);


    console.log(
        'Produto pronto para ser confirmado no carrinho:',
        produto.name
    );

}


// ============================================================
// EVENTOS DO SCANNER
// ============================================================

if (
    abrirScannerBtn
) {

    abrirScannerBtn.addEventListener(
        'click',
        abrirScanner
    );

}


if (
    fecharScannerBtn
) {

    fecharScannerBtn.addEventListener(
        'click',
        fecharScanner
    );

}


/*
    Se clicar no fundo preto do modal,
    fecha o scanner.
*/

if (
    scannerOverlay
) {

    scannerOverlay.addEventListener(
        'click',
        evento => {

            if (
                evento.target ===
                scannerOverlay
            ) {

                fecharScanner();

            }

        }
    );

}


/*
    ESC também fecha o scanner.
*/

document.addEventListener(
    'keydown',
    evento => {

        if (
            evento.key ===
            'Escape'
            &&
            scannerOverlay
                ?.classList
                .contains(
                    'show'
                )
        ) {

            fecharScanner();

        }

    }
);


// ============================================================
// INICIAR
// ============================================================

carregarClientes();

carregarProdutos();

renderCart();
