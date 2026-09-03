const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const bcrypt =
    require('bcrypt');

const jwt =
    require('jsonwebtoken');
const app = express();

app.use(cors());
app.use(express.json());


// =========================
// CONEXÃO POSTGRESQL
// =========================

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }
});


// =========================
// ROTA PRINCIPAL
// =========================

app.get('/', (req, res) => {

    res.json({
        mensagem: 'API BM36 funcionando!'
    });

});


// =========================
// TESTAR BANCO
// =========================

app.get(
    '/api/teste-banco',
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    'SELECT NOW() AS horario'
                );

            res.json({
                sucesso: true,
                mensagem: 'PostgreSQL conectado!',
                horario: resultado.rows[0].horario
            });

        } catch (erro) {

            console.error(
                'Erro PostgreSQL:',
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao conectar com PostgreSQL'
            });

        }

    }
);


// =========================
// BUSCAR PRODUTOS
// =========================

app.get(
    '/api/produtos',
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        p.id,
                        p.origem,
                        p.codigo,
                        p.nome,
                        p.descricao,
                        p.codigo_fabricante,
                        p.corredor,
                        p.prateleira,
                        p.posicao,
                        p.tipo_planilha,
                        p.quantidade_por_caixa,
                        p.preco_venda,
                        p.estoque_minimo,
                        p.ativo,

                        COALESCE(
                            SUM(
                                CASE

                                    WHEN m.tipo IN (
                                        'ENTRADA',
                                        'AJUSTE_POSITIVO'
                                    )
                                    THEN m.quantidade

                                    WHEN m.tipo IN (
                                        'SAIDA',
                                        'VENDA',
                                        'AJUSTE_NEGATIVO'
                                    )
                                    THEN -m.quantidade

                                    ELSE 0

                                END
                            ),
                            0
                        ) AS estoque_atual

                    FROM produtos p

                    LEFT JOIN movimentacoes_estoque m
                        ON m.produto_id = p.id

                    GROUP BY
                        p.id,
                        p.origem,
                        p.codigo,
                        p.nome,
                        p.descricao,
                        p.codigo_fabricante,
                        p.corredor,
                        p.prateleira,
                        p.posicao,
                        p.tipo_planilha,
                        p.quantidade_por_caixa,
                        p.preco_venda,
                        p.estoque_minimo,
                        p.ativo

                    ORDER BY p.nome
                `);

            res.json(
                resultado.rows
            );

        } catch (erro) {

            console.error(
                'Erro ao buscar produtos:',
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem: 'Erro ao buscar produtos'
            });

        }

    }
);


// =========================
// CADASTRAR NOVO PRODUTO
// =========================

app.post(
    '/api/produtos',
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const {
                codigo,
                nome,
                codigo_fabricante,
                corredor,
                prateleira,
                posicao,
                origem,
                quantidade_por_caixa,
                preco_venda,
                estoque_minimo,
                estoque_inicial
            } = req.body;


            if (
                !codigo ||
                !nome ||
                !origem
            ) {

                return res
                    .status(400)
                    .json({
                        mensagem:
                            'Código, nome e origem são obrigatórios.'
                    });

            }


            const quantidadeCaixa =
                Number(
                    quantidade_por_caixa || 0
                );

            const precoVenda =
                Number(
                    preco_venda || 0
                );

            const estoqueMinimo =
                Number(
                    estoque_minimo || 0
                );

            const estoqueInicial =
                Number(
                    estoque_inicial || 0
                );


            if (
                Number.isNaN(quantidadeCaixa) ||
                Number.isNaN(precoVenda) ||
                Number.isNaN(estoqueMinimo) ||
                Number.isNaN(estoqueInicial)
            ) {

                return res
                    .status(400)
                    .json({
                        mensagem:
                            'Existem valores numéricos inválidos.'
                    });

            }


            await client.query(
                'BEGIN'
            );


            const produtoExistente =
                await client.query(
                    `
                    SELECT id

                    FROM produtos

                    WHERE codigo = $1
                      AND origem = $2

                    LIMIT 1
                    `,
                    [
                        codigo.trim(),
                        origem
                    ]
                );


            if (
                produtoExistente.rows.length > 0
            ) {

                await client.query(
                    'ROLLBACK'
                );

                return res
                    .status(409)
                    .json({
                        mensagem:
                            'Já existe um produto com esse código nessa origem.'
                    });

            }


            const resultadoProduto =
                await client.query(
                    `
                    INSERT INTO produtos (
                        codigo,
                        nome,
                        codigo_fabricante,
                        corredor,
                        prateleira,
                        posicao,
                        origem,
                        quantidade_por_caixa,
                        preco_venda,
                        estoque_minimo,
                        ativo
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        TRUE
                    )

                    RETURNING *
                    `,
                    [
                        codigo.trim(),

                        nome.trim(),

                        codigo_fabricante
                            ? codigo_fabricante.trim()
                            : null,

                        corredor
                            ? corredor.trim()
                            : null,

                        prateleira
                            ? prateleira.trim()
                            : null,

                        posicao
                            ? posicao.trim()
                            : null,

                        origem,

                        quantidadeCaixa,

                        precoVenda,

                        estoqueMinimo
                    ]
                );


            const produto =
                resultadoProduto.rows[0];


            if (
                estoqueInicial !== 0
            ) {

                const resultadoUsuario =
                    await client.query(
                        `
                        SELECT id

                        FROM usuarios

                        ORDER BY id

                        LIMIT 1
                        `
                    );


                if (
                    resultadoUsuario.rows.length === 0
                ) {

                    throw new Error(
                        'Nenhum usuário encontrado para registrar a movimentação.'
                    );

                }


                const usuarioId =
                    resultadoUsuario.rows[0].id;


                const tipoMovimentacao =
                    estoqueInicial > 0
                        ? 'ENTRADA'
                        : 'AJUSTE_NEGATIVO';


                await client.query(
                    `
                    INSERT INTO movimentacoes_estoque (
                        produto_id,
                        usuario_id,
                        tipo,
                        quantidade,
                        motivo
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )
                    `,
                    [
                        produto.id,

                        usuarioId,

                        tipoMovimentacao,

                        Math.abs(
                            estoqueInicial
                        ),

                        'Estoque inicial do cadastro do produto'
                    ]
                );

            }


            await client.query(
                'COMMIT'
            );


            res
                .status(201)
                .json({
                    sucesso: true,
                    mensagem:
                        'Produto cadastrado com sucesso!',
                    produto
                });


        } catch (erro) {

            await client.query(
                'ROLLBACK'
            );


            console.error(
                'Erro ao cadastrar produto:',
                erro
            );


            res
                .status(500)
                .json({
                    sucesso: false,
                    mensagem:
                        'Erro interno ao cadastrar produto.'
                });


        } finally {

            client.release();

        }

    }
);


// =========================
// ALTERAR PRODUTO
// =========================

app.put(
    '/api/produtos/:id',
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const id =
                Number(
                    req.params.id
                );


            const {
                nome,
                codigo_fabricante,
                corredor,
                prateleira,
                posicao,
                origem,
                quantidade_por_caixa,
                preco_venda,
                estoque_minimo,
                estoque_atual,
            } = req.body;


            if (
                !Number.isInteger(id)
                ||
                id <= 0
                ||
                !nome ||
                !origem
            ) {

                return res
                    .status(400)
                    .json({
                        mensagem:
                            'ID, nome e origem são obrigatórios.'
                    });

            }


            const quantidadeCaixa =
                Number(
                    quantidade_por_caixa || 0
                );

            const precoVenda =
                Number(
                    preco_venda || 0
                );

            const estoqueMinimo =
                Number(
                    estoque_minimo || 0
                );


            if (
                !Number.isFinite(quantidadeCaixa)
                ||
                !Number.isFinite(precoVenda)
                ||
                !Number.isFinite(estoqueMinimo)
            ) {

                return res
                    .status(400)
                    .json({
                        mensagem:
                            'Existem valores numéricos inválidos.'
                    });

            }


            await client.query(
                'BEGIN'
            );


            const produtoExistente =
                await client.query(
                    `
                    SELECT id

                    FROM produtos

                    WHERE id = $1
                    `,
                    [id]
                );


            if (
                produtoExistente.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );

                return res
                    .status(404)
                    .json({
                        mensagem:
                            'Produto não encontrado.'
                    });

            }


            const resultado =
                await client.query(
                    `
                    UPDATE produtos

                    SET
                        nome = $1,
                        codigo_fabricante = $2,
                        corredor = $3,
                        prateleira = $4,
                        posicao = $5,
                        origem = $6,
                        quantidade_por_caixa = $7,
                        preco_venda = $8,
                        estoque_minimo = $9

                    WHERE id = $10

                    RETURNING *
                    `,
                    [
                        nome.trim(),

                        codigo_fabricante
                            ? codigo_fabricante.trim()
                            : null,

                        corredor
                            ? corredor.trim()
                            : null,

                        prateleira
                            ? prateleira.trim()
                            : null,

                        posicao
                            ? posicao.trim()
                            : null,

                        origem,

                        quantidadeCaixa,

                        precoVenda,

                        estoqueMinimo,

                        id
                    ]
                );


            if (
                estoque_atual !== undefined
                &&
                estoque_atual !== null
                &&
                estoque_atual !== ''
            ) {

                const novoEstoque =
                    Number(estoque_atual);


                if (!Number.isFinite(novoEstoque)) {

                    throw new Error(
                        'Valor de estoque inválido.'
                    );

                }


                const estoqueResultado =
                    await client.query(
                        `
                        SELECT COALESCE(
                            SUM(
                                CASE
                                    WHEN tipo IN ('ENTRADA', 'AJUSTE_POSITIVO')
                                    THEN quantidade
                                    WHEN tipo IN ('SAIDA', 'VENDA', 'AJUSTE_NEGATIVO')
                                    THEN -quantidade
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS estoque_atual
                        FROM movimentacoes_estoque
                        WHERE produto_id = $1
                        `,
                        [id]
                    );

                const diferenca =
                    novoEstoque
                    -
                    Number(
                        estoqueResultado.rows[0].estoque_atual
                    );


                if (diferenca !== 0) {

                    const usuarioResultado =
                        await client.query(
                            `
                            SELECT id
                            FROM usuarios
                            ORDER BY id
                            LIMIT 1
                            `
                        );

                    if (usuarioResultado.rows.length === 0) {

                        throw new Error(
                            'Nenhum usuário encontrado para registrar o ajuste de estoque.'
                        );

                    }

                    await client.query(
                        `
                        INSERT INTO movimentacoes_estoque (
                            produto_id,
                            usuario_id,
                            tipo,
                            quantidade,
                            motivo
                        )
                        VALUES ($1, $2, $3, $4, $5)
                        `,
                        [
                            id,
                            usuarioResultado.rows[0].id,
                            diferenca > 0
                                ? 'AJUSTE_POSITIVO'
                                : 'AJUSTE_NEGATIVO',
                            Math.abs(diferenca),
                            'Ajuste realizado na alteração do produto'
                        ]
                    );

                }

            }


            await client.query(
                'COMMIT'
            );


            res.json({
                sucesso: true,

                mensagem:
                    'Produto alterado com sucesso!',

                produto:
                    resultado.rows[0]
            });


        } catch (erro) {

            await client.query(
                'ROLLBACK'
            );


            console.error(
                'Erro ao alterar produto:',
                erro
            );


            res.status(500).json({
                sucesso: false,
                mensagem:
                    'Erro interno ao alterar produto.'
            });


        } finally {

            client.release();

        }

    }
);


// =========================
// LISTAR MOVIMENTAÇÕES DE ESTOQUE
// =========================

app.get(
    '/api/estoque/movimentacoes',
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        m.id,
                        m.produto_id,
                        p.codigo AS produto_codigo,
                        p.nome AS produto_nome,
                        m.tipo,
                        m.quantidade,
                        m.motivo,
                        m.criado_em

                    FROM movimentacoes_estoque m

                    INNER JOIN produtos p
                        ON p.id = m.produto_id

                    ORDER BY
                        m.criado_em DESC,
                        m.id DESC
                `);


            res.json(
                resultado.rows
            );


        } catch (erro) {

            console.error(
                'Erro ao buscar movimentações:',
                erro
            );


            res.status(500).json({
                sucesso: false,
                mensagem:
                    'Erro ao buscar movimentações.'
            });

        }

    }
);


// =========================
// REGISTRAR MOVIMENTAÇÃO
// =========================

