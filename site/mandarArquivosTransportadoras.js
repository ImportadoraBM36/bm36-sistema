const API_URL = 'https://bm36-sistema-production.up.railway.app/api';

const token = localStorage.getItem('bm36_token');
const usuario = JSON.parse(localStorage.getItem('bm36_usuario') || '{}');

// ======================================================
// VERIFICAÇÃO DE LOGIN E ADMIN
// ======================================================

if (!token || !usuario || String(usuario.perfil || '').toUpperCase() !== 'ADMIN') {

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

const addTransportadoraButton = document.getElementById(
'addTransportadoraButton'
);

const manualTransportadorasRows = document.getElementById(
'manualTransportadorasRows'
);

const reviewButton = document.getElementById('reviewButton');

const uploadPanel = document.getElementById('uploadPanel');
const reviewPanel = document.getElementById('reviewPanel');

const backButton = document.getElementById('backButton');

const stepUpload = document.getElementById('stepUpload');
const stepReview = document.getElementById('stepReview');
const stepFinish = document.getElementById('stepFinish');

const summaryFiles = document.getElementById('summaryFiles');
const summaryTransportadoras = document.getElementById(
'summaryTransportadoras'
);
const summaryNovas = document.getElementById('summaryNovas');
const summaryAtualizacoes = document.getElementById(
'summaryAtualizacoes'
);

const mappingGrid = document.getElementById('mappingGrid');
const readStatus = document.getElementById('readStatus');

const importErrors = document.getElementById('importErrors');
const errorList = document.getElementById('errorList');

const sampleCard = document.getElementById('sampleCard');
const sampleRows = document.getElementById('sampleRows');

const updateDadosGerais = document.getElementById(
'updateDadosGerais'
);

const updateEndereco = document.getElementById(
'updateEndereco'
);

const updateObservacoes = document.getElementById(
'updateObservacoes'
);

const applyButton = document.getElementById('applyButton');
const applyHint = document.getElementById('applyHint');

// ======================================================
// DADOS DA IMPORTAÇÃO
// ======================================================

let arquivoSelecionado = null;

let transportadorasImportadas = [];
let transportadorasDoArquivo = [];
let modoCorrecaoManual = false;
let transportadorasExistentes = [];

let modoAtual = 'arquivo';

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

    fileMode.hidden = false;
    manualMode.hidden = true;

    fileModeButton.classList.add('active');
    manualModeButton.classList.remove('active');

    atualizarBotaoRevisao();

});


