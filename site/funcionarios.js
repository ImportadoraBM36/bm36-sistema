// ============================================================
// CONFIG
// ============================================================

const API_URL =
    'http://localhost:3000/api';


// ============================================================
// LOGIN / ADMIN
// ============================================================

const token =
    localStorage.getItem(
        'bm36_token'
    );


const usuarioSalvo =
    localStorage.getItem(
        'bm36_usuario'
    );


let usuarioLogado =
    null;


try {

    usuarioLogado =
        JSON.parse(
            usuarioSalvo
        );

} catch {

    usuarioLogado =
        null;

}


if (
    !token ||
    !usuarioLogado
) {

    window.location.href =
        './index.html';

}


else if (
    String(
        usuarioLogado.perfil || ''
    )
        .toUpperCase()
    !==
    'ADMIN'
) {

    window.location.href =
        './inicio.html';

}


// ============================================================
// ELEMENTOS
// ============================================================

const btnNovoFuncionario =
    document.getElementById(
        'btnNovoFuncionario'
    );


const modalFuncionario =
    document.getElementById(
        'modalFuncionario'
    );


const btnFecharFuncionario =
    document.getElementById(
        'btnFecharFuncionario'
    );


const btnCancelarFuncionario =
    document.getElementById(
        'btnCancelarFuncionario'
    );


const formFuncionario =
    document.getElementById(
        'formFuncionario'
    );


const funcionarioNome =
    document.getElementById(
        'funcionarioNome'
    );


const funcionarioEmail =
    document.getElementById(
        'funcionarioEmail'
    );


const funcionarioPerfil =
    document.getElementById(
        'funcionarioPerfil'
    );


const funcionarioSenha =
    document.getElementById(
        'funcionarioSenha'
    );


const funcionarioConfirmarSenha =
    document.getElementById(
        'funcionarioConfirmarSenha'
    );


const statusFuncionario =
    document.getElementById(
        'statusFuncionario'
    );


const statusFuncionarioTexto =
    document.getElementById(
        'statusFuncionarioTexto'
    );


const mostrarSenhaFuncionario =
    document.getElementById(
        'mostrarSenhaFuncionario'
    );


const funcionarioErro =
    document.getElementById(
        'funcionarioErro'
    );


const modalFuncionarioTitulo =
    document.getElementById(
        'modalFuncionarioTitulo'
    );


const btnSalvarFuncionario =
    document.getElementById(
        'btnSalvarFuncionario'
    );


const funcionariosBody =
    document.getElementById(
        'funcionariosBody'
    );


const buscaFuncionario =
    document.getElementById(
        'buscaFuncionario'
    );


const filtros =
    document.querySelectorAll(
        '.filtro-funcionario'
    );


const totalFuncionarios =
    document.getElementById(
        'totalFuncionarios'
    );


const totalAtivos =
    document.getElementById(
        'totalAtivos'
    );


const totalAdmins =
    document.getElementById(
        'totalAdmins'
    );


const contadorFuncionarios =
    document.getElementById(
        'contadorFuncionarios'
    );


const paginaAnteriorFuncionario =
    document.getElementById(
        'paginaAnteriorFuncionario'
    );


const proximaPaginaFuncionario =
    document.getElementById(
        'proximaPaginaFuncionario'
    );


const paginasFuncionarios =
    document.getElementById(
        'paginasFuncionarios'
    );


const toastFuncionario =
    document.getElementById(
        'toastFuncionario'
    );


const toastFuncionarioTexto =
    document.getElementById(
        'toastFuncionarioTexto'
    );


// ============================================================
// ESTADO
// ============================================================

let funcionarios =
    [];


let funcionariosFiltrados =
    [];


let funcionarioEditandoId =
    null;


let filtroAtual =
    'todos';


let paginaAtual =
    1;


const itensPorPagina =
    10;


