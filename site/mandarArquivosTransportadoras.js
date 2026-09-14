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

function adicionarLinhaManual() {

   
const tr = document.createElement('tr');

tr.innerHTML = `

    <td>
        <input
            type="text"
            class="manual-nome"
            placeholder="Nome da transportadora"
        >
    </td>

    <td>
        <input
            type="text"
            class="manual-cnpj"
            placeholder="CNPJ"
            maxlength="18"
        >
    </td>

    <td>
        <input
            type="text"
            class="manual-telefone"
            placeholder="Telefone"
        >
    </td>

    <td>
        <input
            type="email"
            class="manual-email"
            placeholder="E-mail"
        >
    </td>

    <td>
        <input
            type="text"
            class="manual-cidade"
            placeholder="Cidade"
        >
    </td>

    <td>
        <input
            type="text"
            class="manual-uf"
            placeholder="UF"
            maxlength="2"
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


const inputs = tr.querySelectorAll('input');

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


applyButton.disabled =
    transportadorasImportadas.length === 0;


applyHint.textContent =
    `${transportadorasImportadas.length} transportadora(s) pronta(s) para revisão.`;
   

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


    const amostra =
        transportadorasImportadas;


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

        } else if (!nome || nome === '—' || !telefone || telefone === '—') {

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
                'Clique para conferir e corrigir esta transportadora';


            tr.addEventListener('click', () => {

                abrirModalTransportadora(item);

            });

        }


        sampleRows.appendChild(tr);

    });


    sampleCard.hidden =
        amostra.length === 0;

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
// ABRIR MODAL DE CONFERÊNCIA
// ======================================================

function abrirModalTransportadora(item) {

    transportadoraEmEdicao = item;


    modalTransportadoraLinha.textContent =
        `Linha da planilha: ${item.linha || '—'}`;


    preencherDadosPlanilhaModal(item);

    preencherFormularioModal(item);


    modalTransportadora.hidden = false;

}


// ======================================================
// DADOS DA PLANILHA
// ======================================================

function preencherDadosPlanilhaModal(item) {

    const campos = [

        ['Nome', item.nome || ''],
        ['CNPJ', item.cnpj || ''],
        ['Telefone', item.telefone || ''],
        ['E-mail', item.email || ''],
        ['Contato', item.contato || ''],
        ['Categoria', item.categoria || ''],
        ['IE', item.ie || ''],
        ['CEP', item.cep || ''],
        ['Rua', item.rua || ''],
        ['Número', item.numero || ''],
        ['Complemento', item.complemento || ''],
        ['Bairro', item.bairro || ''],
        ['Cidade', item.cidade || ''],
        ['UF', item.uf || ''],
        ['Observações', item.observacoes || '']

    ];


    modalDadosPlanilha.innerHTML = '';


    campos.forEach(([nome, valor]) => {

        const div =
            document.createElement('div');

        div.className =
            'modal-dado-planilha';


        div.innerHTML = `

            <strong>
                ${escaparHTML(nome)}
            </strong>

            <span>
                ${escaparHTML(valor || 'Não informado')}
            </span>

        `;


        modalDadosPlanilha.appendChild(div);

    });

}


// ======================================================
// PREENCHER FORMULÁRIO
// ======================================================

function preencherFormularioModal(item) {

    modalNome.value =
        item.nome || '';

    modalCnpj.value =
        item.cnpj || '';

    modalTelefone.value =
        item.telefone || '';

    modalEmail.value =
        item.email || '';

    modalContato.value =
        item.contato || '';

    modalCategoria.value =
        item.categoria || '';

    modalIe.value =
        item.ie || '';

    modalCep.value =
        item.cep || '';

    modalRua.value =
        item.rua || '';

    modalNumero.value =
        item.numero || '';

    modalComplemento.value =
        item.complemento || '';

    modalBairro.value =
        item.bairro || '';

    modalCidade.value =
        item.cidade || '';

    modalUf.value =
        item.uf || '';

    modalObservacoes.value =
        item.observacoes || '';

}


// ======================================================
// FECHAR MODAL
// ======================================================

function fecharModal() {

    modalTransportadora.hidden = true;

    transportadoraEmEdicao = null;

}


// ======================================================
// SALVAR CORREÇÃO
// ======================================================

function salvarCorrecaoTransportadora() {

    if (!transportadoraEmEdicao) {

        return;

    }


    const nome =
        modalNome.value.trim();

    const telefone =
        limparNumeros(
            modalTelefone.value
        );


    if (!nome) {

        alert(
            'O nome da transportadora é obrigatório.'
        );

        modalNome.focus();

        return;

    }


    if (!telefone) {

        alert(
            'O telefone da transportadora é obrigatório.'
        );

        modalTelefone.focus();

        return;

    }


    transportadoraEmEdicao.nome =
        nome;

    transportadoraEmEdicao.cnpj =
        limparNumeros(
            modalCnpj.value
        );

    transportadoraEmEdicao.telefone =
        telefone;

    transportadoraEmEdicao.email =
        modalEmail.value.trim();

    transportadoraEmEdicao.contato =
        modalContato.value.trim();

    transportadoraEmEdicao.categoria =
        modalCategoria.value.trim();

    transportadoraEmEdicao.ie =
        modalIe.value.trim();

    transportadoraEmEdicao.cep =
        limparNumeros(
            modalCep.value
        );

    transportadoraEmEdicao.rua =
        modalRua.value.trim();

    transportadoraEmEdicao.numero =
        modalNumero.value.trim();

    transportadoraEmEdicao.complemento =
        modalComplemento.value.trim();

    transportadoraEmEdicao.bairro =
        modalBairro.value.trim();

    transportadoraEmEdicao.cidade =
        modalCidade.value.trim();

    transportadoraEmEdicao.uf =
        modalUf.value
            .trim()
            .toUpperCase();

    transportadoraEmEdicao.observacoes =
        modalObservacoes.value.trim();


    transportadoraEmEdicao.status =
        'Pronta';


    fecharModal();


    preencherResumo();

    preencherAmostra();

    verificarTransportadorasPendentes();

}


// ======================================================
// IGNORAR
// ======================================================

function ignorarTransportadoraAtual() {t

    if (!transportadoraEmEdicao) {

        return;

    }


    transportadoraEmEdicao.ignorada =
        true;

    transportadoraEmEdicao.status =
        'Ignorada';


    fecharModal();


    preencherResumo();

    preencherAmostra();

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


const confirmar =
    confirm(
        `Deseja realmente atualizar o sistema com ${transportadorasImportadas.length} transportadora(s)?`
    );


if (!confirmar) {

    return;

}


applyButton.disabled = true;

applyButton.textContent =
    'Atualizando...';


try {
console.log(
    'TRANSPORTADORA LINHA 158:',
    transportadorasImportadas.find(
        item => item.linha === 158
    )
);
 const transportadorasNormalizadas =
    transportadorasImportadas.map(item => ({

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

                Authorization: `Bearer ${token}`,

                'Content-Type':
                    'application/json'

            },

            body:
                JSON.stringify(payload)

        }
    );


    const dados =
        await resposta.json().catch(() => ({}));


    if (!resposta.ok) {

        throw new Error(
            dados.mensagem ||
            'Não foi possível aplicar a importação.'
        );

    }


    stepReview.classList.remove('is-active');

    stepFinish.classList.add('is-active');


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