manualModeButton.addEventListener('click', () => {

    modoAtual = 'manual';
modoCorrecaoManual = true;

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


    if (!nome && !telefone && !cnpj && !email && !cidade && !uf) {

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

    reviewButton.disabled = !arquivoSelecionado;

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

    readStatus.textContent = 'Erro na leitura';

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


const formData = new FormData();

formData.append(
    'arquivo',
    arquivoSelecionado
);


const resposta = await fetch(
    `${API_URL}/transportadoras/importar/preview`,
    {
        method: 'POST',

        headers: {
            Authorization: `Bearer ${token}`
        },

        body: formData
    }
);


const dados =
    await resposta.json().catch(() => ({}));


if (!resposta.ok) {

    throw new Error(
        dados.mensagem ||
        'Não foi possível ler a planilha.'
    );

}


transportadorasImportadas =
    normalizarRespostaPreview(dados);

transportadorasDoArquivo =
    [...transportadorasImportadas];


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


transportadorasExistentes = [];
   

}

// ======================================================
// MOSTRAR REVISÃO
// ======================================================

function mostrarRevisao() {

   
uploadPanel.hidden = true;

reviewPanel.hidden = false;


stepUpload.classList.remove('is-active');
stepReview.classList.add('is-active');


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
    modoAtual === 'arquivo' ? '1' : '—';


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

    // Mostra somente as 10 primeiras
    // para não deixar a tela gigante.
    const amostra =
        transportadorasImportadas.slice(0, 10);

    amostra.forEach(item => {

        const tr =
            document.createElement('tr');

        const nome =
            item.nome ||
            item.NOME ||
            '—';

        const cnpj =
            item.cnpj ||
            item.CNPJ ||
            '—';

        const telefone =
            item.telefone ||
            item.TELEFONE ||
            '—';

        const cidade =
            item.cidade ||
            item.CIDADE ||
            '—';

        let status = 'Nova';

        if (item.ignorada) {

            status = 'Ignorada';

        } else if (item.existente) {

            status = 'Existente';

        } else if (!telefone || telefone === '—') {

            status = '⚠️ Conferir';

        }

        tr.innerHTML = `

            <td>
                ${escaparHTML(nome)}
            </td>

            <td>
                ${escaparHTML(formatarCNPJ(cnpj))}
            </td>

            <td>
                ${escaparHTML(telefone)}
            </td>

            <td>
                ${escaparHTML(cidade)}
            </td>

            <td>
                ${status}
            </td>

        `;

        if (status === '⚠️ Conferir') {

            tr.style.cursor = 'pointer';

            tr.title =
                'Clique para corrigir esta transportadora';

            tr.addEventListener('click', () => {

                abrirModalTransportadora(item);

            });

        }

        sampleRows.appendChild(tr);

    });

    sampleCard.hidden =
        amostra.length === 0;

    mostrarErrosConferencia();

}
function mostrarErrosConferencia() {

    errorList.innerHTML = '';

    const problemas =
        transportadorasImportadas.filter(item => {

            if (item.ignorada) {
                return false;
            }

            const nome =
                item.nome ||
                item.NOME ||
                '';

            const telefone =
                item.telefone ||
                item.TELEFONE ||
                '';

            return !nome || !telefone;

        });

    if (!problemas.length) {

        importErrors.hidden = true;

        return;
    }

    problemas.forEach(item => {

        const li =
            document.createElement('li');

        const nome =
            item.nome ||
            item.NOME ||
            'Transportadora sem nome';

        const telefone =
            item.telefone ||
            item.TELEFONE ||
            '';

        li.textContent =
            `Linha ${item.linha}: ${nome} — telefone não informado`;

        li.style.cursor = 'pointer';

        li.title =
            'Clique para corrigir esta transportadora';

        li.addEventListener('click', () => {

            abrirModalTransportadora(item);

        });

        errorList.appendChild(li);

    });

    importErrors.hidden = false;

}
// ======================================================
// VOLTAR
// ======================================================

function voltarParaUpload() {

   
reviewPanel.hidden = true;

uploadPanel.hidden = false;


stepReview.classList.remove('is-active');

stepUpload.classList.add('is-active');


applyButton.disabled = true;
   

}

// ======================================================
// LIMPAR REVISÃO
// ======================================================

function limparRevisao() {

   
transportadorasImportadas = [];

transportadorasExistentes = [];

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

    li.textContent = erro;

    errorList.appendChild(li);

});


importErrors.hidden =
    erros.length === 0;

}





// ======================================================
// MODAL DE CONFERÊNCIA
// ======================================================

let transportadoraEmEdicao = null;

const modalTransportadora =
    document.getElementById('modalTransportadora');

const fecharModalTransportadora =
    document.getElementById('fecharModalTransportadora');

const corrigirTransportadora =
    document.getElementById('corrigirTransportadora');

const ignorarTransportadora =
    document.getElementById('ignorarTransportadora');

const modalTransportadoraNome =
    document.getElementById('modalTransportadoraNome');

const modalTransportadoraProblema =
    document.getElementById('modalTransportadoraProblema');


// ======================================================
// ABRIR MODAL
// ======================================================

function abrirModalTransportadora(item) {

    transportadoraEmEdicao = item;

    const nome =
        item.nome ||
        item.NOME ||
        'Transportadora';

    const telefone =
        item.telefone ||
        item.TELEFONE ||
        '';

    modalTransportadoraNome.textContent =
        nome;

    if (!telefone) {

        modalTransportadoraProblema.textContent =
            'O telefone obrigatório não foi informado na planilha.';

    } else {

        modalTransportadoraProblema.textContent =
            'Existem dados que precisam ser conferidos.';

    }

    modalTransportadora.hidden = false;

}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModalTransportadoraFunc() {

    modalTransportadora.hidden = true;

    transportadoraEmEdicao = null;

}


// ======================================================
// CORRIGIR
// ======================================================

