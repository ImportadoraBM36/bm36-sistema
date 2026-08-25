const { Pool } =
    require('pg');

const bcrypt =
    require('bcrypt');

require('dotenv').config();


const pool =
    new Pool({

        connectionString:
            process.env.DATABASE_URL,

        ssl: {
            rejectUnauthorized:
                false
        }

    });


// ============================================================
// DADOS DO PRIMEIRO ADMIN
// ============================================================
//
// TROQUE AQUI PELOS DADOS QUE VOCÊ QUISER
//

const ADMIN_NOME =
    'Administrador BM36';

const ADMIN_EMAIL =
    'admin@bm36.com';

const ADMIN_SENHA =
    'Bm36@Admin2026!';


// ============================================================
// CRIAR ADMIN
// ============================================================

async function criarAdmin() {

    try {

        console.log(
            'Criando administrador...'
        );


        const email =
            ADMIN_EMAIL
                .trim()
                .toLowerCase();


        // =========================
        // VERIFICAR EXISTENTE
        // =========================

        const existente =
            await pool.query(
                `
                SELECT id

                FROM usuarios

                WHERE LOWER(email) = LOWER($1)

                LIMIT 1
                `,
                [
                    email
                ]
            );


        if (
            existente.rows.length >
            0
        ) {

            console.log(
                'Já existe um usuário com esse e-mail.'
            );

            return;

        }


        // =========================
        // HASH DA SENHA
        // =========================

        const senhaHash =
            await bcrypt.hash(
                ADMIN_SENHA,
                12
            );


        // =========================
        // CADASTRAR
        // =========================

        const resultado =
            await pool.query(
                `
                INSERT INTO usuarios (
                    nome,
                    email,
                    senha_hash,
                    perfil,
                    ativo
                )

                VALUES (
                    $1,
                    $2,
                    $3,
                    'ADMIN',
                    TRUE
                )

                RETURNING
                    id,
                    nome,
                    email,
                    perfil,
                    ativo
                `,
                [
                    ADMIN_NOME,
                    email,
                    senhaHash
                ]
            );


        console.log(
            'Administrador criado com sucesso!'
        );


        console.table(
            resultado.rows
        );


        console.log(
            '\nLogin:'
        );

        console.log(
            ADMIN_EMAIL
        );


        console.log(
            '\nSenha:'
        );

        console.log(
            ADMIN_SENHA
        );


    } catch (erro) {

        console.error(
            'Erro ao criar administrador:',
            erro
        );


    } finally {

        await pool.end();

    }

}


criarAdmin();