    const API_URL =
        'https://bm36-sistema-production.up.railway.app/api';
    let pedidos =
        [];

    let pedidosFiltrados =
        [];

    let paginaAtual =
        1;

    const itensPorPagina =
        20;

    let filtroAtual =
        'todas';

    let pedidoAberto =
        null;

    let modoEdicao =
        false;
    let eventos =
        [];

    // ============================================================
    // ELEMENTOS
    // ============================================================

    const salesBody =
        document.getElementById(
            'salesBody'
        );

    const searchInput =
        document.getElementById(
            'searchInput'
        );

    const filters =
        document.getElementById(
            'filters'
        );

    const pageInfo =
        document.getElementById(
            'pageInfo'
        );

    const pageNums =
        document.getElementById(
            'pageNums'
        );

    const overlay =
        document.getElementById(
            'overlay'
        );

    const closeX =
        document.getElementById(
            'closeX'
        );

    const closeBtn =
        document.getElementById(
            'closeBtn'
        );

    const editarBtn =
        document.getElementById(
            'editarBtn'
        );

    const pdfPedidoBtn =
        document.getElementById(
            'pdfPedidoBtn'
        );

    const imprimirPedidoBtn =
        document.getElementById(
            'imprimirPedidoBtn'
        );

    const cancelarPedidoBtn =
        document.getElementById(
            'cancelarPedidoBtn'
        );

    const cancelOverlay =
        document.getElementById(
            'cancelOverlay'
        );

    const cancelCloseX =
        document.getElementById(
            'cancelCloseX'
        );

    const voltarCancelamentoBtn =
        document.getElementById(
            'voltarCancelamentoBtn'
        );

    const confirmarCancelamentoBtn =
        document.getElementById(
            'confirmarCancelamentoBtn'
        );

    const motivoCancelamento =
        document.getElementById(
            'motivoCancelamento'
        );

    const campoEventoEdicao =
        document.getElementById(
            'campoEventoEdicao'
        );

    const eventoPedido =
        document.getElementById(
            'eventoPedido'
        );
    // ============================================================
    // FORMATADORES
    // ============================================================

    function fmt(valor) {

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


    function formatarData(data) {

        if (!data) {
            return '-';
        }


        const objeto =
            new Date(data);


        return objeto.toLocaleString(
            'pt-BR',
            {
                day:
                    '2-digit',

                month:
                    '2-digit',

                year:
                    'numeric',

                hour:
                    '2-digit',

                minute:
                    '2-digit'
            }
        );

    }


    function formatarDocumento(documento) {

        const numeros =
            String(
                documento || ''
            )
                .replace(
                    /\D/g,
                    ''
                );


        if (numeros.length === 11) {

            return numeros.replace(
                /(\d{3})(\d{3})(\d{3})(\d{2})/,
                '$1.$2.$3-$4'
            );

        }


        if (numeros.length === 14) {

            return numeros.replace(
                /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
                '$1.$2.$3/$4-$5'
            );

        }


        return documento || '';

    }


    function normalizarStatus(status) {

        return String(
            status || ''
        )
            .trim()
            .toLowerCase();

    }


    function statusLabel(status) {

        const s =
            normalizarStatus(
                status
            );


        if (s === 'cancelada') {
            return 'CANCELADO';
        }


        if (s === 'pendente') {
            return 'PENDENTE';
        }


        return 'FINALIZADO';

    }


    // ============================================================
    // PDF DO PEDIDO
    // ============================================================

    async function gerarPdfPedido(
        imprimir = false,
        janelaDeImpressao = null
    ) {

        if (!pedidoAberto) {
            if (janelaDeImpressao) {
                janelaDeImpressao.close();
            }

            return;
        }


        if (!window.jspdf) {

            if (janelaDeImpressao) {
                janelaDeImpressao.close();
            }

            alert(
                'Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.'
            );

            return;

        }


        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });

        const larguraPagina = 297;
        const margem = 10;
        const largura = larguraPagina - (margem * 2);

        const textoSeguro = valor =>
            String(valor || '-')
                .replace(/[\r\n]+/g, ' ');

        const adicionarCabecalho = () => {

            // Layout monocromático: mais econômico para impressão.
            pdf.setTextColor(20, 20, 20);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            pdf.text('BM36 | WC', margem, 13);

            pdf.setFontSize(9);
            pdf.text('COMPROVANTE DE PEDIDO', margem, 19);

            pdf.setFontSize(10);
            pdf.text(
                `PEDIDO #${pedidoAberto.id}`,
                larguraPagina - margem,
                13,
                { align: 'right' }
            );

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            pdf.text(
                `Emitido em ${formatarData(new Date())}`,
                larguraPagina - margem,
                19,
                { align: 'right' }
            );

            pdf.setDrawColor(90, 90, 90);
            pdf.setLineWidth(0.25);
            pdf.line(margem, 24, larguraPagina - margem, 24);
            pdf.setTextColor(28, 27, 46);

        };
    const adicionarCabecalhoTabela = y => {

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);

       pdf.text('CÓDIGO', margem + 3, y + 5.2);