app.post(
    '/api/estoque/movimentacoes',
    async (req, res) => {

        const client =
            await pool.connect();


        try {

            const {
                produto_id,
                tipo,
                quantidade,
                motivo
            } = req.body;


            const tiposPermitidos = [
                'ENTRADA',
                'SAIDA',
                'AJUSTE_POSITIVO',
                'AJUSTE_NEGATIVO'
            ];


            if (
                !produto_id ||
                !tipo ||
                !quantidade
            ) {

                return res
                    .status(400)
                    .json({
                        mensagem:
                            'Produto, tipo e quantidade são obrigatórios.'
                    });

            }


            if (
                !tiposPermitidos.includes(
                    tipo
                )
            ) {

                return res
                    .status(400)
                    .json({
                        mensagem:
                            'Tipo de movimentação inválido.'
                    });

            }


            const quantidadeNumero =
                Number(
                    quantidade
                );


            if (
                Number.isNaN(
                    quantidadeNumero
                )
                ||
                quantidadeNumero <= 0
            ) {

                return res
                    .status(400)
                    .json({
                        mensagem:
                            'Quantidade inválida.'
                    });

            }


            await client.query(
                'BEGIN'
            );


            const produto =
                await client.query(
                    `
                    SELECT id

                    FROM produtos

                    WHERE id = $1
                    `,
                    [
                        produto_id
                    ]
                );


            if (
                produto.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );


                return res
                    .status(404)
                    .json({
                        mensagem:
                            'Produto não encontrado.'
                    });

            }


            const usuario =
                await client.query(`
                    SELECT id

                    FROM usuarios

                    ORDER BY id

                    LIMIT 1
                `);


            if (
                usuario.rows.length === 0
            ) {

                throw new Error(
                    'Nenhum usuário encontrado.'
                );

            }


            const usuarioId =
                usuario.rows[0].id;


            const resultado =
                await client.query(
                    `
                    INSERT INTO movimentacoes_estoque (
                        produto_id,
                        usuario_id,
                        tipo,
                        quantidade,
                        motivo
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )

                    RETURNING *
                    `,
                    [
                        produto_id,
                        usuarioId,
                        tipo,
                        quantidadeNumero,
                        motivo || null
                    ]
                );


            await client.query(
                'COMMIT'
            );


            res
                .status(201)
                .json({
                    sucesso: true,
                    mensagem:
                        'Movimentação registrada com sucesso!',
                    movimentacao:
                        resultado.rows[0]
                });


        } catch (erro) {

            await client.query(
                'ROLLBACK'
            );


            console.error(
                'Erro ao registrar movimentação:',
                erro
            );


            res.status(500).json({
                sucesso: false,
                mensagem:
                    'Erro interno ao registrar movimentação.'
            });


        } finally {

            client.release();

        }

    }
);

// ============================================================
// CLIENTES
// ============================================================


// =========================
// LISTAR CLIENTES
// =========================

app.get(
    '/api/clientes',
    async (req, res) => {

        try {

            const resultado = await pool.query(`
                SELECT
                    id,
                    tipo_pessoa,
                    nome,
                    documento,
                    telefone,
                    email,
                    data_nascimento,
                    categoria,
                    ie,
                    codigo_sistema_antigo,
                    origem_sistema_antigo,
                    cep,
                    rua,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    uf,
                    observacoes,
                    ativo,
                    criado_em,
                    atualizado_em

                FROM clientes

                ORDER BY nome
            `);

            res.json(resultado.rows);

        } catch (erro) {

            console.error(
                'Erro ao buscar clientes:',
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem:
                    'Erro ao buscar clientes.'
            });

        }

    }
);


// =========================
// BUSCAR CLIENTE POR ID
// =========================

app.get(
    '/api/clientes/:id',
    async (req, res) => {

        try {

            const { id } = req.params;

            const resultado = await pool.query(
                `
                SELECT
                    id,
                    tipo_pessoa,
                    nome,
                    documento,
                    telefone,
                    email,
                    data_nascimento,
                    categoria,
                    ie,
                    codigo_sistema_antigo,
                    origem_sistema_antigo,
                    cep,
                    rua,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    uf,
                    observacoes,
                    ativo,
                    criado_em,
                    atualizado_em

                FROM clientes

                WHERE id = $1
                `,
                [id]
            );


            if (resultado.rows.length === 0) {

                return res.status(404).json({
                    sucesso: false,
                    mensagem:
                        'Cliente não encontrado.'
                });

            }


            res.json(resultado.rows[0]);

        } catch (erro) {

            console.error(
                'Erro ao buscar cliente:',
                erro
            );

            res.status(500).json({
                sucesso: false,
                mensagem:
                    'Erro ao buscar cliente.'
            });

        }

    }
);


// =========================
// CADASTRAR CLIENTE
// =========================

app.post(
    '/api/clientes',
    async (req, res) => {

        try {

            const {
                tipo_pessoa,
                nome,
                documento,
                telefone,
                email,
                data_nascimento,
                categoria,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                observacoes,
                ativo
            } = req.body;


            // =========================
            // CAMPOS OBRIGATÓRIOS
            // =========================

            if (!nome || !documento) {

                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        'Nome e CPF/CNPJ são obrigatórios.'
                });

            }


            // Remove pontuação do CPF/CNPJ
            const documentoLimpo =
                String(documento)
                    .replace(/\D/g, '');


            if (
                documentoLimpo.length !== 11 &&
                documentoLimpo.length !== 14
            ) {

                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        'CPF ou CNPJ inválido.'
                });

            }


            // =========================
            // VERIFICAR DUPLICIDADE
            // =========================

            const clienteExistente =
                await pool.query(
                    `
                    SELECT id
                    FROM clientes
                    WHERE documento = $1
                    LIMIT 1
                    `,
                    [documentoLimpo]
                );


            if (
                clienteExistente.rows.length > 0
            ) {

                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        'Já existe um cliente cadastrado com este CPF/CNPJ.'
                });

            }


            // =========================
            // CADASTRAR
            // =========================

            const resultado =
                await pool.query(
                    `
                    INSERT INTO clientes (
                        tipo_pessoa,
                        nome,
                        documento,
                        telefone,
                        email,
                        data_nascimento,
                        categoria,
                        cep,
                        rua,
                        numero,
                        complemento,
                        bairro,
                        cidade,
                        uf,
                        observacoes,
                        ativo
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9,
                        $10,
                        $11,
                        $12,
                        $13,
                        $14,
                        $15,
                        $16
                    )

                    RETURNING *
                    `,
                    [
                        tipo_pessoa || 'FISICA',

                        nome.trim(),

                        documentoLimpo,

                        telefone
                            ? telefone.trim()
                            : null,

                        email
                            ? email.trim().toLowerCase()
                            : null,

                        data_nascimento || null,

                        categoria || null,

                        cep
                            ? String(cep).replace(/\D/g, '')
                            : null,

                        rua
                            ? rua.trim()
                            : null,

                        numero
                            ? String(numero).trim()
                            : null,

                        complemento
                            ? complemento.trim()
                            : null,

                        bairro
                            ? bairro.trim()
                            : null,

                        cidade
                            ? cidade.trim()
                            : null,

                        uf
                            ? uf.trim().toUpperCase()
                            : null,

                        observacoes
                            ? observacoes.trim()
                            : null,

                        ativo !== false
                    ]
                );


            res.status(201).json({
                sucesso: true,

                mensagem:
                    'Cliente cadastrado com sucesso!',

                cliente:
                    resultado.rows[0]
            });


        } catch (erro) {

            console.error(
                'Erro ao cadastrar cliente:',
                erro
            );


            // Caso futuramente o UNIQUE
            // do documento esteja funcionando
            if (erro.code === '23505') {

                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        'Já existe um cliente cadastrado com este CPF/CNPJ.'
                });

            }


            res.status(500).json({
                sucesso: false,
                mensagem:
                    'Erro interno ao cadastrar cliente.'
            });

        }

    }
);


// =========================
// ALTERAR CLIENTE
// =========================

app.put(
    '/api/clientes/:id',
    async (req, res) => {

        try {

            const { id } = req.params;

            const {
                tipo_pessoa,
                nome,
                documento,
                telefone,
                email,
                data_nascimento,
                categoria,
                cep,
                rua,
                numero,
                complemento,
                bairro,
                cidade,
                uf,
                observacoes,
                ativo
            } = req.body;


            if (!nome || !documento) {

                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        'Nome e CPF/CNPJ são obrigatórios.'
                });

            }


            const documentoLimpo =
                String(documento)
                    .replace(/\D/g, '');


            // Verifica se outro cliente
            // possui o mesmo documento

            const duplicado =
                await pool.query(
                    `
                    SELECT id

                    FROM clientes

                    WHERE documento = $1
                      AND id <> $2

                    LIMIT 1
                    `,
                    [
                        documentoLimpo,
                        id
                    ]
                );


            if (duplicado.rows.length > 0) {

                return res.status(409).json({
                    sucesso: false,
                    mensagem:
                        'Já existe outro cliente com este CPF/CNPJ.'
                });

            }


            const resultado =
                await pool.query(
                    `
                    UPDATE clientes

                    SET
                        tipo_pessoa = $1,
                        nome = $2,
                        documento = $3,
                        telefone = $4,
                        email = $5,
                        data_nascimento = $6,
                        categoria = $7,
                        cep = $8,
                        rua = $9,
                        numero = $10,
                        complemento = $11,
                        bairro = $12,
                        cidade = $13,
                        uf = $14,
                        observacoes = $15,
                        ativo = $16,
                        atualizado_em = NOW()

                    WHERE id = $17

                    RETURNING *
                    `,
                    [
                        tipo_pessoa || 'FISICA',
                        nome.trim(),
                        documentoLimpo,
                        telefone || null,
                        email || null,
                        data_nascimento || null,
                        categoria || null,
                        cep || null,
                        rua || null,
                        numero || null,
                        complemento || null,
                        bairro || null,
                        cidade || null,
                        uf || null,
                        observacoes || null,
                        ativo !== false,
                        id
                    ]
                );


            if (resultado.rows.length === 0) {

                return res.status(404).json({
                    sucesso: false,
                    mensagem:
                        'Cliente não encontrado.'
                });

            }


            res.json({
                sucesso: true,
                mensagem:
                    'Cliente alterado com sucesso!',
                cliente:
                    resultado.rows[0]
            });


        } catch (erro) {

            console.error(
                'Erro ao alterar cliente:',
                erro
            );


            res.status(500).json({
                sucesso: false,
                mensagem:
                    'Erro interno ao alterar cliente.'
            });

        }

    }
);

// ============================================================
// VENDAS
// ============================================================


// =========================
// FINALIZAR NOVA VENDA
// =========================

