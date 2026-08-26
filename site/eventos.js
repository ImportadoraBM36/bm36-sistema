const API_URL =
    'https://bm36-sistema-production.up.railway.app/api';

let eventos =
    [];
let eventoAbertoId =
    null;

// ============================================================
// ELEMENTOS
// ============================================================

const eventosGrid =
    document.getElementById(
        'eventosGrid'
    );

const buscarEvento =
    document.getElementById(
        'buscarEvento'
    );

const filtroStatus =
    document.getElementById(
        'filtroStatus'
    );

const novoEventoBtn =
    document.getElementById(
        'novoEventoBtn'
    );

const eventoOverlay =
    document.getElementById(
        'eventoOverlay'
    );

const fecharEventoModal =
    document.getElementById(
        'fecharEventoModal'
    );

const cancelarEventoBtn =
    document.getElementById(
        'cancelarEventoBtn'
    );

const salvarEventoBtn =
    document.getElementById(
        'salvarEventoBtn'
    );

const eventoNome =
    document.getElementById(
        'eventoNome'
    );

const eventoDescricao =
    document.getElementById(
        'eventoDescricao'
    );

const eventoDataInicio =
    document.getElementById(
        'eventoDataInicio'
    );

const eventoDataFim =
    document.getElementById(
        'eventoDataFim'
    );

const detalhesOverlay =
    document.getElementById(
        'detalhesOverlay'
    );

const fecharDetalhes =
    document.getElementById(
        'fecharDetalhes'
    );


// ============================================================
// TOKEN
// ============================================================

function token() {

    return localStorage.getItem(
        'bm36_token'
    );

}


// ============================================================
// FORMATADORES
// ============================================================

function dinheiro(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        'pt-BR',
        {
            style:
                'currency',

            currency:
                'BRL'
        }
    );

}

function dataBR(data) {

    if (!data) {
        return '-';
    }


    const dataTexto =
        String(data);


    /*
     * Se vier no formato:
     * 2026-08-25
     */
    if (
        /^\d{4}-\d{2}-\d{2}$/.test(
            dataTexto
        )
    ) {

        const [
            ano,
            mes,
            dia
        ] =
            dataTexto.split('-');


        return `${dia}/${mes}/${ano}`;

    }


    /*
     * Se o PostgreSQL enviar
     * data completa / ISO
     */
    const dataObjeto =
        new Date(
            dataTexto
        );


    if (
        Number.isNaN(
            dataObjeto.getTime()
        )
    ) {

        return '-';

    }


    return dataObjeto
        .toLocaleDateString(
            'pt-BR'
        );

}
// ============================================================
// CARREGAR EVENTOS
// ============================================================

