const API_URL =
    'http://localhost:3000/api';


// ============================================================
// DADOS
// ============================================================
let produtos = [];
let pedidos = [];
let vendas = [];
const salesBody =
    document.getElementById(
        'salesBody'
    );
// ============================================================
// ELEMENTOS
// ============================================================

const greetingText =
    document.getElementById(
        'greetingText'
    );


const todayDate =
    document.getElementById(
        'todayDate'
    );


const searchInput =
    document.getElementById(
        'searchInput'
    );


const ordersBody =
    document.getElementById(
        'ordersBody'
    );


const countSemEstoque =
    document.getElementById(
        'countSemEstoque'
    );


const countEstoqueBaixo =
    document.getElementById(
        'countEstoqueBaixo'
    );


const countPedidosSeparacao =
    document.getElementById(
        'countPedidosSeparacao'
    );


const countPedidosParados =
    document.getElementById(
        'countPedidosParados'
    );


// ============================================================
// SAUDAÇÃO
// ============================================================

function atualizarSaudacao() {

    const agora =
        new Date();


    const hora =
        agora.getHours();


    let saudacao =
        'Bom dia';


    if (
        hora >= 12
        &&
        hora < 18
    ) {

        saudacao =
            'Boa tarde';

    }


    if (
        hora >= 18
        ||
        hora < 5
    ) {

        saudacao =
            'Boa noite';

    }


    greetingText.textContent =
        `${saudacao}, Funcionário`;


    const dias = [

        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado'

    ];


    const meses = [

        'jan',
        'fev',
        'mar',
        'abr',
        'mai',
        'jun',
        'jul',
        'ago',
        'set',
        'out',
        'nov',
        'dez'

    ];


    todayDate.textContent =
        `${dias[agora.getDay()]}, ` +
        `${agora.getDate()} de ` +
        `${meses[agora.getMonth()]} de ` +
        `${agora.getFullYear()}`;

}


// ============================================================
// ESCAPAR HTML
// ============================================================

function escaparHTML(
    valor
) {

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
// NORMALIZAR TEXTO
// ============================================================

function normalizar(
    valor
) {

    return String(
        valor ?? ''
    )
        .trim()
        .toLowerCase();

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
                'Erro ao buscar produtos.'
            );

        }


        produtos =
            await resposta.json();


        atualizarAlertasEstoque();


    } catch (erro) {

        console.error(
            'Erro ao carregar produtos:',
            erro
        );


        countSemEstoque.textContent =
            '—';


        countEstoqueBaixo.textContent =
            '—';

    }

}


// ============================================================
// ALERTAS DE ESTOQUE
// ============================================================

function atualizarAlertasEstoque() {

    const semEstoque =
        produtos.filter(
            produto => {

                const estoque =
                    Number(
                        produto.estoque_atual || 0
                    );


                return estoque <= 0;

            }
        )
        .length;


    const estoqueBaixo =
        produtos.filter(
            produto => {

                const estoque =
                    Number(
                        produto.estoque_atual || 0
                    );


                const minimo =
                    Number(
                        produto.estoque_minimo || 0
                    );


                return (
                    estoque > 0
                    &&
                    minimo > 0
                    &&
                    estoque <= minimo
                );

            }
        )
        .length;


    countSemEstoque.textContent =
        semEstoque;


    countEstoqueBaixo.textContent =
        estoqueBaixo;

}


// ============================================================
// PEDIDOS
// ============================================================

async function carregarPedidos() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/pedidos`
            );


        if (
            !resposta.ok
        ) {

            throw new Error(
                `GET /api/pedidos retornou ${resposta.status}`
            );

        }


        const resultado =
            await resposta.json();


        if (
            Array.isArray(
                resultado
            )
        ) {

            pedidos =
                resultado;

        } else if (
            Array.isArray(
                resultado.pedidos
            )
        ) {

            pedidos =
                resultado.pedidos;

        } else {

            pedidos =
                [];

        }


        atualizarAlertasPedidos();


        renderizarPedidosRecentes();


    } catch (erro) {

        console.warn(
            'A rota /api/pedidos não está disponível:',
            erro
        );


        pedidos =
            [];


        countPedidosSeparacao.textContent =
            0;


        countPedidosParados.textContent =
            0;


        ordersBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="4">

                    Nenhum pedido disponível no momento.

                </td>

            </tr>
        `;

    }

}


// ============================================================
// PEGAR STATUS
// ============================================================

function pegarStatusPedido(
    pedido
) {

    return (

        pedido.status
        ||
        pedido.estado
        ||
        pedido.situacao
        ||
        'PENDENTE'

    );

}