pdf.text('PRODUTO', 35, y + 5.2);
        pdf.text('CORR.', 121, y + 5.2, { align: 'right' });
        pdf.text('PRAT.', 140, y + 5.2, { align: 'right' });
        pdf.text('POS.', 158, y + 5.2, { align: 'right' });
        pdf.text('CÓD. FAB.', 181, y + 5.2, { align: 'right' });
        pdf.text('QTD.', 208, y + 5.2, { align: 'right' });
        pdf.text('UNIT.', 232, y + 5.2, { align: 'right' });
        pdf.text('SUBTOTAL', 285, y + 5.2, { align: 'right' });

        pdf.setDrawColor(90, 90, 90);
        pdf.setLineWidth(0.25);
        pdf.line(margem, y + 7, margem + largura, y + 7);

        return y + 8;

    };

    

        adicionarCabecalho();

        let y = 42;

        const cliente = pedidoAberto.cliente_nome || 'Não informado';
        const documento = pedidoAberto.cliente_documento;
        const codigoCliente = pedidoAberto.cliente_codigo
            || pedidoAberto.codigo_sistema_antigo
            || pedidoAberto.cliente_id
            || '';

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text('CLIENTE', margem, y);
        pdf.text('DATA DO PEDIDO', 165, y);

        y += 5;

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.text(textoSeguro(cliente), margem, y);
        pdf.text(formatarData(pedidoAberto.criado_em), 165, y);

        y += 5;

        pdf.setFontSize(8.5);
        pdf.setTextColor(95, 99, 117);
        pdf.text(documento || 'Documento não informado', margem, y);
        pdf.text(
            `Status: ${statusLabel(pedidoAberto.status)}`,
            165,
            y
        );

        y += 5;

        pdf.text(
            `Código do cliente: ${textoSeguro(codigoCliente || 'Não informado')}`,
            margem,
            y
        );

        y += 11;

        pdf.setTextColor(28, 27, 46);
        pdf.setFont('helvetica', 'normal');
        pdf.text(
            `Vendedor: ${textoSeguro(pedidoAberto.usuario_nome || 'Não informado')}`,
            margem,
            y
        );

        y += 10;
        y = adicionarCabecalhoTabela(y);

        const itens = Array.isArray(pedidoAberto.itens)
            ? pedidoAberto.itens
            : [];

        itens.forEach(item => {

            const nome = textoSeguro(
                item.produto_nome || item.nome || 'Produto'
            );

            const codigo = textoSeguro(
                item.produto_codigo || item.codigo || ''
            );

           const linhasNome = pdf.splitTextToSize(nome, 83);

            const alturaLinha = Math.max(10, linhasNome.length * 4.3 + 3);

            if (y + alturaLinha > 180) {

                pdf.addPage();
                adicionarCabecalho();
                y = adicionarCabecalhoTabela(40);

            }

            pdf.setDrawColor(222, 225, 232);
            pdf.line(margem, y + alturaLinha, margem + largura, y + alturaLinha);

            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(7.5);
          pdf.text(codigo || '-', margem + 3, y + 5);
pdf.text(linhasNome, 35, y + 5);
            pdf.text(textoSeguro(item.produto_corredor), 121, y + 5, { align: 'right' });
            pdf.text(textoSeguro(item.produto_prateleira), 140, y + 5, { align: 'right' });
            pdf.text(textoSeguro(item.produto_posicao), 158, y + 5, { align: 'right' });
            pdf.text(textoSeguro(item.produto_codigo_fabricante), 181, y + 5, { align: 'right' });
            pdf.text(String(Number(item.quantidade || 0)), 208, y + 5, { align: 'right' });
            pdf.text(fmt(item.preco_unitario), 232, y + 5, { align: 'right' });
    const subtotalItem =
        Number(item.quantidade || 0) *
        Number(item.preco_unitario || 0);

            pdf.text(
            fmt(subtotalItem),
            285,
            y + 5,
            { align: 'right' }
        );

        y += alturaLinha;

    });

        const subtotal = Number(pedidoAberto.subtotal || 0);
        const desconto = Number(pedidoAberto.desconto || 0);
        const total = Number(pedidoAberto.total || subtotal - desconto);

        if (y + 38 > 192) {

            pdf.addPage();
            adicionarCabecalho();
            y = 45; 

        }

        y += 8;

        const adicionarTotal = (titulo, valor, destaque = false) => {

            pdf.setFont('helvetica', destaque ? 'bold' : 'normal');
            pdf.setFontSize(destaque ? 12 : 9);
            pdf.text(titulo, 232, y, { align: 'right' });
            pdf.text(fmt(valor), 285, y, { align: 'right' });
            y += destaque ? 8 : 6;

        };

        adicionarTotal('Subtotal', subtotal);
        adicionarTotal('Desconto', desconto);

        adicionarTotal('TOTAL', total, true);

        pdf.setTextColor(95, 99, 117);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(
            'Documento gerado pelo sistema BM36.',
            margem,
            202
        );

        const nomeArquivo =
            `pedido-${pedidoAberto.id}.pdf`;

        const dispositivoMovel =
            /Android|iPhone|iPad|iPod/i.test(
                navigator.userAgent
            );

        // Em computadores, solicita a impressão ao visualizador nativo do PDF.
        // Em celulares o PDF deve abrir normalmente, para o usuário escolher
        // Compartilhar ou Imprimir no menu do próprio aparelho.
        if (
            imprimir
            &&
            !dispositivoMovel
            &&
            typeof pdf.autoPrint === 'function'
        ) {
            pdf.autoPrint();
        }

        const blobPdf =
            pdf.output('blob');

        if (imprimir) {

            const janelaImpressao =
                janelaDeImpressao
                || window.open('', '_blank');

            if (!janelaImpressao) {
                alert(
                    'O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.'
                );

                return;

            }

            const urlPdf =
                URL.createObjectURL(
                    blobPdf
                );

            // Não usar iframe: o Chrome no Android pode bloquear PDFs blob
            // incorporados. Abrir o Blob como documento principal é compatível
            // com o menu nativo de imprimir/compartilhar do Android e do iPhone.
            janelaImpressao.location.href =
                urlPdf;

            if (!dispositivoMovel) {
                janelaImpressao.focus();
            }

            return;

        }

        try {

            if (
                typeof File === 'function'
                &&
                navigator.canShare
            ) {

                const arquivo = new File(
                    [blobPdf],
                    nomeArquivo,
                    { type: 'application/pdf' }
                );

                if (navigator.canShare({ files: [arquivo] })) {

                    await navigator.share({
                        title: `Pedido #${pedidoAberto.id}`,
                        text: `Comprovante do pedido #${pedidoAberto.id}`,
                        files: [arquivo]
                    });

                    return;

                }

            }

        } catch (erro) {

            if (erro.name === 'AbortError') {
                return;
            }

            console.error('Erro ao compartilhar PDF:', erro);

        }

        pdf.save(nomeArquivo);



    }
    pdfPedidoBtn.addEventListener(
        'click',
        () => gerarPdfPedido()
    );

    imprimirPedidoBtn.addEventListener(
        'click',
        () => {

            // Abre a janela durante o toque do usuário. Alguns celulares
            // bloqueiam pop-ups iniciados depois que o PDF já foi montado.
            const janelaImpressao =
                window.open('', '_blank');

            if (!janelaImpressao) {
                alert(
                    'O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.'
                );

                return;

            }

            gerarPdfPedido(true, janelaImpressao);
        }
    );


    // ============================================================
    // CARREGAR PEDIDOS
    // ============================================================

    async function carregarPedidos() {

        try {

            salesBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Carregando pedidos...
                    </td>
                </tr>
            `;


            const resposta =
                await fetch(
                    `${API_URL}/vendas`
                );


            if (!resposta.ok) {

                throw new Error(
                    'Erro ao carregar pedidos.'
                );

            }


            pedidos =
                await resposta.json();


            aplicarFiltros();


        } catch (erro) {

            console.error(
                erro
            );


            salesBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Não foi possível carregar os pedidos.
                    </td>
                </tr>
            `;

        }

    }


    // ============================================================
    // FILTROS
    // ============================================================

    function aplicarFiltros() {

        const termo =
            searchInput.value
                .trim()
                .toLowerCase();


        const hoje =
            new Date();


        pedidosFiltrados =
            pedidos.filter(
                pedido => {

                    const id =
                        String(
                            pedido.id || ''
                        );


                    const cliente =
                        String(
                            pedido.cliente_nome || ''
                        )
                            .toLowerCase();


                    const documento =
                        String(
                            pedido.cliente_documento || ''
                        )
                            .replace(
                                /\D/g,
                                ''
                            );


                    const termoDocumento =
                        termo.replace(
                            /\D/g,
                            ''
                        );


                    const buscaOK =
                        !termo
                        ||
                        id.includes(
                            termo
                        )
                        ||
                        cliente.includes(
                            termo
                        )
                        ||
                        (
                            termoDocumento
                            &&
                            documento.includes(
                                termoDocumento
                            )
                        );


                    if (!buscaOK) {

                        return false;

                    }


                    const status =
                        normalizarStatus(
                            pedido.status
                        );


                    if (
                        filtroAtual ===
                        'canceladas'
                    ) {

                        return status ===
                            'cancelada';

                    }


                    if (
                        filtroAtual ===
                        'finalizadas'
                    ) {

                        return status ===
                            'finalizada';

                    }


                    const data =
                        new Date(
                            pedido.criado_em
                        );


                    if (
                        filtroAtual ===
                        'hoje'
                    ) {

                        return (
                            data.getDate() ===
                                hoje.getDate()
                            &&
                            data.getMonth() ===
                                hoje.getMonth()
                            &&
                            data.getFullYear() ===
                                hoje.getFullYear()
                        );

                    }


                    if (
                        filtroAtual ===
                        'mes'
                    ) {

                        return (
                            data.getMonth() ===
                                hoje.getMonth()
                            &&
                            data.getFullYear() ===
                                hoje.getFullYear()
                        );

                    }


                    return true;

                }
            );


        paginaAtual =
            1;


        renderPedidos();

    }


    // ============================================================
    // RENDER PEDIDOS
    // ============================================================

    function renderPedidos() {

        salesBody.innerHTML =
            '';


        const inicio =
            (
                paginaAtual -
                1
            )
            *
            itensPorPagina;


        const pagina =
            pedidosFiltrados.slice(
                inicio,
                inicio +
                itensPorPagina
            );


        if (
            pagina.length ===
            0
        ) {

            salesBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        Nenhum pedido encontrado.
                    </td>
                </tr>
            `;


            atualizarPaginacao();

            return;

        }


        pagina.forEach(
            pedido => {

                const tr =
                    document.createElement(
                        'tr'
                    );


                tr.dataset.id =
                    pedido.id;


                const status =
                    normalizarStatus(
                        pedido.status
                    );


                tr.innerHTML = `

                    <td>
                        #${pedido.id}
                    </td>

                    <td class="name">
                        ${pedido.cliente_nome || '-'}
                    </td>

                    <td>
                        ${formatarData(
                            pedido.criado_em
                        )}
                    </td>

                    <td class="val">
                        ${fmt(
                            pedido.total
                        )}
                    </td>

                    <td>

                        <span
                            class="badge ${status}"
                        >

                            ${statusLabel(
                                status
                            )}

                        </span>

                    </td>
                `;


                salesBody.appendChild(
                    tr
                );

            }
        );


        atualizarPaginacao();

    }


    // ============================================================
    // PAGINAÇÃO
    // ============================================================

    function atualizarPaginacao() {

        const total =
            pedidosFiltrados.length;


        pageNums.innerHTML =
            '';


        if (total === 0) {

            pageInfo.textContent =
                'Nenhum pedido';

            return;

        }


        const totalPaginas =
            Math.ceil(
                total /
                itensPorPagina
            );


        const inicio =
            (
                paginaAtual -
                1
            )
            *
            itensPorPagina
            +
            1;


        const fim =
            Math.min(
                paginaAtual *
                itensPorPagina,
                total
            );


        pageInfo.textContent =
            `Mostrando ${inicio}-${fim} de ${total} pedidos`;


        const anterior =
            document.createElement(
                'button'
            );


        anterior.textContent =
            '◀';


        anterior.disabled =
            paginaAtual === 1;


        anterior.addEventListener(
            'click',
            () => {

                if (
                    paginaAtual >
                    1
                ) {

                    paginaAtual--;

                    renderPedidos();

                }

            }
        );


        pageNums.appendChild(
            anterior
        );


        for (
            let pagina = 1;
            pagina <= totalPaginas;
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
                paginaAtual
            ) {

                botao.classList.add(
                    'active'
                );

            }


            botao.addEventListener(
                'click',
                () => {

                    paginaAtual =
                        pagina;

                    renderPedidos();

                }
            );


            pageNums.appendChild(
                botao
            );

        }


        const proximo =
            document.createElement(
                'button'
            );


        proximo.textContent =
            '▶';


        proximo.disabled =
            paginaAtual ===
            totalPaginas;


        proximo.addEventListener(
            'click',
            () => {

                if (
                    paginaAtual <
                    totalPaginas
                ) {

                    paginaAtual++;

                    renderPedidos();

                }

            }
        );


        pageNums.appendChild(
            proximo
        );

    }

    // ============================================================
    // CARREGAR EVENTOS
    // ============================================================

    async function carregarEventos() {

        try {

            const token =
                localStorage.getItem(
                    'bm36_token'
                );


            const resposta =
                await fetch(
                    `${API_URL}/eventos`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
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


            preencherSelectEventos();


        } catch (erro) {

            console.error(
                'Erro ao carregar eventos:',
                erro
            );

        }

    }


    // ============================================================
    // PREENCHER SELECT DE EVENTOS
    // ============================================================

    function preencherSelectEventos() {

        if (!eventoPedido) {
            return;
        }


        eventoPedido.innerHTML = `
            <option value="">
                Sem evento
            </option>
        `;


        eventos.forEach(
            evento => {

                const option =
                    document.createElement(
                        'option'
                    );


                option.value =
                    evento.id;


                option.textContent =
                    evento.nome;


                eventoPedido.appendChild(
                    option
                );

            }
        );

    }
    // ============================================================
    // ABRIR PEDIDO
    // ============================================================

    async function abrirPedido(id) {

        try {

            const resposta =
                await fetch(
                    `${API_URL}/vendas/${id}`
                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                throw new Error(
                    resultado.mensagem
                    ||
                    'Erro ao buscar pedido.'
                );

            }


            pedidoAberto =
                resultado.venda;


            modoEdicao =
                false;


            renderModalPedido();


            overlay.classList.add(
                'show'
            );


            document.body.style.overflow =
                'hidden';


        } catch (erro) {

            console.error(
                erro
            );

        }

    }


    // ============================================================
    // RENDER MODAL
    // ============================================================

    function renderModalPedido() {

        if (!pedidoAberto) {
            return;
        }


        document
            .getElementById(
                'modalTitle'
            )
            .textContent =
            `Pedido #${pedidoAberto.id}`;


        let cliente =
            pedidoAberto.cliente_nome
            ||
            '-';


        if (
            pedidoAberto
                .cliente_documento
        ) {

            cliente +=
                ` - ${formatarDocumento(
                    pedidoAberto
                        .cliente_documento
                )}`;

        }


    document
        .getElementById(
            'modalCliente'
        )
        .textContent =
        cliente;


    // =========================
    // VENDEDOR
    // =========================

    const modalVendedor =
        document.getElementById(
            'modalVendedor'
        );


    if (modalVendedor) {

        modalVendedor.textContent =
            pedidoAberto.usuario_nome
            ||
            'Não informado';

    }


        
        document
            .getElementById(
                'modalData'
            )
            .textContent =
            formatarData(
                pedidoAberto.criado_em
            );


        document
            .getElementById(
                'modalStatus'
            )
            .textContent =
            statusLabel(
                pedidoAberto.status
            );


        const cancelamentoInfo =
            document.getElementById(
                'cancelamentoInfo'
            );


        const cancelado =
            normalizarStatus(
                pedidoAberto.status
            )
            ===
            'cancelada';


        if (cancelado) {

            cancelamentoInfo
                .classList
                .add(
                    'visivel'
                );


            cancelamentoInfo.innerHTML = `

                <strong>
                    Pedido cancelado
                </strong>

                <br>

                ${
                    pedidoAberto.cancelado_em
                        ?
                        `Em ${formatarData(
                            pedidoAberto.cancelado_em
                        )}<br>`
                        :
                        ''
                }

                Motivo:
                ${
                    pedidoAberto.motivo_cancelamento
                    ||
                    'Não informado'
                }
            `;

        } else {

            cancelamentoInfo
                .classList
                .remove(
                    'visivel'
                );


            cancelamentoInfo.innerHTML =
                '';

        }


        editarBtn.disabled =
            cancelado;


        cancelarPedidoBtn.disabled =
            cancelado;


        editarBtn.textContent =
            modoEdicao
                ? 'Salvar Alterações'
                : 'Editar Pedido';
    // ============================================================
    // EVENTO DO PEDIDO
    // ============================================================

    if (
        campoEventoEdicao &&
        eventoPedido
    ) {

        campoEventoEdicao.style.display =
            modoEdicao
                ? 'flex'
                : 'none';


        if (modoEdicao) {

            eventoPedido.value =
                pedidoAberto.evento_id
                    ? String(
                        pedidoAberto.evento_id
                    )
                    : '';

        }

    }

        renderItensModal();

    }


    // ============================================================
    // ITENS
    // ============================================================

    function renderItensModal() {

        const body =
            document.getElementById(
                'modalItems'
            );


        body.innerHTML =
            '';
        pedidoAberto.itens
            .forEach(
                item => {

                    const tr =
                        document.createElement(
                            'tr'
                        );


                    const quantidade =
                        Number(
                            item.quantidade
                        );


                    const preco =
                        Number(
                            item.preco_unitario
                        );


                    tr.innerHTML = `

                        <td>
                            ${item.produto_nome}
                        </td>


                        <td>

                            ${
                                modoEdicao
                                    ?
                                    `
                                        <input
                                            class="edit-qty"
                                            type="number"
                                            min="1"
                                            step="1"
                                            data-produto-id="${item.produto_id}"
                                            value="${quantidade}"
                                        >
                                    `
                                    :
                                    quantidade
                            }

                        </td>


                        <td>
                            ${fmt(preco)}
                        </td>


                        <td>
                            ${fmt(
                                quantidade *
                                preco
                            )}
                        </td>
                    `;


                    body.appendChild(
                        tr
                    );

                }
            );


        recalcularResumoModal();

    }


    // ============================================================
    // RECALCULAR RESUMO
    // ============================================================

    function recalcularResumoModal() {

        const subtotal =
            pedidoAberto.itens
                .reduce(
                    (
                        soma,
                        item
                    ) => {

                        return (
                            soma
                            +
                            Number(
                                item.quantidade
                            )
                            *
                            Number(
                                item.preco_unitario
                            )
                        );

                    },
                    0
                );


        const desconto =
            Number(
                pedidoAberto.desconto
                ||
                0
            );


        document
            .getElementById(
                'modalSubtotal'
            )
            .textContent =
            fmt(
                subtotal
            );


        document
            .getElementById(
                'modalDesconto'
            )
            .textContent =
            fmt(
                desconto
            );


        document
            .getElementById(
                'modalTotal'
            )
            .textContent =
            fmt(
                subtotal -
                desconto
            );

    }


    // ============================================================
    // EDITAR
    // ============================================================

    editarBtn.addEventListener(
        'click',
        async () => {

            if (!pedidoAberto) {
                return;
            }


            if (!modoEdicao) {

                modoEdicao =
                    true;


                renderModalPedido();

                return;

            }


            const inputs =
                document.querySelectorAll(
                    '.edit-qty'
                );


            const itens =
                [];


            inputs.forEach(
                input => {

                    itens.push({

                        produto_id:
                            Number(
                                input.dataset
                                    .produtoId
                            ),

                        quantidade:
                            Math.max(
                                1,
                                Math.floor(
                                    Number(
                                        input.value
                                    )
                                )
                            )

                    });

                }
            );


            try {

                editarBtn.disabled =
                    true;


                const resposta =
                    await fetch(
                        `${API_URL}/vendas/${pedidoAberto.id}`,
                        {

                            method:
                                'PUT',

                            headers: {

                                'Content-Type':
                                    'application/json'

                            },

                        body:
        JSON.stringify({

            itens,

            evento_id:
                eventoPedido.value
                    ? Number(
                        eventoPedido.value
                    )
                    : null

        })

                        }
                    );


                const resultado =
                    await resposta.json();


                if (!resposta.ok) {

                    alert(
                        resultado.mensagem
                        ||
                        'Não foi possível alterar o pedido.'
                    );


                    editarBtn.disabled =
                        false;


                    return;

                }


                await carregarPedidos();


                await abrirPedido(
                    pedidoAberto.id
                );


        } catch (erro) {

                console.error(
                    erro
                );


                alert(
                    'Não foi possível alterar o pedido.'
                );

            }

        }
    );


    // ============================================================
    // CANCELAR
    // ============================================================

    cancelarPedidoBtn.addEventListener(
        'click',
        () => {

            if (!pedidoAberto) {
                return;
            }


            motivoCancelamento.value =
                '';


            document
                .getElementById(
                    'cancelTitle'
                )
                .textContent =
                `Cancelar Pedido #${pedidoAberto.id}`;


            cancelOverlay.classList.add(
                'show'
            );

        }
    );


    confirmarCancelamentoBtn
        .addEventListener(
            'click',
            async () => {

                const motivo =
                    motivoCancelamento
                        .value
                        .trim();


                if (!motivo) {

                    alert(
                        'Informe o motivo do cancelamento.'
                    );

                    return;

                }


                try {

                    confirmarCancelamentoBtn.disabled =
                        true;


                    const resposta =
                        await fetch(
                            `${API_URL}/vendas/${pedidoAberto.id}/cancelar`,
                            {

                                method:
                                    'PATCH',

                                headers: {

                                    'Content-Type':
                                        'application/json'

                                },

                                body:
                                    JSON.stringify({
                                        motivo
                                    })

                            }
                        );


                    const resultado =
                        await resposta.json();


                    confirmarCancelamentoBtn.disabled =
                        false;


                    if (!resposta.ok) {

                        alert(
                            resultado.mensagem
                            ||
                            'Não foi possível cancelar o pedido.'
                        );

                        return;

                    }


                    cancelOverlay
                        .classList
                        .remove(
                            'show'
                        );


                    overlay
                        .classList
                        .remove(
                            'show'
                        );


                    document.body.style.overflow =
                        '';


                    await carregarPedidos();


                } catch (erro) {

                    confirmarCancelamentoBtn.disabled =
                        false;


                    console.error(
                        erro
                    );


                    alert(
                        'Erro ao cancelar pedido.'
                    );

                }

            }
        );


    // ============================================================
    // EVENTOS
    // ============================================================

    salesBody.addEventListener(
        'click',
        evento => {

            const tr =
                evento.target.closest(
                    'tr[data-id]'
                );


            if (!tr) {
                return;
            }


            abrirPedido(
                Number(
                    tr.dataset.id
                )
            );

        }
    );


    filters.addEventListener(
        'click',
        evento => {

            const btn =
                evento.target.closest(
                    '.pill'
                );


            if (!btn) {
                return;
            }


            filters
                .querySelectorAll(
                    '.pill'
                )
                .forEach(
                    item =>
                        item.classList
                            .remove(
                                'active'
                            )
                );


            btn.classList.add(
                'active'
            );


            filtroAtual =
                btn.dataset.filter;


            aplicarFiltros();

        }
    );


    searchInput.addEventListener(
        'input',
        aplicarFiltros
    );


    // ============================================================
    // FECHAR MODAIS
    // ============================================================

    function fecharPedido() {

        overlay.classList.remove(
            'show'
        );


        document.body.style.overflow =
            '';

    }


    closeX.addEventListener(
        'click',
        fecharPedido
    );


    closeBtn.addEventListener(
        'click',
        fecharPedido
    );


    overlay.addEventListener(
        'click',
        evento => {

            if (
                evento.target ===
                overlay
            ) {

                fecharPedido();

            }

        }
    );


    function fecharCancelamento() {

        cancelOverlay.classList.remove(
            'show'
        );

    }


    cancelCloseX.addEventListener(
        'click',
        fecharCancelamento
    );


    voltarCancelamentoBtn.addEventListener(
        'click',
        fecharCancelamento
    );


    // ============================================================
    // INICIAR
    // ============================================================

    carregarPedidos();
    carregarEventos();