function corrigirTransportadoraAtual() {

    if (!transportadoraEmEdicao) {

        return;

    }

    const item =
        transportadoraEmEdicao;


    // Marca que essa transportadora será
    // corrigida manualmente.
    item.corrigirManualmente = true;


    // Volta para a primeira etapa.
    reviewPanel.hidden = true;

    uploadPanel.hidden = false;


    stepReview.classList.remove('is-active');

    stepUpload.classList.add('is-active');


    // Abre o modo manual.
    modoAtual = 'manual';

    fileMode.hidden = true;

    manualMode.hidden = false;

    fileModeButton.classList.remove('active');

    manualModeButton.classList.add('active');


    // Coloca os dados da planilha
    // diretamente na tabela manual.
    adicionarLinhaManual({

        nome:
            item.nome ||
            item.NOME ||
            '',

        cnpj:
            item.cnpj ||
            item.CNPJ ||
            '',

        telefone:
            item.telefone ||
            item.TELEFONE ||
            '',

        email:
            item.email ||
            item.EMAIL ||
            '',

        cidade:
            item.cidade ||
            item.CIDADE ||
            '',

        uf:
            item.uf ||
            item.UF ||
            ''

    });


    fecharModalTransportadoraFunc();

}


// ======================================================
// IGNORAR
// ======================================================

function ignorarTransportadoraAtual() {

    if (!transportadoraEmEdicao) {

        return;

    }


    transportadoraEmEdicao.ignorada =
        true;

    transportadoraEmEdicao.status =
        'Ignorada';


    fecharModalTransportadoraFunc();


    preencherResumo();

    preencherAmostra();

    verificarTransportadorasPendentes();

}


// ======================================================
// BOTÕES DO MODAL
// ======================================================

fecharModalTransportadora.addEventListener(
    'click',
    fecharModalTransportadoraFunc
);


ignorarTransportadora.addEventListener(
    'click',
    ignorarTransportadoraAtual
);


corrigirTransportadora.addEventListener(
    'click',
    corrigirTransportadoraAtual
);


// Clicar fora do modal também fecha
modalTransportadora
    .querySelector('.modal-transportadora-overlay')
    .addEventListener(
        'click',
        fecharModalTransportadoraFunc
    );
// ======================================================
// APLICAR IMPORTAÇÃO
// ======================================================
function verificarTransportadorasPendentes() {

    const pendentes =
        transportadorasImportadas.filter(item => {

            if (item.ignorada) {
                return false;
            }

            const nome =
                item.nome ||
                item.NOME ||
                '';

            const telefone =
                item.telefone ||
                item.TELEFONE ||
                '';

            return !nome || !telefone;

        });


    if (pendentes.length > 0) {

        applyButton.disabled = true;

        applyHint.textContent =
            `${pendentes.length} transportadora(s) precisam de correção.`;

        return false;

    }


    applyButton.disabled =
        transportadorasImportadas.filter(
            item => !item.ignorada
        ).length === 0;

    applyHint.textContent =
        'Todos os dados obrigatórios estão preenchidos.';

    return true;

}// ======================================================
// APLICAR IMPORTAÇÃO
// ======================================================

async function aplicarImportacao() {

    if (!transportadorasImportadas.length) {

        alert(
            'Não existem transportadoras para importar.'
        );

        return;

    }


    // Verifica se ainda existe algum problema
    if (!verificarTransportadorasPendentes()) {

        alert(
            'Existem transportadoras que precisam ser corrigidas ou ignoradas.'
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

                .filter(item => !item.ignorada)

                .map(item => ({

                    ...item,

                    nome:
                        item.nome ??
                        item.NOME ??
                        '',

                    cnpj:
                        item.cnpj ??
                        item.CNPJ ??
                        '',

                    telefone:
                        item.telefone ??
                        item.TELEFONE ??
                        '',

                    email:
                        item.email ??
                        item.EMAIL ??
                        '',

                    contato:
                        item.contato ??
                        item.CONTATO ??
                        '',

                    categoria:
                        item.categoria ??
                        item.CATEGORIA ??
                        '',

                    ie:
                        item.ie ??
                        item.IE ??
                        '',

                    cep:
                        item.cep ??
                        item.CEP ??
                        '',

                    rua:
                        item.rua ??
                        item.RUA ??
                        '',

                    numero:
                        item.numero ??
                        item.NUMERO ??
                        '',

                    complemento:
                        item.complemento ??
                        item.COMPLEMENTO ??
                        '',

                    bairro:
                        item.bairro ??
                        item.BAIRRO ??
                        '',

                    cidade:
                        item.cidade ??
                        item.CIDADE ??
                        '',

                    uf:
                        item.uf ??
                        item.UF ??
                        '',

                    observacoes:
                        item.observacoes ??
                        item.OBSERVACOES ??
                        ''

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


        const resposta = await fetch(
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
                    JSON.stringify(payload)

            }
        );


        const dados =
            await resposta.json()
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


        applyButton.disabled = false;

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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}