app.post(
    '/api/vendas',
    autenticar,
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const {
                cliente_id,
                desconto = 0,
                itens
            } = req.body;


            // =========================
            // VALIDAÇÕES BÁSICAS
            // =========================

            if (!cliente_id) {

                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        'Selecione um cliente para realizar a venda.'
                });

            }


            if (
                !Array.isArray(itens) ||
                itens.length === 0
            ) {

                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        'Adicione pelo menos um produto à venda.'
                });

            }


            const descontoNumero =
                Number(desconto || 0);


            if (
                Number.isNaN(descontoNumero) ||
                descontoNumero < 0
            ) {

                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        'Desconto inválido.'
                });

            }


            // =========================
            // INICIAR TRANSAÇÃO
            // =========================

            await client.query('BEGIN');


            // =========================
            // VERIFICAR CLIENTE
            // =========================

            const clienteResultado =
                await client.query(
                    `
                    SELECT
                        id,
                        nome,
                        ativo

                    FROM clientes

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [cliente_id]
                );


            if (
                clienteResultado.rows.length === 0
            ) {

                await client.query('ROLLBACK');

                return res.status(404).json({
                    sucesso: false,
                    mensagem:
                        'Cliente não encontrado.'
                });

            }


            const cliente =
                clienteResultado.rows[0];


            if (!cliente.ativo) {

                await client.query('ROLLBACK');

                return res.status(400).json({
                    sucesso: false,
                    mensagem:
                        'Este cliente está inativo.'
                });

            }


            // =========================
// USUÁRIO LOGADO
// =========================

const usuarioId =
    Number(
        req.usuario.id
    );


if (
    !Number.isInteger(usuarioId)
    ||
    usuarioId <= 0
) {

    throw new Error(
        'Usuário autenticado inválido.'
    );

}


// =========================
// CONFIRMAR USUÁRIO
// =========================

const usuarioResultado =
    await client.query(
        `
        SELECT
            u.id,
            u.nome,
            u.email,
            u.perfil,
            u.ativo,

            u.evento_ativo_id,

            e.nome AS evento_ativo_nome,
            e.status AS evento_ativo_status

        FROM usuarios u

        LEFT JOIN eventos e
            ON e.id = u.evento_ativo_id

        WHERE u.id = $1

        LIMIT 1
        `,
        [
            usuarioId
        ]
    );

if (
    usuarioResultado.rows.length === 0
) {

    throw new Error(
        'Usuário autenticado não encontrado.'
    );

}


const usuarioLogado =
    usuarioResultado.rows[0];

// ============================================================
// EVENTO ATIVO DO USUÁRIO
// ============================================================

let eventoIdVenda =
    null;


if (
    usuarioLogado.evento_ativo_id
) {

    const statusEvento =
        String(
            usuarioLogado.evento_ativo_status || ''
        )
            .trim()
            .toUpperCase();


    if (
        statusEvento === 'ATIVO'
    ) {

        eventoIdVenda =
            Number(
                usuarioLogado.evento_ativo_id
            );

    } else {

        // Se o evento foi finalizado/cancelado,
        // remove automaticamente do usuário.
        await client.query(
            `
            UPDATE usuarios

            SET evento_ativo_id = NULL

            WHERE id = $1
            `,
            [
                usuarioId
            ]
        );


        eventoIdVenda =
            null;

    }

}
if (
    usuarioLogado.ativo === false
) {

    await client.query(
        'ROLLBACK'
    );


    return res
        .status(403)
        .json({

            sucesso:
                false,

            mensagem:
                'Seu usuário está inativo.'

        });

}
            // =========================
            // PREPARAR ITENS
            // =========================

            const itensProcessados = [];

            let subtotalVenda = 0;


         const produtoId = Number(item.produto_id);

const quantidade = Number(item.quantidade);


if (
    !Number.isInteger(produtoId) ||
    produtoId <= 0
) {

    throw new Error('Produto inválido.');

}


if (
    !Number.isFinite(quantidade) ||
    quantidade <= 0
) {

    throw new Error(
        `Quantidade inválida para o produto ${produtoId}.`
    );

}


// Buscar o preço diretamente do banco
const resultadoProduto = await client.query(
    `
    SELECT preco_venda
    FROM produtos
    WHERE id = $1
    LIMIT 1
    `,
    [produtoId]
);


if (resultadoProduto.rows.length === 0) {

    throw new Error(
        `Produto ${produtoId} não encontrado.`
    );

}



           // ========================================================
// CALCULAR TOTAL
// DESCONTO É PERCENTUAL (%)
// ========================================================

const descontoPercentual = Math.min(
    100,
    Math.max(0, descontoFinal)
);

const valorDesconto =
    novoSubtotal * (descontoPercentual / 100);

const novoTotal = Math.max(
    0,
    novoSubtotal - valorDesconto
);
            // =========================
            // CRIAR VENDA
            // =========================

            const vendaResultado =
                await client.query(
                    `
                  INSERT INTO vendas (
    cliente_id,
    usuario_id,
    evento_id,
    subtotal,
    desconto,
    total,
    status
)

VALUES (
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7
)

RETURNING *
                    `,
               [
    cliente.id,
    usuarioId,
    eventoIdVenda, 
    subtotalVenda,
    descontoNumero,
    totalVenda,
    'FINALIZADA'
]
                );


            const venda =
                vendaResultado.rows[0];


            // =========================
            // SALVAR ITENS
            // =========================

            for (
                const item
                of itensProcessados
            ) {

                await client.query(
                    `
                    INSERT INTO itens_venda (
                        venda_id,
                        produto_id,
                        quantidade,
                        preco_unitario,
                        subtotal
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )
                    `,
                    [
                        venda.id,
                        item.produto_id,
                        item.quantidade,
                        item.preco_unitario,
                        item.subtotal
                    ]
                );


                // =========================
                // MOVIMENTAÇÃO DE ESTOQUE
                // =========================
                //
                // Não bloqueamos venda
                // mesmo se o estoque estiver
                // zerado ou negativo.
                // =========================

                await client.query(
                    `
                    INSERT INTO movimentacoes_estoque (
                        produto_id,
                        usuario_id,
                        tipo,
                        quantidade,
                        motivo
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )
                    `,
                    [
                        item.produto_id,
                        usuarioId,
                        'VENDA',
                        item.quantidade,
                        `Venda #${venda.id}`
                    ]
                );

            }


            // =========================
            // FINALIZAR TRANSAÇÃO
            // =========================

            await client.query('COMMIT');


            // =========================
            // RESPOSTA
            // =========================

            return res.status(201).json({

                sucesso: true,

                mensagem:
                    'Venda finalizada com sucesso!',

                venda: {

                    id:
                        venda.id,

                    cliente_id:
                        venda.cliente_id,

                    cliente_nome:
                        cliente.nome,

                    usuario_id:
                        venda.usuario_id,

                    subtotal:
                        Number(venda.subtotal),

                    desconto:
                        Number(venda.desconto),

                    total:
                        Number(venda.total),

                    status:
                        venda.status,

                    criado_em:
                        venda.criado_em,

                    itens:
                        itensProcessados

                }

            });


        } catch (erro) {

            // =========================
            // DESFAZER TUDO
            // =========================

            try {

                await client.query(
                    'ROLLBACK'
                );

            } catch (rollbackErro) {

                console.error(
                    'Erro no rollback:',
                    rollbackErro
                );

            }


            console.error(
                'Erro ao finalizar venda:',
                erro
            );


            return res.status(500).json({

                sucesso: false,

                mensagem:
                    erro.message ||
                    'Erro interno ao finalizar venda.'

            });


        } finally {

            client.release();

        }

    }
);


// ============================================================
// CONSULTAR VENDAS
// ============================================================


// =========================
// LISTAR TODAS AS VENDAS
// =========================

app.get(
    '/api/vendas',
    async (req, res) => {

        try {

            const resultado =
                await pool.query(`
                    SELECT
                        v.id,
                        v.cliente_id,
                        c.nome AS cliente_nome,
                        c.documento AS cliente_documento,

                        v.usuario_id,
                        u.nome AS usuario_nome,
                        v.evento_id,

                        v.subtotal,
                        v.desconto,
                        v.total,

                        v.status,
                        v.criado_em,

                        COUNT(iv.id) AS quantidade_itens,

                        COALESCE(
                            SUM(iv.quantidade),
                            0
                        ) AS quantidade_produtos

                   FROM vendas v

                    INNER JOIN clientes c
                        ON c.id = v.cliente_id

                    LEFT JOIN usuarios u
                        ON u.id = v.usuario_id

                    LEFT JOIN itens_venda iv
                        ON iv.venda_id = v.id
                     GROUP BY
                    v.id,
                    v.cliente_id,
                    c.nome,
                    c.documento,
                    v.usuario_id,
                    u.nome,
                    v.subtotal,
                    v.desconto,
                    v.total,
                    v.status,
                    v.criado_em
                    ORDER BY
                        v.criado_em DESC,
                        v.id DESC
                `);


            res.json(
                resultado.rows
            );


        } catch (erro) {

            console.error(
                'Erro ao buscar vendas:',
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    'Erro ao buscar vendas.'

            });

        }

    }
);


// =========================
// DETALHES DE UMA VENDA
// =========================

app.get(
    '/api/vendas/:id',
    async (req, res) => {

        try {

            const vendaId =
                Number(req.params.id);


            if (
                !Number.isInteger(vendaId) ||
                vendaId <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Venda inválida.'

                    });

            }


            // =========================
            // BUSCAR VENDA
            // =========================

           const resultadoVenda =
    await pool.query(
        `
        SELECT
            v.id,
            v.cliente_id,

            c.nome AS cliente_nome,
            c.documento AS cliente_documento,
            c.codigo_sistema_antigo AS cliente_codigo,
            c.telefone AS cliente_telefone,
            c.email AS cliente_email,

            v.usuario_id,
            u.nome AS usuario_nome,
            v.evento_id,

            v.subtotal,
            v.desconto,
            v.total,

            v.status,
            v.criado_em

        FROM vendas v

        INNER JOIN clientes c
            ON c.id = v.cliente_id

        LEFT JOIN usuarios u
            ON u.id = v.usuario_id

        WHERE v.id = $1
        `,
        [vendaId]
    );


            if (
                resultadoVenda.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Venda não encontrada.'

                    });

            }


            // =========================
            // BUSCAR ITENS
            // =========================

            const resultadoItens =
                await pool.query(
                    `
                    SELECT
                        iv.id,

                        iv.produto_id,

                        p.codigo AS produto_codigo,
                        p.nome AS produto_nome,
                        p.origem AS produto_origem,
                        p.codigo_fabricante AS produto_codigo_fabricante,
                        p.corredor AS produto_corredor,
                        p.prateleira AS produto_prateleira,
                        p.posicao AS produto_posicao,

                        iv.quantidade,
                        iv.preco_unitario,
                        iv.subtotal,

                        iv.criado_em

                    FROM itens_venda iv

                    INNER JOIN produtos p
                        ON p.id = iv.produto_id

                    WHERE iv.venda_id = $1

                    ORDER BY iv.id
                    `,
                    [vendaId]
                );


            res.json({

                sucesso: true,

                venda: {

                    ...resultadoVenda.rows[0],

                    itens:
                        resultadoItens.rows

                }

            });


        } catch (erro) {

            console.error(
                'Erro ao buscar venda:',
                erro
            );


            res.status(500).json({

                sucesso: false,

                mensagem:
                    'Erro ao buscar detalhes da venda.'

            });

        }

    }
);

// ============================================================
// CANCELAR VENDA
// ============================================================

app.patch(
    '/api/vendas/:id/cancelar',
    async (req, res) => {

        const client =
            await pool.connect();

        try {

            const vendaId =
                Number(req.params.id);

            const {
                motivo = null
            } = req.body || {};
            // =========================
            // VALIDAR ID
            // =========================

            if (
                !Number.isInteger(vendaId) ||
                vendaId <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Venda inválida.'

                    });

            }


            // =========================
            // INICIAR TRANSAÇÃO
            // =========================

            await client.query(
                'BEGIN'
            );


            // =========================
            // BUSCAR VENDA
            // =========================
            //
            // FOR UPDATE impede que duas
            // pessoas cancelem a mesma
            // venda ao mesmo tempo.
            // =========================

            const resultadoVenda =
                await client.query(
                    `
                    SELECT
                        id,
                        usuario_id,
                        status

                    FROM vendas

                    WHERE id = $1

                    FOR UPDATE
                    `,
                    [
                        vendaId
                    ]
                );


            // =========================
            // VENDA NÃO EXISTE
            // =========================

            if (
                resultadoVenda.rows.length === 0
            ) {

                await client.query(
                    'ROLLBACK'
                );


                return res
                    .status(404)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Venda não encontrada.'

                    });

            }


            const venda =
                resultadoVenda.rows[0];


            // =========================
            // JÁ ESTÁ CANCELADA
            // =========================

            if (
                String(
                    venda.status || ''
                ).toUpperCase() === 'CANCELADA'
            ) {

                await client.query(
                    'ROLLBACK'
                );


                return res
                    .status(409)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Esta venda já está cancelada.'

                    });

            }


            // =========================
            // BUSCAR ITENS DA VENDA
            // =========================

            const resultadoItens =
                await client.query(
                    `
                    SELECT
                        produto_id,
                        quantidade

                    FROM itens_venda

                    WHERE venda_id = $1

                    ORDER BY id
                    `,
                    [
                        vendaId
                    ]
                );


            // =========================
            // USUÁRIO DA VENDA
            // =========================

            let usuarioId =
                venda.usuario_id;


            // Caso por algum motivo
            // a venda não tenha usuário,
            // pega o primeiro cadastrado.

            if (!usuarioId) {

                const resultadoUsuario =
                    await client.query(
                        `
                        SELECT id

                        FROM usuarios

                        ORDER BY id

                        LIMIT 1
                        `
                    );


                if (
                    resultadoUsuario.rows.length === 0
                ) {

                    throw new Error(
                        'Nenhum usuário encontrado para registrar o cancelamento.'
                    );

                }


                usuarioId =
                    resultadoUsuario.rows[0].id;

            }


            // =========================
            // DEVOLVER PRODUTOS
            // AO ESTOQUE
            // =========================
            //
            // Na venda foi criada uma
            // movimentação do tipo VENDA.
            //
            // Agora criamos uma
            // AJUSTE_POSITIVO para devolver
            // exatamente a mesma quantidade.
            // =========================

            for (
                const item
                of resultadoItens.rows
            ) {

                await client.query(
                    `
                    INSERT INTO movimentacoes_estoque (
                        produto_id,
                        usuario_id,
                        tipo,
                        quantidade,
                        motivo
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        $5
                    )
                    `,
                    [
                        item.produto_id,

                        usuarioId,

                        'AJUSTE_POSITIVO',

                        item.quantidade,

                        motivo
                            ? `Cancelamento da venda #${vendaId}: ${String(motivo).trim()}`
                            : `Cancelamento da venda #${vendaId}`
                    ]
                );

            }


            // =========================
            // ALTERAR STATUS
            // =========================

            const resultadoAtualizacao =
                await client.query(
                    `
                    UPDATE vendas

                    SET
                        status = 'CANCELADA'

                    WHERE id = $1

                    RETURNING *
                    `,
                    [
                        vendaId
                    ]
                );


            // =========================
            // CONFIRMAR TRANSAÇÃO
            // =========================

            await client.query(
                'COMMIT'
            );


            // =========================
            // RESPOSTA
            // =========================

            return res.json({

                sucesso: true,

                mensagem:
                    'Venda cancelada com sucesso!',

                venda:
                    resultadoAtualizacao.rows[0]

            });


        } catch (erro) {


            // =========================
            // DESFAZER ALTERAÇÕES
            // =========================

            try {

                await client.query(
                    'ROLLBACK'
                );

            } catch (rollbackErro) {

                console.error(
                    'Erro no rollback do cancelamento:',
                    rollbackErro
                );

            }


            console.error(
                'Erro ao cancelar venda:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        erro.message ||
                        'Erro interno ao cancelar venda.'

                });


        } finally {

            client.release();

        }

    }
);
// =====================================================
// REATIVAR EVENTO
// =====================================================

