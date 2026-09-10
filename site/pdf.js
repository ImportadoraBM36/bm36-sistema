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

const larguraPagina = 210;
const margem = 10;
const largura = larguraPagina - (margem * 2);

const logo = './imagem/logo.png';


const clientes = pedido.cliente_nome || 'Não informado';
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

    function statusLabelPdf(status) {
        const s = String(status || '')
            .trim()
            .toLowerCase();

        if (s === 'cancelada') {
            return 'CANCELADO';
        }

        if (s === 'pendente') {
            return 'PENDENTE';
        }

        return 'FINALIZADO';
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

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);

    pdf.addImage(logo, 'PNG', margem, 5, 20, 20);

    // =============================================================
    // informaçoes da empresa
    // =============================================================

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
   pdf.setFont('helvetica');
   pdf.setFontSize(7);
   pdf.text('AV SENADOR QUEIROZ, N°605', 35, 20);

 pdf.setFont('helvetica');
   pdf.setFontSize(7);
pdf.text('COMPL: SALA 1405/1406, BAIRRO: CENTRO', 35, 23);


pdf.setFont('helvetica');
   pdf.setFontSize(7);
pdf.text('SÃO PAULO - SP - CEP: 01026-001', 35, 27);


    pdf.setFont('helvetica');
   pdf.setFontSize(7);
pdf.text('FONE: (11) 3315-8669, CELULAR: (11) 94108-5905', 35, 31);
    
    pdf.setFont('helvetica');
   pdf.setFontSize(7);
pdf.text('EMAIL: contato@bm36importadora.com.br', 35, 35);
    
       pdf.setFont('helvetica');
   pdf.setFontSize(7);
pdf.text('SITE: www.bm36importadora.com.br', 35, 39);

 pdf.setFont('helvetica');
   pdf.setFontSize(7);
pdf.text('REDES SOCIAIS: facebook.com/bm36IMPORTADORA | @bm36_importadora', 35, 43);


    // ======================================================================
    // fim do informações da empresa
    // ======================================================================
  
     // ======================================================================
    // parte do codigo de barras e data de emição
    // ======================================================================
  
  
pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('55.1', right, 10);

    
pdf.setFont('helvetica');
pdf.setFontSize(7); 
pdf.text(
    `Emitido em ${formatarDataPdf(new Date())}`, right, 30,
)

   // ======================================================================
    // fim da parte do codigo de barras e data de emição
    // ======================================================================
   
        
     

    // Linha abaixo do cabeçalho
    pdf.setDrawColor(90, 90, 90);
    pdf.setLineWidth(0.25);

    pdf.line(2,45 , larguraPagina - 2, 45);

    pdf.setTextColor(28, 27, 46);
}

   // ======================================================================
    // informações do cliente e do pedido
    // ======================================================================
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);
pdf.text('CÓDIGO DO PEDIDO:' + pedido.id, 5, 50);
pdf.setFont('helvetica', 'bold');
pdf.setFontSize(7);