async function carregarEventos() {

    try {

        const resposta =
            await fetch(
                `${API_URL}/eventos`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token()}`
                    }
                }
            );


        if (!resposta.ok) {

            throw new Error(
                'Erro ao carregar eventos.'
            );

        }


        eventos =
            await resposta.json();


        renderEventos();


    } catch (erro) {

        console.error(
            erro
        );


        eventosGrid.innerHTML = `
            <div class="carregando">
                Não foi possível carregar os eventos.
            </div>
        `;

    }

}


// ============================================================
// RENDERIZAR
// ============================================================

function renderEventos() {

    const termo =
        buscarEvento.value
            .trim()
            .toLowerCase();


    const status =
        filtroStatus.value;


    const filtrados =
        eventos.filter(
            evento => {

                const buscaOK =
                    !termo
                    ||
                    String(
                        evento.nome || ''
                    )
                        .toLowerCase()
                        .includes(
                            termo
                        );


                const statusOK =
                    !status
                    ||
                    evento.status ===
                        status;


                return (
                    buscaOK &&
                    statusOK
                );

            }
        );


    if (
        filtrados.length === 0
    ) {

        eventosGrid.innerHTML = `
            <div class="carregando">
                Nenhum evento encontrado.
            </div>
        `;

        return;

    }


    eventosGrid.innerHTML =
        '';


    filtrados.forEach(
        evento => {

            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'evento-card';


            const classeStatus =
                String(
                    evento.status || ''
                )
                    .toLowerCase();


            card.innerHTML = `

                <div class="evento-card-topo">

                    <h2>
                        ${evento.nome}
                    </h2>

                    <span
                        class="evento-status ${classeStatus}"
                    >
                        ${evento.status}
                    </span>

                </div>


                <div class="evento-descricao">

                    ${
                        evento.descricao
                        ||
                        'Sem descrição.'
                    }

                </div>


                <div class="evento-datas">

                    ${dataBR(
                        evento.data_inicio
                    )}

                    até

                    ${dataBR(
                        evento.data_fim
                    )}

                </div>


                <div class="evento-resumo">

                    <div>

                        <span>
                            Pedidos
                        </span>

                        <strong>
                            ${
                                evento.quantidade_pedidos
                                ||
                                0
                            }
                        </strong>

                    </div>


                    <div>

                        <span>
                            Total vendido
                        </span>

                        <strong>
                            ${dinheiro(
                                evento.total_vendido
                            )}
                        </strong>

                    </div>

                </div>
            `;


            card.addEventListener(
                'click',
                () => {

                    abrirEvento(
                        evento.id
                    );

                }
            );


            eventosGrid.appendChild(
                card
            );

        }
    );

}


// ============================================================
// NOVO EVENTO
// ============================================================

function abrirNovoEvento() {

    eventoNome.value =
        '';

    eventoDescricao.value =
        '';

    eventoDataInicio.value =
        '';

    eventoDataFim.value =
        '';


    eventoOverlay.classList.add(
        'show'
    );

}


function fecharNovoEvento() {

    eventoOverlay.classList.remove(
        'show'
    );

}


async function salvarEvento() {

    const nome =
        eventoNome.value
            .trim();


    if (!nome) {

        alert(
            'Informe o nome do evento.'
        );

        return;

    }


    try {

        salvarEventoBtn.disabled =
            true;


        const resposta =
            await fetch(
                `${API_URL}/eventos`,
                {

                    method:
                        'POST',

                    headers: {

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token()}`

                    },

                    body:
                        JSON.stringify({

                            nome,

                            descricao:
                                eventoDescricao
                                    .value
                                    .trim()
                                ||
                                null,

                            data_inicio:
                                eventoDataInicio
                                    .value
                                ||
                                null,

                            data_fim:
                                eventoDataFim
                                    .value
                                ||
                                null

                        })

                }
            );


        const resultado =
            await resposta.json();


        salvarEventoBtn.disabled =
            false;


        if (!resposta.ok) {

            alert(
                resultado.mensagem
                ||
                'Não foi possível criar o evento.'
            );

            return;

        }


        fecharNovoEvento();


        await carregarEventos();


    } catch (erro) {

        salvarEventoBtn.disabled =
            false;

        console.error(
            erro
        );

        alert(
            'Erro ao criar evento.'
        );

    }

}


// ============================================================
// ABRIR DETALHES
// ============================================================

async function abrirEvento(id) {
eventoAbertoId =
    id;
    try {

        const resposta =
            await fetch(
                `${API_URL}/eventos/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token()}`
                    }
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                resultado.mensagem
                ||
                'Não foi possível carregar o evento.'
            );

            return;

        }


        const evento =
            resultado.evento;

// =====================================================
// CONFIGURAR BOTÃO DE STATUS DO EVENTO
// =====================================================

const finalizarEventoBtn =
    document.getElementById(
        'finalizarEventoBtn'
    );

if (evento.status === 'FINALIZADO') {

    finalizarEventoBtn.textContent =
        'Reativar Evento';

    finalizarEventoBtn.dataset.acao =
        'REATIVAR';

} else {

    finalizarEventoBtn.textContent =
        'Finalizar Evento';

    finalizarEventoBtn.dataset.acao =
        'FINALIZAR';
}
        document
            .getElementById(
                'detalhesTitulo'
            )
            .textContent =
            evento.nome;


        document
            .getElementById(
                'detalhesInfo'
            )
            .innerHTML = `

                ${
                    evento.descricao
                    ||
                    'Sem descrição.'
                }

                <br>

                Período:
                ${dataBR(
                    evento.data_inicio
                )}

                até

                ${dataBR(
                    evento.data_fim
                )}

                <br>

                Status:
                ${evento.status}
            `;


        document
            .getElementById(
                'resumoPedidos'
            )
            .textContent =
            resultado.resumo
                .quantidade_pedidos;


        document
            .getElementById(
                'resumoTotal'
            )
            .textContent =
            dinheiro(
                resultado.resumo
                    .total_vendido
            );


        renderPedidosEvento(
            resultado.pedidos
        );


        renderProdutosEvento(
            resultado.produtos
        );


        detalhesOverlay
            .classList
            .add(
                'show'
            );


    } catch (erro) {

        console.error(
            erro
        );

    }

}



