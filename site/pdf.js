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
    let configuracaoPdf = {};
    try {
        const respostaConfiguracao = await fetch('https://bm36-sistema-production.up.railway.app/api/configuracoes-pdf');
        configuracaoPdf = (await respostaConfiguracao.json()).configuracao || {};
    } catch (_) { /* mantém os dados visuais atuais se estiver offline */ }
    const logo = configuracaoPdf.logo_pdf || './imagem/logofolha-removebg-preview.png';
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
        pedido.transportadora_nome ||
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
        pdf.setFontSize(30);

        pdf.addImage(
            logo,
            'PNG',
            margem,
            10,
            20,
            20
        );

        // --------------------------------------------------------
        // INFORMAÇÕES DA EMPRESA
        // --------------------------------------------------------

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);

        pdf.text(
            configuracaoPdf.nome_empresa || 'BM36 CIE LTDA',
            35,
            10
        );

        // CNPJ
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(10);

        pdf.text(
            `C.N.P.J.: ${configuracaoPdf.cnpj || '09.648.255/0001-30'} - I.E.: ${configuracaoPdf.inscricao_estadual || '140085675118'}`,
            35,
            15
        );

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);

        pdf.text(
            `${configuracaoPdf.endereco || 'AV SENADOR QUEIROZ'}, N°${configuracaoPdf.numero || '605'}`,
            35,
            20
        );

        pdf.text(
            `COMPL: ${configuracaoPdf.complemento || 'SALA 1405/1406'}, BAIRRO: ${configuracaoPdf.bairro || 'CENTRO'}`,
            35,
            23
        );

        pdf.text(
            `${configuracaoPdf.cidade || 'SÃO PAULO'} - ${configuracaoPdf.estado || 'SP'} - CEP: ${configuracaoPdf.cep || '01026-001'}`,
            35,
            27
        );

        pdf.text(
            `FONE: ${configuracaoPdf.telefone || '(11) 3315-8669'}`,
            35,
            31
        );

        pdf.text(
            `EMAIL: ${configuracaoPdf.email || 'contato@bm36importadora.com.br'}`,
            35,
            35
        );

        pdf.text(
            `SITE: ${configuracaoPdf.site || 'www.bm36importadora.com.br'}`,
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
    // OBSERVAÇÃO DO PEDIDO
    // ============================================================
    // Esta é a observação específica deste pedido.
    // Ela fica entre os dados do pedido e os totais.
    // É diferente de "observacoes_pedido", que continua
    // aparecendo mais abaixo, antes da declaração/assinatura.
    // ============================================================

    const textoObservacao =
        pedido.observacao ||
        '';

    const linhasObservacao =
        textoObservacao
            ? pdf.splitTextToSize(
                String(textoObservacao),
                188
            )
            : [];

    let yTotais;

    if (linhasObservacao.length > 0) {

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);

        pdf.text(
            'OBSERVAÇÃO:',
            5,
            69
        );

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7);

        pdf.text(
            linhasObservacao,
            5,
            73
        );

        // Cada linha ocupa aproximadamente 3.6 mm.
        yTotais =
            73 +
            (linhasObservacao.length * 3.6) +
            6;

    } else {

        // Se não houver observação, mantém os totais
        // praticamente na posição original.
        yTotais = 82;
    }

    // ============================================================
    // TOTAIS DO PEDIDO
    // ============================================================

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
    // TIPO DE VALOR DA VENDA (Cheio / Real / 1/3)
    // ------------------------------------------------------------
    // No banco, o preço de cada item e o "subtotal" SEMPRE ficam
    // gravados em valor real (sem ajuste). Só o "total" do pedido
    // já vem pronto, no valor que foi escolhido na tela de Venda.
    // Por isso aplicamos o mesmo fator do tipo escolhido em cima
    // dos itens e do subtotal, para o PDF nunca misturar números
    // de "moedas" diferentes (real / cheio / 1-3) na mesma folha.
    // ============================================================
    const tipoValorPedido =
        pedido.tipo_valor ||
        pedido.tipoValor ||
        '18001';

    // Fallback pela configuração (só usado se o pedido não tiver total)
    function fatorTipoValorPDF(tipo) {
        const pct = (chave, padrao) => {
            const n = Number(configuracaoPdf[`percentual_${chave}`]);
            return Number.isFinite(n) ? n : padrao;
        };

        switch (String(tipo)) {
            case '16001': return pct('16001', 33.33) / 100;
            case '18001': return pct('18001', 100) / 100;
            case '18002': return pct('18002', 120) / 100;
            // 22/002 = 18/002 x percentual_16002
            case '16002': return (pct('18002', 120) / 100) * (pct('16002', 66.67) / 100);

            // pedidos antigos
            case 'cheio': return 1.2;
            case 'terco': return 1 / 3;
            default:      return 1;
        }
    }

    // Fator real do pedido: total cobrado / subtotal já com o desconto.
    // Assim o PDF sempre bate com o que foi cobrado.
    const descontoSeguro =
        Math.min(100, Math.max(0, desconto));

    const baseLiquida =
        subtotal * (1 - descontoSeguro / 100);

    const FATOR_EXIBICAO_PDF =
        (baseLiquida > 0 && total > 0)
            ? total / baseLiquida
            : fatorTipoValorPDF(tipoValorPedido);

    // subtotal e IPI vêm em valor real do banco -> aplicamos o fator
    const subtotalPDF =
        subtotal * FATOR_EXIBICAO_PDF;

    const totalIpiPDF =
        totalIpi * FATOR_EXIBICAO_PDF;

    // "total" já vem certo/ajustado do banco
    const totalPDF = total;

    // "desconto" no banco é PORCENTAGEM, não valor em R$.
    // Calculamos o valor em reais coerente com o subtotal e o total
    const descontoPDF =
        Math.max(
            0,
            subtotalPDF - totalPDF
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
        111,
        yTotais
    );

    pdf.text(
        'TOTAL DO PEDIDO',
        161,
        yTotais
    );

    // ============================================================
    // VALORES DOS TOTAIS
    // ============================================================

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    pdf.text(
        fmtPdf(subtotalPDF),
        32,
        yTotais + 7,
        {
            align: 'center'
        }
    );

    pdf.text(
        fmtPdf(totalIpiPDF),
        78,
        yTotais + 7,
        {
            align: 'center'
        }
    );

    pdf.text(
        fmtPdf(descontoPDF),
        125,
        yTotais + 7,
        {
            align: 'center'
        }
    );

    pdf.text(
        fmtPdf(totalPDF),
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

    let yTabela = yTotais + 15;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);

    pdf.text(
        'Nº',
        5,
        yTabela
    );

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

    itens.forEach((item, indice) => {

        const numeroLinha = indice + 1;

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

        const valorUnitarioPDF =
            valorUnitario *
            FATOR_EXIBICAO_PDF;

        const valorTotal =
            Number(
                item.subtotal ||
                item.valor_total ||
                (valorUnitario * quantidade)
            );

        const valorTotalPDF =
            valorTotal *
            FATOR_EXIBICAO_PDF;

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
        // NÚMERO DA LINHA
        // --------------------------------------------------------

        pdf.text(
            String(numeroLinha),
            5,
            yProduto
        );

        // --------------------------------------------------------
        // CÓDIGO
        // --------------------------------------------------------

        pdf.text(
            codigo,
            15,
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
            fmtPdf(valorUnitarioPDF),
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
            fmtPdf(valorTotalPDF),
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
    // OBSERVAÇÕES DO PEDIDO (texto editável) + DECLARAÇÃO + ASSINATURA
    // ============================================================

    const textoObservacoesPadrao =
        'AS 3 PRIMEIRAS COMPRAS O PAGAMENTO É À VISTA ANTECIPADO\n' +
        'PEDIDOS Á PRAZO, SUJEITO A CONSULTA E LIBERAÇÃO FINANCEIRA\n' +
        'POR FAVOR INDICAR 5 FORNECEDORES QUE JÁ COMPRA Á PRAZO (MÍNIMO DE 1 ANO)';

    const textoObservacoes = pedido.observacoes_pedido || configuracaoPdf.mensagem_padrao_pedido || textoObservacoesPadrao;

    const linhasObservacoes =
        textoObservacoes
            .split('\n')
            .flatMap(linha =>
                pdf.splitTextToSize(
                    linha,
                    188
                )
            );

    // ============================================================
    // ALTURA NECESSÁRIA PARA O BLOCO INTEIRO
    // (observações + declaração + nome/assinatura)
    // ============================================================

    const alturaBlocoFinal =
        36 +
        linhasObservacoes.length * 3.6;

    if (yProduto + alturaBlocoFinal > 285) {

        pdf.addPage();

        adicionarCabecalho();

        yProduto = 55;
    }

    let yObservacoes =
        yProduto + 6;

    pdf.setDrawColor(90, 90, 90);
    pdf.setLineWidth(0.25);

    pdf.line(
        10,
        yObservacoes - 3,
        200,
        yObservacoes - 3
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(28, 27, 46);

    pdf.text(
        linhasObservacoes,
        10,
        yObservacoes
    );

    let yDeclaracao =
        yObservacoes +
        (linhasObservacoes.length * 3.6) +
        6;

    // --------------------------------------------------------
    // CAIXA "DECLARO ESTAR CIENTE..."
    // --------------------------------------------------------

    pdf.rect(
        10,
        yDeclaracao,
        190,
        8
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);

    pdf.text(
        'DECLARO ESTAR CIENTE SOBRE AS INFORMAÇÕES MENCIONADAS NESTE PEDIDO DE VENDA',
        12,
        yDeclaracao + 5.5
    );

    // --------------------------------------------------------
    // NOME POR EXTENSO / ASSINATURA
    // --------------------------------------------------------

    const yAssinatura =
        yDeclaracao + 8;

    const alturaAssinatura = 16;

    pdf.rect(
        10,
        yAssinatura,
        95,
        alturaAssinatura
    );

    pdf.rect(
        105,
        yAssinatura,
        95,
        alturaAssinatura
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);

    pdf.text(
        'NOME POR EXTENSO:',
        12,
        yAssinatura + 5
    );

    pdf.text(
        'ASSINATURA:',
        107,
        yAssinatura + 5
    );

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
