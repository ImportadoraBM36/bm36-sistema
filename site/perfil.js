const API_URL =
    'https://bm36-sistema-production.up.railway.app/api';

const BASE_URL =
    'https://bm36-sistema-production.up.railway.app';


// ============================================================
// LOGIN
// ============================================================

const token =
    localStorage.getItem(
        'bm36_token'
    );


const usuarioSalvo =
    localStorage.getItem(
        'bm36_usuario'
    );


if (
    !token ||
    !usuarioSalvo
) {

    window.location.href =
        './index.html';

}


// ============================================================
// ELEMENTOS
// ============================================================

const perfilNome =
    document.getElementById(
        'perfilNome'
    );


const perfilEmail =
    document.getElementById(
        'perfilEmail'
    );


const perfilTipo =
    document.getElementById(
        'perfilTipo'
    );


const perfilErro =
    document.getElementById(
        'perfilErro'
    );


const formPerfil =
    document.getElementById(
        'formPerfil'
    );


const btnSalvarPerfil =
    document.getElementById(
        'btnSalvarPerfil'
    );


const formSenha =
    document.getElementById(
        'formSenha'
    );


const senhaAtual =
    document.getElementById(
        'senhaAtual'
    );


const novaSenha =
    document.getElementById(
        'novaSenha'
    );


const confirmarNovaSenha =
    document.getElementById(
        'confirmarNovaSenha'
    );


const senhaErro =
    document.getElementById(
        'senhaErro'
    );


const btnAlterarSenha =
    document.getElementById(
        'btnAlterarSenha'
    );


const inputFoto =
    document.getElementById(
        'inputFoto'
    );


const btnEnviarFoto =
    document.getElementById(
        'btnEnviarFoto'
    );


const btnRemoverFoto =
    document.getElementById(
        'btnRemoverFoto'
    );


const fotoUsuario =
    document.getElementById(
        'fotoUsuario'
    );


const fotoIniciais =
    document.getElementById(
        'fotoIniciais'
    );


const fotoStatus =
    document.getElementById(
        'fotoStatus'
    );


const perfilToast =
    document.getElementById(
        'perfilToast'
    );


const perfilToastTexto =
    document.getElementById(
        'perfilToastTexto'
    );


// ============================================================
// REQUEST
// ============================================================

async function apiFetch(
    rota,
    opcoes = {}
) {

    const headers = {

        ...(opcoes.headers || {}),

        Authorization:
            `Bearer ${token}`

    };


    if (
        opcoes.body
        &&
        !(opcoes.body instanceof FormData)
    ) {

        headers[
            'Content-Type'
        ] =
            'application/json';

    }


    const resposta =
        await fetch(
            `${API_URL}${rota}`,
            {

                ...opcoes,

                headers

            }
        );


    // ========================================================
    // SESSÃO EXPIRADA
    // ========================================================

    if (
        resposta.status === 401
    ) {

        localStorage.removeItem(
            'bm36_token'
        );


        localStorage.removeItem(
            'bm36_usuario'
        );


        window.location.href =
            './index.html';


        throw new Error(
            'Sessão expirada.'
        );

    }


    return resposta;

}


// ============================================================
// INICIAIS
// ============================================================

function gerarIniciais(
    nome
) {

    const partes =
        String(nome || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        partes.length === 0
    ) {

        return 'US';

    }


    if (
        partes.length === 1
    ) {

        return partes[0]
            .slice(0, 2)
            .toUpperCase();

    }


    return (
        partes[0][0]
        +
        partes[
            partes.length - 1
        ][0]
    )
        .toUpperCase();

}


// ============================================================
// FOTO
// ============================================================