app.patch('/api/eventos/:id/reativar', async (req, res) => {

    try {

        const eventoId = Number(req.params.id);

       if (!statusPermitidos.includes(statusFinal)) {
    return res.status(400).json({
        sucesso: false,
        mensagem: 'Status de evento inválido.'
    });
}

const resultado = await pool.query(
    `
    UPDATE eventos
    SET
        nome = $1,
        descricao = $2,
        data_inicio = $3,
        data_fim = $4,
        status = $5,
        atualizado_em = NOW()
    WHERE id = $6
    RETURNING *
    `,
    [
        String(nome).trim(),
        descricao ? String(descricao).trim() : null,
        data_inicio || null,
        data_fim || null,
        statusFinal,
        eventoId
    ]
);

if (resultado.rows.length === 0) {
    return res.status(404).json({
        sucesso: false,
        mensagem: 'Evento não encontrado.'
    });
}

return res.json({
    sucesso: true,
    mensagem: 'Evento atualizado com sucesso!',
    evento: resultado.rows[0]
});
    } catch (erro) {

        console.error(
            'Erro ao reativar evento:',
            erro
        );

        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao reativar evento.'
        });
    }
});
// ============================================================
// ALTERAR VENDA / PEDIDO
// ============================================================

app.put('/api/vendas/:id', async (req, res) => {

    const client = await pool.connect();

    try {

        const vendaId = Number(req.params.id);

        const {
            itens,
            desconto = 0,
            evento_id = null
        } = req.body;


        // ========================================================
        // VALIDAR ID
        // ========================================================

        if (!Number.isInteger(vendaId) || vendaId <= 0) {

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Pedido inválido.'
            });

        }


        // ========================================================
        // VALIDAR ITENS
        // ========================================================

        if (!Array.isArray(itens) || itens.length === 0) {

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Informe os itens do pedido.'
            });

        }


        // ========================================================
        // DESCONTO
        // ========================================================

        const descontoFinal = Number(desconto) || 0;

        if (descontoFinal < 0) {

            return res.status(400).json({
                sucesso: false,
                mensagem: 'Desconto inválido.'
            });

        }


        // ========================================================
        // INICIAR TRANSAÇÃO
        // ========================================================

        await client.query('BEGIN');


        // ========================================================
        // BUSCAR VENDA
        // ========================================================

        const resultadoVenda = await client.query(
            `
            SELECT
                id,
                usuario_id,
                subtotal,
                desconto,
                total,
                status,
                evento_id
            FROM vendas
            WHERE id = $1
            FOR UPDATE
            `,
            [vendaId]
        );


        if (resultadoVenda.rows.length === 0) {

            throw new Error('Pedido não encontrado.');

        }


        const venda = resultadoVenda.rows[0];


        // ========================================================
        // PEDIDO CANCELADO
        // ========================================================

        if (
            String(venda.status || '').toUpperCase() === 'CANCELADA'
        ) {

            throw new Error(
                'Um pedido cancelado não pode ser alterado.'
            );

        }


        // ========================================================
        // VALIDAR EVENTO
        // ========================================================

        let eventoIdFinal = null;

        if (
            evento_id !== null &&
            evento_id !== '' &&
            evento_id !== undefined
        ) {

            eventoIdFinal = Number(evento_id);

            if (
                !Number.isInteger(eventoIdFinal) ||
                eventoIdFinal <= 0
            ) {

                throw new Error('Evento inválido.');

            }


            const resultadoEvento = await client.query(
                `
                SELECT id
                FROM eventos
                WHERE id = $1
                LIMIT 1
                `,
                [eventoIdFinal]
            );


            if (resultadoEvento.rows.length === 0) {

                throw new Error('Evento não encontrado.');

            }

        }


        // ========================================================
        // BUSCAR ITENS ATUAIS
        // ========================================================

        const resultadoItensAtuais = await client.query(
            `
            SELECT
                id,
                produto_id,
                quantidade,
                preco_unitario,
                subtotal
            FROM itens_venda
            WHERE venda_id = $1
            ORDER BY id
            FOR UPDATE
            `,
            [vendaId]
        );


        const itensAtuais = resultadoItensAtuais.rows;


        // ========================================================
        // USUÁRIO
        // ========================================================

        let usuarioId = venda.usuario_id;


        if (!usuarioId) {

            const resultadoUsuario = await client.query(
                `
                SELECT id
                FROM usuarios
                ORDER BY id
                LIMIT 1
                `
            );


            if (resultadoUsuario.rows.length === 0) {

                throw new Error(
                    'Nenhum usuário encontrado.'
                );

            }


            usuarioId = resultadoUsuario.rows[0].id;

        }


        // ========================================================
        // MAPEAR ITENS RECEBIDOS
        // ========================================================

        const itensRecebidos = new Map();


        for (const item of itens) {

            const produtoId = Number(item.produto_id);

            const quantidade = Number(item.quantidade);

            const resultadoProduto = await client.query(
    `   
    SELECT preco_venda
    FROM produtos
    WHERE id = $1
    LIMIT 1
    `,
    [produtoId]
);

if (resultadoProduto.rows.length === 0) {
    throw new Error(
        `Produto ${produtoId} não encontrado.`
    );
}

const precoUnitario =
    Number(resultadoProduto.rows[0].preco_venda) || 0;


            if (
                !Number.isInteger(produtoId) ||
                produtoId <= 0
            ) {

                throw new Error('Produto inválido.');

            }


            if (
                !Number.isFinite(quantidade) ||
                quantidade <= 0
            ) {

                throw new Error(
                    `Quantidade inválida para o produto ${produtoId}.`
                );

            }


            if (
                !Number.isFinite(precoUnitario) ||
                precoUnitario < 0
            ) {

                throw new Error(
                    `Preço inválido para o produto ${produtoId}.`
                );

            }


            itensRecebidos.set(
                produtoId,
                {
                    produto_id: produtoId,
                    quantidade: quantidade,
                    preco_unitario: precoUnitario
                }
            );

        }


        // ========================================================
        // MAPA DOS ITENS ATUAIS
        // ========================================================

        const itensAtuaisMap = new Map();


        for (const itemAtual of itensAtuais) {

            itensAtuaisMap.set(
                Number(itemAtual.produto_id),
                itemAtual
            );

        }


        // ========================================================
        // PROCESSAR ITENS
        // ========================================================

        let novoSubtotal = 0;


        for (const itemNovo of itensRecebidos.values()) {

            const produtoId = Number(itemNovo.produto_id);

            const novaQuantidade = Number(itemNovo.quantidade);

            const precoNovo = Number(itemNovo.preco_unitario);


            const itemAtual = itensAtuaisMap.get(produtoId);


            // ====================================================
            // PRODUTO NOVO
            // ====================================================

            if (!itemAtual) {

                const subtotalItem =
                    novaQuantidade * precoNovo;


                novoSubtotal += subtotalItem;


                // ------------------------------------------------
                // SAÍDA DO ESTOQUE
                // ------------------------------------------------

                await client.query(
                    `
                    INSERT INTO movimentacoes_estoque (
                        produto_id,
                        usuario_id,
                        tipo,
                        quantidade,
                        motivo
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        produtoId,
                        usuarioId,
                        'VENDA',
                        novaQuantidade,
                        `Alteração do pedido #${vendaId} - novo produto`
                    ]
                );


                // ------------------------------------------------
                // INSERIR ITEM
                // ------------------------------------------------

                await client.query(
                    `
                    INSERT INTO itens_venda (
                        venda_id,
                        produto_id,
                        quantidade,
                        preco_unitario,
                        subtotal
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        vendaId,
                        produtoId,
                        novaQuantidade,
                        precoNovo,
                        subtotalItem
                    ]
                );


                continue;

            }


            // ====================================================
            // PRODUTO JÁ EXISTENTE
            // ====================================================

            const quantidadeAtual =
                Number(itemAtual.quantidade);


            const diferenca =
                novaQuantidade - quantidadeAtual;


            // ------------------------------------------------
            // AUMENTOU
            // ------------------------------------------------

            if (diferenca > 0) {

                await client.query(
                    `
                    INSERT INTO movimentacoes_estoque (
                        produto_id,
                        usuario_id,
                        tipo,
                        quantidade,
                        motivo
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        produtoId,
                        usuarioId,
                        'VENDA',
                        diferenca,
                        `Alteração do pedido #${vendaId} - aumento de quantidade`
                    ]
                );

            }


            // ------------------------------------------------
            // DIMINUIU
            // ------------------------------------------------

            if (diferenca < 0) {

                await client.query(
                    `
                    INSERT INTO movimentacoes_estoque (
                        produto_id,
                        usuario_id,
                        tipo,
                        quantidade,
                        motivo
                    )
                    VALUES ($1, $2, $3, $4, $5)
                    `,
                    [
                        produtoId,
                        usuarioId,
                        'AJUSTE_POSITIVO',
                        Math.abs(diferenca),
                        `Alteração do pedido #${vendaId} - devolução`
                    ]
                );

            }


            // ------------------------------------------------
            // NOVO SUBTOTAL
            // ------------------------------------------------

            const subtotalItem =
                novaQuantidade * precoNovo;


            novoSubtotal += subtotalItem;


            // ------------------------------------------------
            // ATUALIZAR ITEM
            // ------------------------------------------------

            await client.query(
                `
                UPDATE itens_venda
                SET
                    quantidade = $1,
                    preco_unitario = $2,
                    subtotal = $3
                WHERE id = $4
                `,
                [
                    novaQuantidade,
                    precoNovo,
                    subtotalItem,
                    itemAtual.id
                ]
            );


            // Item já foi processado
            itensAtuaisMap.delete(produtoId);

        }


        // ========================================================
        // REMOVER ITENS QUE SAÍRAM DO PEDIDO
        // ========================================================

        for (const itemRemovido of itensAtuaisMap.values()) {

            const produtoId =
                Number(itemRemovido.produto_id);

            const quantidadeRemovida =
                Number(itemRemovido.quantidade);


            // ------------------------------------------------
            // DEVOLVER AO ESTOQUE
            // ------------------------------------------------

            await client.query(
                `
                INSERT INTO movimentacoes_estoque (
                    produto_id,
                    usuario_id,
                    tipo,
                    quantidade,
                    motivo
                )
                VALUES ($1, $2, $3, $4, $5)
                `,
                [
                    produtoId,
                    usuarioId,
                    'AJUSTE_POSITIVO',
                    quantidadeRemovida,
                    `Alteração do pedido #${vendaId} - produto removido`
                ]
            );


            // ------------------------------------------------
            // EXCLUIR ITEM
            // ------------------------------------------------

            await client.query(
                `
                DELETE FROM itens_venda
                WHERE id = $1
                `,
                [itemRemovido.id]
            );

        }


        // ========================================================
        // CALCULAR TOTAL
        // ========================================================

        const novoTotal = Math.max(
            0,
           novoSubtotal - (novoSubtotal * descontoFinal / 100)
        );


        // ========================================================
        // ATUALIZAR VENDA
        // ========================================================

        const resultadoAtualizacao = await client.query(
            `
            UPDATE vendas
            SET
                subtotal = $1,
                desconto = $2,
                total = $3,
                evento_id = $4
            WHERE id = $5
            RETURNING *
            `,
            [
                novoSubtotal,
                descontoFinal,
                novoTotal,
                eventoIdFinal,
                vendaId
            ]
        );


        // ========================================================
        // COMMIT
        // ========================================================

        await client.query('COMMIT');


        // ========================================================
        // RESPOSTA
        // ========================================================

        return res.json({
            sucesso: true,
            mensagem: 'Pedido alterado com sucesso!',
            venda: resultadoAtualizacao.rows[0]
        });


    } catch (erro) {

        try {
            await client.query('ROLLBACK');
        } catch (rollbackErro) {
            console.error(
                'Erro no rollback:',
                rollbackErro
            );
        }


        console.error(
            'ERRO AO ALTERAR PEDIDO:',
            erro
        );


        return res.status(500).json({
            sucesso: false,
            mensagem:
                erro.message ||
                'Erro interno ao alterar pedido.'
        });


    } finally {

        client.release();

    }

});