// ============================================================
// REQUEST COM TOKEN
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


    // TOKEN EXPIRADO

    if (
        resposta.status ===
        401
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
// ESCAPAR HTML
// ============================================================

function escaparHTML(
    valor
) {

    return String(
        valor ?? ''
    )
        .replaceAll(
            '&',
            '&amp;'
        )
        .replaceAll(
            '<',
            '&lt;'
        )
        .replaceAll(
            '>',
            '&gt;'
        )
        .replaceAll(
            '"',
            '&quot;'
        )
        .replaceAll(
            "'",
            '&#039;'
        );

}


// ============================================================
// INICIAIS
// ============================================================

function iniciais(
    nome
) {

    const partes =
        String(nome || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    if (
        partes.length ===
        0
    ) {

        return 'US';

    }


    if (
        partes.length ===
        1
    ) {

        return partes[0]
            .substring(0, 2)
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
// DATA
// ============================================================

function formatarData(
    valor
) {

    if (!valor) {

        return '-';

    }


    const data =
        new Date(valor);


    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return '-';

    }


    return data
        .toLocaleDateString(
            'pt-BR'
        );

}


// ============================================================
// CARREGAR
// ============================================================

async function carregarFuncionarios() {

    try {

        funcionariosBody.innerHTML = `

            <tr>

                <td colspan="6">

                    Carregando funcionários...

                </td>

            </tr>

        `;


        const resposta =
            await apiFetch(
                '/usuarios'
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.mensagem
                ||
                'Erro ao carregar funcionários.'
            );

        }


        funcionarios =
            Array.isArray(resultado)
                ? resultado
                : [];


        atualizarResumo();


        aplicarFiltros();


    } catch (erro) {

        console.error(
            erro
        );


        funcionariosBody.innerHTML = `

            <tr>

                <td colspan="6">

                    Não foi possível carregar os funcionários.

                </td>

            </tr>

        `;

    }

}


// ============================================================
// RESUMO
// ============================================================

function atualizarResumo() {

    totalFuncionarios.textContent =
        funcionarios.length;


    totalAtivos.textContent =
        funcionarios.filter(
            f =>
                f.ativo === true
        ).length;


    totalAdmins.textContent =
        funcionarios.filter(
            f =>
                String(
                    f.perfil
                )
                    .toUpperCase()
                ===
                'ADMIN'
        ).length;

}


// ============================================================
// FILTROS
// ============================================================

function aplicarFiltros() {

    const busca =
        buscaFuncionario.value
            .trim()
            .toLowerCase();


    funcionariosFiltrados =
        funcionarios.filter(
            funcionario => {

                const nome =
                    String(
                        funcionario.nome ||
                        ''
                    )
                        .toLowerCase();


                const email =
                    String(
                        funcionario.email ||
                        ''
                    )
                        .toLowerCase();


                const perfil =
                    String(
                        funcionario.perfil ||
                        ''
                    )
                        .toUpperCase();


                let passouFiltro =
                    true;


                if (
                    filtroAtual ===
                    'ativos'
                ) {

                    passouFiltro =
                        funcionario.ativo ===
                        true;

                }


                else if (
                    filtroAtual ===
                    'inativos'
                ) {

                    passouFiltro =
                        funcionario.ativo ===
                        false;

                }


                else if (
                    filtroAtual ===
                    'admins'
                ) {

                    passouFiltro =
                        perfil ===
                        'ADMIN';

                }


                const passouBusca =

                    !busca

                    ||

                    nome.includes(
                        busca
                    )

                    ||

                    email.includes(
                        busca
                    );


                return (
                    passouFiltro &&
                    passouBusca
                );

            }
        );


    paginaAtual =
        1;


    renderizarFuncionarios();

}


// ============================================================
// BUSCA
// ============================================================

buscaFuncionario.addEventListener(
    'input',
    aplicarFiltros
);


// ============================================================
// BOTÕES FILTRO
// ============================================================

filtros.forEach(
    botao => {

        botao.addEventListener(
            'click',
            () => {

                filtros.forEach(
                    b =>
                        b.classList.remove(
                            'ativo'
                        )
                );


                botao.classList.add(
                    'ativo'
                );


                filtroAtual =
                    botao.dataset.filtro;


                aplicarFiltros();

            }
        );

    }
);


// ============================================================
// RENDER
// ============================================================

function renderizarFuncionarios() {

    funcionariosBody.innerHTML =
        '';


    const inicio =
        (
            paginaAtual -
            1
        )
        *
        itensPorPagina;


    const fim =
        inicio +
        itensPorPagina;


    const pagina =
        funcionariosFiltrados.slice(
            inicio,
            fim
        );


    if (
        pagina.length ===
        0
    ) {

        funcionariosBody.innerHTML = `

            <tr>

                <td colspan="6">

                    Nenhum funcionário encontrado.

                </td>

            </tr>

        `;


        atualizarPaginacao();

        return;

    }


    pagina.forEach(
        funcionario => {

            const perfil =
                String(
                    funcionario.perfil ||
                    ''
                )
                    .toUpperCase();


            const tr =
                document.createElement(
                    'tr'
                );


            tr.innerHTML = `

                <td>

                    <div class="funcionario-info">

                        <div class="funcionario-avatar">

                            ${iniciais(
                                funcionario.nome
                            )}

                        </div>


                        <div class="funcionario-nome">

                            ${escaparHTML(
                                funcionario.nome
                            )}

                        </div>

                    </div>

                </td>


                <td>

                    ${escaparHTML(
                        funcionario.email
                    )}

                </td>


                <td>

                    <span
                        class="
                            perfil-badge
                            ${
                                perfil ===
                                'ADMIN'

                                    ? 'admin'
                                    : 'vendedor'
                            }
                        "
                    >

                        ${
                            perfil ===
                            'ADMIN'

                                ? 'ADMIN'
                                : 'VENDEDOR'
                        }

                    </span>

                </td>


                <td>

                    <span
                        class="
                            status-badge
                            ${
                                funcionario.ativo

                                    ? 'ativo'
                                    : 'inativo'
                            }
                        "
                    >

                        ${
                            funcionario.ativo

                                ? 'ATIVO'
                                : 'INATIVO'
                        }

                    </span>

                </td>


                <td>

                    ${formatarData(
                        funcionario.criado_em
                    )}

                </td>


                <td>

                    <button
                        type="button"
                        class="btn-editar-funcionario"
                        data-id="${funcionario.id}"
                    >

                        EDITAR

                    </button>

                </td>

            `;


            funcionariosBody.appendChild(
                tr
            );

        }
    );


    atualizarPaginacao();

}


// ============================================================
// PAGINAÇÃO
// ============================================================

function atualizarPaginacao() {

    const total =
        funcionariosFiltrados.length;


    const totalPaginas =
        Math.max(
            1,

            Math.ceil(
                total /
                itensPorPagina
            )
        );


    if (
        paginaAtual >
        totalPaginas
    ) {

        paginaAtual =
            totalPaginas;

    }


    if (
        total === 0
    ) {

        contadorFuncionarios.textContent =
            'Nenhum funcionário';

    } else {

        const inicio =
            (
                paginaAtual -
                1
            )
            *
            itensPorPagina
            +
            1;


        const fim =
            Math.min(
                paginaAtual *
                itensPorPagina,

                total
            );


        contadorFuncionarios.textContent =
            `Mostrando ${inicio}-${fim} de ${total} funcionários`;

    }


    paginaAnteriorFuncionario.disabled =
        paginaAtual <=
        1;


    proximaPaginaFuncionario.disabled =
        paginaAtual >=
        totalPaginas;


    paginasFuncionarios.innerHTML =
        '';


    for (
        let pagina = 1;
        pagina <= totalPaginas;
        pagina++
    ) {

        const btn =
            document.createElement(
                'button'
            );


        btn.type =
            'button';


        btn.textContent =
            pagina;


        if (
            pagina ===
            paginaAtual
        ) {

            btn.classList.add(
                'active'
            );

        }


        btn.addEventListener(
            'click',
            () => {

                paginaAtual =
                    pagina;


                renderizarFuncionarios();

            }
        );


        paginasFuncionarios
            .appendChild(
                btn
            );

    }

}


paginaAnteriorFuncionario
    .addEventListener(
        'click',
        () => {

            if (
                paginaAtual >
                1
            ) {

                paginaAtual--;


                renderizarFuncionarios();

            }

        }
    );


proximaPaginaFuncionario
    .addEventListener(
        'click',
        () => {

            const totalPaginas =
                Math.ceil(
                    funcionariosFiltrados.length /
                    itensPorPagina
                );


            if (
                paginaAtual <
                totalPaginas
            ) {

                paginaAtual++;


                renderizarFuncionarios();

            }

        }
    );


// ============================================================
// MODAL
// ============================================================

function abrirModalFuncionario() {

    modalFuncionario.classList.add(
        'aberto'
    );


    document.body.style.overflow =
        'hidden';


    setTimeout(
        () => {

            funcionarioNome.focus();

        },
        150
    );

}


function fecharModalFuncionario() {

    modalFuncionario.classList.remove(
        'aberto'
    );


    document.body.style.overflow =
        '';


    resetarFormulario();

}


// ============================================================
// NOVO
// ============================================================

btnNovoFuncionario.addEventListener(
    'click',
    () => {

        resetarFormulario();


        funcionarioEditandoId =
            null;


        modalFuncionarioTitulo.textContent =
            'Novo Funcionário';


        btnSalvarFuncionario.textContent =
            'SALVAR FUNCIONÁRIO';


        funcionarioSenha.required =
            true;


        funcionarioConfirmarSenha.required =
            true;


        abrirModalFuncionario();

    }
);


// ============================================================
// EDITAR
// ============================================================

funcionariosBody.addEventListener(
    'click',
    evento => {

        const btn =
            evento.target.closest(
                '.btn-editar-funcionario'
            );


        if (!btn) {

            return;

        }


        const id =
            Number(
                btn.dataset.id
            );


        const funcionario =
            funcionarios.find(
                f =>
                    Number(f.id) ===
                    id
            );


        if (!funcionario) {

            return;

        }


        funcionarioEditandoId =
            funcionario.id;


        funcionarioNome.value =
            funcionario.nome || '';


        funcionarioEmail.value =
            funcionario.email || '';


        funcionarioPerfil.value =
            String(
                funcionario.perfil ||
                'VENDEDOR'
            )
                .toUpperCase();


        funcionarioSenha.value =
            '';


        funcionarioConfirmarSenha.value =
            '';


        funcionarioSenha.required =
            false;


        funcionarioConfirmarSenha.required =
            false;


        if (
            funcionario.ativo
        ) {

            statusFuncionario
                .classList
                .add('on');


            statusFuncionarioTexto
                .textContent =
                'Ativo';

        } else {

            statusFuncionario
                .classList
                .remove('on');


            statusFuncionarioTexto
                .textContent =
                'Inativo';

        }


        modalFuncionarioTitulo.textContent =
            `Editar ${funcionario.nome}`;


        btnSalvarFuncionario.textContent =
            'SALVAR ALTERAÇÕES';


        abrirModalFuncionario();

    }
);


// ============================================================
// FECHAR
// ============================================================

btnFecharFuncionario.addEventListener(
    'click',
    fecharModalFuncionario
);


btnCancelarFuncionario.addEventListener(
    'click',
    fecharModalFuncionario
);


modalFuncionario.addEventListener(
    'click',
    evento => {

        if (
            evento.target ===
            modalFuncionario
        ) {

            fecharModalFuncionario();

        }

    }
);


document.addEventListener(
    'keydown',
    evento => {

        if (
            evento.key ===
            'Escape'
        ) {

            fecharModalFuncionario();

        }

    }
);


// ============================================================
// STATUS
// ============================================================

statusFuncionario.addEventListener(
    'click',
    () => {

        const ativo =
            statusFuncionario
                .classList
                .toggle('on');


        statusFuncionarioTexto.textContent =
            ativo
                ? 'Ativo'
                : 'Inativo';

    }
);


// ============================================================
// MOSTRAR SENHA
// ============================================================

mostrarSenhaFuncionario.addEventListener(
    'click',
    () => {

        const mostrar =
            funcionarioSenha.type ===
            'password';


        funcionarioSenha.type =
            mostrar
                ? 'text'
                : 'password';


        funcionarioConfirmarSenha.type =
            mostrar
                ? 'text'
                : 'password';


        mostrarSenhaFuncionario.textContent =
            mostrar
                ? '🙈'
                : '👁';

    }
);


// ============================================================
// RESET
// ============================================================

function resetarFormulario() {

    formFuncionario.reset();


    funcionarioEditandoId =
        null;


    funcionarioPerfil.value =
        'VENDEDOR';


    statusFuncionario
        .classList
        .add('on');


    statusFuncionarioTexto.textContent =
        'Ativo';


    funcionarioErro.textContent =
        '';


    funcionarioSenha.type =
        'password';


    funcionarioConfirmarSenha.type =
        'password';


    mostrarSenhaFuncionario.textContent =
        '👁';

}


// ============================================================
// SALVAR
// ============================================================

formFuncionario.addEventListener(
    'submit',
    async evento => {

        evento.preventDefault();


        funcionarioErro.textContent =
            '';


        const nome =
            funcionarioNome.value
                .trim();


        const email =
            funcionarioEmail.value
                .trim()
                .toLowerCase();


        const senha =
            funcionarioSenha.value;


        const confirmarSenha =
            funcionarioConfirmarSenha.value;


        const perfil =
            funcionarioPerfil.value;


        const ativo =
            statusFuncionario
                .classList
                .contains('on');


        // ====================================================
        // VALIDAÇÕES
        // ====================================================

        if (
            !nome ||
            !email
        ) {

            funcionarioErro.textContent =
                'Informe o nome e o e-mail.';

            return;

        }


        if (
            !funcionarioEditandoId
            &&
            !senha
        ) {

            funcionarioErro.textContent =
                'Informe uma senha inicial.';

            return;

        }


        if (
            senha &&
            senha.length < 6
        ) {

            funcionarioErro.textContent =
                'A senha precisa ter pelo menos 6 caracteres.';

            return;

        }


        if (
            senha !==
            confirmarSenha
        ) {

            funcionarioErro.textContent =
                'As senhas não são iguais.';

            return;

        }


        // ====================================================
        // PAYLOAD
        // ====================================================

        const dados = {

            nome,

            email,

            perfil,

            ativo

        };


        if (senha) {

            dados.senha =
                senha;

        }


        const editando =
            funcionarioEditandoId !==
            null;


        const rota =
            editando

                ? `/usuarios/${funcionarioEditandoId}`

                : '/usuarios';


        const metodo =
            editando
                ? 'PUT'
                : 'POST';


        try {

            btnSalvarFuncionario.disabled =
                true;


            btnSalvarFuncionario.textContent =
                editando

                    ? 'SALVANDO...'

                    : 'CADASTRANDO...';


            const resposta =
                await apiFetch(
                    rota,
                    {

                        method:
                            metodo,

                        body:
                            JSON.stringify(
                                dados
                            )

                    }
                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                funcionarioErro.textContent =
                    resultado.mensagem
                    ||
                    'Não foi possível salvar o funcionário.';


                return;

            }


            fecharModalFuncionario();


            mostrarToast(
                resultado.mensagem
                ||
                (
                    editando

                        ? 'Funcionário alterado com sucesso!'

                        : 'Funcionário cadastrado com sucesso!'
                )
            );


            await carregarFuncionarios();


        } catch (erro) {

            console.error(
                erro
            );


            funcionarioErro.textContent =
                'Não foi possível conectar com o servidor.';


        } finally {

            btnSalvarFuncionario.disabled =
                false;


            btnSalvarFuncionario.textContent =
                funcionarioEditandoId

                    ? 'SALVAR ALTERAÇÕES'

                    : 'SALVAR FUNCIONÁRIO';

        }

    }
);


// ============================================================
// TOAST
// ============================================================

function mostrarToast(
    mensagem
) {

    toastFuncionarioTexto.textContent =
        mensagem;


    toastFuncionario.classList.add(
        'show'
    );


    setTimeout(
        () => {

            toastFuncionario.classList.remove(
                'show'
            );

        },
        2500
    );

}


// ============================================================
// INICIAR
// ============================================================

carregarFuncionarios();