function atualizarFoto(
    usuario
) {

    const iniciais =
        gerarIniciais(
            usuario.nome
        );


    fotoIniciais.textContent =
        iniciais;


    // ========================================================
    // TEM FOTO
    // ========================================================

    if (
        usuario.foto_url
        &&
        String(
            usuario.foto_url
        )
            .trim() !== ''
    ) {

        fotoUsuario.src =
            `${BASE_URL}${usuario.foto_url}`;


        fotoUsuario.style.display =
            'block';


        fotoIniciais.style.display =
            'none';


        if (
            btnRemoverFoto
        ) {

            btnRemoverFoto.disabled =
                false;

        }


        return;

    }


    // ========================================================
    // NÃO TEM FOTO
    // ========================================================

    fotoUsuario.removeAttribute(
        'src'
    );


    fotoUsuario.style.display =
        'none';


    fotoIniciais.style.display =
        'flex';


    fotoIniciais.textContent =
        iniciais;


    if (
        btnRemoverFoto
    ) {

        btnRemoverFoto.disabled =
            true;

    }

}


// ============================================================
// LOCAL STORAGE
// ============================================================

function atualizarLocalStorage(
    usuario
) {

    let atual = {};


    try {

        atual =
            JSON.parse(
                localStorage.getItem(
                    'bm36_usuario'
                )
            )
            || {};

    } catch {

        atual = {};

    }


    const atualizado = {

        ...atual,

        id:
            usuario.id !== undefined
                ? usuario.id
                : atual.id,

        nome:
            usuario.nome !== undefined
                ? usuario.nome
                : atual.nome,

        email:
            usuario.email !== undefined
                ? usuario.email
                : atual.email,

        perfil:
            usuario.perfil !== undefined
                ? usuario.perfil
                : atual.perfil,

        /*
            IMPORTANTE:

            Se foto_url vier null,
            salvamos null.

            Não recuperamos a foto antiga.
        */
        foto_url:
            usuario.foto_url !== undefined
                ? usuario.foto_url
                : (
                    atual.foto_url
                    ?? null
                )

    };


    localStorage.setItem(
        'bm36_usuario',
        JSON.stringify(
            atualizado
        )
    );


    // ========================================================
    // AVISA O HEADER
    // ========================================================

    window.dispatchEvent(
        new CustomEvent(
            'bm36-usuario-atualizado',
            {

                detail:
                    atualizado

            }
        )
    );

}


// ============================================================
// CARREGAR PERFIL
// ============================================================

async function carregarPerfil() {

    try {

        const resposta =
            await apiFetch(
                '/me'
            );


        const usuario =
            await resposta.json();


        if (
            !resposta.ok
        ) {

            throw new Error(
                usuario.mensagem
                ||
                'Erro ao carregar perfil.'
            );

        }


        perfilNome.value =
            usuario.nome || '';


        perfilEmail.value =
            usuario.email || '';


        perfilTipo.value =
            String(
                usuario.perfil ||
                ''
            )
                .toUpperCase();


        atualizarFoto(
            usuario
        );


        atualizarLocalStorage(
            usuario
        );


    } catch (erro) {

        console.error(
            erro
        );


        perfilErro.textContent =
            'Não foi possível carregar suas informações.';

    }

}


// ============================================================
// SALVAR PERFIL
// ============================================================

