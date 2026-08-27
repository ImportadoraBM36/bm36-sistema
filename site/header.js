document.addEventListener(
    'DOMContentLoaded',
    () => {

        // ====================================================
        // ELEMENTOS PRINCIPAIS
        // ====================================================

        const header =
            document.querySelector('.topbar');

        const menuToggle =
            document.querySelector('.menu-toggle');

        const menu =
            document.querySelector('.mainnav');

        const avatar =
            document.getElementById('avatarInitials');

        const topbarRight =
            document.querySelector('.topbar-right');


        if (!header) {
            return;
        }


        // ====================================================
        // LOGIN
        // ====================================================

        const token =
            localStorage.getItem('bm36_token');

        const usuarioSalvo =
            localStorage.getItem('bm36_usuario');


        /*
            Qualquer página que carregue header.js
            será considerada uma página interna.

            Sem login:
            volta para index.html.
        */

        if (
            !token ||
            !usuarioSalvo
        ) {

         window.location.href = '../index.html';

            return;
        }


        let usuario;


        try {

            usuario =
                JSON.parse(usuarioSalvo);

        } catch (erro) {

            console.error(
                'Usuário salvo inválido:',
                erro
            );


            localStorage.removeItem(
                'bm36_token'
            );

            localStorage.removeItem(
                'bm36_usuario'
            );


           window.location.href = '../index.html';

            return;
        }


        // ====================================================
        // INICIAIS
        // ====================================================

        function gerarIniciais(nome) {

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


       // ====================================================
// AVATAR / FOTO DO USUÁRIO
// ====================================================

const API_BASE_URL =
    'https://bm36-sistema-production.up.railway.app';


function atualizarAvatarUsuario(
    dadosUsuario
) {

    if (!avatar) {
        return;
    }


    avatar.innerHTML = '';


    avatar.title =
        dadosUsuario.nome ||
        'Minha conta';


    // ====================================================
    // SE TIVER FOTO
    // ====================================================

    if (
        dadosUsuario.foto_url
    ) {

        const img =
            document.createElement(
                'img'
            );


        img.src =
            `${API_BASE_URL}${dadosUsuario.foto_url}`;


        img.alt =
            dadosUsuario.nome ||
            'Foto de perfil';


        img.className =
            'avatar-foto';


        avatar.appendChild(
            img
        );


        return;
    }


    // ====================================================
    // SE NÃO TIVER FOTO
    // ====================================================

    avatar.textContent =
        gerarIniciais(
            dadosUsuario.nome
        );
}


atualizarAvatarUsuario(
    usuario
);

        // ====================================================
        // TEMA
        // ====================================================

        /*
            IMPORTANTE:

            O seu CSS usa:

            html.dark-mode

            Então a classe TEM que ficar no <html>
            e não no <body>.
        */

        const html =
            document.documentElement;


        // ====================================================
        // LOCALIZAR OU CRIAR BOTÃO DE TEMA
        // ====================================================

        let themeToggle =
            document.getElementById(
                'themeToggle'
            );


        /*
            Algumas páginas podem ter o botão
            no HTML e outras não.

            Se não existir, o próprio header.js
            cria automaticamente.
        */

        if (
            !themeToggle &&
            topbarRight
        ) {

            themeToggle =
                document.createElement(
                    'button'
                );


            themeToggle.id =
                'themeToggle';


            themeToggle.className =
                'theme-toggle';


            themeToggle.type =
                'button';


            themeToggle.title =
                'Alternar tema';


            themeToggle.setAttribute(
                'aria-label',
                'Alternar tema'
            );


            /*
                Coloca antes do avatar.
            */

            if (avatar) {

                topbarRight.insertBefore(
                    themeToggle,
                    avatar
                );

            } else {

                topbarRight.prepend(
                    themeToggle
                );
            }
        }


        // ====================================================
        // CARREGAR TEMA SALVO
        // ====================================================

        const temaSalvo =
            localStorage.getItem(
                'bm36_theme'
            );


        if (
            temaSalvo === 'dark'
        ) {

            html.classList.add(
                'dark-mode'
            );

        } else {

            html.classList.remove(
                'dark-mode'
            );
        }


        // ====================================================
        // ÍCONE DO TEMA
        // ====================================================
function atualizarIconeTema() {

    if (!themeToggle) {
        return;
    }

    const estaEscuro =
        html.classList.contains(
            'dark-mode'
        );

    /*
        MODO ESCURO:
        mostra o sol porque o clique
        vai voltar para o modo claro.

        MODO CLARO:
        mostra a lua porque o clique
        vai ativar o modo escuro.
    */

    themeToggle.textContent =
        estaEscuro
            ? '☀️'
            : '🌙';


    themeToggle.title =
        estaEscuro
            ? 'Usar modo claro'
            : 'Usar modo escuro';


    themeToggle.setAttribute(
        'aria-label',
        estaEscuro
            ? 'Usar modo claro'
            : 'Usar modo escuro'
    );
}
        // ====================================================
        // ALTERAR TEMA
        // ====================================================

        if (themeToggle) {

            themeToggle.addEventListener(
                'click',
                () => {

                    /*
                        Ativa as animações que já
                        existem no header.css.
                    */

                    html.classList.add(
                        'theme-transition'
                    );


                    themeToggle.classList.add(
                        'theme-changing'
                    );


                    /*
                        Pequeno atraso proposital.

                        Isso deixa a mudança de cores
                        perceptível, como você queria.
                    */

                    setTimeout(
                        () => {

                            html.classList.toggle(
                                'dark-mode'
                            );


                            const estaEscuro =
                                html.classList.contains(
                                    'dark-mode'
                                );


                            localStorage.setItem(
                                'bm36_theme',
                                estaEscuro
                                    ? 'dark'
                                    : 'light'
                            );


                            atualizarIconeTema();

                        },
                        90
                    );


                    /*
                        Remove as classes de animação
                        depois da transição.
                    */

                    setTimeout(
                        () => {

                            html.classList.remove(
                                'theme-transition'
                            );


                            themeToggle
                                .classList
                                .remove(
                                    'theme-changing'
                                );

                        },
                        1000
                    );

                }
            );
        }


        // ====================================================
        // MENU DO USUÁRIO
        // ====================================================

        if (
            topbarRight &&
            avatar
        ) {

            /*
                Evita criar o menu duas vezes
                caso o script seja executado novamente.
            */

            if (
                !avatar.closest(
                    '.user-menu-wrapper'
                )
            ) {

                const wrapper =
                    document.createElement(
                        'div'
                    );


                wrapper.className =
                    'user-menu-wrapper';


                /*
                    Coloca wrapper exatamente onde
                    estava o avatar.
                */

                avatar.parentNode.insertBefore(
                    wrapper,
                    avatar
                );


                wrapper.appendChild(
                    avatar
                );


                // ============================================
                // DROPDOWN
                // ============================================

                const dropdown =
                    document.createElement(
                        'div'
                    );


                dropdown.className =
                    'user-dropdown';


                const perfil =
                    String(
                        usuario.perfil || ''
                    )
                        .toUpperCase();


                const ehAdmin =
                    perfil === 'ADMIN';


          dropdown.innerHTML = `

    <div class="user-dropdown-header">

        <div
            class="user-dropdown-avatar"
            id="dropdownAvatar"
        >
            ${gerarIniciais(usuario.nome)}
        </div>


        <div class="user-dropdown-info">

            <strong>
                ${escaparHTML(
                    usuario.nome ||
                    'Usuário'
                )}
            </strong>


            <span>
                ${escaparHTML(
                    usuario.email ||
                    ''
                )}
            </span>


            <small>
                ${
                    ehAdmin
                        ? 'Administrador'
                        : 'Vendedor'
                }
            </small>

        </div>

    </div>


    <div class="user-dropdown-divider"></div>


    <a
        href="./perfil.html"
        class="user-dropdown-item"
    >

        <span>
            👤
        </span>

        Minha conta

    </a>

        ${
        ehAdmin
            ? `

                
                    href="./mandarArquivos.html"
                    class="user-dropdown-item admin-item"
                >

                    <span>
                        📤
                    </span>

                    Enviar arquivos

                </a>
            `
            : ''
    }


    ${
        ehAdmin
            ? `

                
                    href="./mandarArquivosClientes.html"
                    class="user-dropdown-item admin-item"
                >

                    <span>
                        📥
                    </span>

                    Importar clientes

                </a>
            `
            : ''
    }


    ${
        ehAdmin
            ? `

                
                    href="./funcionarios.html"
                    class="user-dropdown-item admin-item"
                >

                    <span>
                        👥
                    </span>

                    Funcionários

                </a>

            `
            : ''
    }


    <button
        type="button"
        class="user-dropdown-item evento-menu-item"
        id="eventoMenuBtn"
    >

        <span>
            🎪
        </span>

        <div class="evento-menu-texto">

            <strong>
                Evento
            </strong>

            <small id="eventoAtualTexto">
                Carregando...
            </small>

        </div>

    </button>


    <div
        class="evento-dropdown-area"
        id="eventoDropdownArea"
        style="display:none;"
    >

        <div
            class="evento-opcoes"
            id="eventoOpcoes"
        >
            Carregando eventos...
        </div>

    </div>


    <div class="user-dropdown-divider"></div>


    <button
        type="button"
        class="user-dropdown-item logout-item"
        id="logoutBtn"
    >

        <span>
            ↪
        </span>

        Sair

    </button>

`;


                wrapper.appendChild(
                    dropdown
                );
// ====================================================
// EVENTO ATIVO DO USUÁRIO
// ====================================================

const eventoMenuBtn =
    dropdown.querySelector(
        '#eventoMenuBtn'
    );

const eventoDropdownArea =
    dropdown.querySelector(
        '#eventoDropdownArea'
    );

const eventoAtualTexto =
    dropdown.querySelector(
        '#eventoAtualTexto'
    );

const eventoOpcoes =
    dropdown.querySelector(
        '#eventoOpcoes'
    );


async function carregarEventoAtual() {

    try {

        const resposta =
            await fetch(
                `${API_BASE_URL}/api/me`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!resposta.ok) {

            eventoAtualTexto.textContent =
                'Não foi possível carregar';

            return;

        }


        const dados =
            await resposta.json();


        usuario =
            {
                ...usuario,
                ...dados
            };


        localStorage.setItem(
            'bm36_usuario',
            JSON.stringify(usuario)
        );


        if (
            dados.evento_ativo_id
            &&
            dados.evento_ativo_nome
        ) {

            eventoAtualTexto.textContent =
                dados.evento_ativo_nome;

        } else {

            eventoAtualTexto.textContent =
                'Venda normal';

        }


    } catch (erro) {

        console.error(
            'Erro ao carregar evento atual:',
            erro
        );


        eventoAtualTexto.textContent =
            'Venda normal';

    }

}


async function carregarEventosDisponiveis() {

    eventoOpcoes.innerHTML =
        'Carregando eventos...';


    try {

        const resposta =
            await fetch(
                `${API_BASE_URL}/api/eventos`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        if (!resposta.ok) {

            eventoOpcoes.innerHTML =
                'Não foi possível carregar os eventos.';

            return;

        }


        const eventos =
            await resposta.json();


        const eventosAtivos =
            eventos.filter(
                evento =>
                    String(
                        evento.status || ''
                    )
                        .toUpperCase()
                    ===
                    'ATIVO'
            );


        let html =
            `

            <button
                type="button"
                class="evento-opcao ${
                    !usuario.evento_ativo_id
                        ? 'selecionado'
                        : ''
                }"
                data-evento-id=""
            >
                <span>
                    🛒
                </span>

                <div>
                    <strong>
                        Venda normal
                    </strong>

                    <small>
                        Sem evento
                    </small>
                </div>
            </button>

            `;


        eventosAtivos.forEach(
            evento => {

                const selecionado =
                    Number(
                        usuario.evento_ativo_id
                    )
                    ===
                    Number(
                        evento.id
                    );


                html += `

                    <button
                        type="button"
                        class="evento-opcao ${
                            selecionado
                                ? 'selecionado'
                                : ''
                        }"
                        data-evento-id="${evento.id}"
                    >

                        <span>
                            🎪
                        </span>

                        <div>

                            <strong>
                                ${escaparHTML(
                                    evento.nome
                                )}
                            </strong>

                            <small>
                                Evento ativo
                            </small>

                        </div>

                    </button>

                `;

            }
        );


        if (
            eventosAtivos.length === 0
        ) {

            html += `

                <div class="evento-sem-opcoes">
                    Nenhum evento ativo no momento.
                </div>

            `;

        }


        eventoOpcoes.innerHTML =
            html;


        eventoOpcoes
            .querySelectorAll(
                '.evento-opcao'
            )
            .forEach(
                botao => {

                    botao.addEventListener(
                        'click',
                        async eventoClique => {

                            eventoClique.stopPropagation();


                            const eventoId =
                                botao.dataset.eventoId;


                            if (!eventoId) {

                                await sairDoEvento();

                            } else {

                                await entrarNoEvento(
                                    Number(eventoId)
                                );

                            }

                        }
                    );

                }
            );


    } catch (erro) {

        console.error(
            'Erro ao listar eventos:',
            erro
        );


        eventoOpcoes.innerHTML =
            'Erro ao carregar eventos.';

    }

}


async function entrarNoEvento(
    eventoId
) {

    try {

        const resposta =
            await fetch(
                `${API_BASE_URL}/api/me/evento`,
                {
                    method:
                        'PATCH',

                    headers: {

                        'Content-Type':
                            'application/json',

                        Authorization:
                            `Bearer ${token}`

                    },

                    body:
                        JSON.stringify({
                            evento_id:
                                eventoId
                        })

                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                resultado.mensagem
                ||
                'Não foi possível entrar no evento.'
            );

            return;

        }


        usuario.evento_ativo_id =
            resultado.evento.id;

        usuario.evento_ativo_nome =
            resultado.evento.nome;

        usuario.evento_ativo_status =
            resultado.evento.status;


        localStorage.setItem(
            'bm36_usuario',
            JSON.stringify(usuario)
        );


        eventoAtualTexto.textContent =
            resultado.evento.nome;


        eventoDropdownArea.style.display =
            'none';


        alert(
            `Você entrou no evento "${resultado.evento.nome}".`
        );


    } catch (erro) {

        console.error(
            'Erro ao entrar no evento:',
            erro
        );


        alert(
            'Erro ao entrar no evento.'
        );

    }

}


async function sairDoEvento() {

    try {

        const resposta =
            await fetch(
                `${API_BASE_URL}/api/me/evento`,
                {
                    method:
                        'DELETE',

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            alert(
                resultado.mensagem
                ||
                'Não foi possível sair do evento.'
            );

            return;

        }


        usuario.evento_ativo_id =
            null;

        usuario.evento_ativo_nome =
            null;

        usuario.evento_ativo_status =
            null;


        localStorage.setItem(
            'bm36_usuario',
            JSON.stringify(usuario)
        );


        eventoAtualTexto.textContent =
            'Venda normal';


        eventoDropdownArea.style.display =
            'none';


        alert(
            'Você voltou para venda normal.'
        );


    } catch (erro) {

        console.error(
            'Erro ao sair do evento:',
            erro
        );


        alert(
            'Erro ao sair do evento.'
        );

    }

}


if (eventoMenuBtn) {

    eventoMenuBtn.addEventListener(
        'click',
        async eventoClique => {

            eventoClique.stopPropagation();


            const estaAberto =
                eventoDropdownArea
                    .style
                    .display
                !==
                'none';


            eventoDropdownArea.style.display =
                estaAberto
                    ? 'none'
                    : 'block';


            if (!estaAberto) {

                await carregarEventosDisponiveis();

            }

        }
    );

}


carregarEventoAtual();

                // ============================================
                // ABRIR MENU
                // ============================================

                avatar.addEventListener(
                    'click',
                    evento => {

                        evento.stopPropagation();


                        dropdown.classList.toggle(
                            'show'
                        );
                    }
                );


                // ============================================
                // FECHAR CLICANDO FORA
                // ============================================

                document.addEventListener(
                    'click',
                    evento => {

                        if (
                            !wrapper.contains(
                                evento.target
                            )
                        ) {

                            dropdown.classList.remove(
                                'show'
                            );
                        }

                    }
                );


                // ============================================
                // ESC
                // ============================================

                document.addEventListener(
                    'keydown',
                    evento => {

                        if (
                            evento.key ===
                            'Escape'
                        ) {

                            dropdown.classList.remove(
                                'show'
                            );
                        }

                    }
                );


                // ============================================
                // LOGOUT
                // ============================================

                const logoutBtn =
                    dropdown.querySelector(
                        '#logoutBtn'
                    );


                if (logoutBtn) {

                    logoutBtn.addEventListener(
                        'click',
                        () => {

                            localStorage.removeItem(
                                'bm36_token'
                            );


                            localStorage.removeItem(
                                'bm36_usuario'
                            );


                            /*
                                Não removemos bm36_theme.

                                Assim o usuário mantém
                                a preferência claro/escuro
                                mesmo depois de sair.
                            */


                          window.location.href = '../index.html';
                        }
                    );
                }
            }
        }


        // ====================================================
        // ESCAPAR HTML
        // ====================================================

        function escaparHTML(valor) {

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


        // ====================================================
        // HEADER ESCONDER AO ROLAR
        // ====================================================

        let ultimoScroll =
            window.scrollY;


        const limiteTopo =
            80;


        window.addEventListener(
            'scroll',
            () => {

                const scrollAtual =
                    window.scrollY;


                /*
                    Perto do topo:
                    sempre mostrar.
                */

                if (
                    scrollAtual <=
                    limiteTopo
                ) {

                    header.classList.remove(
                        'header-escondido'
                    );


                    ultimoScroll =
                        scrollAtual;


                    return;
                }


                /*
                    Descendo.
                */

                if (
                    scrollAtual >
                    ultimoScroll
                ) {

                    header.classList.add(
                        'header-escondido'
                    );
                }


                /*
                    Subindo.
                */

                else if (
                    scrollAtual <
                    ultimoScroll
                ) {

                    header.classList.remove(
                        'header-escondido'
                    );
                }


                ultimoScroll =
                    scrollAtual;
            }
        );


        // ====================================================
        // MENU MOBILE
        // ====================================================

        if (
            menuToggle &&
            menu
        ) {

            menuToggle.addEventListener(
                'click',
                () => {

                    const menuAberto =
                        menu.classList.toggle(
                        'open'
                    );


                    menuToggle.setAttribute(
                        'aria-expanded',
                        String(menuAberto)
                    );


                    /*
                        Se abrir o menu mobile,
                        mantém o header visível.
                    */

                    header.classList.remove(
                        'header-escondido'
                    );
                }
            );


            menu.querySelectorAll('a').forEach(
                link => {

                    link.addEventListener(
                        'click',
                        () => {

                            menu.classList.remove('open');

                            menuToggle.setAttribute(
                                'aria-expanded',
                                'false'
                            );

                        }
                    );

                }
            );
        }

    }
);