// ============================================================
// DATA DO PEDIDO
// ============================================================

function pegarDataPedido(
    pedido
) {

    const valor =

        pedido.criado_em
        ||
        pedido.created_at
        ||
        pedido.data
        ||
        pedido.data_pedido;


    if (
        !valor
    ) {

        return null;

    }


    const data =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return null;

    }


    return data;

}


// ============================================================
// CLIENTE DO PEDIDO
// ============================================================

function pegarClientePedido(
    pedido
) {

    return (

        pedido.cliente_nome
        ||
        pedido.nome_cliente
        ||
        pedido.cliente
        ||
        pedido.quem_fez_pedido
        ||
        `Cliente #${pedido.cliente_id || '-'}`

    );

}


// ============================================================
// CÓDIGO
// ============================================================

function pegarCodigoPedido(
    pedido
) {

    return (

        pedido.codigo
        ||
        pedido.numero
        ||
        pedido.numero_pedido
        ||
        pedido.id
        ||
        '-'

    );

}


// ============================================================
// ALERTAS PEDIDOS
// ============================================================

function atualizarAlertasPedidos() {

    const agora =
        Date.now();


    const aguardando =
        pedidos.filter(
            pedido => {

                const status =
                    normalizar(
                        pegarStatusPedido(
                            pedido
                        )
                    );


                return (

                    status.includes(
                        'separ'
                    )

                    ||

                    status.includes(
                        'aguard'
                    )

                    ||

                    status ===
                        'pendente'

                );

            }
        )
        .length;


    const parados =
        pedidos.filter(
            pedido => {

                const status =
                    normalizar(
                        pegarStatusPedido(
                            pedido
                        )
                    );


                if (
                    status.includes(
                        'final'
                    )
                    ||
                    status.includes(
                        'cancel'
                    )
                    ||
                    status.includes(
                        'conclu'
                    )
                ) {

                    return false;

                }


                const data =
                    pegarDataPedido(
                        pedido
                    );


                if (
                    !data
                ) {

                    return false;

                }


                const diferenca =
                    agora -
                    data.getTime();


                return (
                    diferenca >=
                    24 * 60 * 60 * 1000
                );

            }
        )
        .length;


    countPedidosSeparacao.textContent =
        aguardando;


    countPedidosParados.textContent =
        parados;

}


// ============================================================
// FORMATAR DATA PEDIDO
// ============================================================

function formatarDataPedido(
    pedido
) {

    const data =
        pegarDataPedido(
            pedido
        );


    if (
        !data
    ) {

        return '-';

    }


    const agora =
        new Date();


    const hoje =
        new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
        );


    const diaPedido =
        new Date(
            data.getFullYear(),
            data.getMonth(),
            data.getDate()
        );


    const diferenca =
        Math.round(
            (
                hoje -
                diaPedido
            )
            /
            86400000
        );


    if (
        diferenca ===
        0
    ) {

        const horario =
            data
                .toLocaleTimeString(
                    'pt-BR',
                    {
                        hour:
                            '2-digit',

                        minute:
                            '2-digit'
                    }
                );


        return `Hoje ${horario}`;

    }


    if (
        diferenca ===
        1
    ) {

        return 'Ontem';

    }


    return data
        .toLocaleDateString(
            'pt-BR'
        );

}


// ============================================================
// CLASSE STATUS
// ============================================================

function classeStatus(
    status
) {

    const valor =
        normalizar(
            status
        );


    if (
        valor.includes(
            'final'
        )
        ||
        valor.includes(
            'conclu'
        )
        ||
        valor.includes(
            'entreg'
        )
    ) {

        return 'finalizado';

    }


    if (
        valor.includes(
            'cancel'
        )
    ) {

        return 'cancelado';

    }


    if (
        valor.includes(
            'parado'
        )
        ||
        valor.includes(
            'atras'
        )
    ) {

        return 'parado';

    }


    return 'separacao';

}


// ============================================================
// TEXTO STATUS
// ============================================================

function textoStatus(
    status
) {

    const valor =
        normalizar(
            status
        );


    if (
        valor.includes(
            'final'
        )
        ||
        valor.includes(
            'conclu'
        )
        ||
        valor.includes(
            'entreg'
        )
    ) {

        return 'Finalizado';

    }


    if (
        valor.includes(
            'cancel'
        )
    ) {

        return 'Cancelado';

    }


    if (
        valor.includes(
            'parado'
        )
        ||
        valor.includes(
            'atras'
        )
    ) {

        return 'Parado';

    }


    if (
        valor.includes(
            'separ'
        )
    ) {

        return 'Separação';

    }


    return String(
        status || 'Pendente'
    );

}


