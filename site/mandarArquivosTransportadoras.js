const API_URL = 'https://bm36-sistema-production.up.railway.app/api';

const token = localStorage.getItem('bm36_token');
const usuario = JSON.parse(localStorage.getItem('bm36_usuario') || '{}');

// ======================================================
// VERIFICAÇÃO DE LOGIN E ADMIN
// ======================================================

if (
    !token ||
    !usuario ||
    String(usuario.perfil || '').toUpperCase() !== 'ADMIN'
) {
    alert('Acesso permitido somente para administradores.');
    window.location.href = './inicio.html';
}

// ======================================================
// ELEMENTOS
// ======================================================

const fileModeButton = document.getElementById('fileModeButton');
const manualModeButton = document.getElementById('manualModeButton');

const fileMode = document.getElementById('fileMode');
const manualMode = document.getElementById('manualMode');

const fileInput = document.getElementById('fileInput');
const selectedFiles = document.getElementById('selectedFiles');
const fileList = document.getElementById('fileList');
const clearFilesButton = document.getElementById('clearFilesButton');

const addTransportadoraButton =
    document.getElementById('addTransportadoraButton');

const manualTransportadorasRows =
    document.getElementById('manualTransportadorasRows');

const reviewButton =
    document.getElementById('reviewButton');

const uploadPanel =
    document.getElementById('uploadPanel');

const reviewPanel =
    document.getElementById('reviewPanel');

const backButton =
    document.getElementById('backButton');

const stepUpload =
    document.getElementById('stepUpload');

const stepReview =
    document.getElementById('stepReview');

const stepFinish =
    document.getElementById('stepFinish');

const summaryFiles =
    document.getElementById('summaryFiles');

const summaryTransportadoras =
    document.getElementById('summaryTransportadoras');

const summaryNovas =
    document.getElementById('summaryNovas');

const summaryAtualizacoes =
    document.getElementById('summaryAtualizacoes');

const mappingGrid =
    document.getElementById('mappingGrid');

const readStatus =
    document.getElementById('readStatus');

const importErrors =
    document.getElementById('importErrors');

const errorList =
    document.getElementById('errorList');

const sampleCard =
    document.getElementById('sampleCard');

const sampleRows =
    document.getElementById('sampleRows');

const updateDadosGerais =
    document.getElementById('updateDadosGerais');

const updateEndereco =
    document.getElementById('updateEndereco');

const updateObservacoes =
    document.getElementById('updateObservacoes');

const applyButton =
    document.getElementById('applyButton');

const applyHint =
    document.getElementById('applyHint');

const correcaoTransportadoras =
    document.getElementById('correcaoTransportadoras');

const voltarRevisaoButton =
    document.getElementById('voltarRevisaoButton');

const atualizarSistemaCorrecaoButton =
    document.getElementById('atualizarSistemaCorrecaoButton');

const correcaoHint =
    document.getElementById('correcaoHint');
// ======================================================
// DADOS DA IMPORTAÇÃO
// ======================================================

let arquivoSelecionado = null;

let transportadorasImportadas = [];

/*
    Guarda uma cópia da planilha original.
    Assim conseguimos voltar para os dados originais
    caso seja necessário.
*/
let transportadorasDoArquivo = [];

let transportadorasExistentes = [];

let modoAtual = 'arquivo';

/*
    Indica se estamos na tela de correção da planilha.
*/
let modoCorrecao = false;

// ======================================================
// CAMPOS DA PLANILHA
// ======================================================

