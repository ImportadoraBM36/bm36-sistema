const API_URL = 'https://bm36-sistema-production.up.railway.app/api';

/*
 * Página de importação em massa de CLIENTES (sistema antigo -> BM36).
 * Espelha a estrutura de importacao-produtos.js, trocando os campos de
 * produto (estoque/localização/preço) pelos campos de cliente do
 * CadastroCliente.html: Nome, CPF/CNPJ, Telefone, E-mail, Data de
 * nascimento, Categoria, Endereço (CEP/Rua/Número/Complemento/Bairro/
 * Cidade/UF), Inscrição Estadual (IE) e Notas internas.
 *
 * O casamento do registro da planilha é feito pelo código e pela origem
 * do sistema antigo; quando houver CPF/CNPJ, ele também é usado como apoio.
 *
 * IDs de elementos esperados no HTML (mesmos nomes usados abaixo):
 * fileInput, uploadDropzone, selectedFiles, fileList, clearFilesButton,
 * fileModeButton, manualModeButton, fileMode, manualMode, manualTipo,
 * manualRows, addManualRowButton, clearManualButton, sourceHelp,
 * reviewButton, backButton, uploadPanel, reviewPanel, summaryFiles,
 * summaryClientes, summaryUpdates, stepUpload, stepReview, mappingGrid,
 * readStatus, updateContato, updateEndereco, updateDados, importErrors,
 * errorList, sampleCard, sampleRows, applyButton, applyHint,
 * reviewNoticeText.
 *
 * Rotas de API implementadas no backend, no mesmo padrão de
 * /importacoes/preview e /importacoes/aplicar:
 * POST /importacoes-clientes/preview
 * POST /importacoes-clientes/aplicar
 */

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('bm36_token');
    let usuario;

    try {
        usuario = JSON.parse(localStorage.getItem('bm36_usuario'));
    } catch {
        usuario = null;
    }

    if (!token || String(usuario?.perfil || '').toUpperCase() !== 'ADMIN') {
        window.location.replace('./inicio.html');
        return;
    }

    const elemento = id => document.getElementById(id);
    const fileInput = elemento('fileInput');
    const uploadDropzone = elemento('uploadDropzone');
    const selectedFiles = elemento('selectedFiles');
    const fileList = elemento('fileList');
    const clearFilesButton = elemento('clearFilesButton');
    const fileModeButton = elemento('fileModeButton');
    const manualModeButton = elemento('manualModeButton');
    const fileMode = elemento('fileMode');
    const manualMode = elemento('manualMode');
    const manualTipo = elemento('manualTipo');
    const manualRows = elemento('manualRows');
    const addManualRowButton = elemento('addManualRowButton');
    const clearManualButton = elemento('clearManualButton');
    const sourceHelp = elemento('sourceHelp');
    const reviewButton = elemento('reviewButton');
    const backButton = elemento('backButton');
    const uploadPanel = elemento('uploadPanel');
    const reviewPanel = elemento('reviewPanel');
    const summaryFiles = elemento('summaryFiles');
    const summaryClientes = elemento('summaryClientes');
    const summaryUpdates = elemento('summaryUpdates');
    const stepUpload = elemento('stepUpload');
    const stepReview = elemento('stepReview');
    const mappingGrid = elemento('mappingGrid');
    const readStatus = elemento('readStatus');
    const updateContato = elemento('updateContato');
    const updateEndereco = elemento('updateEndereco');
    const updateDados = elemento('updateDados');
    const importErrors = elemento('importErrors');
    const errorList = elemento('errorList');
    const sampleCard = elemento('sampleCard');
    const sampleRows = elemento('sampleRows');
    const applyButton = elemento('applyButton');
    const applyHint = elemento('applyHint');
    const reviewNoticeText = elemento('reviewNoticeText');

    const COLUNAS_MANUAIS = ['cpf_cnpj', 'nome', 'telefone', 'email', 'ie'];

    let arquivosSelecionados = [];
    let analiseAtual = null;
    let importacaoConcluida = false;
    let modoImportacao = 'arquivo';

    function tamanhoFormatado(bytes) {
        return bytes < 1024 * 1024
            ? `${Math.max(1, Math.round(bytes / 1024))} KB`
            : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function normalizarDocumento(documento) {
        return String(documento || '').replace(/\D/g, '');
    }

    function definirCarregamento(botao, carregando, texto) {
        botao.disabled = carregando;
        botao.dataset.textoOriginal ||= botao.textContent.trim();
        botao.textContent = carregando ? texto : botao.dataset.textoOriginal;
    }

    function atualizarArquivos(files) {
        arquivosSelecionados = Array.from(files).filter(file => /\.(xls|xlsx|csv)$/i.test(file.name));
        fileList.innerHTML = '';

        arquivosSelecionados.forEach(file => {
            const item = document.createElement('li');
            const nome = document.createElement('span');
            const tamanho = document.createElement('span');
            nome.textContent = `👤 ${file.name}`;
            tamanho.textContent = tamanhoFormatado(file.size);
            item.append(nome, tamanho);
            fileList.appendChild(item);
        });

        const possuiArquivos = arquivosSelecionados.length > 0;
        selectedFiles.hidden = !possuiArquivos;
        reviewButton.disabled = !possuiArquivos;
        summaryFiles.textContent = arquivosSelecionados.length;
    }

    function criarLinhaManual(valores = []) {
        const linha = document.createElement('tr');

        COLUNAS_MANUAIS.forEach((campo, indice) => {
            const celula = document.createElement('td');
            const input = document.createElement('input');

            input.type = 'text';
            input.autocomplete = 'off';
            input.dataset.coluna = campo;
            input.value = valores[indice] || '';
            input.placeholder = indice === 0 ? 'Ex.: 000.000.000-00' : '—';
            input.addEventListener('input', atualizarEstadoManual);
            input.addEventListener('paste', colarDadosManuais);

            celula.appendChild(input);
            linha.appendChild(celula);
        });

        manualRows.appendChild(linha);
    }

    function garantirLinhasManuais(quantidade) {
        while (manualRows.children.length < quantidade) {
            criarLinhaManual();
        }
    }

    function atualizarEstadoManual() {
        const possuiDocumento = [...manualRows.querySelectorAll('input[data-coluna="cpf_cnpj"]')]
            .some(input => input.value.trim());

        if (modoImportacao === 'manual') {
            reviewButton.disabled = !possuiDocumento;
            summaryFiles.textContent = possuiDocumento ? '1' : '0';
        }
    }

    function colarDadosManuais(event) {
        const texto = event.clipboardData?.getData('text/plain') || '';

        if (!texto.includes('\n') && !texto.includes('\t')) {
            return;
        }

        event.preventDefault();

        const linhasColadas = texto
            .replace(/\r/g, '')
            .split('\n')
            .filter(linha => linha.length > 0)
            .map(linha => linha.split('\t'));

        const linhaInicial = [...manualRows.children]
            .indexOf(event.target.closest('tr'));

        const colunaInicial = COLUNAS_MANUAIS.indexOf(event.target.dataset.coluna);

        garantirLinhasManuais(linhaInicial + linhasColadas.length);

        linhasColadas.forEach((linhaColada, deslocamentoLinha) => {
            linhaColada.forEach((valor, deslocamentoColuna) => {
                const coluna = colunaInicial + deslocamentoColuna;

                if (coluna < COLUNAS_MANUAIS.length) {
                    const input = manualRows.children[linhaInicial + deslocamentoLinha]
                        .querySelectorAll('input')[coluna];
                    input.value = valor.trim();
                }
            });
        });

        atualizarEstadoManual();
    }

    function escaparCsv(valor) {
        return `"${String(valor || '').replaceAll('"', '""')}"`;
    }

    function criarArquivoManual() {
        const registros = [...manualRows.children]
            .map(linha => [...linha.querySelectorAll('input')].map(input => input.value.trim()))
            .filter(linha => linha[0]);

        const colunas = [
            ['CPF/CNPJ', 0],
            ['Nome', 1],
            ['Telefone', 2],
            ['E-mail', 3],
            ['Inscrição Estadual', 4]
        ].filter(([, indice]) => indice === 0 || registros.some(linha => linha[indice]));

        const titulo = manualTipo?.value === 'PJ'
            ? 'BM36 - Importação manual de clientes (Pessoa Jurídica)'
            : 'BM36 - Importação manual de clientes (Pessoa Física)';

        const csv = [
            escaparCsv(titulo),
            colunas.map(([nome]) => escaparCsv(nome)).join(','),
            ...registros.map(linha => colunas.map(([, indice]) => escaparCsv(linha[indice])).join(','))
        ].join('\r\n');

        return new File(
            [`\uFEFF${csv}`],
            'importacao-clientes-manual.csv',
            { type: 'text/csv' }
        );
    }

    function trocarModo(novoModo) {
        modoImportacao = novoModo;
        const modoArquivo = novoModo === 'arquivo';

        fileMode.hidden = !modoArquivo;
        manualMode.hidden = modoArquivo;
        fileModeButton.classList.toggle('is-active', modoArquivo);
        manualModeButton.classList.toggle('is-active', !modoArquivo);
        fileModeButton.setAttribute('aria-selected', String(modoArquivo));
        manualModeButton.setAttribute('aria-selected', String(!modoArquivo));
        sourceHelp.textContent = modoArquivo
            ? 'Na próxima etapa, você poderá conferir as colunas antes de atualizar o banco.'
            : 'Cole dados do Excel ou preencha as células. Nada será alterado antes da sua confirmação.';

        if (modoArquivo) {
            reviewButton.disabled = arquivosSelecionados.length === 0;
            summaryFiles.textContent = arquivosSelecionados.length;
        } else {
            atualizarEstadoManual();
        }
    }

    function criarFormData() {
        const formData = new FormData();

        if (modoImportacao === 'manual') {
            formData.append('arquivos', criarArquivoManual());
        } else {
            arquivosSelecionados.forEach(arquivo => formData.append('arquivos', arquivo));
        }

        return formData;
    }

    async function requisicaoImportacao(rota, formData) {
        const resposta = await fetch(`${API_URL}${rota}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
        });
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(dados.mensagem || 'Não foi possível processar a importação.');
        }

        return dados;
    }

    function adicionarLinhaMapeamento(coluna, uso, origem) {
        const linha = document.createElement('div');
        linha.className = 'mapping-row';

        [coluna, uso, origem].forEach((texto, indice) => {
            const celula = document.createElement(indice === 0 ? 'strong' : 'span');
            celula.textContent = texto;
            linha.appendChild(celula);
        });

        mappingGrid.appendChild(linha);
    }

    function preencherMapeamento(planilhas) {
        mappingGrid.querySelectorAll('.mapping-row:not(.mapping-labels)').forEach(linha => linha.remove());

        const mapeamentos = new Map([
            ['contato', ['Telefone / E-mail', 'Dados de contato']],
            ['endereco', ['CEP / Rua / Nº / Bairro / Cidade / UF', 'Endereço completo']],
            ['dados_adicionais', ['Nasc. / Categoria / IE / Notas', 'Dados adicionais']]
        ]);

        planilhas.forEach(planilha => {
            const [coluna, uso] = mapeamentos.get(planilha.tipo) || ['Código antigo', 'Identificação do cliente'];
            adicionarLinhaMapeamento(coluna, uso, planilha.origem);
        });
    }

    function preencherAmostra(amostra) {
        sampleRows.innerHTML = '';

        amostra.forEach(registro => {
            const linha = document.createElement('tr');
            const dados = [];
            if (registro.telefone !== undefined) dados.push(`Tel: ${registro.telefone}`);
            if (registro.email !== undefined) dados.push(`E-mail: ${registro.email}`);
            if (registro.cidade !== undefined || registro.uf !== undefined) dados.push(`Local: ${registro.cidade || '—'} / ${registro.uf || '—'}`);
            if (registro.ie !== undefined) dados.push(`IE: ${registro.ie}`);

            [
                registro.codigo,
                registro.origem,
                dados.join(' · ') || '—',
                registro.encontrado ? 'Encontrado' : 'Não encontrado'
            ].forEach((valor, indice) => {
                const celula = document.createElement('td');
                celula.textContent = valor;
                if (indice === 3) celula.className = registro.encontrado ? 'match-status' : 'missing-status';
                linha.appendChild(celula);
            });

            sampleRows.appendChild(linha);
        });

        sampleCard.hidden = amostra.length === 0;
    }

    function preencherErros(erros) {
        errorList.innerHTML = '';
        erros.forEach(erro => {
            const item = document.createElement('li');
            item.textContent = erro;
            errorList.appendChild(item);
        });
        importErrors.hidden = erros.length === 0;
    }

    function atualizarBotaoAplicar() {
        const existemAlteracoes = updateContato.checked || updateEndereco.checked || updateDados.checked;
        const possuiErros = analiseAtual?.resumo.erros > 0;
        applyButton.disabled = importacaoConcluida || !analiseAtual || possuiErros || !existemAlteracoes;

        if (possuiErros) {
            applyHint.textContent = 'Corrija os erros apontados nas planilhas antes de aplicar a importação.';
        } else if (!existemAlteracoes) {
            applyHint.textContent = 'Selecione pelo menos um tipo de atualização.';
        } else {
            applyHint.textContent = 'A importação relaciona pelo código e origem do sistema antigo. Clientes ainda não cadastrados serão incluídos.';
        }
    }

    function mostrarAnalise(analise) {
        analiseAtual = analise;
        importacaoConcluida = false;
        const resumo = analise.resumo;
        summaryFiles.textContent = resumo.arquivos;
        summaryClientes.textContent = resumo.encontrados;
        summaryUpdates.textContent = resumo.atualizacoesContato + resumo.atualizacoesEndereco + resumo.atualizacoesDados;
        readStatus.textContent = resumo.erros > 0 ? `${resumo.erros} erro(s) encontrado(s)` : 'Leitura concluída';
        readStatus.className = resumo.erros > 0 ? 'status-pill is-error' : 'status-pill is-ready';

        updateContato.disabled = resumo.atualizacoesContato === 0;
        updateEndereco.disabled = resumo.atualizacoesEndereco === 0;
        updateDados.disabled = resumo.atualizacoesDados === 0;
        updateContato.checked = !updateContato.disabled;
        updateEndereco.checked = !updateEndereco.disabled;
        updateDados.checked = !updateDados.disabled;

        preencherMapeamento(analise.planilhas);
        preencherAmostra(analise.amostra);
        preencherErros(analise.erros);

        reviewNoticeText.innerHTML = resumo.novos > 0
            ? `<strong>Pronto para importar:</strong> ${resumo.novos} cliente(s) novo(s) serão incluídos usando o código e a origem do sistema antigo.`
            : '<strong>Confira antes de aplicar:</strong> arquivos com erros não serão importados. Os clientes encontrados serão atualizados somente nas opções escolhidas acima.';

        atualizarBotaoAplicar();
    }

    garantirLinhasManuais(6);

    fileModeButton.addEventListener('click', () => trocarModo('arquivo'));
    manualModeButton.addEventListener('click', () => trocarModo('manual'));
    addManualRowButton.addEventListener('click', () => criarLinhaManual());
    clearManualButton.addEventListener('click', () => {
        manualRows.innerHTML = '';
        garantirLinhasManuais(6);
        atualizarEstadoManual();
    });

    fileInput.addEventListener('change', event => atualizarArquivos(event.target.files));

    ['dragenter', 'dragover'].forEach(eventName => uploadDropzone.addEventListener(eventName, event => {
        event.preventDefault();
        uploadDropzone.classList.add('is-dragging');
    }));

    ['dragleave', 'drop'].forEach(eventName => uploadDropzone.addEventListener(eventName, event => {
        event.preventDefault();
        uploadDropzone.classList.remove('is-dragging');
    }));

    uploadDropzone.addEventListener('drop', event => atualizarArquivos(event.dataTransfer.files));

    clearFilesButton.addEventListener('click', () => {
        arquivosSelecionados = [];
        fileInput.value = '';
        atualizarArquivos([]);
    });

    reviewButton.addEventListener('click', async () => {
        definirCarregamento(reviewButton, true, 'Lendo planilhas...');

        try {
            const analise = await requisicaoImportacao('/importacoes-clientes/preview', criarFormData());
            mostrarAnalise(analise);
            uploadPanel.hidden = true;
            reviewPanel.hidden = false;
            stepUpload.classList.remove('is-active');
            stepUpload.classList.add('is-complete');
            stepReview.classList.add('is-active');
        } catch (erro) {
            alert(erro.message);
        } finally {
            definirCarregamento(reviewButton, false);
        }
    });

    backButton.addEventListener('click', () => {
        reviewPanel.hidden = true;
        uploadPanel.hidden = false;
        stepUpload.classList.add('is-active');
        stepUpload.classList.remove('is-complete');
        stepReview.classList.remove('is-active');
    });

    [updateContato, updateEndereco, updateDados].forEach(opcao => opcao.addEventListener('change', atualizarBotaoAplicar));

    applyButton.addEventListener('click', async () => {
        if (!window.confirm('Confirmar a importação dos clientes? Cadastros já existentes serão atualizados e os novos serão incluídos.')) return;

        const formData = criarFormData();
        formData.append('atualizarContato', String(updateContato.checked));
        formData.append('atualizarEndereco', String(updateEndereco.checked));
        formData.append('atualizarDados', String(updateDados.checked));
        definirCarregamento(applyButton, true, 'Atualizando...');

        try {
            const resultado = await requisicaoImportacao('/importacoes-clientes/aplicar', formData);
            alert(`${resultado.mensagem}\n\nNovos clientes: ${resultado.resumo.criados || 0}\nContato: ${resultado.resumo.contatoAtualizado}\nEndereço: ${resultado.resumo.enderecoAtualizado}\nDados adicionais: ${resultado.resumo.dadosAtualizados}`);
            importacaoConcluida = true;
            applyHint.textContent = 'Importação concluída. Reenvie as planilhas se desejar executar uma nova atualização.';
        } catch (erro) {
            alert(erro.message);
            atualizarBotaoAplicar();
        } finally {
            definirCarregamento(applyButton, false);
            atualizarBotaoAplicar();
        }
    });
});