// ============================================================
// PEDIDOS RECENTES
// ============================================================

function renderizarPedidosRecentes(
    lista = pedidos
) {

    ordersBody.innerHTML =
        '';


    const ordenados =
        [...lista]
            .sort(
                (
                    a,
                    b
                ) => {

                    const dataA =
                        pegarDataPedido(
                            a
                        );


                    const dataB =
                        pegarDataPedido(
                            b
                        );


                    return (
                        (
                            dataB
                                ?.getTime()
                            ||
                            0
                        )
                        -
                        (
                            dataA
                                ?.getTime()
                            ||
                            0
                        )
                    );

                }
            )
            .slice(
                0,
                4
            );


    if (
        ordenados.length ===
        0
    ) {

        ordersBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="4">

                    Nenhum pedido encontrado.

                </td>

            </tr>
        `;


        return;

    }


    ordenados.forEach(
        pedido => {

            const tr =
                document.createElement(
                    'tr'
                );


            const codigo =
                pegarCodigoPedido(
                    pedido
                );


            const cliente =
                pegarClientePedido(
                    pedido
                );


            const status =
                pegarStatusPedido(
                    pedido
                );


            tr.innerHTML = `

                <td class="code">

                    #${escaparHTML(
                        codigo
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        cliente
                    )}

                </td>


                <td>

                    ${escaparHTML(
                        formatarDataPedido(
                            pedido
                        )
                    )}

                </td>


                <td>

                    <span
                        class="badge ${classeStatus(
                            status
                        )}"
                    >

                        ${escaparHTML(
                            textoStatus(
                                status
                            )
                        )}

                    </span>

                </td>
            `;


            tr.addEventListener(
                'click',
                () => {

                    window.location.href =
                        './pedidos.html';

                }
            );


            ordersBody.appendChild(
                tr
            );

        }
    );

}


// ============================================================
// PESQUISA
// ============================================================

searchInput.addEventListener(
    'input',
    () => {

        const termo =
            normalizar(
                searchInput.value
            );


        if (
            !termo
        ) {

            renderizarPedidosRecentes();


            return;

        }


        const encontrados =
            pedidos.filter(
                pedido => {

                    const codigo =
                        normalizar(
                            pegarCodigoPedido(
                                pedido
                            )
                        );


                    const cliente =
                        normalizar(
                            pegarClientePedido(
                                pedido
                            )
                        );


                    return (

                        codigo.includes(
                            termo
                        )

                        ||

                        cliente.includes(
                            termo
                        )

                    );

                }
            );


        renderizarPedidosRecentes(
            encontrados
        );

    }
);


// ============================================================
// ENTER NA PESQUISA → PRODUTOS
// ============================================================

searchInput.addEventListener(
    'keydown',
    evento => {

        if (
            evento.key !==
            'Enter'
        ) {

            return;

        }


        const termo =
            searchInput
                .value
                .trim();


        if (
            !termo
        ) {

            return;

        }


        /*
            Guardamos a pesquisa para poder,
            futuramente, fazer produtos.html
            abrir já pesquisando o termo.
        */

        sessionStorage.setItem(
            'bm36_busca_produto',
            termo
        );


        window.location.href =
            './produtos.html';

    }
);


// ============================================================
// ATALHOS
// ============================================================

function configurarAtalho(
    id,
    destino
) {

    const elemento =
        document.getElementById(
            id
        );


    if (
        !elemento
    ) {

        return;

    }


    const abrir =
        () => {

            window.location.href =
                destino;

        };


    elemento.addEventListener(
        'click',
        abrir
    );


    elemento.addEventListener(
        'keydown',
        evento => {

            if (
                evento.key ===
                'Enter'
                ||
                evento.key ===
                ' '
            ) {

                evento.preventDefault();


                abrir();

            }

        }
    );

}


configurarAtalho(
    'btnNovoPedido',
    './pedidos.html'
);


configurarAtalho(
    'btnBuscarProduto',
    './produtos.html'
);


configurarAtalho(
    'btnEntradaEstoque',
    './estoque.html'
);


configurarAtalho(
    'btnNovaVenda',
    './venda.html'
);


// ============================================================
// ALERTAS CLICÁVEIS
// ============================================================

document
    .getElementById(
        'alertSemEstoque'
    )
    .addEventListener(
        'click',
        () => {

            window.location.href =
                './estoque.html';

        }
    );


document
    .getElementById(
        'alertEstoqueBaixo'
    )
    .addEventListener(
        'click',
        () => {

            window.location.href =
                './estoque.html';

        }
    );


document
    .getElementById(
        'alertPedidosSeparacao'
    )
    .addEventListener(
        'click',
        () => {

            window.location.href =
                './pedidos.html';

        }
    );


document
    .getElementById(
        'alertPedidosParados'
    )
    .addEventListener(
        'click',
        () => {

            window.location.href =
                './pedidos.html';

        }
    );


// ============================================================
// INICIAR
// ============================================================

atualizarSaudacao();

Promise.all([

    carregarProdutos(),

    carregarPedidos(),

    carregarVendas()

]);
// ============================================================
// VENDAS RECENTES
// ============================================================

async function carregarVendas() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/vendas`
            );


        if (!resposta.ok) {

            throw new Error(
                'Erro ao carregar vendas.'
            );

        }


        vendas =
            await resposta.json();


        renderizarVendasRecentes();


    } catch (erro) {

        console.error(
            'Erro ao carregar vendas:',
            erro
        );


        salesBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="5">

                    Não foi possível carregar as vendas.

                </td>

            </tr>
        `;

    }

}


// ============================================================
// FORMATAR DINHEIRO
// ============================================================

function formatarDinheiro(
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


// ============================================================
// FORMATAR DATA VENDA
// ============================================================

function formatarDataVenda(
    valor
) {

    if (!valor) {

        return '-';

    }


    const data =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return '-';

    }


    const agora =
        new Date();


    const hoje =
        new Date(
            agora.getFullYear(),
            agora.getMonth(),
            agora.getDate()
        );


    const diaVenda =
        new Date(
            data.getFullYear(),
            data.getMonth(),
            data.getDate()
        );


    const diferenca =
        Math.round(
            (
                hoje -
                diaVenda
            )
            /
            86400000
        );


    if (
        diferenca === 0
    ) {

        const hora =
            data.toLocaleTimeString(
                'pt-BR',
                {
                    hour:
                        '2-digit',

                    minute:
                        '2-digit'
                }
            );


        return `Hoje ${hora}`;

    }


    if (
        diferenca === 1
    ) {

        return 'Ontem';

    }


    return data.toLocaleDateString(
        'pt-BR'
    );

}


// ============================================================
// STATUS VENDA
// ============================================================

function classeStatusVenda(
    status
) {

    const valor =
        String(
            status || ''
        )
            .toLowerCase();


    if (
        valor.includes(
            'cancel'
        )
    ) {

        return 'cancelado';

    }


    return 'finalizado';

}


function textoStatusVenda(
    status
) {

    if (!status) {

        return '-';

    }


    return String(
        status
    )
        .replaceAll(
            '_',
            ' '
        )
        .toUpperCase();

}


// ============================================================
// RENDERIZAR ÚLTIMAS VENDAS
// ============================================================

function renderizarVendasRecentes(
    lista = vendas
) {

    salesBody.innerHTML =
        '';


    /*
        A API já costuma retornar
        ordenado por mais recente,
        mas ordenamos novamente
        para garantir.
    */

    const recentes =
        [...lista]
            .sort(
                (
                    a,
                    b
                ) => {

                    return (
                        new Date(
                            b.criado_em
                        )
                        -
                        new Date(
                            a.criado_em
                        )
                    );

                }
            )
            .slice(
                0,
                5
            );


    if (
        recentes.length === 0
    ) {

        salesBody.innerHTML = `

            <tr class="empty-row">

                <td colspan="5">

                    Nenhuma venda realizada ainda.

                </td>

            </tr>
        `;


        return;

    }


    recentes.forEach(
        venda => {

            const tr =
                document.createElement(
                    'tr'
                );


            tr.innerHTML = `

                <td class="code">

                    #${venda.id}

                </td>


                <td>

                    ${venda.cliente_nome || '-'}

                </td>


                <td>

                    ${formatarDataVenda(
                        venda.criado_em
                    )}

                </td>


                <td>

                    <strong>

                        ${formatarDinheiro(
                            venda.total
                        )}

                    </strong>

                </td>


                <td>

                    <span
                        class="badge ${classeStatusVenda(
                            venda.status
                        )}"
                    >

                        ${textoStatusVenda(
                            venda.status
                        )}

                    </span>

                </td>
            `;


            /*
                Clicar na venda leva para
                o histórico de vendas.
            */

            tr.addEventListener(
                'click',
                () => {

                    window.location.href =
                        './vendido.html';

                }
            );


            salesBody.appendChild(
                tr
            );

        }
    );

}