const CAMPOS_TRANSPORTADORA = [

    {
        chave: 'nome',
        coluna: 'NOME',
        titulo: 'Nome',
        obrigatorio: true
    },

    {
        chave: 'cnpj',
        coluna: 'CNPJ',
        titulo: 'CNPJ',
        obrigatorio: false
    },

    {
        chave: 'telefone',
        coluna: 'TELEFONE',
        titulo: 'Telefone',
        obrigatorio: true
    },

    {
        chave: 'email',
        coluna: 'EMAIL',
        titulo: 'E-mail',
        obrigatorio: false
    },

    {
        chave: 'contato',
        coluna: 'CONTATO',
        titulo: 'Contato',
        obrigatorio: false
    },

    {
        chave: 'categoria',
        coluna: 'CATEGORIA',
        titulo: 'Categoria',
        obrigatorio: false
    },

    {
        chave: 'ie',
        coluna: 'IE',
        titulo: 'Inscrição estadual',
        obrigatorio: false
    },

    {
        chave: 'cep',
        coluna: 'CEP',
        titulo: 'CEP',
        obrigatorio: false
    },

    {
        chave: 'rua',
        coluna: 'RUA',
        titulo: 'Rua',
        obrigatorio: false
    },

    {
        chave: 'numero',
        coluna: 'NUMERO',
        titulo: 'Número',
        obrigatorio: false
    },

    {
        chave: 'complemento',
        coluna: 'COMPLEMENTO',
        titulo: 'Complemento',
        obrigatorio: false
    },

    {
        chave: 'bairro',
        coluna: 'BAIRRO',
        titulo: 'Bairro',
        obrigatorio: false
    },

    {
        chave: 'cidade',
        coluna: 'CIDADE',
        titulo: 'Cidade',
        obrigatorio: false
    },

    {
        chave: 'uf',
        coluna: 'UF',
        titulo: 'UF',
        obrigatorio: false
    },

    {
        chave: 'observacoes',
        coluna: 'OBSERVACOES',
        titulo: 'Observações',
        obrigatorio: false
    }

];

// ======================================================
// INICIALIZAÇÃO
// ======================================================

document.addEventListener('DOMContentLoaded', () => {

    configurarModos();

    configurarUpload();

    configurarBotoes();

    atualizarBotaoRevisao();

});

// ======================================================
// MODO ARQUIVO / MODO MANUAL
// ======================================================

function configurarModos() {

    fileModeButton.addEventListener('click', () => {

        modoAtual = 'arquivo';

        modoCorrecao = false;

        fileMode.hidden = false;
        manualMode.hidden = true;

        fileModeButton.classList.add('active');
        manualModeButton.classList.remove('active');

        atualizarBotaoRevisao();

    });

    manualModeButton.addEventListener('click', () => {

        modoAtual = 'manual';

        modoCorrecao = false;

        fileMode.hidden = true;
        manualMode.hidden = false;

        manualModeButton.classList.add('active');
        fileModeButton.classList.remove('active');

        if (!manualTransportadorasRows.children.length) {

            adicionarLinhaManual();

        }

        atualizarBotaoRevisao();

    });

}

// ======================================================
// UPLOAD
// ======================================================

function configurarUpload() {

    fileInput.addEventListener('change', () => {

        const arquivo = fileInput.files[0];

        if (!arquivo) {

            arquivoSelecionado = null;

            atualizarArquivos();
            atualizarBotaoRevisao();

            return;

        }

        arquivoSelecionado = arquivo;

        atualizarArquivos();
        atualizarBotaoRevisao();

    });

    clearFilesButton.addEventListener('click', () => {

        fileInput.value = '';

        arquivoSelecionado = null;

        atualizarArquivos();
        atualizarBotaoRevisao();

    });

}

// ======================================================
// MOSTRAR ARQUIVO
// ======================================================

function atualizarArquivos() {

    fileList.innerHTML = '';

    if (!arquivoSelecionado) {

        selectedFiles.hidden = true;

        return;

    }

    selectedFiles.hidden = false;

    const li = document.createElement('li');

    li.textContent =
        `${arquivoSelecionado.name} (${formatarTamanho(arquivoSelecionado.size)})`;

    fileList.appendChild(li);

}