// ============================================================
// LOGIN
// ============================================================

app.post(
    '/api/auth/login',
    async (req, res) => {

        try {

            const {
                email,
                senha
            } = req.body;


            if (
                !email ||
                !senha
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso:
                            false,

                        mensagem:
                            'Informe o e-mail e a senha.'

                    });

            }


            // =========================
            // BUSCAR USUÁRIO
            // =========================

            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        email,
                        senha_hash,
                        perfil,
                        ativo

                    FROM usuarios

                    WHERE LOWER(email) =
                          LOWER($1)

                    LIMIT 1
                    `,
                    [
                        email.trim()
                    ]
                );


            if (
                resultado.rows.length ===
                0
            ) {

                return res
                    .status(401)
                    .json({

                        sucesso:
                            false,

                        mensagem:
                            'E-mail ou senha incorretos.'

                    });

            }


            const usuario =
                resultado.rows[0];


            // =========================
            // USUÁRIO INATIVO
            // =========================

            if (
                usuario.ativo ===
                false
            ) {

                return res
                    .status(403)
                    .json({

                        sucesso:
                            false,

                        mensagem:
                            'Este usuário está inativo.'

                    });

            }


            // =========================
            // VALIDAR SENHA
            // =========================

            const senhaCorreta =
                await bcrypt.compare(
                    senha,
                    usuario.senha_hash
                );


            if (
                !senhaCorreta
            ) {

                return res
                    .status(401)
                    .json({

                        sucesso:
                            false,

                        mensagem:
                            'E-mail ou senha incorretos.'

                    });

            }


            // =========================
            // GERAR TOKEN
            // =========================

            const token =
                jwt.sign(
                    {

                        id:
                            usuario.id,

                        nome:
                            usuario.nome,

                        email:
                            usuario.email,

                        perfil:
                            usuario.perfil

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            '12h'
                    }
                );


            // =========================
            // RESPOSTA
            // =========================

            return res.json({

                sucesso:
                    true,

                mensagem:
                    'Login realizado com sucesso!',

                token,

                usuario: {

                    id:
                        usuario.id,

                    nome:
                        usuario.nome,

                    email:
                        usuario.email,

                    perfil:
                        usuario.perfil

                }

            });


        } catch (erro) {

            console.error(
                'Erro no login:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso:
                        false,

                    mensagem:
                        'Erro interno ao realizar login.'

                });

        }

    }
);
// ============================================================
// AUTENTICAÇÃO
// ============================================================

function autenticar(
    req,
    res,
    next
) {

    const authorization =
        req.headers.authorization;


    if (
        !authorization
    ) {

        return res
            .status(401)
            .json({

                sucesso:
                    false,

                mensagem:
                    'Usuário não autenticado.'

            });

    }


    const partes =
        authorization.split(
            ' '
        );


    if (
        partes.length !==
        2
        ||
        partes[0] !==
        'Bearer'
    ) {

        return res
            .status(401)
            .json({

                sucesso:
                    false,

                mensagem:
                    'Token inválido.'

            });

    }


    try {

        const token =
            partes[1];


        const usuario =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        req.usuario =
            usuario;


        next();


    } catch (erro) {

        return res
            .status(401)
            .json({

                sucesso:
                    false,

                mensagem:
                    'Sessão expirada ou inválida.'

            });

    }

}


// ============================================================
// SOMENTE ADMIN
// ============================================================

function somenteAdmin(
    req,
    res,
    next
) {

    if (
        req.usuario.perfil !==
        'ADMIN'
    ) {

        return res
            .status(403)
            .json({

                sucesso:
                    false,

                mensagem:
                    'Acesso permitido somente para administradores.'

            });

    }


    next();

}


// ============================================================
// IMPORTAÇÃO DE PLANILHAS (SISTEMA ANTIGO)
// ============================================================

const uploadPlanilhasImportacao =
    multer({
        storage: multer.memoryStorage(),

        limits: {
            fileSize: 15 * 1024 * 1024,
            files: 6
        },

        fileFilter: (
            req,
            file,
            cb
        ) => {

            if (
                /\.(xls|xlsx|csv)$/i.test(
                    file.originalname
                )
            ) {

                return cb(null, true);
            }


            cb(
                new Error(
                    'Envie somente arquivos .xls, .xlsx ou .csv.'
                )
            );
        }
    });


function normalizarTextoImportacao(valor) {

    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

}


function normalizarCodigoImportacao(valor) {

    return String(valor || '')
        .trim();

}


function converterNumeroImportacao(valor) {

    if (
        typeof valor === 'number'
        &&
        Number.isFinite(valor)
    ) {

        return valor;
    }


    let texto = String(valor || '')
        .trim()
        .replace(/\s/g, '');


    if (!texto) {
        return null;
    }


    const ultimaVirgula =
        texto.lastIndexOf(',');

    const ultimoPonto =
        texto.lastIndexOf('.');


    if (
        ultimaVirgula > ultimoPonto
    ) {

        texto = texto
            .replace(/\./g, '')
            .replace(',', '.');
    }

    else if (
        ultimoPonto > ultimaVirgula
    ) {

        texto = texto
            .replace(/,/g, '');
    }

    else {

        texto = texto.replace(',', '.');
    }


    const numero = Number(texto);

    return Number.isFinite(numero)
        ? numero
        : null;

}


function encontrarIndiceColunaImportacao(
    cabecalho,
    opcoes
) {

    return cabecalho.findIndex(coluna => {

        const nome =
            normalizarTextoImportacao(coluna);

        return opcoes.some(opcao =>
            nome === opcao
            ||
            nome.includes(opcao)
        );
    });

}


function detectarOrigemImportacao(linhas) {

    const titulo = linhas
        .slice(0, 3)
        .flat()
        .map(normalizarTextoImportacao)
        .join(' ');


    if (titulo.includes('world classic')) {
        return 'WORLD CLASSIC';
    }


    if (titulo.includes('bm36')) {
        return 'BM36';
    }


    return null;

}


function lerPlanilhaImportacao(arquivo) {

    const workbook = XLSX.read(
        arquivo.buffer,
        {
            type: 'buffer',
            raw: false
        }
    );


    const primeiraAba = workbook.SheetNames[0];


    if (!primeiraAba) {
        throw new Error('A planilha não possui nenhuma aba.');
    }


    const linhas = XLSX.utils.sheet_to_json(
        workbook.Sheets[primeiraAba],
        {
            header: 1,
            defval: '',
            raw: false,
            blankrows: false
        }
    );


    const indiceCabecalho = linhas.findIndex(linha =>
        linha.some(celula =>
            normalizarTextoImportacao(celula) === 'codigo'
        )
    );


    if (indiceCabecalho < 0) {
        throw new Error(
            'Não encontramos a coluna "Código" nesta planilha.'
        );
    }


    const cabecalho = linhas[indiceCabecalho];

    const indiceCodigo =
        encontrarIndiceColunaImportacao(
            cabecalho,
            ['codigo']
        );

    const indiceEstoque =
        encontrarIndiceColunaImportacao(
            cabecalho,
            ['est. fisico', 'estoque fisico']
        );

    const indiceCorredor =
        encontrarIndiceColunaImportacao(
            cabecalho,
            ['cor.', 'corredor']
        );

    const indicePrateleira =
        encontrarIndiceColunaImportacao(
            cabecalho,
            ['prat', 'prateleira']
        );

    const indicePosicao =
        encontrarIndiceColunaImportacao(
            cabecalho,
            ['posicao', 'posição', 'pos.']
        );

    const indicePreco =
        encontrarIndiceColunaImportacao(
            cabecalho,
            [
                'preco venda',
                'preco',
                'valor venda',
                'vl venda'
            ]
        );

    const origem = detectarOrigemImportacao(linhas);


    if (!origem) {
        throw new Error(
            'Não foi possível identificar a origem BM36 ou WORLD CLASSIC.'
        );
    }


    if (
        indiceEstoque < 0
        &&
        indiceCorredor < 0
        &&
        indicePrateleira < 0
        &&
        indicePosicao < 0
        &&
        indicePreco < 0
    ) {

        throw new Error(
            'Não encontramos colunas de estoque, localização ou preço.'
        );
    }


    const registros = [];
    const erros = [];


    linhas
        .slice(indiceCabecalho + 1)
        .forEach((linha, indice) => {

            const codigo = normalizarCodigoImportacao(
                linha[indiceCodigo]
            );


            if (!codigo) {
                return;
            }


            const registro = {
                codigo,
                origem,
                linha: indiceCabecalho + indice + 2
            };


            if (indiceEstoque >= 0) {

                registro.estoque =
                    converterNumeroImportacao(
                        linha[indiceEstoque]
                    );


                if (registro.estoque === null) {

                    erros.push(
                        `Linha ${registro.linha}: estoque físico inválido para o código ${codigo}.`
                    );

                    return;
                }
            }


            if (indicePreco >= 0) {

                registro.preco =
                    converterNumeroImportacao(
                        linha[indicePreco]
                    );


                if (registro.preco === null) {

                    erros.push(
                        `Linha ${registro.linha}: preço inválido para o código ${codigo}.`
                    );

                    return;
                }
            }


            if (indiceCorredor >= 0) {
                registro.corredor = String(
                    linha[indiceCorredor] || ''
                ).trim();
            }


            if (indicePrateleira >= 0) {
                registro.prateleira = String(
                    linha[indicePrateleira] || ''
                ).trim();
            }

            if (indicePosicao >= 0) {
                registro.posicao = String(
                    linha[indicePosicao] || ''
                ).trim();
            }


            registros.push(registro);
        });


    return {
        nome: arquivo.originalname,
        aba: primeiraAba,
        origem,
        cabecalho: cabecalho
            .filter(Boolean)
            .map(valor => String(valor).trim()),
        tipo: indiceEstoque >= 0
            ? 'estoque_fisico'
            : indicePreco >= 0
                ? 'precos'
                : 'localizacao',
        registros,
        erros
    };

}


function consolidarRegistrosImportacao(planilhas) {

    const registros = new Map();


    planilhas.forEach(planilha => {

        planilha.registros.forEach(registro => {

            const chave =
                `${registro.origem}::${registro.codigo}`;

            const atual = registros.get(chave) || {
                codigo: registro.codigo,
                origem: registro.origem
            };


            [
                'estoque',
                'preco',
                'corredor',
                'prateleira',
                'posicao'
            ].forEach(campo => {

                if (
                    registro[campo] !== undefined
                    &&
                    registro[campo] !== ''
                ) {
                    atual[campo] = registro[campo];
                }
            });


            registros.set(chave, atual);
        });
    });


    return [...registros.values()];

}


async function analisarImportacaoPlanilhas(arquivos) {

    const planilhas = [];
    const erros = [];


    arquivos.forEach(arquivo => {

        try {
            planilhas.push(
                lerPlanilhaImportacao(arquivo)
            );
        } catch (erro) {
            erros.push(
                `${arquivo.originalname}: ${erro.message}`
            );
        }
    });


    const registros =
        consolidarRegistrosImportacao(planilhas);


    const resultadoProdutos = await pool.query(`
        SELECT
            p.id,
            p.codigo,
            p.codigo_fabricante,
            p.origem,
            p.corredor,
            p.prateleira,
            p.posicao,
            p.preco_venda,

            COALESCE(
                SUM(
                    CASE
                        WHEN m.tipo IN ('ENTRADA', 'AJUSTE_POSITIVO')
                            THEN m.quantidade
                        WHEN m.tipo IN ('SAIDA', 'AJUSTE_NEGATIVO')
                            THEN -m.quantidade
                        ELSE 0
                    END
                ),
                0
            ) AS estoque_atual

        FROM produtos p

        LEFT JOIN movimentacoes_estoque m
            ON m.produto_id = p.id

        GROUP BY p.id
    `);


    const produtosPorChave = new Map();

    resultadoProdutos.rows.forEach(produto => {
        [produto.codigo, produto.codigo_fabricante]
            .filter(Boolean)
            .forEach(codigo => {
                produtosPorChave.set(
                    `${produto.origem}::${codigo}`,
                    produto
                );
            });
    });

    let encontrados = 0;
    let naoEncontrados = 0;
    let atualizacoesEstoque = 0;
    let atualizacoesLocalizacao = 0;
    let atualizacoesPreco = 0;


    const amostra = registros
        .slice(0, 12)
        .map(registro => {

            const produto = produtosPorChave.get(
                `${registro.origem}::${registro.codigo}`
            );


            if (produto) {
                encontrados += 1;


                if (registro.estoque !== undefined) {
                    atualizacoesEstoque += 1;
                }

                if (
                    registro.corredor !== undefined
                    ||
                    registro.prateleira !== undefined
                    ||
                    registro.posicao !== undefined
                ) {
                    atualizacoesLocalizacao += 1;
                }

                if (registro.preco !== undefined) {
                    atualizacoesPreco += 1;
                }
            }

            else {
                naoEncontrados += 1;
            }


            return {
                codigo: registro.codigo,
                origem: registro.origem,
                encontrado: Boolean(produto),
                estoque: registro.estoque,
                corredor: registro.corredor,
                prateleira: registro.prateleira,
                posicao: registro.posicao,
                preco: registro.preco
            };
        });


    // Conta os registros restantes que não entraram na amostra.
    registros.slice(12).forEach(registro => {

        const produto = produtosPorChave.get(
            `${registro.origem}::${registro.codigo}`
        );


        if (produto) {
            encontrados += 1;

            if (registro.estoque !== undefined) {
                atualizacoesEstoque += 1;
            }

            if (
                registro.corredor !== undefined
                ||
                registro.prateleira !== undefined
                ||
                registro.posicao !== undefined
            ) {
                atualizacoesLocalizacao += 1;
            }

            if (registro.preco !== undefined) {
                atualizacoesPreco += 1;
            }
        }

        else {
            naoEncontrados += 1;
        }
    });


    planilhas.forEach(planilha => {
        erros.push(...planilha.erros);
    });


    return {
        planilhas: planilhas.map(planilha => ({
            nome: planilha.nome,
            aba: planilha.aba,
            origem: planilha.origem,
            tipo: planilha.tipo,
            cabecalho: planilha.cabecalho,
            registros: planilha.registros.length
        })),
        registros,
        produtosPorChave,
        resumo: {
            arquivos: planilhas.length,
            registros: registros.length,
            encontrados,
            naoEncontrados,
            atualizacoesEstoque,
            atualizacoesLocalizacao,
            atualizacoesPreco,
            erros: erros.length
        },
        amostra,
        erros: erros.slice(0, 30)
    };

}


app.post(
    '/api/importacoes/preview',
    autenticar,
    somenteAdmin,
    uploadPlanilhasImportacao.array('arquivos', 6),
    async (req, res) => {

        try {

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Selecione ao menos uma planilha.'
                });
            }


            const analise = await analisarImportacaoPlanilhas(
                req.files
            );


            res.json({
                sucesso: true,
                ...analise,
                registros: undefined,
                produtosPorChave: undefined
            });

        } catch (erro) {

            console.error('Erro ao gerar prévia da importação:', erro);

            res.status(500).json({
                sucesso: false,
                mensagem: 'Não foi possível ler as planilhas enviadas.'
            });
        }
    }
);


app.post(
    '/api/importacoes/aplicar',
    autenticar,
    somenteAdmin,
    uploadPlanilhasImportacao.array('arquivos', 6),
    async (req, res) => {

        const client = await pool.connect();


        try {

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Selecione novamente as planilhas para confirmar a atualização.'
                });
            }


            const atualizarEstoque =
                req.body.atualizarEstoque === 'true';

            const atualizarLocalizacao =
                req.body.atualizarLocalizacao === 'true';

            const atualizarPreco =
                req.body.atualizarPreco === 'true';


            if (
                !atualizarEstoque
                &&
                !atualizarLocalizacao
                &&
                !atualizarPreco
            ) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Selecione pelo menos um tipo de atualização.'
                });
            }


            const analise = await analisarImportacaoPlanilhas(
                req.files
            );


            if (analise.resumo.erros > 0) {
                return res.status(400).json({
                    sucesso: false,
                    mensagem: 'Corrija os erros da planilha antes de aplicar a importação.',
                    erros: analise.erros
                });
            }


            await client.query('BEGIN');


            let estoqueAtualizado = 0;
            let localizacaoAtualizada = 0;
            let precoAtualizado = 0;
            let naoEncontrados = 0;


            for (const registro of analise.registros) {

                const produto = analise.produtosPorChave.get(
                    `${registro.origem}::${registro.codigo}`
                );


                if (!produto) {
                    naoEncontrados += 1;
                    continue;
                }


                const deveAtualizarLocalizacao =
                    atualizarLocalizacao
                    &&
                    (
                        registro.corredor !== undefined
                        ||
                        registro.prateleira !== undefined
                        ||
                        registro.posicao !== undefined
                    );

                const deveAtualizarPreco =
                    atualizarPreco
                    &&
                    registro.preco !== undefined;


                if (
                    deveAtualizarLocalizacao
                    ||
                    deveAtualizarPreco
                ) {

                    await client.query(
                        `
                        UPDATE produtos

                        SET
                            corredor = CASE
                                WHEN $1 THEN $2
                                ELSE corredor
                            END,

                            prateleira = CASE
                                WHEN $1 THEN $3
                                ELSE prateleira
                            END,

                            posicao = CASE
                                WHEN $1 THEN $4
                                ELSE posicao
                            END,

                            preco_venda = CASE
                                WHEN $5 THEN $6
                                ELSE preco_venda
                            END

                        WHERE id = $7
                        `,
                        [
                            deveAtualizarLocalizacao,
                            registro.corredor || null,
                            registro.prateleira || null,
                            registro.posicao || null,
                            deveAtualizarPreco,
                            registro.preco,
                            produto.id
                        ]
                    );


                    if (deveAtualizarLocalizacao) {
                        localizacaoAtualizada += 1;
                    }


                    if (deveAtualizarPreco) {
                        precoAtualizado += 1;
                    }
                }


                if (
                    atualizarEstoque
                    &&
                    registro.estoque !== undefined
                ) {

                    const diferenca =
                        Number(registro.estoque)
                        -
                        Number(produto.estoque_atual);


                    if (diferenca !== 0) {

                        await client.query(
                            `
                            INSERT INTO movimentacoes_estoque (
                                produto_id,
                                usuario_id,
                                tipo,
                                quantidade,
                                motivo
                            )

                            VALUES ($1, $2, $3, $4, $5)
                            `,
                            [
                                produto.id,
                                req.usuario.id,
                                diferenca > 0
                                    ? 'AJUSTE_POSITIVO'
                                    : 'AJUSTE_NEGATIVO',
                                Math.abs(diferenca),
                                'Importação de estoque físico do sistema antigo'
                            ]
                        );


                        estoqueAtualizado += 1;
                    }
                }
            }


            await client.query('COMMIT');


            res.json({
                sucesso: true,
                mensagem: 'Importação concluída com sucesso.',
                resumo: {
                    estoqueAtualizado,
                    localizacaoAtualizada,
                    precoAtualizado,
                    naoEncontrados
                }
            });

        } catch (erro) {

            await client.query('ROLLBACK');

            console.error('Erro ao aplicar importação:', erro);

            res.status(500).json({
                sucesso: false,
                mensagem: 'Não foi possível aplicar a importação.'
            });
        } finally {
            client.release();
        }
    }
);


// ============================================================
// USUÁRIOS / FUNCIONÁRIOS
// SOMENTE ADMINISTRADORES
// ============================================================


// ============================================================
// LISTAR FUNCIONÁRIOS
// ============================================================

app.get(
    '/api/usuarios',
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        email,
                        perfil,
                        ativo,
                        criado_em,
                        atualizado_em

                    FROM usuarios

                    ORDER BY
                        ativo DESC,
                        nome ASC
                    `
                );


            return res.json(
                resultado.rows
            );


        } catch (erro) {

            console.error(
                'Erro ao listar usuários:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        'Erro ao carregar funcionários.'

                });

        }

    }
);


