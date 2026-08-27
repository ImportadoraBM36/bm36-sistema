document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('bm36_token');
    const usuarioSalvo = localStorage.getItem('bm36_usuario');

    let usuario;

    try {
        usuario = JSON.parse(usuarioSalvo);
    } catch {
        usuario = null;
    }

    const ehAdmin = String(usuario?.perfil || '').toUpperCase() === 'ADMIN';

    if (!token || !ehAdmin) {
        window.location.replace('./inicio.html');
        return;
    }

    const fileInput = document.getElementById('fileInput');
    const uploadDropzone = document.getElementById('uploadDropzone');
    const selectedFiles = document.getElementById('selectedFiles');
    const fileList = document.getElementById('fileList');
    const clearFilesButton = document.getElementById('clearFilesButton');
    const reviewButton = document.getElementById('reviewButton');
    const backButton = document.getElementById('backButton');
    const uploadPanel = document.getElementById('uploadPanel');
    const reviewPanel = document.getElementById('reviewPanel');
    const summaryFiles = document.getElementById('summaryFiles');
    const stepUpload = document.getElementById('stepUpload');
    const stepReview = document.getElementById('stepReview');

    let arquivosSelecionados = [];

    function tamanhoFormatado(bytes) {
        if (bytes < 1024 * 1024) {
            return `${Math.max(1, Math.round(bytes / 1024))} KB`;
        }

        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function atualizarArquivos(files) {
        arquivosSelecionados = Array.from(files).filter(file =>
            /\.(xls|xlsx|csv)$/i.test(file.name)
        );

        fileList.innerHTML = '';

        arquivosSelecionados.forEach(file => {
            const item = document.createElement('li');
            const nome = document.createElement('span');
            const tamanho = document.createElement('span');

            nome.textContent = `📊 ${file.name}`;
            tamanho.textContent = tamanhoFormatado(file.size);

            item.append(nome, tamanho);
            fileList.appendChild(item);
        });

        const possuiArquivos = arquivosSelecionados.length > 0;
        selectedFiles.hidden = !possuiArquivos;
        reviewButton.disabled = !possuiArquivos;
        summaryFiles.textContent = arquivosSelecionados.length;
    }

    fileInput.addEventListener('change', event => atualizarArquivos(event.target.files));

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadDropzone.addEventListener(eventName, event => {
            event.preventDefault();
            uploadDropzone.classList.add('is-dragging');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadDropzone.addEventListener(eventName, event => {
            event.preventDefault();
            uploadDropzone.classList.remove('is-dragging');
        });
    });

    uploadDropzone.addEventListener('drop', event => atualizarArquivos(event.dataTransfer.files));

    clearFilesButton.addEventListener('click', () => {
        arquivosSelecionados = [];
        fileInput.value = '';
        atualizarArquivos([]);
    });

    reviewButton.addEventListener('click', () => {
        uploadPanel.hidden = true;
        reviewPanel.hidden = false;
        stepUpload.classList.remove('is-active');
        stepUpload.classList.add('is-complete');
        stepReview.classList.add('is-active');
    });

    backButton.addEventListener('click', () => {
        reviewPanel.hidden = true;
        uploadPanel.hidden = false;
        stepUpload.classList.add('is-active');
        stepUpload.classList.remove('is-complete');
        stepReview.classList.remove('is-active');
    });
});