function formatarTamanho(bytes) {

    if (bytes < 1024) {

        return `${bytes} B`;

    }

    if (bytes < 1024 * 1024) {

        return `${(bytes / 1024).toFixed(1)} KB`;

    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

}

// ======================================================
// BOTÕES
// ======================================================

function configurarBotoes() {

    addTransportadoraButton.addEventListener(
        'click',
        adicionarLinhaManual
    );

    reviewButton.addEventListener(
        'click',
        iniciarRevisao
    );

    backButton.addEventListener(
        'click',
        voltarParaUpload
    );

    applyButton.addEventListener(
        'click',
        aplicarImportacao
    );
    voltarRevisaoButton.addEventListener(
    'click',
    fecharTelaCorrecao
);

atualizarSistemaCorrecaoButton.addEventListener(
    'click',
    aplicarImportacao
);

}

// ======================================================
// ADICIONAR LINHA MANUAL
// ======================================================

function adicionarLinhaManual(dados = {}) {

    const tr = document.createElement('tr');

    tr.innerHTML = `

        <td>
            <input
                type="text"
                class="manual-nome"
                placeholder="Nome da transportadora"
                value="${escaparHTML(dados.nome || '')}"
            >
        </td>

        <td>
            <input
                type="text"
                class="manual-cnpj"
                placeholder="CNPJ"
                maxlength="18"
                value="${escaparHTML(dados.cnpj || '')}"
            >
        </td>

        <td>
            <input
                type="text"
                class="manual-telefone"
                placeholder="Telefone"
                value="${escaparHTML(dados.telefone || '')}"
            >
        </td>

        <td>
            <input
                type="email"
                class="manual-email"
                placeholder="E-mail"
                value="${escaparHTML(dados.email || '')}"
            >
        </td>

        <td>
            <input
                type="text"
                class="manual-cidade"
                placeholder="Cidade"
                value="${escaparHTML(dados.cidade || '')}"
            >
        </td>

        <td>
            <input
                type="text"
                class="manual-uf"
                placeholder="UF"
                maxlength="2"
                value="${escaparHTML(dados.uf || '')}"
            >
        </td>

        <td>
            <button
                type="button"
                class="remove-manual-row"
                title="Remover"
            >
                ×
            </button>
        </td>

    `;

    const botaoRemover =
        tr.querySelector('.remove-manual-row');

    botaoRemover.addEventListener('click', () => {

        tr.remove();

        atualizarBotaoRevisao();

    });

    const inputs =
        tr.querySelectorAll('input');

    inputs.forEach(input => {

        input.addEventListener(
            'input',
            atualizarBotaoRevisao
        );

    });

    manualTransportadorasRows.appendChild(tr);

    atualizarBotaoRevisao();

}

// ======================================================
// PEGAR DADOS MANUAIS
// ======================================================

function obterTransportadorasManuais() {

    const linhas =
        manualTransportadorasRows.querySelectorAll('tr');

    const transportadoras = [];

    linhas.forEach((linha, index) => {

        const nome =
            linha.querySelector('.manual-nome').value.trim();

        const cnpj =
            limparNumeros(
                linha.querySelector('.manual-cnpj').value
            );

        const telefone =
            limparNumeros(
                linha.querySelector('.manual-telefone').value
            );

        const email =
            linha.querySelector('.manual-email').value.trim();

        const cidade =
            linha.querySelector('.manual-cidade').value.trim();

        const uf =
            linha.querySelector('.manual-uf').value
                .trim()
                .toUpperCase();

        if (
            !nome &&
            !telefone &&
            !cnpj &&
            !email &&
            !cidade &&
            !uf
        ) {

            return;

        }

        transportadoras.push({

            linha: index + 1,

            nome,
            cnpj,
            telefone,
            email,
            cidade,
            uf

        });

    });

    return transportadoras;

}

// ======================================================
// VALIDAR MODO ATUAL
// ======================================================

function atualizarBotaoRevisao() {

    if (modoAtual === 'arquivo') {

        reviewButton.disabled =
            !arquivoSelecionado;

        return;

    }

    const transportadoras =
        obterTransportadorasManuais();

    reviewButton.disabled =
        transportadoras.length === 0;

}

// ======================================================
// INICIAR REVISÃO
// ======================================================

async function iniciarRevisao() {

    reviewButton.disabled = true;

    readStatus.textContent = 'Lendo dados...';

    limparRevisao();

    try {

        if (modoAtual === 'arquivo') {

            await lerArquivo();

        } else {

            await lerDadosManuais();

        }

        mostrarRevisao();

    } catch (erro) {

        console.error(erro);

        alert(
            erro.message ||
            'Não foi possível ler os dados.'
        );

        readStatus.textContent =
            'Erro na leitura';

    } finally {

        atualizarBotaoRevisao();

    }

}

// ======================================================
// LER ARQUIVO
// ======================================================

async function lerArquivo() {

    if (!arquivoSelecionado) {

        throw new Error(
            'Selecione uma planilha primeiro.'
        );

    }

    const formData =
        new FormData();

    formData.append(
        'arquivo',
        arquivoSelecionado
    );

    const resposta =
        await fetch(
            `${API_URL}/transportadoras/importar/preview`,
            {
                method: 'POST',

                headers: {
                    Authorization:
                        `Bearer ${token}`
                },

                body: formData
            }
        );

    const dados =
        await resposta
            .json()
            .catch(() => ({}));

    if (!resposta.ok) {

        throw new Error(
            dados.mensagem ||
            'Não foi possível ler a planilha.'
        );

    }

    transportadorasImportadas =
        normalizarRespostaPreview(dados);

    /*
        Guarda uma cópia independente.
    */
    transportadorasDoArquivo =
        transportadorasImportadas.map(item => ({
            ...item
        }));

    transportadorasExistentes =
        transportadorasImportadas.filter(
            item => item.existente
        );

}

// ======================================================
// NORMALIZAR RESPOSTA DO BACKEND
// ======================================================

function normalizarRespostaPreview(dados) {

    if (Array.isArray(dados.transportadoras)) {

        return dados.transportadoras;

    }

    if (Array.isArray(dados.dados)) {

        return dados.dados;

    }

    if (Array.isArray(dados.resultado)) {

        return dados.resultado;

    }

    if (Array.isArray(dados.rows)) {

        return dados.rows;

    }

    return [];

}

// ======================================================
// LER DADOS MANUAIS
// ======================================================

async function lerDadosManuais() {

    const transportadoras =
        obterTransportadorasManuais();

    if (!transportadoras.length) {

        throw new Error(
            'Adicione pelo menos uma transportadora.'
        );

    }

    const erros = [];

    transportadoras.forEach(item => {

        if (!item.nome) {

            erros.push(
                `Linha ${item.linha}: informe o nome.`
            );

        }

        if (!item.telefone) {

            erros.push(
                `Linha ${item.linha}: informe o telefone.`
            );

        }

        if (
            item.cnpj &&
            item.cnpj.length !== 14
        ) {

            erros.push(
                `Linha ${item.linha}: CNPJ inválido.`
            );

        }

        if (
            item.uf &&
            item.uf.length !== 2
        ) {

            erros.push(
                `Linha ${item.linha}: UF inválida.`
            );

        }

    });

    if (erros.length) {

        mostrarErros(erros);

        throw new Error(
            'Existem dados que precisam ser corrigidos.'
        );

    }

    transportadorasImportadas =
        transportadoras.map(item => ({

            ...item,

            existente: false,

            status: item.cnpj
                ? 'Nova / conferir CNPJ'
                : 'Nova'

        }));

    transportadorasDoArquivo =
        transportadorasImportadas.map(item => ({
            ...item
        }));

    transportadorasExistentes = [];

}

// ======================================================
// MOSTRAR REVISÃO
// ======================================================

function mostrarRevisao() {

    uploadPanel.hidden = true;

    reviewPanel.hidden = false;

    stepUpload.classList.remove(
        'is-active'
    );

    stepReview.classList.add(
        'is-active'
    );

    preencherResumo();

    preencherMapeamento();

    preencherAmostra();

    readStatus.textContent =
        'Leitura concluída';

    verificarTransportadorasPendentes();

}

// ======================================================
// RESUMO
// ======================================================

function preencherResumo() {

    const total =
        transportadorasImportadas.length;

    const novas =
        transportadorasImportadas.filter(
            item => !item.existente
        ).length;

    const atualizacoes =
        transportadorasImportadas.filter(
            item => item.existente
        ).length;

    summaryFiles.textContent =
        modoAtual === 'arquivo'
            ? '1'
            : '—';

    summaryTransportadoras.textContent =
        total;

    summaryNovas.textContent =
        novas;

    summaryAtualizacoes.textContent =
        atualizacoes;

}

// ======================================================
// MAPEAMENTO
// ======================================================

function preencherMapeamento() {

    mappingGrid.innerHTML = `

        <div class="mapping-row mapping-labels">

            <span>
                Coluna do arquivo
            </span>

            <span>
                Será usada como
            </span>

            <span>
                Status
            </span>

        </div>

    `;

    const campos = [

        ['NOME', 'Nome da transportadora'],
        ['CNPJ', 'CNPJ'],
        ['TELEFONE', 'Telefone'],
        ['EMAIL', 'E-mail'],
        ['CONTATO', 'Contato'],
        ['CATEGORIA', 'Categoria'],
        ['IE', 'Inscrição estadual'],
        ['CEP', 'CEP'],
        ['RUA', 'Rua'],
        ['NUMERO', 'Número'],
        ['COMPLEMENTO', 'Complemento'],
        ['BAIRRO', 'Bairro'],
        ['CIDADE', 'Cidade'],
        ['UF', 'UF'],
        ['OBSERVACOES', 'Observações']

    ];

    campos.forEach(campo => {

        const row =
            document.createElement('div');

        row.className =
            'mapping-row';

        row.innerHTML = `

            <span>
                ${campo[0]}
            </span>

            <span>
                ${campo[1]}
            </span>

            <span class="status-pill">
                ✓ Aceita
            </span>

        `;

        mappingGrid.appendChild(row);

    });

}

// ======================================================
// AMOSTRA
// ======================================================

function preencherAmostra() {

    sampleRows.innerHTML = '';

    const amostra =
        transportadorasImportadas.slice(0, 10);

    amostra.forEach(item => {

        const tr =
            document.createElement('tr');

        const nome =
            obterValor(item, 'nome');

        const cnpj =
            obterValor(item, 'cnpj');

        const telefone =
            obterValor(item, 'telefone');

        const cidade =
            obterValor(item, 'cidade');

        let status = 'Nova';

        if (item.ignorada) {

            status = 'Ignorada';

        } else if (item.existente) {

            status = 'Existente';

        } else if (possuiErros(item)) {

            status = '⚠️ Conferir';

        }

        tr.innerHTML = `

            <td>
                ${escaparHTML(nome || '—')}
            </td>

            <td>
                ${escaparHTML(
                    formatarCNPJ(cnpj)
                )}
            </td>

            <td>
                ${escaparHTML(
                    telefone || '—'
                )}
            </td>

            <td>
                ${escaparHTML(
                    cidade || '—'
                )}
            </td>

            <td>
                ${status}
            </td>

        `;

        sampleRows.appendChild(tr);

    });

    sampleCard.hidden =
        amostra.length === 0;

    mostrarErrosConferencia();

}

// ======================================================
// MOSTRAR ERROS
// ======================================================

function mostrarErrosConferencia() {

    errorList.innerHTML = '';

    const problemas =
        transportadorasImportadas.filter(item => {

            if (item.ignorada) {

                return false;

            }

            return possuiErros(item);

        });

    if (!problemas.length) {

        importErrors.hidden = true;

        return;

    }

    /*
        Agora a lista mostra os problemas,
        mas NÃO abre mais uma transportadora
        individualmente.
    */

    problemas.forEach(item => {

        const li =
            document.createElement('li');

        const nome =
            obterValor(item, 'nome') ||
            'Transportadora sem nome';

        const problemasItem =
            obterProblemas(item);

        li.textContent =
            `Linha ${item.linha || '—'}: ${nome} — ${problemasItem.join(', ')}`;

        errorList.appendChild(li);

    });

    /*
        Cria o botão geral de correção.
    */

    const botaoCorrigir =
        document.createElement('button');

    botaoCorrigir.type = 'button';

    botaoCorrigir.className =
        'botao-corrigir-importacao';

    botaoCorrigir.textContent =
        '🔧 Corrigir dados';

    botaoCorrigir.addEventListener(
        'click',
        abrirTelaCorrecao
    );

    errorList.appendChild(
        botaoCorrigir
    );

    importErrors.hidden = false;

}

// ======================================================
// ABRIR TELA DE CORREÇÃO
// ======================================================

function abrirTelaCorrecao() {

    modoCorrecao = true;

    if (!transportadorasImportadas.length) {

        alert('Não existem transportadoras para corrigir.');

        return;

    }

    // Esconde a tela de revisão
    reviewPanel.hidden = true;

    // Mostra a tela de correção
    correcaoTransportadoras.hidden = false;

    // Atualiza a etapa visual
    stepReview.classList.remove('is-active');

    stepFinish.classList.add('is-active');

    // Monta a tabela
    preencherTabelaCorrecao();

    atualizarEstadoBotaoCorrecao();

}

function fecharTelaCorrecao() {

    modoCorrecao = false;

    correcaoTransportadoras.hidden = true;

    reviewPanel.hidden = false;

    stepFinish.classList.remove('is-active');

    stepReview.classList.add('is-active');

    verificarTransportadorasPendentes();

}

function atualizarEstadoBotaoCorrecao() {

    const possuiPendencias =
        transportadorasImportadas.some(item => {

            if (item.ignorada) {
                return false;
            }

            return possuiErros(item);

        });

    atualizarSistemaCorrecaoButton.disabled =
        possuiPendencias;

    if (possuiPendencias) {

        correcaoHint.textContent =
            'Existem campos em vermelho que precisam ser corrigidos.';

    } else {

        correcaoHint.textContent =
            'Todos os dados obrigatórios estão corretos.';

    }

}
// ======================================================
// PREENCHER TABELA DE CORREÇÃO
// ======================================================

function preencherTabelaCorrecao() {

    const tabela =
        document.getElementById(
            'tabelaCorrecaoTransportadoras'
        );

    if (!tabela) {

        return;

    }

    tabela.innerHTML = '';

    const cabecalho =
        document.createElement('thead');

    const linhaCabecalho =
        document.createElement('tr');

    linhaCabecalho.innerHTML = `

        <th>Linha</th>

        ${CAMPOS_TRANSPORTADORA.map(
            campo =>
                `<th>${campo.titulo}</th>`
        ).join('')}

    `;

    cabecalho.appendChild(
        linhaCabecalho
    );

    const corpo =
        document.createElement('tbody');

    transportadorasImportadas.forEach(
        (item, index) => {

            const linha =
                document.createElement('tr');

            const numero =
                document.createElement('td');

            numero.textContent =
                item.linha || index + 1;

            linha.appendChild(numero);

            CAMPOS_TRANSPORTADORA.forEach(
                campo => {

                    const td =
                        document.createElement('td');

                    const input =
                        document.createElement('input');

                    input.type = 'text';

                    input.value =
                        obterValor(
                            item,
                            campo.chave
                        );

                    input.dataset.campo =
                        campo.chave;

                    input.dataset.index =
                        index;

                    atualizarVisualCelula(
                        td,
                        input,
                        campo,
                        item
                    );

                    input.addEventListener(
                        'input',
                        () => {

                            atualizarItemDaTabela(
                                item,
                                campo,
                                input.value
                            );

                            atualizarVisualCelula(
                                td,
                                input,
                                campo,
                                item
                            );

verificarTransportadorasPendentes();

atualizarEstadoBotaoCorrecao();
                        }
                    );

                    td.appendChild(input);

                    linha.appendChild(td);

                }
            );

            corpo.appendChild(linha);

        }
    );

    tabela.appendChild(cabecalho);

    tabela.appendChild(corpo);

}

// ======================================================
// ATUALIZAR ITEM DA TABELA
// ======================================================

function atualizarItemDaTabela(
    item,
    campo,
    valor
) {

    const valorLimpo =
        valor.trim();

    item[campo.chave] =
        valorLimpo;

    /*
        Também atualiza a coluna original
        caso o backend tenha enviado NOME,
        TELEFONE etc.
    */

    item[campo.coluna] =
        valorLimpo;

}

// ======================================================
// VISUAL DA CÉLULA
// ======================================================

function atualizarVisualCelula(
    td,
    input,
    campo,
    item
) {

    const valor =
        input.value.trim();

    const valido =
        campoValido(
            campo,
            valor
        );

    td.classList.remove(
        'celula-erro',
        'celula-corrigida'
    );

    if (!valido) {

        td.classList.add(
            'celula-erro'
        );

        input.title =
            obterMensagemCampo(
                campo,
                valor
            );

    } else {

        td.classList.add(
            'celula-corrigida'
        );

        input.title =
            'Campo preenchido corretamente';

    }

}

// ======================================================
// VALIDAR CAMPO
// ======================================================

function campoValido(
    campo,
    valor
) {

    /*
        NOME é obrigatório.
    */

    if (
        campo.chave === 'nome'
    ) {

        return valor.length > 0;

    }

    /*
        TELEFONE é obrigatório.
    */

    if (
        campo.chave === 'telefone'
    ) {

        return limparNumeros(valor).length > 0;

    }

    /*
        CNPJ é opcional.
        Mas se foi informado,
        precisa ter 14 números.
    */

    if (
        campo.chave === 'cnpj'
    ) {

        if (!valor) {

            return true;

        }

        return limparNumeros(valor).length === 14;

    }

    /*
        UF é opcional.
        Mas se foi informado,
        precisa ter 2 letras.
    */

    if (
        campo.chave === 'uf'
    ) {

        if (!valor) {

            return true;

        }

        return valor.length === 2;

    }

    /*
        Os outros campos são opcionais.
    */

    return true;

}

// ======================================================
// MENSAGEM DO CAMPO
// ======================================================

function obterMensagemCampo(
    campo,
    valor
) {

    if (
        campo.chave === 'nome'
    ) {

        return 'Informe o nome da transportadora.';

    }

    if (
        campo.chave === 'telefone'
    ) {

        return 'Informe o telefone.';

    }

    if (
        campo.chave === 'cnpj' &&
        valor
    ) {

        return 'O CNPJ precisa ter 14 números.';

    }

    if (
        campo.chave === 'uf' &&
        valor
    ) {

        return 'A UF precisa ter 2 letras.';

    }

    return 'Confira este campo.';

}

// ======================================================
// DESCOBRIR PROBLEMAS
// ======================================================

function possuiErros(item) {

    return obterProblemas(item).length > 0;

}

function obterProblemas(item) {

    const problemas = [];

    CAMPOS_TRANSPORTADORA.forEach(
        campo => {

            const valor =
                obterValor(
                    item,
                    campo.chave
                );

            if (
                !campoValido(
                    campo,
                    valor
                )
            ) {

                problemas.push(
                    campo.titulo
                );

            }

        }
    );

    return problemas;

}

// ======================================================
// OBTER VALOR
// ======================================================

function obterValor(
    item,
    chave
) {

    const campo =
        CAMPOS_TRANSPORTADORA.find(
            itemCampo =>
                itemCampo.chave === chave
        );

    if (!campo) {

        return '';

    }

    return String(
        item[chave] ??
        item[campo.coluna] ??
        ''
    ).trim();

}

// ======================================================
// VOLTAR
// ======================================================

function voltarParaUpload() {

    reviewPanel.hidden = true;

    uploadPanel.hidden = false;

    stepReview.classList.remove(
        'is-active'
    );

    stepUpload.classList.add(
        'is-active'
    );

    modoCorrecao = false;

    applyButton.disabled = true;

}

// ======================================================
// LIMPAR REVISÃO
// ======================================================

function limparRevisao() {

    transportadorasImportadas = [];

    transportadorasDoArquivo = [];

    transportadorasExistentes = [];

    modoCorrecao = false;

    mappingGrid.innerHTML = `

        <div class="mapping-row mapping-labels">

            <span>
                Coluna do arquivo
            </span>

            <span>
                Será usada como
            </span>

            <span>
                Status
            </span>

        </div>

    `;

    sampleRows.innerHTML = '';

    sampleCard.hidden = true;

    importErrors.hidden = true;

    errorList.innerHTML = '';

}

// ======================================================
// MOSTRAR ERROS
// ======================================================

function mostrarErros(erros) {

    errorList.innerHTML = '';

    erros.forEach(erro => {

        const li =
            document.createElement('li');

        li.textContent =
            erro;

        errorList.appendChild(li);

    });

    importErrors.hidden =
        erros.length === 0;

}

// ======================================================
// VERIFICAR TRANSPORTADORAS PENDENTES
// ======================================================

function verificarTransportadorasPendentes() {

    const pendentes =
        transportadorasImportadas.filter(
            item => {

                if (item.ignorada) {

                    return false;

                }

                return possuiErros(item);

            }
        );

    if (pendentes.length > 0) {

        applyButton.disabled = true;

        applyHint.textContent =
            `${pendentes.length} transportadora(s) precisam de correção.`;

        return false;

    }

    const quantidadeValidas =
        transportadorasImportadas.filter(
            item => !item.ignorada
        ).length;

    applyButton.disabled =
        quantidadeValidas === 0;

    applyHint.textContent =
        'Todos os dados obrigatórios estão preenchidos.';

    return true;

}

// ======================================================
// APLICAR IMPORTAÇÃO
// ======================================================

async function aplicarImportacao() {

    if (!transportadorasImportadas.length) {

        alert(
            'Não existem transportadoras para importar.'
        );

        return;

    }

    if (!verificarTransportadorasPendentes()) {

        alert(
            'Existem transportadoras que precisam ser corrigidas.'
        );

        return;

    }

    const quantidadeParaEnviar =
        transportadorasImportadas.filter(
            item => !item.ignorada
        ).length;

    if (!quantidadeParaEnviar) {

        alert(
            'Todas as transportadoras foram ignoradas.'
        );

        return;

    }

    const confirmar =
        confirm(
            `Deseja realmente atualizar o sistema com ${quantidadeParaEnviar} transportadora(s)?`
        );

    if (!confirmar) {

        return;

    }

    applyButton.disabled = true;

    applyButton.textContent =
        'Atualizando...';

    try {

        const transportadorasNormalizadas =
            transportadorasImportadas

                .filter(
                    item => !item.ignorada
                )

                .map(item => ({

                    ...item,

                    nome:
                        obterValor(
                            item,
                            'nome'
                        ),

                    cnpj:
                        limparNumeros(
                            obterValor(
                                item,
                                'cnpj'
                            )
                        ),

                    telefone:
                        limparNumeros(
                            obterValor(
                                item,
                                'telefone'
                            )
                        ),

                    email:
                        obterValor(
                            item,
                            'email'
                        ),

                    contato:
                        obterValor(
                            item,
                            'contato'
                        ),

                    categoria:
                        obterValor(
                            item,
                            'categoria'
                        ),

                    ie:
                        obterValor(
                            item,
                            'ie'
                        ),

                    cep:
                        limparNumeros(
                            obterValor(
                                item,
                                'cep'
                            )
                        ),

                    rua:
                        obterValor(
                            item,
                            'rua'
                        ),

                    numero:
                        obterValor(
                            item,
                            'numero'
                        ),

                    complemento:
                        obterValor(
                            item,
                            'complemento'
                        ),

                    bairro:
                        obterValor(
                            item,
                            'bairro'
                        ),

                    cidade:
                        obterValor(
                            item,
                            'cidade'
                        ),

                    uf:
                        obterValor(
                            item,
                            'uf'
                        ).toUpperCase(),

                    observacoes:
                        obterValor(
                            item,
                            'observacoes'
                        )

                }));

        const payload = {

            transportadoras:
                transportadorasNormalizadas,

            atualizarDadosGerais:
                updateDadosGerais.checked,

            atualizarEndereco:
                updateEndereco.checked,

            atualizarObservacoes:
                updateObservacoes.checked

        };

        const resposta =
            await fetch(
                `${API_URL}/transportadoras/importar/aplicar`,
                {

                    method: 'POST',

                    headers: {

                        Authorization:
                            `Bearer ${token}`,

                        'Content-Type':
                            'application/json'

                    },

                    body:
                        JSON.stringify(
                            payload
                        )

                }
            );

        const dados =
            await resposta
                .json()
                .catch(() => ({}));

        if (!resposta.ok) {

            throw new Error(
                dados.mensagem ||
                'Não foi possível aplicar a importação.'
            );

        }

        stepReview.classList.remove(
            'is-active'
        );

        stepFinish.classList.add(
            'is-active'
        );

        applyHint.textContent =
            dados.mensagem ||
            'Importação concluída com sucesso.';

        applyButton.textContent =
            'Importação concluída';

        alert(
            dados.mensagem ||
            'Transportadoras importadas com sucesso.'
        );

    } catch (erro) {

        console.error(erro);

        alert(
            erro.message ||
            'Erro ao atualizar o sistema.'
        );

        applyButton.disabled =
            false;

        applyButton.textContent =
            'Atualizar sistema →';

    }

}

// ======================================================
// UTILITÁRIOS
// ======================================================

function limparNumeros(valor) {

    return String(valor || '')
        .replace(/\D/g, '');

}

function formatarCNPJ(valor) {

    const numeros =
        limparNumeros(valor);

    if (numeros.length !== 14) {

        return valor || '—';

    }

    return numeros.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );

}

function escaparHTML(valor) {

    return String(valor ?? '')
        .replace(
            /&/g,
            '&amp;'
        )
        .replace(
            /</g,
            '&lt;'
        )
        .replace(
            />/g,
            '&gt;'
        )
        .replace(
            /"/g,
            '&quot;'
        )
        .replace(
            /'/g,
            '&#039;'
        );

}