// ============================================================
// BUSCAR UM FUNCIONÁRIO
// ============================================================

app.get(
    '/api/usuarios/:id',
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const id =
                Number(req.params.id);


            if (!id) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'ID inválido.'

                    });

            }


            const resultado =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        email,
                        perfil,
                        ativo,
                        criado_em,
                        atualizado_em

                    FROM usuarios

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [
                        id
                    ]
                );


            if (
                resultado.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({

                        mensagem:
                            'Funcionário não encontrado.'

                    });

            }


            return res.json(
                resultado.rows[0]
            );


        } catch (erro) {

            console.error(
                'Erro ao buscar funcionário:',
                erro
            );


            return res
                .status(500)
                .json({

                    mensagem:
                        'Erro ao buscar funcionário.'

                });

        }

    }
);


// ============================================================
// CADASTRAR FUNCIONÁRIO
// ============================================================

app.post(
    '/api/usuarios',
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            let {
                nome,
                email,
                senha,
                perfil,
                ativo
            } = req.body;


            // ====================================================
            // VALIDAÇÕES
            // ====================================================

            nome =
                String(nome || '')
                    .trim();


            email =
                String(email || '')
                    .trim()
                    .toLowerCase();


            perfil =
                String(
                    perfil || 'VENDEDOR'
                )
                    .toUpperCase();


            if (
                !nome ||
                !email ||
                !senha
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Nome, e-mail e senha são obrigatórios.'

                    });

            }


            if (
                senha.length < 6
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'A senha deve possuir pelo menos 6 caracteres.'

                    });

            }


            if (
                ![
                    'ADMIN',
                    'VENDEDOR'
                ].includes(perfil)
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Perfil inválido.'

                    });

            }


            // ====================================================
            // VERIFICAR E-MAIL
            // ====================================================

            const existente =
                await pool.query(
                    `
                    SELECT id

                    FROM usuarios

                    WHERE LOWER(email) =
                          LOWER($1)

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

                return res
                    .status(409)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Já existe um funcionário usando este e-mail.'

                    });

            }


            // ====================================================
            // HASH DA SENHA
            // ====================================================

            const senhaHash =
                await bcrypt.hash(
                    senha,
                    12
                );


            // ====================================================
            // CADASTRAR
            // ====================================================

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
                        $4,
                        $5

                    )

                    RETURNING

                        id,
                        nome,
                        email,
                        perfil,
                        ativo,
                        criado_em
                    `,
                    [

                        nome,

                        email,

                        senhaHash,

                        perfil,

                        ativo !== false

                    ]
                );


            return res
                .status(201)
                .json({

                    sucesso: true,

                    mensagem:
                        'Funcionário cadastrado com sucesso!',

                    usuario:
                        resultado.rows[0]

                });


        } catch (erro) {

            console.error(
                'Erro ao cadastrar funcionário:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        'Erro ao cadastrar funcionário.'

                });

        }

    }
);


// ============================================================
// EDITAR FUNCIONÁRIO
// ============================================================