pdf.text('Nome do Cliente: ' + clientes, 5, 52);
       // ======================================================================
    // fim da parte de informações do cliente e do pedido
    // ======================================================================





    // ============================================================
    // CABEÇALHO DA TABELA
    // ============================================================

    function adicionarCabecalhoTabela(y) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);

        pdf.text(
            'CÓDIGO',
            margem + 3,
            y + 5.2
        );

        pdf.text(
            'PRODUTO',
            35,
            y + 5.2
        );

        pdf.text(
            'CORR.',
            121,
            y + 5.2,
            {
                align: 'right'
            }
        );

        pdf.text(
            'PRAT.',
            140,
            y + 5.2,
            {
                align: 'right'
            }
        );

        pdf.text(
            'POS.',
            158,
            y + 5.2,
            {
                align: 'right'
            }
        );

        pdf.text(
            'CÓD. FAB.',
            181,
            y + 5.2,
            {
                align: 'right'
            }
        );

        pdf.text(
            'QTD.',
            208,
            y + 5.2,
            {
                align: 'right'
            }
        );

        pdf.text(
            'UNIT.',
            232,
            y + 5.2,
            {
                align: 'right'
            }
        );

        pdf.text(
            'SUBTOTAL',
            285,
            y + 5.2,
            {
                align: 'right'
            }
        );

        pdf.setDrawColor(90, 90, 90);
        pdf.setLineWidth(0.25);

        pdf.line(
            margem,
            y + 7,
            margem + largura,
            y + 7
        );

        return y + 8;
    }

    // ============================================================
    // INÍCIO DO PDF
    // ============================================================

    adicionarCabecalho();

    let y = 42;

    const cliente =
        pedido.cliente_nome ||
        'Não informado';

    const documento =
        pedido.cliente_documento;

    const codigoCliente =
        pedido.cliente_codigo ||
        pedido.codigo_sistema_antigo ||
        pedido.cliente_id ||
        '';

    // ============================================================
    // DADOS DO CLIENTE
    // ============================================================



    pdf.setFont('helvetica');
    pdf.setFontSize(10);

    pdf.text(
        textoSeguro(cliente),
        margem,
        y
    );

    pdf.text(
        formatarDataPdf(pedido.criado_em),
        165,
        y
    );

    y += 5;

    pdf.setFontSize(8.5);
    pdf.setTextColor(95, 99, 117);

    pdf.text(
        documento || 'Documento não informado',
        margem,
        y
    );

    
    pdf.text(
        `Código do cliente: ${textoSeguro(
            codigoCliente || 'Não informado'
        )}`,
        margem,
        y
    );

    y += 11;

    pdf.setTextColor(28, 27, 46);
    pdf.setFont('helvetica');

    pdf.text(
        `Vendedor: ${textoSeguro(
            pedido.usuario_nome || 'Não informado'
        )}`,
        margem,
        y
    );

    y += 10;

    y = adicionarCabecalhoTabela(y);

    // ============================================================
    // ITENS
    // ============================================================

    const itens =
        Array.isArray(pedido.itens)
            ? pedido.itens
            : [];

    itens.forEach(item => {
        const nome =
            textoSeguro(
                item.produto_nome ||
                item.nome ||
                'Produto'
            );

        const codigo =
            textoSeguro(
                item.produto_codigo ||
                item.codigo ||
                ''
            );

        const linhasNome =
            pdf.splitTextToSize(
                nome,
                83
            );

        const alturaLinha =
            Math.max(
                10,
                linhasNome.length * 4.3 + 3
            );

        if (y + alturaLinha > 180) {
            pdf.addPage();

            adicionarCabecalho();

            y = adicionarCabecalhoTabela(40);
        }

        pdf.setDrawColor(
            222,
            225,
            232
        );

        pdf.line(
            margem,
            y + alturaLinha,
            margem + largura,
            y + alturaLinha
        );

        pdf.setFont('helvetica');
        pdf.setFontSize(7.5);

        pdf.text(
            codigo || '-',
            margem + 3,
            y + 5
        );

        pdf.text(
            linhasNome,
            35,
            y + 5
        );

        pdf.text(
            textoSeguro(
                item.produto_corredor
            ),
            121,
            y + 5,
            {
                align: 'right'
            }
        );

        pdf.text(
            textoSeguro(
                item.produto_prateleira
            ),
            140,
            y + 5,
            {
                align: 'right'
            }
        );

        pdf.text(
            textoSeguro(
                item.produto_posicao
            ),
            158,
            y + 5,
            {
                align: 'right'
            }
        );

        pdf.text(
            textoSeguro(
                item.produto_codigo_fabricante
            ),
            181,
            y + 5,
            {
                align: 'right'
            }
        );

        pdf.text(
            String(
                Number(
                    item.quantidade || 0
                )
            ),
            208,
            y + 5,
            {
                align: 'right'
            }
        );

        pdf.text(
            fmtPdf(
                item.preco_unitario
            ),
            232,
            y + 5,
            {
                align: 'right'
            }
        );

        const subtotalItem =
            Number(item.quantidade || 0) *
            Number(item.preco_unitario || 0);

        pdf.text(
            fmtPdf(subtotalItem),
            285,
            y + 5,
            {
                align: 'right'
            }
        );

        y += alturaLinha;
    });

    // ============================================================
    // TOTAIS
    // ============================================================

    const subtotal =
        Number(pedido.subtotal || 0);

    const desconto =
        Number(pedido.desconto || 0);

    const total =
        Number(
            pedido.total ||
            subtotal -
            (
                subtotal *
                desconto /
                100
            )
        );

    if (y + 38 > 192) {
        pdf.addPage();

        adicionarCabecalho();

        y = 45;
    }

    y += 8;

    function adicionarTotal(
        titulo,
        valor,
        destaque = false
    ) {
        pdf.setFont(
            'helvetica',
            destaque
                ? 'bold'
                : 'helvetica'
        );

        pdf.setFontSize(
            destaque
                ? 12
                : 9
        );

        pdf.text(
            titulo,
            232,
            y,
            {
                align: 'right'
            }
        );

        pdf.text(
            fmtPdf(valor),
            285,
            y,
            {
                align: 'right'
            }
        );

        y += destaque
            ? 8
            : 6;
    }

    adicionarTotal(
        'Subtotal',
        subtotal
    );

    pdf.setFont(
        'helvetica',
        'helvetica'
    );

    pdf.setFontSize(9);

    pdf.text(
        'Desconto',
        232,
        y,
        {
            align: 'right'
        }
    );

    pdf.text(
        `${desconto}%`,
        285,
        y,
        {
            align: 'right'
        }
    );

    y += 6;

    adicionarTotal(
        'TOTAL',
        total,
        true
    );

    // ============================================================
    // RODAPÉ
    // ============================================================

    pdf.setTextColor(
        95,
        99,
        117
    );

    pdf.setFont(
        'helvetica',
        'helvetica'
    );

    pdf.setFontSize(8);

    pdf.text(
        'Documento gerado pelo sistema BM36.',
        margem,
        202
    );

    // ============================================================
    // SALVAR / IMPRIMIR / COMPARTILHAR
    // ============================================================

    const nomeArquivo =
        `pedido-${pedido.id}.pdf`;

    const dispositivoMovel =
        /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
        );

    if (
        imprimir &&
        !dispositivoMovel &&
        typeof pdf.autoPrint === 'function'
    ) {
        pdf.autoPrint();
    }

    const blobPdf =
        pdf.output('blob');

    // ============================================================
    // IMPRESSÃO
    // ============================================================

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

    pdf.save(nomeArquivo);
}