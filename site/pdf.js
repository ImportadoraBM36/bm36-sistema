
async function gerarPdfPedido(
    pedido,
    imprimir = false,
    janelaDeImpressao = null
) {
    if (!pedido) {
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
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // ============================================================
    // CONFIGURAÇÕES
    // ============================================================

    const larguraPagina = 210;
    const margem = 10;
    const logo = './imagem/logo.png';
    const right = 180;

    // ============================================================
    // DADOS DO PEDIDO
    // ============================================================

    const clientes =
        pedido.cliente_nome ||
        'Não informado';

    const cliente =
        pedido.cliente_nome ||
        'Não informado';

    const documento =
        pedido.cliente_documento;

    const codigoCliente =
        pedido.cliente_codigo ||
        pedido.codigo_sistema_antigo ||
        '';

    const vendedor =
        pedido.usuario_nome ||
        'Não informado';

    const formapagamento =
        pedido.formaPagamento ||
        'Não informado';

    const evento =
        pedido.evento_nome ||
        'Não informado';
    
        const transportadora =
        pedido.transportadora ||
        'Não informado';

        
    console.log('PEDIDO:', pedido);

    // ============================================================
    // FORMATADORES DO PDF
    // ============================================================

    function fmtPdf(valor) {
        return Number(valor || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    function formatarDataPdf(data) {
        if (!data) {
            return '-';
        }

        const objeto = new Date(data);

        return objeto.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function textoSeguro(valor) {
        return String(valor || '-')
            .replace(/[\r\n]+/g, ' ');
    }

    // ============================================================
    // CABEÇALHO
    // ============================================================

    function adicionarCabecalho() {

        pdf.setTextColor(20, 20, 20);

        // --------------------------------------------------------
        // LOGO
        // --------------------------------------------------------

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);

        pdf.addImage(
            logo,
            'PNG',
            margem,
            5,
            20,
            20
        );

        // --------------------------------------------------------
        // INFORMAÇÕES DA EMPRESA
        // --------------------------------------------------------

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);

        pdf.text(
            'BM36 CIE LTDA',
            35,
            10
        );

        // CNPJ
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);

        pdf.text(
            'C.N.P.J.: 00.000.000/0000-00 - I.E.: 140085675118',
            35,
            15
        );

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);

        pdf.text(
            'AV SENADOR QUEIROZ, N°605',
            35,
            20
        );

        pdf.text(
            'COMPL: SALA 1405/1406, BAIRRO: CENTRO',
            35,
            23
        );

        pdf.text(
            'SÃO PAULO - SP - CEP: 01026-001',
            35,
            27
        );

        pdf.text(
            'FONE: (11) 3315-8669, CELULAR: (11) 94108-5905',
            35,
            31
        );

        pdf.text(
            'EMAIL: contato@bm36importadora.com.br',
            35,
            35
        );

        pdf.text(
            'SITE: www.bm36importadora.com.br',
            35,
            39
        );

        pdf.text(
            'REDES SOCIAIS: facebook.com/bm36IMPORTADORA | @bm36_importadora',
            35,
            43
        );

        // --------------------------------------------------------
        // NÚMERO DO PEDIDO
        // --------------------------------------------------------

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(20);

        pdf.text(
            String(pedido.id),
            right,
            10
        );

        // --------------------------------------------------------
        // DATA DE EMISSÃO
        // --------------------------------------------------------

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);

        pdf.text(
            `Emitido em ${formatarDataPdf(new Date())}`,
            170,
            30
        );

        // --------------------------------------------------------
        // LINHA ABAIXO DO CABEÇALHO
        // --------------------------------------------------------

        pdf.setDrawColor(90, 90, 90);
        pdf.setLineWidth(0.25);

        pdf.line(
            2,
            45,
            larguraPagina - 2,
            45
        );

        pdf.setTextColor(28, 27, 46);
    }

    // ============================================================
    // CABEÇALHO
    // ============================================================

    adicionarCabecalho();

    // ============================================================
    // INFORMAÇÕES DO CLIENTE
    // ============================================================

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);

    pdf.text(
        'Código do cliente: ' + codigoCliente,
        5,
        50
    );

    pdf.text(
        'Nome do Cliente: ' + clientes,
        5,
        54
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);

    pdf.text(
        'CNPJ/CPF: ' + (documento || 'Não informado'),
        5,
        58
    );

    pdf.text(
        'Contato: ' + (pedido.cliente_telefone || 'Não informado'),
        5,
        62
    );

    // ============================================================
    // INFORMAÇÕES DO PEDIDO
    // ============================================================

    pdf.text(
        'Evento: ' + evento,
        130,
        50
    );

    pdf.text(
        'Vendedor: ' + vendedor,
        130,
        54
    );

    pdf.text(
        'Forma de pagamento: ' + formapagamento,
        130,
        58
    );

    pdf.text(
        'Transportadora: ' + transportadora,
        130,
        62
    );

    // ============================================================
    // TOTAIS DO PEDIDO
    // ============================================================

    let yTotais = 82;

    const subtotal =
        Number(
            pedido.subtotal ||
            pedido.sub_total ||
            0
        );

    const desconto =
        Number(
            pedido.desconto ||
            0
        );

    const total =
        Number(
            pedido.total ||
            0
        );

    const totalIpi =
        Number(
            pedido.total_ipi ||
            pedido.ipi ||
            0
        );

    // ============================================================
    // TÍTULOS DOS TOTAIS
    // ============================================================

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);

    pdf.text(
        'SUB TOTAL',
        25,
        yTotais
    );

    pdf.text(
        'TOTAL DE IPI',
        71,
        yTotais
    );

    pdf.text(
        'VALOR DE DESCONTO',
        118,
        yTotais
    );

    pdf.text(
        'TOTAL DO PEDIDO',
        168,
        yTotais
    );

    // ============================================================
    // VALORES DOS TOTAIS
    // ============================================================

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    pdf.text(
        fmtPdf(subtotal),
        32,
        yTotais + 7,
        {
            align: 'center'
        }
    );

    pdf.text(
        fmtPdf(totalIpi),
        78,
        yTotais + 7,
        {
            align: 'center'
        }
    );

    pdf.text(
        fmtPdf(desconto),
        125,
        yTotais + 7,
        {
            align: 'center'
        }
    );

    pdf.text(
        fmtPdf(total),
        175,
        yTotais + 7,
        {
            align: 'center'
        }
    );

    // ============================================================
    // LINHA ABAIXO DOS TOTAIS
    // ============================================================

    pdf.setDrawColor(90, 90, 90);
    pdf.setLineWidth(0.25);

    pdf.line(
        10,
        yTotais + 10,
        200,
        yTotais + 10
    );

    // ============================================================
    // CABEÇALHO DOS PRODUTOS
    // ============================================================

    let yTabela = 97;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);

    pdf.text(
        'CÓDIGO',
        12,
        yTabela
    );

    pdf.text(
        'DESCRIÇÃO',
        35,
        yTabela
    );

    pdf.text(
        'VLR UNIT. LÍQUIDO',
        100,
        yTabela
    );

    pdf.text(
        'QUANTI',
        140,
        yTabela
    );

    pdf.text(
        'VALOR TOTAL',
        160,
        yTabela
    );

    pdf.text(
        'PREVISÃO',
        190,
        yTabela
    );

    // ============================================================
    // LINHA DO CABEÇALHO
    // ============================================================

    pdf.setDrawColor(90, 90, 90);
    pdf.setLineWidth(0.25);

    pdf.line(
        10,
        yTabela + 3,
        200,
        yTabela + 3
    );

    // ============================================================
    // PRODUTOS
    // ============================================================

    let yProduto = yTabela + 9;

    const itens =
        Array.isArray(pedido.itens)
            ? pedido.itens
            : [];

    itens.forEach(item => {

        const codigo =
            textoSeguro(
                item.produto_codigo ||
                item.codigo ||
                ''
            );

        const descricao =
            textoSeguro(
                item.produto_nome ||
                item.nome ||
                'Produto'
            );

        const quantidade =
            Number(
                item.quantidade ||
                item.qtd ||
                0
            );

        const valorUnitario =
            Number(
                item.preco_unitario ||
                item.valor_unitario ||
                item.preco ||
                0
            );

        const valorTotal =
            Number(
                item.subtotal ||
                item.valor_total ||
                (valorUnitario * quantidade)
            );

        const previsao =
            textoSeguro(
                item.previsao ||
                ''
            );

        // --------------------------------------------------------
        // DESCRIÇÃO
        // --------------------------------------------------------

        const linhasDescricao =
            pdf.splitTextToSize(
                descricao,
                60
            );

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);

        // --------------------------------------------------------
        // CÓDIGO
        // --------------------------------------------------------

        pdf.text(
            codigo,
            12,
            yProduto
        );

        // --------------------------------------------------------
        // DESCRIÇÃO
        // --------------------------------------------------------

        pdf.text(
            linhasDescricao,
            35,
            yProduto
        );

        // --------------------------------------------------------
        // VALOR UNITÁRIO
        // --------------------------------------------------------

        pdf.text(
            fmtPdf(valorUnitario),
            100,
            yProduto
        );

        // --------------------------------------------------------
        // QUANTIDADE
        // --------------------------------------------------------

        pdf.text(
            String(quantidade),
            140,
            yProduto
        );

        // --------------------------------------------------------
        // VALOR TOTAL
        // --------------------------------------------------------

        pdf.text(
            fmtPdf(valorTotal),
            160,
            yProduto
        );

        // --------------------------------------------------------
        // PREVISÃO
        // --------------------------------------------------------

        pdf.text(
            previsao,
            190,
            yProduto
        );

        // --------------------------------------------------------
        // LINHA DO PRODUTO
        // --------------------------------------------------------

        pdf.setDrawColor(
            220,
            220,
            220
        );

        pdf.line(
            10,
            yProduto + 3,
            200,
            yProduto + 3
        );

        // --------------------------------------------------------
        // PRÓXIMO PRODUTO
        // --------------------------------------------------------

        yProduto += Math.max(
            7,
            linhasDescricao.length * 4
        );

        // --------------------------------------------------------
        // NOVA PÁGINA
        // --------------------------------------------------------

        if (yProduto > 270) {

            pdf.addPage();

            adicionarCabecalho();

            yProduto = 55;
        }
    });

    // ============================================================
    // RODAPÉ
    // ============================================================

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);

    pdf.setTextColor(
        80,
        80,
        80
    );

    pdf.text(
        'Documento gerado pelo sistema BM36.',
        10,
        285
    );

    // ============================================================
    // NOME DO ARQUIVO
    // ============================================================

    const nomeArquivo =
        `pedido-${pedido.id}.pdf`;

    // ============================================================
    // DISPOSITIVO MÓVEL
    // ============================================================

    const dispositivoMovel =
        /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
        );

    // ============================================================
    // IMPRESSÃO
    // ============================================================

    if (
        imprimir &&
        !dispositivoMovel &&
        typeof pdf.autoPrint === 'function'
    ) {
        pdf.autoPrint();
    }

    if (imprimir) {

        const janelaImpressao =
            janelaDeImpressao ||
            window.open(
                '',
                '_blank'
            );

        if (!janelaImpressao) {

            alert(
                'O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.'
            );

            return;
        }

        const blobPdf =
            pdf.output('blob');

        const urlPdf =
            URL.createObjectURL(
                blobPdf
            );

        janelaImpressao.location.href =
            urlPdf;

        if (!dispositivoMovel) {
            janelaImpressao.focus();
        }

        return;
    }

    // ============================================================
    // COMPARTILHAMENTO
    // ============================================================

    try {

        if (
            typeof File === 'function' &&
            navigator.canShare
        ) {

            const blobPdf =
                pdf.output('blob');

            const arquivo =
                new File(
                    [blobPdf],
                    nomeArquivo,
                    {
                        type: 'application/pdf'
                    }
                );

            if (
                navigator.canShare({
                    files: [arquivo]
                })
            ) {

                await navigator.share({
                    title:
                        `Pedido #${pedido.id}`,

                    text:
                        `Comprovante do pedido #${pedido.id}`,

                    files: [arquivo]
                });

                return;
            }
        }

    } catch (erro) {

        if (
            erro.name === 'AbortError'
        ) {
            return;
        }

        console.error(
            'Erro ao compartilhar PDF:',
            erro
        );
    }

    // ============================================================
    // DOWNLOAD
    // ============================================================

    pdf.save(
        nomeArquivo
    );
}