app.put(
    '/api/usuarios/:id',
    autenticar,
    somenteAdmin,
    async (req, res) => {

        try {

            const id =
                Number(
                    req.params.id
                );


            let {

                nome,
                email,
                senha,
                perfil,
                ativo

            } = req.body;


            if (!id) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'ID inválido.'

                    });

            }


            nome =
                String(nome || '')
                    .trim();


            email =
                String(email || '')
                    .trim()
                    .toLowerCase();


            perfil =
                String(
                    perfil || ''
                )
                    .toUpperCase();


            if (
                !nome ||
                !email
            ) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'Nome e e-mail são obrigatórios.'

                    });

            }


            if (
                ![
                    'ADMIN',
                    'VENDEDOR'
                ].includes(perfil)
            ) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'Perfil inválido.'

                    });

            }


            // ====================================================
            // NÃO DEIXAR O ADMIN DESATIVAR A PRÓPRIA CONTA
            // ====================================================

            if (
                Number(req.usuario.id) ===
                id
                &&
                ativo === false
            ) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'Você não pode desativar a própria conta.'

                    });

            }


            // ====================================================
            // VERIFICAR E-MAIL DUPLICADO
            // ====================================================

            const existente =
                await pool.query(
                    `
                    SELECT id

                    FROM usuarios

                    WHERE LOWER(email) =
                          LOWER($1)

                    AND id <> $2

                    LIMIT 1
                    `,
                    [
                        email,
                        id
                    ]
                );


            if (
                existente.rows.length >
                0
            ) {

                return res
                    .status(409)
                    .json({

                        mensagem:
                            'Este e-mail já pertence a outro funcionário.'

                    });

            }


            // ====================================================
            // ALTERAÇÃO COM NOVA SENHA
            // ====================================================

            if (
                senha &&
                senha.trim() !== ''
            ) {

                if (
                    senha.length < 6
                ) {

                    return res
                        .status(400)
                        .json({

                            mensagem:
                                'A senha deve possuir pelo menos 6 caracteres.'

                        });

                }


                const senhaHash =
                    await bcrypt.hash(
                        senha,
                        12
                    );


                const resultado =
                    await pool.query(
                        `
                        UPDATE usuarios

                        SET
                            nome = $1,
                            email = $2,
                            perfil = $3,
                            ativo = $4,
                            senha_hash = $5,
                            atualizado_em = NOW()

                        WHERE id = $6

                        RETURNING
                            id,
                            nome,
                            email,
                            perfil,
                            ativo,
                            criado_em,
                            atualizado_em
                        `,
                        [

                            nome,
                            email,
                            perfil,
                            ativo !== false,
                            senhaHash,
                            id

                        ]
                    );


                if (
                    resultado.rows.length ===
                    0
                ) {

                    return res
                        .status(404)
                        .json({

                            mensagem:
                                'Funcionário não encontrado.'

                        });

                }


                return res.json({

                    sucesso: true,

                    mensagem:
                        'Funcionário alterado com sucesso!',

                    usuario:
                        resultado.rows[0]

                });

            }


            // ====================================================
            // ALTERAÇÃO SEM MUDAR SENHA
            // ====================================================

            const resultado =
                await pool.query(
                    `
                    UPDATE usuarios

                    SET
                        nome = $1,
                        email = $2,
                        perfil = $3,
                        ativo = $4,
                        atualizado_em = NOW()

                    WHERE id = $5

                    RETURNING
                        id,
                        nome,
                        email,
                        perfil,
                        ativo,
                        criado_em,
                        atualizado_em
                    `,
                    [

                        nome,
                        email,
                        perfil,
                        ativo !== false,
                        id

                    ]
                );


            if (
                resultado.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({

                        mensagem:
                            'Funcionário não encontrado.'

                    });

            }


            return res.json({

                sucesso: true,

                mensagem:
                    'Funcionário alterado com sucesso!',

                usuario:
                    resultado.rows[0]

            });


        } catch (erro) {

            console.error(
                'Erro ao editar funcionário:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        'Erro ao editar funcionário.'

                });

        }

    }
);

// ============================================================
// UPLOAD DE FOTO DE PERFIL
// ============================================================

const pastaUsuarios =
    path.join(
        __dirname,
        'uploads',
        'usuarios'
    );


// cria a pasta automaticamente se não existir
if (
    !fs.existsSync(
        pastaUsuarios
    )
) {

    fs.mkdirSync(
        pastaUsuarios,
        {
            recursive: true
        }
    );

}


const storageUsuario =
    multer.diskStorage({

        destination: (
            req,
            file,
            cb
        ) => {

            cb(
                null,
                pastaUsuarios
            );

        },

        filename: (
            req,
            file,
            cb
        ) => {

            const extensao =
                path.extname(
                    file.originalname
                )
                    .toLowerCase();


            const nomeArquivo =
                `usuario-${req.usuario.id}-${Date.now()}${extensao}`;


            cb(
                null,
                nomeArquivo
            );

        }

    });


const uploadFotoUsuario =
    multer({

        storage:
            storageUsuario,

        limits: {

            fileSize:
                5 * 1024 * 1024

        },

        fileFilter: (
            req,
            file,
            cb
        ) => {

            const tiposPermitidos =
                [
                    'image/jpeg',
                    'image/png',
                    'image/webp'
                ];


            if (
                !tiposPermitidos.includes(
                    file.mimetype
                )
            ) {

                return cb(
                    new Error(
                        'Formato de imagem não permitido.'
                    )
                );

            }


            cb(
                null,
                true
            );

        }

    });
    app.use(
    '/uploads',
    express.static(
        path.join(
            __dirname,
            'uploads'
        )
    )
);

// ============================================================
// MEU PERFIL
// ============================================================

app.get(
    '/api/me',
    autenticar,
    async (req, res) => {

        try {

         const resultado =
    await pool.query(
        `
        SELECT
            u.id,
            u.nome,
            u.email,
            u.perfil,
            u.ativo,
            u.foto_url,
            u.criado_em,

            u.evento_ativo_id,

            e.nome AS evento_ativo_nome,
            e.status AS evento_ativo_status

        FROM usuarios u

        LEFT JOIN eventos e
            ON e.id = u.evento_ativo_id

        WHERE u.id = $1

        LIMIT 1
        `,
        [
            req.usuario.id
        ]
    );

            if (
                resultado.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({

                        mensagem:
                            'Usuário não encontrado.'

                    });

            }


            return res.json(
                resultado.rows[0]
            );


        } catch (erro) {

            console.error(
                'Erro ao buscar perfil:',
                erro
            );


            return res
                .status(500)
                .json({

                    mensagem:
                        'Erro ao carregar perfil.'

                });

        }

    }
);


// ============================================================
// EDITAR MEU PERFIL
// ============================================================

app.put(
    '/api/me',
    autenticar,
    async (req, res) => {

        try {

            let {
                nome,
                email
            } = req.body;


            nome =
                String(
                    nome || ''
                )
                    .trim();


            email =
                String(
                    email || ''
                )
                    .trim()
                    .toLowerCase();


            if (
                !nome ||
                !email
            ) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'Nome e e-mail são obrigatórios.'

                    });

            }


            const emailExistente =
                await pool.query(
                    `
                    SELECT id

                    FROM usuarios

                    WHERE LOWER(email) =
                          LOWER($1)

                    AND id <> $2

                    LIMIT 1
                    `,
                    [
                        email,
                        req.usuario.id
                    ]
                );


            if (
                emailExistente.rows.length >
                0
            ) {

                return res
                    .status(409)
                    .json({

                        mensagem:
                            'Este e-mail já está sendo usado.'

                    });

            }


            const resultado =
                await pool.query(
                    `
                    UPDATE usuarios

                    SET
                        nome = $1,
                        email = $2,
                        atualizado_em = NOW()

                    WHERE id = $3

                    RETURNING
                        id,
                        nome,
                        email,
                        perfil,
                        ativo,
                        foto_url
                    `,
                    [
                        nome,
                        email,
                        req.usuario.id
                    ]
                );


            return res.json({

                sucesso:
                    true,

                mensagem:
                    'Perfil atualizado com sucesso!',

                usuario:
                    resultado.rows[0]

            });


        } catch (erro) {

            console.error(
                'Erro ao atualizar perfil:',
                erro
            );


            return res
                .status(500)
                .json({

                    mensagem:
                        'Erro ao atualizar perfil.'

                });

        }

    }
);


// ============================================================
// TROCAR SENHA
// ============================================================

app.put(
    '/api/me/senha',
    autenticar,
    async (req, res) => {

        try {

            const {
                senhaAtual,
                novaSenha
            } = req.body;


            if (
                !senhaAtual ||
                !novaSenha
            ) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'Informe a senha atual e a nova senha.'

                    });

            }


            if (
                novaSenha.length <
                6
            ) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'A nova senha deve ter pelo menos 6 caracteres.'

                    });

            }


            const resultado =
                await pool.query(
                    `
                    SELECT senha_hash

                    FROM usuarios

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [
                        req.usuario.id
                    ]
                );


            if (
                resultado.rows.length ===
                0
            ) {

                return res
                    .status(404)
                    .json({

                        mensagem:
                            'Usuário não encontrado.'

                    });

            }


            const senhaCorreta =
                await bcrypt.compare(
                    senhaAtual,
                    resultado.rows[0]
                        .senha_hash
                );


            if (
                !senhaCorreta
            ) {

                return res
                    .status(401)
                    .json({

                        mensagem:
                            'Senha atual incorreta.'

                    });

            }


            const novaSenhaHash =
                await bcrypt.hash(
                    novaSenha,
                    12
                );


            await pool.query(
                `
                UPDATE usuarios

                SET
                    senha_hash = $1,
                    atualizado_em = NOW()

                WHERE id = $2
                `,
                [
                    novaSenhaHash,
                    req.usuario.id
                ]
            );


            return res.json({

                sucesso:
                    true,

                mensagem:
                    'Senha alterada com sucesso!'

            });


        } catch (erro) {

            console.error(
                'Erro ao alterar senha:',
                erro
            );


            return res
                .status(500)
                .json({

                    mensagem:
                        'Erro ao alterar senha.'

                });

        }

    }
);


// ============================================================
// FOTO DE PERFIL
// ============================================================

app.post(
    '/api/me/foto',
    autenticar,
    uploadFotoUsuario.single(
        'foto'
    ),
    async (req, res) => {

        try {

            if (
                !req.file
            ) {

                return res
                    .status(400)
                    .json({

                        mensagem:
                            'Nenhuma imagem enviada.'

                    });

            }


            const fotoUrl =
                `/uploads/usuarios/${req.file.filename}`;


            const resultado =
                await pool.query(
                    `
                    UPDATE usuarios

                    SET
                        foto_url = $1,
                        atualizado_em = NOW()

                    WHERE id = $2

                    RETURNING
                        id,
                        nome,
                        email,
                        perfil,
                        ativo,
                        foto_url
                    `,
                    [
                        fotoUrl,
                        req.usuario.id
                    ]
                );


            return res.json({

                sucesso:
                    true,

                mensagem:
                    'Foto atualizada com sucesso!',

                usuario:
                    resultado.rows[0]

            });


        } catch (erro) {

            console.error(
                'Erro ao enviar foto:',
                erro
            );


            return res
                .status(500)
                .json({

                    mensagem:
                        'Erro ao enviar foto.'

                });

        }

    }
);
// ============================================================
// REMOVER FOTO DE PERFIL
// ============================================================

app.delete(
    '/api/me/foto',
    autenticar,
    async (req, res) => {

        try {

            const resultadoAtual =
                await pool.query(
                    `
                    SELECT foto_url
                    FROM usuarios
                    WHERE id = $1
                    LIMIT 1
                    `,
                    [req.usuario.id]
                );


            if (
                resultadoAtual.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({
                        mensagem:
                            'Usuário não encontrado.'
                    });

            }


            const fotoAtual =
                resultadoAtual.rows[0].foto_url;


            // remove do banco
            const resultado =
                await pool.query(
                    `
                    UPDATE usuarios

                    SET
                        foto_url = NULL,
                        atualizado_em = NOW()

                    WHERE id = $1

                    RETURNING
                        id,
                        nome,
                        email,
                        perfil,
                        ativo,
                        foto_url
                    `,
                    [req.usuario.id]
                );


            // remove o arquivo físico antigo
            if (fotoAtual) {

                const nomeArquivo =
                    path.basename(
                        fotoAtual
                    );


                const caminhoArquivo =
                    path.join(
                        pastaUsuarios,
                        nomeArquivo
                    );


                if (
                    fs.existsSync(
                        caminhoArquivo
                    )
                ) {

                    try {

                        fs.unlinkSync(
                            caminhoArquivo
                        );

                    } catch (erroArquivo) {

                        console.error(
                            'Não foi possível apagar a foto antiga:',
                            erroArquivo
                        );

                    }

                }

            }


            return res.json({

                sucesso: true,

                mensagem:
                    'Foto removida com sucesso!',

                usuario:
                    resultado.rows[0]

            });


        } catch (erro) {

            console.error(
                'Erro ao remover foto:',
                erro
            );


            return res
                .status(500)
                .json({

                    mensagem:
                        'Erro ao remover foto.'

                });

        }

    }
);


// ============================================================
// EVENTOS
// ============================================================


// =========================
// LISTAR EVENTOS
// =========================

app.get(
    '/api/eventos',
    autenticar,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT
                        e.id,
                        e.nome,
                        e.descricao,
                        e.data_inicio,
                        e.data_fim,
                        e.status,
                        e.criado_em,
                        e.atualizado_em,

                        COUNT(v.id) AS quantidade_pedidos,

                        COALESCE(
                            SUM(
                                CASE
                                    WHEN v.status <> 'CANCELADA'
                                    THEN v.total
                                    ELSE 0
                                END
                            ),
                            0
                        ) AS total_vendido

                    FROM eventos e

                    LEFT JOIN vendas v
                        ON v.evento_id = e.id

                    GROUP BY
                        e.id,
                        e.nome,
                        e.descricao,
                        e.data_inicio,
                        e.data_fim,
                        e.status,
                        e.criado_em,
                        e.atualizado_em

                    ORDER BY
                        e.data_inicio DESC NULLS LAST,
                        e.id DESC
                    `
                );


            return res.json(
                resultado.rows
            );


        } catch (erro) {

            console.error(
                'Erro ao listar eventos:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        'Erro ao listar eventos.'

                });

        }

    }
);


