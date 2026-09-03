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

let todosProdutos =
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
    return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}

function formatarData(data) {
    if (!data) return '-';

    const objeto = new Date(data);
    return objeto.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatarDocumento(documento) {
    const numeros = String(documento || '').replace(/\D/g, '');

    if (numeros.length === 11) {
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    if (numeros.length === 14) {
        return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    return documento || '';
}

function normalizarStatus(status) {
    return String(status || '').trim().toLowerCase();
}

function statusLabel(status) {
    const s = normalizarStatus(status);

    if (s === 'cancelada') return 'CANCELADO';
    if (s === 'pendente') return 'PENDENTE';

    return 'FINALIZADO';
}


// ============================================================
// PDF DO PEDIDO
// ============================================================

async function gerarPdfPedido(imprimir = false, janelaDeImpressao = null) {
    if (!pedidoAberto) {
        if (janelaDeImpressao) janelaDeImpressao.close();
        return;
    }

    if (!window.jspdf) {
        if (janelaDeImpressao) janelaDeImpressao.close();
        alert('Não foi possível carregar o gerador de PDF. Verifique sua conexão e tente novamente.');
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

    const textoSeguro = valor => String(valor || '-').replace(/[\r\n]+/g, ' ');

    const adicionarCabecalho = () => {
        pdf.setTextColor(20, 20, 20);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.text('BM36 | WC', margem, 13);

        pdf.setFontSize(9);
        pdf.text('COMPROVANTE DE PEDIDO', margem, 19);

        pdf.setFontSize(10);
        pdf.text(`PEDIDO #${pedidoAberto.id}`, larguraPagina - margem, 13, { align: 'right' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.text(`Emitido em ${formatarData(new Date())}`, larguraPagina - margem, 19, { align: 'right' });

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
    pdf.text(`Status: ${statusLabel(pedidoAberto.status)}`, 165, y);

    y += 5;
    pdf.text(`Código do cliente: ${textoSeguro(codigoCliente || 'Não informado')}`, margem, y);

    y += 11;
    pdf.setTextColor(28, 27, 46);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Vendedor: ${textoSeguro(pedidoAberto.usuario_nome || 'Não informado')}`, margem, y);

    y += 10;
    y = adicionarCabecalhoTabela(y);

    const itens = Array.isArray(pedidoAberto.itens) ? pedidoAberto.itens : [];

    itens.forEach(item => {
        const nome = textoSeguro(item.produto_nome || item.nome || 'Produto');
        const codigo = textoSeguro(item.produto_codigo || item.codigo || '');
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

        const subtotalItem = Number(item.quantidade || 0) * Number(item.preco_unitario || 0);
        pdf.text(fmt(subtotalItem), 285, y + 5, { align: 'right' });

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
    pdf.text('Documento gerado pelo sistema BM36.', margem, 202);

    const nomeArquivo = `pedido-${pedidoAberto.id}.pdf`;
    const dispositivoMovel = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (imprimir && !dispositivoMovel && typeof pdf.autoPrint === 'function') {
        pdf.autoPrint();
    }

    const blobPdf = pdf.output('blob');

    if (imprimir) {
        const janelaImpressao = janelaDeImpressao || window.open('', '_blank');

        if (!janelaImpressao) {
            alert('O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.');
            return;
        }

        const urlPdf = URL.createObjectURL(blobPdf);
        janelaImpressao.location.href = urlPdf;

        if (!dispositivoMovel) {
            janelaImpressao.focus();
        }

        return;
    }

    try {
        if (typeof File === 'function' && navigator.canShare) {
            const arquivo = new File([blobPdf], nomeArquivo, { type: 'application/pdf' });

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
        if (erro.name === 'AbortError') return;
        console.error('Erro ao compartilhar PDF:', erro);
    }

    pdf.save(nomeArquivo);
}

if (pdfPedidoBtn) {
    pdfPedidoBtn.addEventListener('click', () => gerarPdfPedido());
}

if (imprimirPedidoBtn) {
    imprimirPedidoBtn.addEventListener('click', () => {
        const janelaImpressao = window.open('', '_blank');

        if (!janelaImpressao) {
            alert('O navegador bloqueou a janela de impressão. Permita pop-ups e tente novamente.');
            return;
        }

        gerarPdfPedido(true, janelaImpressao);
    });
}


// ============================================================
// CARREGAR PEDIDOS
// ============================================================

async function carregarPedidos() {
    try {
        salesBody.innerHTML =
        '<tr><td colspan="5">Carregando...</td></tr>';

        const resposta = await fetch(`${API_URL}/vendas`);

        const texto = await resposta.text();
        const dados = texto ? JSON.parse(texto) : [];

        if (!resposta.ok) throw new Error(texto);

        pedidos = Array.isArray(dados) ? dados : [];
        aplicarFiltros();

    } catch (erro) {
        console.error("ERRO PEDIDOS:", erro);
        salesBody.innerHTML =
        `<tr><td colspan="5">${erro.message}</td></tr>`;
    }
}


// ============================================================
// FILTROS
// ============================================================

function aplicarFiltros() {
    const termo = searchInput ? searchInput.value.trim().toLowerCase() : '';
    const hoje = new Date();

    pedidosFiltrados = pedidos.filter(pedido => {
        const id = String(pedido.id || '');
        const cliente = String(pedido.cliente_nome || '').toLowerCase();
        const documento = String(pedido.cliente_documento || '').replace(/\D/g, '');
        const termoDocumento = termo.replace(/\D/g, '');

        const buscaOK = !termo
            || id.includes(termo)
            || cliente.includes(termo)
            || (termoDocumento && documento.includes(termoDocumento));

        if (!buscaOK) return false;

        const status = normalizarStatus(pedido.status);

        if (filtroAtual === 'canceladas') return status === 'cancelada';
        if (filtroAtual === 'finalizadas') return status === 'finalizada';

        const data = new Date(pedido.criado_em);

        if (filtroAtual === 'hoje') {
            return (
                data.getDate() === hoje.getDate() &&
                data.getMonth() === hoje.getMonth() &&
                data.getFullYear() === hoje.getFullYear()
            );
        }

        if (filtroAtual === 'mes') {
            return (
                data.getMonth() === hoje.getMonth() &&
                data.getFullYear() === hoje.getFullYear()
            );
        }

        return true;
    });

    paginaAtual = 1;
    renderPedidos();
}


// ============================================================
// RENDER PEDIDOS
// ============================================================

function renderPedidos() {
    if (!salesBody) return;
    salesBody.innerHTML = '';

    const inicio = (paginaAtual - 1) * itensPorPagina;
    const pagina = pedidosFiltrados.slice(inicio, inicio + itensPorPagina);

    if (pagina.length === 0) {
        salesBody.innerHTML = `
            <tr>
                <td colspan="5">Nenhum pedido encontrado.</td>
            </tr>
        `;
        atualizarPaginacao();
        return;
    }

    pagina.forEach(pedido => {
        const tr = document.createElement('tr');
        tr.dataset.id = pedido.id;
        const status = normalizarStatus(pedido.status);

        tr.innerHTML = `
            <td>#${pedido.id}</td>
            <td class="name">${pedido.cliente_nome || '-'}</td>
            <td>${formatarData(pedido.criado_em)}</td>
            <td class="val">${fmt(pedido.total)}</td>
            <td>
                <span class="badge ${status}">
                    ${statusLabel(status)}
                </span>
            </td>
        `;

        salesBody.appendChild(tr);
    });

    atualizarPaginacao();
}


// ============================================================
// PAGINAÇÃO
// ============================================================

function atualizarPaginacao() {
    if (!pageNums || !pageInfo) return;

    const total = pedidosFiltrados.length;
    pageNums.innerHTML = '';

    if (total === 0) {
        pageInfo.textContent = 'Nenhum pedido';
        return;
    }

    const totalPaginas = Math.ceil(total / itensPorPagina);
    const inicio = (paginaAtual - 1) * itensPorPagina + 1;
    const fim = Math.min(paginaAtual * itensPorPagina, total);

    pageInfo.textContent = `Mostrando ${inicio}-${fim} de ${total} pedidos`;

    const anterior = document.createElement('button');
    anterior.textContent = '◀';
    anterior.disabled = paginaAtual === 1;
    anterior.addEventListener('click', () => {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderPedidos();
        }
    });
    pageNums.appendChild(anterior);

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        const botao = document.createElement('button');
        botao.textContent = pagina;

        if (pagina === paginaAtual) {
            botao.classList.add('active');
        }

        botao.addEventListener('click', () => {
            paginaAtual = pagina;
            renderPedidos();
        });

        pageNums.appendChild(botao);
    }

    const proximo = document.createElement('button');
    proximo.textContent = '▶';
    proximo.disabled = paginaAtual === totalPaginas;
    proximo.addEventListener('click', () => {
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            renderPedidos();
        }
    });
    pageNums.appendChild(proximo);
}


// ============================================================
// CARREGAR EVENTOS
// ============================================================

async function carregarEventos() {
    try {
      const token = localStorage.getItem('bm36_token') || localStorage.getItem('token');
        const resposta = await fetch(`${API_URL}/eventos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!resposta.ok) {
            throw new Error('Erro ao carregar eventos.');
        }

        eventos = await resposta.json();
        preencherSelectEventos();

    } catch (erro) {
        console.error('Erro ao carregar eventos:', erro);
    }
}

function preencherSelectEventos() {
    if (!eventoPedido) return;

    eventoPedido.innerHTML = `<option value="">Sem evento</option>`;

    eventos.forEach(evento => {
        const option = document.createElement('option');
        option.value = evento.id;
        option.textContent = evento.nome;
        eventoPedido.appendChild(option);
    });
}


// ============================================================
// CARREGAR PRODUTOS DO BANCO E BUSCA (AUTOCOMPLETE)
// ============================================================

async function carregarProdutosBanco() {
    try {
        const resposta = await fetch(`${API_URL}/produtos`);
        if (resposta.ok) {
            todosProdutos = await resposta.json();
            console.log('PRODUTOS DO BANCO:', todosProdutos);
        }
    } catch (erro) {
        console.error('Erro ao carregar produtos do banco:', erro);
    }
}

function inicializarBuscaProduto() {
    const inputBusca = document.getElementById('busca-produto');
    const divSugestoes = document.getElementById('lista-sugestoes');

    if (!inputBusca || !divSugestoes) return;

    inputBusca.value = '';
    divSugestoes.innerHTML = '';
    divSugestoes.style.display = 'none';

    inputBusca.oninput = (e) => {
        const termo = e.target.value.toLowerCase().trim();

        if (!termo) {
            divSugestoes.innerHTML = '';
            divSugestoes.style.display = 'none';
            return;
        }

        const filtrados = todosProdutos.filter(prod =>
            prod.nome && prod.nome.toLowerCase().includes(termo)
        );

        exibirSugestoes(filtrados);
    };
}

function exibirSugestoes(produtos) {
    const divSugestoes = document.getElementById('lista-sugestoes');
    const inputBusca = document.getElementById('busca-produto');
    
    if (!divSugestoes) return;
    divSugestoes.innerHTML = '';

    if (produtos.length === 0) {
        divSugestoes.style.display = 'none';
        return;
    }

    produtos.forEach(produto => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item-sugestao';
        itemDiv.textContent = `${produto.nome} - ${fmt(
    produto.preco_venda ||
    produto.preco ||
    produto.preco_unitario ||
    0
)}`;

        itemDiv.onclick = () => {
            adicionarItemAoPedido(produto);
            if (inputBusca) inputBusca.value = '';
            divSugestoes.style.display = 'none';
        };

        divSugestoes.appendChild(itemDiv);
    });

    divSugestoes.style.display = 'block';
}

function adicionarItemAoPedido(produto) {
    if (!pedidoAberto) return;

    const produtoId = Number(produto.id || produto.produto_id);

    if (!produtoId) {
        alert('Erro ao identificar o produto selecionado.');
        return;
    }

    const itemExistente = pedidoAberto.itens.find(
        i => Number(i.produto_id || i.id) === produtoId
    );

    if (itemExistente) {
        itemExistente.quantidade = Number(itemExistente.quantidade) + 1;
    } else {
        pedidoAberto.itens.push({
            produto_id: produtoId,
            produto_nome: produto.nome || produto.produto_nome,
            preco_unitario: Number(
    produto.preco_venda ||
    produto.preco ||
    produto.preco_unitario ||
    0
),
            quantidade: 1
        });
    }

    renderItensModal();
}


// ============================================================
// ABRIR PEDIDO
// ============================================================

async function abrirPedido(id) {
    try {
        const resposta = await fetch(`${API_URL}/vendas/${id}`);
        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.mensagem || 'Erro ao buscar pedido.');
        }

        pedidoAberto = resultado.venda || resultado;
        modoEdicao = false;

        renderModalPedido();

        if (overlay) {
            overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

    } catch (erro) {
        console.error(erro);
    }
}


// ============================================================
// RENDER MODAL PEDIDO
// ============================================================

function renderModalPedido() {
    if (!pedidoAberto) return;

    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = `Pedido #${pedidoAberto.id}`;

    let cliente = pedidoAberto.cliente_nome || '-';
    if (pedidoAberto.cliente_documento) {
        cliente += ` - ${formatarDocumento(pedidoAberto.cliente_documento)}`;
    }
    
    const modalCliente = document.getElementById('modalCliente');
    if (modalCliente) modalCliente.textContent = cliente;

    const modalVendedor = document.getElementById('modalVendedor');
    if (modalVendedor) {
        modalVendedor.textContent = pedidoAberto.usuario_nome || 'Não informado';
    }

    const modalData = document.getElementById('modalData');
    if (modalData) modalData.textContent = formatarData(pedidoAberto.criado_em);

    const modalStatus = document.getElementById('modalStatus');
    if (modalStatus) modalStatus.textContent = statusLabel(pedidoAberto.status);

    const cancelamentoInfo = document.getElementById('cancelamentoInfo');
    const cancelado = normalizarStatus(pedidoAberto.status) === 'cancelada';

    if (cancelamentoInfo) {
        if (cancelado) {
            cancelamentoInfo.classList.add('visivel');
            cancelamentoInfo.innerHTML = `
                <strong>Pedido cancelado</strong><br>
                ${pedidoAberto.cancelado_em ? `Em ${formatarData(pedidoAberto.cancelado_em)}<br>` : ''}
                Motivo: ${pedidoAberto.motivo_cancelamento || 'Não informado'}
            `;
        } else {
            cancelamentoInfo.classList.remove('visivel');
            cancelamentoInfo.innerHTML = '';
        }
    }

    if (editarBtn) {
        editarBtn.disabled = cancelado;
        editarBtn.textContent = modoEdicao ? 'Salvar Alterações' : 'Editar Pedido';
    }
    if (cancelarPedidoBtn) cancelarPedidoBtn.disabled = cancelado;

    const containerBusca = document.getElementById('containerBuscaProduto');
    if (containerBusca) {
        containerBusca.style.display = modoEdicao ? 'block' : 'none';
        if (modoEdicao) inicializarBuscaProduto();
    }

    if (campoEventoEdicao && eventoPedido) {
        campoEventoEdicao.style.display = modoEdicao ? 'flex' : 'none';
        if (modoEdicao) {
            eventoPedido.value = pedidoAberto.evento_id ? String(pedidoAberto.evento_id) : '';
        }
    }

    renderItensModal();
}


// ============================================================
// ITENS DO PEDIDO (ALTERAR QTD E EXCLUIR)
// ============================================================

function renderItensModal() {
    const body = document.getElementById('modalItems');
    const thAcoes = document.getElementById('thAcoes');

    if (!body || !pedidoAberto) return;

    body.innerHTML = '';
    if (thAcoes) thAcoes.style.display = modoEdicao ? 'table-cell' : 'none';

    pedidoAberto.itens.forEach(item => {
        const tr = document.createElement('tr');
        const quantidade = Number(item.quantidade);
        const preco = Number(item.preco_unitario || item.preco || 0);
        const produtoId = Number(item.produto_id || item.id);

        tr.innerHTML = `
            <td>${item.produto_nome || item.nome || 'Produto'}</td>
            <td>
                ${modoEdicao 
                    ? `<input class="edit-qty" type="number" min="1" step="1" data-produto-id="${produtoId}" value="${quantidade}">` 
                    : quantidade}
            </td>
            <td>${fmt(preco)}</td>
            <td>${fmt(quantidade * preco)}</td>
            ${modoEdicao 
                ? `<td style="text-align: center;"><button type="button" class="btn-remove" data-produto-id="${produtoId}">🗑️</button></td>` 
                : ''}
        `;

        body.appendChild(tr);
    });

    if (modoEdicao) {
        body.querySelectorAll('.edit-qty').forEach(input => {
            input.addEventListener('input', e => {
                const novoValor = Math.floor(Number(e.target.value));
                const produtoId = Number(e.target.dataset.produtoId);

                if (novoValor >= 1) {
                    const item = pedidoAberto.itens.find(i => Number(i.produto_id || i.id) === produtoId);
                    if (item) {
                        item.quantidade = novoValor;
                        recalcularResumoModal();
                    }
                }
            });
        });

        body.querySelectorAll('.btn-remove').forEach(botao => {
            botao.addEventListener('click', e => {
                const produtoId = Number(e.currentTarget.dataset.produtoId);
                pedidoAberto.itens = pedidoAberto.itens.filter(i => Number(i.produto_id || i.id) !== produtoId);
                renderItensModal();
            });
        });
    }

    recalcularResumoModal();
}


// ============================================================
// RESUMO E EDIÇÃO DE DESCONTO
// ============================================================

function recalcularResumoModal() {
    if (!pedidoAberto) return;

    const subtotal = pedidoAberto.itens.reduce((soma, item) => {
        return soma + (Number(item.quantidade) * Number(item.preco_unitario || item.preco || 0));
    }, 0);

    const containerDesconto = document.getElementById('containerDesconto');
    const modalSubtotal = document.getElementById('modalSubtotal');
    const modalTotal = document.getElementById('modalTotal');

    if (containerDesconto) {
        if (modoEdicao) {
            containerDesconto.innerHTML = `
                <input type="number" id="inputDescontoEdicao" class="edit-desconto" min="0" step="0.01" value="${pedidoAberto.desconto || 0}">
            `;

            const inputDesconto = document.getElementById('inputDescontoEdicao');
            if (inputDesconto) {
                inputDesconto.addEventListener('input', e => {
                    const valorDesconto = parseFloat(e.target.value) || 0;
                    pedidoAberto.desconto = valorDesconto;

                    const total = Math.max(0, subtotal - valorDesconto);
                    if (modalSubtotal) modalSubtotal.textContent = fmt(subtotal);
                    if (modalTotal) modalTotal.textContent = fmt(total);
                });
            }
        } else {
            containerDesconto.innerHTML = `<span id="modalDesconto">${fmt(pedidoAberto.desconto || 0)}</span>`;
        }
    }

    const desconto = Number(pedidoAberto.desconto || 0);
    const total = Math.max(0, subtotal - desconto);

    if (modalSubtotal) modalSubtotal.textContent = fmt(subtotal);
    if (modalTotal) modalTotal.textContent = fmt(total);
}


// ============================================================
// EDITAR OU SALVAR ALTERAÇÕES DO PEDIDO
// ============================================================

if (editarBtn) {
    editarBtn.addEventListener('click', async () => {
        if (!pedidoAberto) return;

        // Se ainda não está em modo de edição, ativa o modo
        if (!modoEdicao) {
            modoEdicao = true;
            renderModalPedido();
            return;
        }

        // 1. Filtra apenas os itens válidos
        const itensValidos = pedidoAberto.itens.filter(item => {
            const qtd = Number(item.quantidade);
            const id = Number(item.produto_id || item.id);
            return id > 0 && qtd > 0;
        });

        if (itensValidos.length === 0) {
            alert('O pedido deve conter pelo menos um produto com quantidade maior que zero.');
            return;
        }

        try {
            editarBtn.disabled = true;
            editarBtn.textContent = 'Salvando...';

            // 2. Monta o objeto com os nomes exatos esperados pelo Backend
          const subtotal = itensValidos.reduce((soma, item) => {
    return soma + (item.quantidade * item.preco_unitario);
}, 0);

const desconto = Math.min(
    100,
    Math.max(0, Number(pedidoAberto.desconto || 0))
);

const total = Math.max(
    0,
    subtotal - (subtotal * desconto / 100)
);
const dadosAtualizados = {
    itens: itensValidos.map(item => ({
        produto_id: Number(item.produto_id || item.id),
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario || item.preco || 0)
    })),
    subtotal,
    desconto,
    total,
    evento_id: eventoPedido?.value
        ? Number(eventoPedido.value)
        : null
};


            // 3. Obtém o Token de Autenticação
            const token = localStorage.getItem('bm36_token') || localStorage.getItem('token');

            const headers = {
                'Content-Type': 'application/json'
            };
console.log(
  "DADOS ENVIADOS",
  JSON.stringify(dadosAtualizados, null, 2)
            );
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // 4. Envia a requisição PUT para o servidor
            const resposta = await fetch(`${API_URL}/vendas/${pedidoAberto.id}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(dadosAtualizados)
            });

            const resultado = await resposta.json();

            if (!resposta.ok || !resultado.sucesso) {
                alert(resultado.mensagem || 'Não foi possível alterar o pedido.');
                return;
            }

            // 5. Sucesso: Desativa o modo edição e atualiza a tela
            alert('Pedido alterado com sucesso!');
            modoEdicao = false;
            await carregarPedidos();
            await abrirPedido(pedidoAberto.id);

        } catch (erro) {
            console.error('Erro ao salvar alterações:', erro);
            alert('Erro de conexão ao tentar alterar o pedido.');
        } finally {
            editarBtn.disabled = false;
            editarBtn.textContent = modoEdicao ? 'Salvar Alterações' : 'Editar Pedido';
        }
    });
}


// ============================================================
// CANCELAR PEDIDO
// ============================================================

if (cancelarPedidoBtn) {
    cancelarPedidoBtn.addEventListener('click', () => {
        if (!pedidoAberto) return;

        if (motivoCancelamento) motivoCancelamento.value = '';
        const cancelTitle = document.getElementById('cancelTitle');
        if (cancelTitle) cancelTitle.textContent = `Cancelar Pedido #${pedidoAberto.id}`;
        if (cancelOverlay) cancelOverlay.classList.add('show');
    });
}

if (confirmarCancelamentoBtn) {
    confirmarCancelamentoBtn.addEventListener('click', async () => {
        const motivo = motivoCancelamento ? motivoCancelamento.value.trim() : '';

        if (!motivo) {
            alert('Informe o motivo do cancelamento.');
            return;
        }

        try {
            confirmarCancelamentoBtn.disabled = true;

            const token = localStorage.getItem('bm36_token') || localStorage.getItem('token');

            const resposta = await fetch(`${API_URL}/vendas/${pedidoAberto.id}/cancelar`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ motivo })
            });

            const resultado = await resposta.json();
            confirmarCancelamentoBtn.disabled = false;

            if (!resposta.ok) {
                alert(resultado.mensagem || 'Não foi possível cancelar o pedido.');
                return;
            }

            if (cancelOverlay) cancelOverlay.classList.remove('show');
            if (overlay) overlay.classList.remove('show');
            document.body.style.overflow = '';

            await carregarPedidos();

        } catch (erro) {
            confirmarCancelamentoBtn.disabled = false;
            console.error(erro);
            alert('Erro ao cancelar pedido.');
        }
    });
}


// ============================================================
// EVENTOS DE NAVEGAÇÃO E FILTROS
// ============================================================

if (salesBody) {
    salesBody.addEventListener('click', evento => {
        const tr = evento.target.closest('tr[data-id]');
        if (!tr) return;

        abrirPedido(Number(tr.dataset.id));
    });
}

if (filters) {
    filters.addEventListener('click', evento => {
        const btn = evento.target.closest('.pill');
        if (!btn) return;

        filters.querySelectorAll('.pill').forEach(item => item.classList.remove('active'));
        btn.classList.add('active');

        filtroAtual = btn.dataset.filter;
        aplicarFiltros();
    });
}

if (searchInput) {
    searchInput.addEventListener('input', aplicarFiltros);
}


// ============================================================
// FECHAR MODAIS
// ============================================================

function fecharPedido() {
    if (overlay) overlay.classList.remove('show');
    document.body.style.overflow = '';
}

if (closeX) closeX.addEventListener('click', fecharPedido);
if (closeBtn) closeBtn.addEventListener('click', fecharPedido);

if (overlay) {
    overlay.addEventListener('click', evento => {
        if (evento.target === overlay) {
            fecharPedido();
        }
    });
}

function fecharCancelamento() {
    if (cancelOverlay) cancelOverlay.classList.remove('show');
}

if (cancelCloseX) cancelCloseX.addEventListener('click', fecharCancelamento);
if (voltarCancelamentoBtn) voltarCancelamentoBtn.addEventListener('click', fecharCancelamento);


// ============================================================q
// INICIAR
// ============================================================

carregarPedidos();
carregarEventos();
carregarProdutosBanco();