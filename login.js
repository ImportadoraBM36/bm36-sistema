const API_URL =
    'http://localhost:3000/api';


const loginForm =
    document.getElementById(
        'loginForm'
    );

const emailInput =
    document.getElementById(
        'email'
    );

const senhaInput =
    document.getElementById(
        'senha'
    );

const loginButton =
    document.getElementById(
        'loginButton'
    );

const loginError =
    document.getElementById(
        'loginError'
    );

const showPassword =
    document.getElementById(
        'showPassword'
    );


// ============================================================
// MOSTRAR / ESCONDER SENHA
// ============================================================

showPassword.addEventListener(
    'click',
    () => {

        const mostrando =
            senhaInput.type ===
            'text';


        senhaInput.type =
            mostrando
                ? 'password'
                : 'text';


        showPassword.textContent =
            mostrando
                ? '👁'
                : '🙈';

    }
);


// ============================================================
// LOGIN
// ============================================================

loginForm.addEventListener(
    'submit',
    async evento => {

        evento.preventDefault();


        loginError.textContent =
            '';


        const email =
            emailInput.value
                .trim()
                .toLowerCase();


        const senha =
            senhaInput.value;


        if (
            !email ||
            !senha
        ) {

            loginError.textContent =
                'Informe o e-mail e a senha.';

            return;

        }


        try {

            loginButton.disabled =
                true;


            loginButton.textContent =
                'Entrando...';


            const resposta =
                await fetch(
                    `${API_URL}/auth/login`,
                    {

                        method:
                            'POST',

                        headers: {

                            'Content-Type':
                                'application/json'

                        },

                        body:
                            JSON.stringify({

                                email,

                                senha

                            })

                    }
                );


            let resultado;


            try {

                resultado =
                    await resposta.json();

            } catch {

                resultado = {

                    mensagem:
                        'Resposta inválida da API.'

                };

            }


            if (!resposta.ok) {

                loginError.textContent =
                    resultado.mensagem
                    ||
                    'E-mail ou senha incorretos.';

                return;

            }


            // ====================================================
            // SALVAR LOGIN
            // ====================================================

            if (
                resultado.token
            ) {

                localStorage.setItem(
                    'bm36_token',
                    resultado.token
                );

            }


            if (
                resultado.usuario
            ) {

                localStorage.setItem(
                    'bm36_usuario',
                    JSON.stringify(
                        resultado.usuario
                    )
                );

            }


            // ====================================================
            // IR PARA HOME
            // ====================================================

            window.location.href =
                './inicio.html';


        } catch (erro) {

            console.error(
                'Erro no login:',
                erro
            );


            loginError.textContent =
                'Não foi possível conectar com o servidor.';


        } finally {

            loginButton.disabled =
                false;


            loginButton.textContent =
                'Entrar';

        }

    }
);


// ============================================================
// SE JÁ ESTIVER LOGADO
// ============================================================

const tokenExistente =
    localStorage.getItem(
        'bm36_token'
    );


if (
    tokenExistente
) {

    window.location.href =
        './inicio.html';

}