// =========================
// CRIAR EVENTO
// =========================

app.post(
    '/api/eventos',
    autenticar,
    async (req, res) => {

        try {

            const {
                nome,
                descricao = null,
                data_inicio = null,
                data_fim = null
            } = req.body;


            if (
                !nome ||
                !String(nome).trim()
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'O nome do evento é obrigatório.'

                    });

            }


            if (
                data_inicio &&
                data_fim &&
                new Date(data_fim) < new Date(data_inicio)
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'A data final não pode ser anterior à data inicial.'

                    });

            }


            const resultado =
                await pool.query(
                    `
                    INSERT INTO eventos (
                        nome,
                        descricao,
                        data_inicio,
                        data_fim,
                        status,
                        criado_em,
                        atualizado_em
                    )

                    VALUES (
                        $1,
                        $2,
                        $3,
                        $4,
                        'ATIVO',
                        NOW(),
                        NOW()
                    )

                    RETURNING *
                    `,
                    [
                        String(nome).trim(),

                        descricao
                            ? String(descricao).trim()
                            : null,

                        data_inicio || null,

                        data_fim || null
                    ]
                );


            return res
                .status(201)
                .json({

                    sucesso: true,

                    mensagem:
                        'Evento criado com sucesso!',

                    evento:
                        resultado.rows[0]

                });


        } catch (erro) {

            console.error(
                'Erro ao criar evento:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        'Erro ao criar evento.'

                });

        }

    }
);


// =========================
// DETALHES DO EVENTO
// =========================

app.get(
    '/api/eventos/:id',
    autenticar,
    async (req, res) => {

        try {

            const eventoId =
                Number(
                    req.params.id
                );


            if (
                !Number.isInteger(eventoId)
                ||
                eventoId <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Evento inválido.'

                    });

            }


            const resultadoEvento =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        descricao,
                        data_inicio,
                        data_fim,
                        status,
                        criado_em,
                        atualizado_em

                    FROM eventos

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [
                        eventoId
                    ]
                );


            if (
                resultadoEvento.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Evento não encontrado.'

                    });

            }


            const resultadoPedidos =
                await pool.query(
                    `
                    SELECT
                        v.id,
                        v.cliente_id,
                        c.nome AS cliente_nome,

                        v.usuario_id,
                        u.nome AS usuario_nome,
                        v.evento_id,

                        v.subtotal,
                        v.desconto,
                        v.total,
                        v.status,
                        v.criado_em

                    FROM vendas v

                    INNER JOIN clientes c
                        ON c.id = v.cliente_id

                    LEFT JOIN usuarios u
                        ON u.id = v.usuario_id

                    WHERE v.evento_id = $1

                    ORDER BY
                        v.criado_em DESC,
                        v.id DESC
                    `,
                    [
                        eventoId
                    ]
                );


            const resultadoProdutos =
                await pool.query(
                    `
                    SELECT
                        p.id,
                        p.codigo,
                        p.nome,

                        SUM(iv.quantidade) AS quantidade_vendida,

                        SUM(iv.subtotal) AS total_vendido

                    FROM vendas v

                    INNER JOIN itens_venda iv
                        ON iv.venda_id = v.id

                    INNER JOIN produtos p
                        ON p.id = iv.produto_id

                    WHERE
                        v.evento_id = $1
                        AND v.status <> 'CANCELADA'

                    GROUP BY
                        p.id,
                        p.codigo,
                        p.nome

                    ORDER BY
                        quantidade_vendida DESC,
                        p.nome
                    `,
                    [
                        eventoId
                    ]
                );


            const pedidos =
                resultadoPedidos.rows;


            const totalVendido =
                pedidos.reduce(
                    (total, pedido) => {

                        if (
                            String(
                                pedido.status || ''
                            )
                                .toUpperCase()
                            ===
                            'CANCELADA'
                        ) {

                            return total;

                        }


                        return (
                            total
                            +
                            Number(
                                pedido.total || 0
                            )
                        );

                    },
                    0
                );


            return res.json({

                sucesso: true,

                evento:
                    resultadoEvento.rows[0],

                resumo: {

                    quantidade_pedidos:
                        pedidos.length,

                    total_vendido:
                        totalVendido

                },

                pedidos,

                produtos:
                    resultadoProdutos.rows

            });


        } catch (erro) {

            console.error(
                'Erro ao buscar evento:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        'Erro ao buscar evento.'

                });

        }

    }
);


// =========================
// EDITAR EVENTO
// =========================

app.put(
    '/api/eventos/:id',
    autenticar,
    async (req, res) => {

        try {

            const eventoId =
                Number(
                    req.params.id
                );


            const {
                nome,
                descricao = null,
                data_inicio = null,
                data_fim = null,
                status
            } = req.body;


            if (
                !Number.isInteger(eventoId)
                ||
                eventoId <= 0
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Evento inválido.'

                    });

            }


            if (
                !nome ||
                !String(nome).trim()
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'O nome do evento é obrigatório.'

                    });

            }


            const statusPermitidos =
                [
                    'ATIVO',
                    'FINALIZADO',
                    'CANCELADO'
                ];


            const statusFinal =
                String(
                    status || 'ATIVO'
                )
                    .trim()
                    .toUpperCase();


            if (
                !statusPermitidos.includes(
                    statusFinal
                )
            ) {

                return res
                    .status(400)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Status do evento inválido.'

                    });

            }


            const resultado =
                await pool.query(
                    `
                    UPDATE eventos

                    SET
                        nome = $1,
                        descricao = $2,
                        data_inicio = $3,
                        data_fim = $4,
                        status = $5,
                        atualizado_em = NOW()

                    WHERE id = $6

                    RETURNING *
                    `,
                    [
                        String(nome).trim(),

                        descricao
                            ? String(descricao).trim()
                            : null,

                        data_inicio || null,

                        data_fim || null,

                        statusFinal,

                        eventoId
                    ]
                );


            if (
                resultado.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({

                        sucesso: false,

                        mensagem:
                            'Evento não encontrado.'

                    });

            }


            return res.json({

                sucesso: true,

                mensagem:
                    'Evento atualizado com sucesso!',

                evento:
                    resultado.rows[0]

            });


        } catch (erro) {

            console.error(
                'Erro ao atualizar evento:',
                erro
            );


            return res
                .status(500)
                .json({

                    sucesso: false,

                    mensagem:
                        'Erro ao atualizar evento.'

                });

        }

    }
);
// ============================================================
// ALTERAR STATUS DO EVENTO
// ============================================================

app.patch(
    '/api/eventos/:id/status',
    autenticar,
    async (req, res) => {

        try {

            const eventoId =
                Number(
                    req.params.id
                );


            const {
                status
            } = req.body;


            if (
                !Number.isInteger(eventoId)
                ||
                eventoId <= 0
            ) {

                return res
                    .status(400)
                    .json({
                        sucesso: false,
                        mensagem: 'Evento inválido.'
                    });

            }


            const statusPermitidos =
                [
                    'ATIVO',
                    'FINALIZADO',
                    'CANCELADO'
                ];


            const statusFinal =
                String(
                    status || ''
                )
                    .trim()
                    .toUpperCase();


            if (
                !statusPermitidos.includes(
                    statusFinal
                )
            ) {

                return res
                    .status(400)
                    .json({
                        sucesso: false,
                        mensagem: 'Status inválido.'
                    });

            }


            const resultado =
                await pool.query(
                    `
                    UPDATE eventos

                    SET
                        status = $1,
                        atualizado_em = NOW()

                    WHERE id = $2

                    RETURNING *
                    `,
                    [
                        statusFinal,
                        eventoId
                    ]
                );


            if (
                resultado.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({
                        sucesso: false,
                        mensagem: 'Evento não encontrado.'
                    });

            }


            return res.json({
                sucesso: true,
                mensagem: 'Status atualizado com sucesso!',
                evento: resultado.rows[0]
            });


        } catch (erro) {

            console.error(
                'Erro ao alterar status do evento:',
                erro
            );


            return res
                .status(500)
                .json({
                    sucesso: false,
                    mensagem: 'Erro ao alterar status do evento.'
                });

        }

    }
);











// ============================================================
// ENTRAR EM UM EVENTO
// ============================================================

app.patch(
    '/api/me/evento',
    autenticar,
    async (req, res) => {

        try {

            const eventoId =
                Number(
                    req.body.evento_id
                );


            if (
                !Number.isInteger(eventoId)
                ||
                eventoId <= 0
            ) {

                return res
                    .status(400)
                    .json({
                        sucesso: false,
                        mensagem: 'Evento inválido.'
                    });

            }


            // Verificar se o evento existe e está ativo
            const resultadoEvento =
                await pool.query(
                    `
                    SELECT
                        id,
                        nome,
                        status

                    FROM eventos

                    WHERE id = $1

                    LIMIT 1
                    `,
                    [
                        eventoId
                    ]
                );


            if (
                resultadoEvento.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({
                        sucesso: false,
                        mensagem: 'Evento não encontrado.'
                    });

            }


            const evento =
                resultadoEvento.rows[0];


            if (
                String(
                    evento.status || ''
                ).toUpperCase() !== 'ATIVO'
            ) {

                return res
                    .status(409)
                    .json({
                        sucesso: false,
                        mensagem:
                            'Você só pode entrar em eventos ativos.'
                    });

            }


            const resultadoUsuario =
                await pool.query(
                    `
                    UPDATE usuarios

                    SET
                        evento_ativo_id = $1,
                        atualizado_em = NOW()

                    WHERE id = $2

                    RETURNING
                        id,
                        nome,
                        email,
                        perfil,
                        evento_ativo_id
                    `,
                    [
                        eventoId,
                        req.usuario.id
                    ]
                );


            return res.json({

                sucesso: true,

                mensagem:
                    `Você entrou no evento "${evento.nome}".`,

                evento: {
                    id:
                        evento.id,

                    nome:
                        evento.nome,

                    status:
                        evento.status
                },

                usuario:
                    resultadoUsuario.rows[0]

            });


        } catch (erro) {

            console.error(
                'Erro ao entrar no evento:',
                erro
            );


            return res
                .status(500)
                .json({
                    sucesso: false,
                    mensagem:
                        'Erro ao entrar no evento.'
                });

        }

    }
);

// ============================================================
// SAIR DO EVENTO
// ============================================================

app.delete(
    '/api/me/evento',
    autenticar,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    UPDATE usuarios

                    SET
                        evento_ativo_id = NULL,
                        atualizado_em = NOW()

                    WHERE id = $1

                    RETURNING
                        id,
                        nome,
                        email,
                        perfil,
                        evento_ativo_id
                    `,
                    [
                        req.usuario.id
                    ]
                );


            if (
                resultado.rows.length === 0
            ) {

                return res
                    .status(404)
                    .json({
                        sucesso: false,
                        mensagem:
                            'Usuário não encontrado.'
                    });

            }


            return res.json({

                sucesso: true,

                mensagem:
                    'Você saiu do evento. As próximas vendas serão vendas normais.',

                usuario:
                    resultado.rows[0]

            });


        } catch (erro) {

            console.error(
                'Erro ao sair do evento:',
                erro
            );


            return res
                .status(500)
                .json({
                    sucesso: false,
                    mensagem:
                        'Erro ao sair do evento.'
                });

        }

    }
);


// =========================
// INICIAR SERVIDOR
// =========================

const PORT =
    process.env.PORT || 3000;


async function iniciarServidor() {

    try {

        // Garante que o banco publicado tenha as colunas usadas pela API.
        await pool.query(`
            ALTER TABLE produtos
                ADD COLUMN IF NOT EXISTS corredor TEXT,
                ADD COLUMN IF NOT EXISTS prateleira TEXT,
                ADD COLUMN IF NOT EXISTS posicao TEXT
        `);

        await pool.query(`
            ALTER TABLE clientes
                ADD COLUMN IF NOT EXISTS ie TEXT,
                ADD COLUMN IF NOT EXISTS codigo_sistema_antigo TEXT,
                ADD COLUMN IF NOT EXISTS origem_sistema_antigo TEXT
        `);

        app.listen(
            PORT,
            () => {

                console.log(
                    `API BM36 rodando em http://localhost:${PORT}`
                );

            }
        );

    } catch (erro) {

        console.error(
            'Erro ao preparar banco de dados:',
            erro
        );

        process.exit(1);

    }

}


iniciarServidor();