// ============================================================
// PEDIDOS EVENTO
// ============================================================

function renderPedidosEvento(
    pedidos
) {

    const body =
        document.getElementById(
            'eventosPedidosBody'
        );


    if (
        pedidos.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="6">
                    Nenhum pedido neste evento.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        pedidos.map(
            pedido => `
                <tr>

                    <td>
                        #${pedido.id}
                    </td>

                    <td>
                        ${
                            pedido.cliente_nome
                            ||
                            '-'
                        }
                    </td>

                    <td>
                        ${
                            pedido.usuario_nome
                            ||
                            '-'
                        }
                    </td>

                    <td>
                        ${
                            new Date(
                                pedido.criado_em
                            )
                                .toLocaleString(
                                    'pt-BR'
                                )
                        }
                    </td>

                    <td>
                        ${dinheiro(
                            pedido.total
                        )}
                    </td>

                    <td>
                        ${
                            pedido.status
                        }
                    </td>

                </tr>
            `
        )
        .join(
            ''
        );

}


// ============================================================
// PRODUTOS EVENTO
// ============================================================

function renderProdutosEvento(
    produtos
) {

    const body =
        document.getElementById(
            'eventosProdutosBody'
        );


    if (
        produtos.length === 0
    ) {

        body.innerHTML = `
            <tr>
                <td colspan="4">
                    Nenhum produto vendido neste evento.
                </td>
            </tr>
        `;

        return;

    }


    body.innerHTML =
        produtos.map(
            produto => `
                <tr>

                    <td>
                        ${
                            produto.codigo
                            ||
                            '-'
                        }
                    </td>

                    <td>
                        ${produto.nome}
                    </td>

                    <td>
                        ${
                            produto.quantidade_vendida
                        }
                    </td>

                    <td>
                        ${dinheiro(
                            produto.total_vendido
                        )}
                    </td>

                </tr>
            `
        )
        .join(
            ''
        );

}


// ============================================================
// EVENTOS
// ============================================================

novoEventoBtn.addEventListener(
    'click',
    abrirNovoEvento
);


fecharEventoModal.addEventListener(
    'click',
    fecharNovoEvento
);


cancelarEventoBtn.addEventListener(
    'click',
    fecharNovoEvento
);


salvarEventoBtn.addEventListener(
    'click',
    salvarEvento
);


fecharDetalhes.addEventListener(
    'click',
    () => {

        detalhesOverlay
            .classList
            .remove(
                'show'
            );

    }
);


buscarEvento.addEventListener(
    'input',
    renderEventos
);


filtroStatus.addEventListener(
    'change',
    renderEventos
);


// ============================================================
// INICIAR
// ============================================================
// ============================================================
// ALTERAR STATUS EVENTO
// ============================================================

async function alterarStatusEvento(
    novoStatus
) {

    if (!eventoAbertoId) {
        return;
    }


    try {

        const resposta =
            await fetch(
                `${API_URL}/eventos/${eventoAbertoId}/status`,
                {
                    method:
                        'PATCH',

                    headers: {
                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token()}`
                    },

                    body:
                        JSON.stringify({
                            status:
                                novoStatus
                        })
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                resultado.mensagem
                ||
                'Não foi possível alterar o status.'
            );

            return;

        }


        detalhesOverlay
            .classList
            .remove(
                'show'
            );


        await carregarEventos();


    } catch (erro) {

        console.error(
            erro
        );

        alert(
            'Erro ao alterar status do evento.'
        );

    }

}


document
    .getElementById(
        'finalizarEventoBtn'
    )
    .addEventListener(
        'click',
        () => {

            const botao =
                document.getElementById(
                    'finalizarEventoBtn'
                );


            const reativar =
                botao.dataset.acao ===
                'REATIVAR';


            const confirmar =
                confirm(
                    reativar
                        ? 'Deseja reativar este evento?'
                        : 'Deseja finalizar este evento?'
                );


            if (!confirmar) {
                return;
            }


            alterarStatusEvento(
                reativar
                    ? 'ATIVO'
                    : 'FINALIZADO'
            );

        }
    );


document
    .getElementById(
        'cancelarEventoStatusBtn'
    )
    .addEventListener(
        'click',
        () => {

            const confirmar =
                confirm(
                    'Deseja cancelar este evento?'
                );


            if (confirmar) {

                alterarStatusEvento(
                    'CANCELADO'
                );

            }

        }
    );
carregarEventos();