formPerfil.addEventListener(
    'submit',
    async evento => {

        evento.preventDefault();


        perfilErro.textContent =
            '';


        const nome =
            perfilNome.value
                .trim();


        const email =
            perfilEmail.value
                .trim()
                .toLowerCase();


        if (
            !nome ||
            !email
        ) {

            perfilErro.textContent =
                'Nome e e-mail são obrigatórios.';


            return;

        }


        try {

            btnSalvarPerfil.disabled =
                true;


            btnSalvarPerfil.textContent =
                'Salvando...';


            const resposta =
                await apiFetch(
                    '/me',
                    {

                        method:
                            'PUT',

                        body:
                            JSON.stringify(
                                {

                                    nome,

                                    email

                                }
                            )

                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok
            ) {

                perfilErro.textContent =
                    resultado.mensagem
                    ||
                    'Não foi possível salvar as alterações.';


                return;

            }


            atualizarLocalStorage(
                resultado.usuario
            );


            atualizarFoto(
                resultado.usuario
            );


            mostrarToast(
                resultado.mensagem
                ||
                'Perfil atualizado!'
            );


        } catch (erro) {

            console.error(
                erro
            );


            perfilErro.textContent =
                'Não foi possível conectar com o servidor.';


        } finally {

            btnSalvarPerfil.disabled =
                false;


            btnSalvarPerfil.textContent =
                'Salvar alterações';

        }

    }
);


// ============================================================
// TROCAR SENHA
// ============================================================

formSenha.addEventListener(
    'submit',
    async evento => {

        evento.preventDefault();


        senhaErro.textContent =
            '';


        const atual =
            senhaAtual.value;


        const nova =
            novaSenha.value;


        const confirmar =
            confirmarNovaSenha.value;


        if (
            !atual ||
            !nova ||
            !confirmar
        ) {

            senhaErro.textContent =
                'Preencha todos os campos.';


            return;

        }


        if (
            nova.length < 6
        ) {

            senhaErro.textContent =
                'A nova senha precisa ter pelo menos 6 caracteres.';


            return;

        }


        if (
            nova !==
            confirmar
        ) {

            senhaErro.textContent =
                'As novas senhas não são iguais.';


            return;

        }


        try {

            btnAlterarSenha.disabled =
                true;


            btnAlterarSenha.textContent =
                'Alterando...';


            const resposta =
                await apiFetch(
                    '/me/senha',
                    {

                        method:
                            'PUT',

                        body:
                            JSON.stringify(
                                {

                                    senhaAtual:
                                        atual,

                                    novaSenha:
                                        nova

                                }
                            )

                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok
            ) {

                senhaErro.textContent =
                    resultado.mensagem
                    ||
                    'Não foi possível alterar a senha.';


                return;

            }


            formSenha.reset();


            mostrarToast(
                resultado.mensagem
                ||
                'Senha alterada com sucesso!'
            );


        } catch (erro) {

            console.error(
                erro
            );


            senhaErro.textContent =
                'Não foi possível conectar com o servidor.';


        } finally {

            btnAlterarSenha.disabled =
                false;


            btnAlterarSenha.textContent =
                'Alterar senha';

        }

    }
);


// ============================================================
// SELECIONAR FOTO
// ============================================================

inputFoto.addEventListener(
    'change',
    () => {

        const arquivo =
            inputFoto.files[0];


        fotoStatus.textContent =
            '';


        btnEnviarFoto.disabled =
            true;


        if (
            !arquivo
        ) {

            return;

        }


        const tiposPermitidos =
            [

                'image/jpeg',
                'image/png',
                'image/webp'

            ];


        if (
            !tiposPermitidos.includes(
                arquivo.type
            )
        ) {

            fotoStatus.textContent =
                'Formato inválido. Use JPG, PNG ou WEBP.';


            inputFoto.value =
                '';


            return;

        }


        if (
            arquivo.size >
            5 * 1024 * 1024
        ) {

            fotoStatus.textContent =
                'A imagem deve possuir no máximo 5 MB.';


            inputFoto.value =
                '';


            return;

        }


        // ========================================================
        // PREVIEW
        // ========================================================

        const url =
            URL.createObjectURL(
                arquivo
            );


        fotoUsuario.src =
            url;


        fotoUsuario.style.display =
            'block';


        fotoIniciais.style.display =
            'none';


        btnEnviarFoto.disabled =
            false;


        fotoStatus.textContent =
            arquivo.name;

    }
);


// ============================================================
// ENVIAR FOTO
// ============================================================

btnEnviarFoto.addEventListener(
    'click',
    async () => {

        const arquivo =
            inputFoto.files[0];


        if (
            !arquivo
        ) {

            return;

        }


        try {

            btnEnviarFoto.disabled =
                true;


            btnEnviarFoto.textContent =
                'Enviando...';


            fotoStatus.textContent =
                '';


            const formData =
                new FormData();


            formData.append(
                'foto',
                arquivo
            );


            const resposta =
                await apiFetch(
                    '/me/foto',
                    {

                        method:
                            'POST',

                        body:
                            formData

                    }
                );


            const resultado =
                await resposta.json();


            if (
                !resposta.ok
            ) {

                fotoStatus.textContent =
                    resultado.mensagem
                    ||
                    'Não foi possível enviar a foto.';


                return;

            }


            atualizarLocalStorage(
                resultado.usuario
            );


            atualizarFoto(
                resultado.usuario
            );


            inputFoto.value =
                '';


            fotoStatus.textContent =
                'Foto salva com sucesso.';


            mostrarToast(
                resultado.mensagem
                ||
                'Foto atualizada!'
            );


        } catch (erro) {

            console.error(
                erro
            );


            fotoStatus.textContent =
                'Erro ao enviar a foto.';


        } finally {

            btnEnviarFoto.disabled =
                true;


            btnEnviarFoto.textContent =
                'Salvar foto';

        }

    }
);


// ============================================================
// REMOVER FOTO
// ============================================================

if (
    btnRemoverFoto
) {

    btnRemoverFoto.addEventListener(
        'click',
        async () => {

            if (
                btnRemoverFoto.disabled
            ) {

                return;

            }


            const confirmar =
                window.confirm(
                    'Deseja remover sua foto de perfil?'
                );


            if (
                !confirmar
            ) {

                return;

            }


            try {

                btnRemoverFoto.disabled =
                    true;


                btnRemoverFoto.textContent =
                    'Removendo...';


                fotoStatus.textContent =
                    '';


                const resposta =
                    await apiFetch(
                        '/me/foto',
                        {

                            method:
                                'DELETE'

                        }
                    );


                const resultado =
                    await resposta.json();


                if (
                    !resposta.ok
                ) {

                    fotoStatus.textContent =
                        resultado.mensagem
                        ||
                        'Não foi possível remover a foto.';


                    return;

                }


                // ====================================================
                // ATUALIZAR USUÁRIO
                // ====================================================

                atualizarLocalStorage(
                    resultado.usuario
                );


                // ====================================================
                // VOLTAR PARA AS INICIAIS
                // ====================================================

                atualizarFoto(
                    resultado.usuario
                );


                inputFoto.value =
                    '';


                fotoStatus.textContent =
                    'Foto removida.';


                mostrarToast(
                    resultado.mensagem
                    ||
                    'Foto removida com sucesso!'
                );


            } catch (erro) {

                console.error(
                    erro
                );


                fotoStatus.textContent =
                    'Erro ao remover a foto.';


            } finally {

                btnRemoverFoto.textContent =
                    'Remover foto';


                // ====================================================
                // VERIFICAR SE AINDA EXISTE FOTO
                // ====================================================

                let usuarioAtual = {};


                try {

                    usuarioAtual =
                        JSON.parse(
                            localStorage.getItem(
                                'bm36_usuario'
                            )
                        )
                        || {};

                } catch {

                    usuarioAtual =
                        {};

                }


                btnRemoverFoto.disabled =
                    !usuarioAtual.foto_url;

            }

        }
    );

}


// ============================================================
// ERRO DE IMAGEM
// ============================================================

fotoUsuario.addEventListener(
    'error',
    () => {

        fotoUsuario.removeAttribute(
            'src'
        );


        fotoUsuario.style.display =
            'none';


        fotoIniciais.style.display =
            'flex';


        let usuarioAtual = {};


        try {

            usuarioAtual =
                JSON.parse(
                    localStorage.getItem(
                        'bm36_usuario'
                    )
                )
                || {};

        } catch {

            usuarioAtual =
                {};

        }


        fotoIniciais.textContent =
            gerarIniciais(
                usuarioAtual.nome
            );

    }
);


// ============================================================
// MOSTRAR SENHAS
// ============================================================

document
    .querySelectorAll(
        '.mostrar-senha'
    )
    .forEach(
        botao => {

            botao.addEventListener(
                'click',
                () => {

                    const alvo =
                        document.getElementById(
                            botao.dataset.target
                        );


                    if (
                        !alvo
                    ) {

                        return;

                    }


                    const mostrar =
                        alvo.type ===
                        'password';


                    alvo.type =
                        mostrar
                            ? 'text'
                            : 'password';


                    botao.textContent =
                        mostrar
                            ? '🙈'
                            : '👁';

                }
            );

        }
    );


// ============================================================
// TOAST
// ============================================================

function mostrarToast(
    mensagem
) {

    perfilToastTexto.textContent =
        mensagem;


    perfilToast.classList.add(
        'show'
    );


    setTimeout(
        () => {

            perfilToast.classList.remove(
                'show'
            );

        },
        2500
    );

}


// ============================================================
// INICIAR
// ============================================================

carregarPerfil();