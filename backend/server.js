import express from 'express';
import cors from 'cors';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_aqui';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/seu_banco',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// =========================
// MIDDLEWARE AUTENTICAÇÃO
// =========================

function autenticar(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token não fornecido.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.usuario = decoded;
        return next();
    } catch (erro) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Token inválido ou expirado.'
        });
    }
}

// =========================
// ROTAS DE AUTENTICAÇÃO
// =========================

app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Email e senha são obrigatórios.'
            });
        }

        const resultado = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1',
            [String(email).trim().toLowerCase()]
        );

        if (resultado.rows.length === 0) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Credenciais inválidas.'
            });
        }

        const usuario = resultado.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({
                sucesso: false,
                mensagem: 'Credenciais inválidas.'
            });
        }

        const token = jwt.sign(
            { id: usuario.id, nome: usuario.nome, email: usuario.email, nivel: usuario.nivel },
            JWT_SECRET,
            { expiresIn: '12h' }
        );

        return res.json({
            sucesso: true,
            mensagem: 'Login realizado com sucesso!',
            token,
            usuario: {
                id: usuario.id,
                nome: usuario.nome,
                email: usuario.email,
                nivel: usuario.nivel
            }
        });

    } catch (erro) {
        console.error('Erro no login:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro interno ao realizar login.'
        });
    }
});

// =========================
// ROTAS DE CAIXAS
// =========================

app.get('/api/caixas/status', autenticar, async (req, res) => {
    try {
        const resultado = await pool.query(
            "SELECT * FROM caixas WHERE status = 'ABERTO' ORDER BY data_abertura DESC LIMIT 1"
        );

        if (resultado.rows.length === 0) {
            return res.json({
                sucesso: true,
                caixaAberto: false,
                caixa: null
            });
        }

        return res.json({
            sucesso: true,
            caixaAberto: true,
            caixa: resultado.rows[0]
        });
    } catch (erro) {
        console.error('Erro ao verificar status do caixa:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao verificar caixa.'
        });
    }
});

app.post('/api/caixas/abrir', autenticar, async (req, res) => {
    try {
        const { valor_inicial } = req.body;

        const caixaAtual = await pool.query(
            "SELECT id FROM caixas WHERE status = 'ABERTO' LIMIT 1"
        );

        if (caixaAtual.rows.length > 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Já existe um caixa aberto.'
            });
        }

        const novoCaixa = await pool.query(
            `
            INSERT INTO caixas (usuario_id, valor_inicial, status, data_abertura)
            VALUES ($1, $2, 'ABERTO', NOW())
            RETURNING *
            `,
            [req.usuario.id, valor_inicial || 0]
        );

        return res.json({
            sucesso: true,
            mensagem: 'Caixa aberto com sucesso!',
            caixa: novoCaixa.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao abrir caixa:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao abrir caixa.'
        });
    }
});

app.post('/api/caixas/fechar', autenticar, async (req, res) => {
    try {
        const { valor_final, observacao } = req.body;

        const caixaAtual = await pool.query(
            "SELECT id FROM caixas WHERE status = 'ABERTO' LIMIT 1"
        );

        if (caixaAtual.rows.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não há caixa aberto para fechar.'
            });
        }

        const caixaId = caixaAtual.rows[0].id;

        const caixaFechado = await pool.query(
            `
            UPDATE caixas
            SET
                status = 'FECHADO',
                data_fechamento = NOW(),
                valor_final = $1,
                observacao = $2
            WHERE id = $3
            RETURNING *
            `,
            [valor_final || 0, observacao || null, caixaId]
        );

        return res.json({
            sucesso: true,
            mensagem: 'Caixa fechado com sucesso!',
            caixa: caixaFechado.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao fechar caixa:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao fechar caixa.'
        });
    }
});

// =========================
// ROTAS DE MOVIMENTAÇÕES
// =========================

app.post('/api/caixas/movimentacoes', autenticar, async (req, res) => {
    try {
        const { tipo, valor, descricao } = req.body;

        if (!tipo || !['ENTRADA', 'SAIDA'].includes(tipo)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Tipo de movimentação inválido.'
            });
        }

        if (!valor || valor <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Valor deve ser maior que zero.'
            });
        }

        const caixaAtual = await pool.query(
            "SELECT id FROM caixas WHERE status = 'ABERTO' LIMIT 1"
        );

        if (caixaAtual.rows.length === 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'É necessário ter um caixa aberto.'
            });
        }

        const novaMovimentacao = await pool.query(
            `
            INSERT INTO movimentacoes_caixa (caixa_id, usuario_id, tipo, valor, descricao, data_movimentacao)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING *
            `,
            [caixaAtual.rows[0].id, req.usuario.id, tipo, valor, descricao || null]
        );

        return res.json({
            sucesso: true,
            mensagem: 'Movimentação registrada com sucesso!',
            movimentacao: novaMovimentacao.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao registrar movimentação:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao registrar movimentação.'
        });
    }
});

// =========================
// FORMAS DE PAGAMENTO
// =========================

app.get('/api/formas-pagamento', autenticar, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM formas_pagamento WHERE ativo = true ORDER BY nome ASC'
        );

        return res.json({
            sucesso: true,
            formas: resultado.rows
        });
    } catch (erro) {
        console.error('Erro ao buscar formas de pagamento:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar formas de pagamento.'
        });
    }
});

// =========================
// ROTAS DE PRODUTOS
// =========================

app.get('/api/produtos', autenticar, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM produtos WHERE ativo = true ORDER BY nome ASC'
        );

        return res.json({
            sucesso: true,
            produtos: resultado.rows
        });
    } catch (erro) {
        console.error('Erro ao buscar produtos:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar produtos.'
        });
    }
});

// =========================
// ROTAS DE VENDAS
// =========================

app.post('/api/vendas', autenticar, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { itens, forma_pagamento_id, desconto = 0, observacao = null } = req.body;

        if (!Array.isArray(itens) || itens.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                sucesso: false,
                mensagem: 'A venda precisa conter pelo menos um item.'
            });
        }

        const caixaAtual = await client.query(
            "SELECT id FROM caixas WHERE status = 'ABERTO' LIMIT 1"
        );

        if (caixaAtual.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Não há caixa aberto no momento.'
            });
        }

        const caixaId = caixaAtual.rows[0].id;
        let subtotal = 0;

        for (const item of itens) {
            const prodRes = await client.query(
                'SELECT preco, estoque FROM produtos WHERE id = $1 AND ativo = true',
                [item.produto_id]
            );

            if (prodRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    sucesso: false,
                    mensagem: `Produto ID ${item.produto_id} não encontrado.`
                });
            }

            const produto = prodRes.rows[0];

            if (produto.estoque < item.quantidade) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    sucesso: false,
                    mensagem: `Estoque insuficiente para o produto ID ${item.produto_id}.`
                });
            }

            subtotal += Number(produto.preco) * Number(item.quantidade);
        }

        const total = Math.max(0, subtotal - Number(desconto));

        const vendaRes = await client.query(
            `
            INSERT INTO vendas (caixa_id, usuario_id, forma_pagamento_id, subtotal, desconto, total, observacao, data_venda)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING *
            `,
            [caixaId, req.usuario.id, forma_pagamento_id, subtotal, desconto, total, observacao]
        );

        const vendaId = vendaRes.rows[0].id;

        for (const item of itens) {
            const prodRes = await client.query(
                'SELECT preco FROM produtos WHERE id = $1',
                [item.produto_id]
            );

            const precoUnitario = prodRes.rows[0].preco;
            const itemTotal = Number(precoUnitario) * Number(item.quantidade);

            await client.query(
                `
                INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal)
                VALUES ($1, $2, $3, $4, $5)
                `,
                [vendaId, item.produto_id, item.quantidade, precoUnitario, itemTotal]
            );

            await client.query(
                `
                UPDATE produtos
                SET estoque = estoque - $1
                WHERE id = $2
                `,
                [item.quantidade, item.produto_id]
            );
        }

        await client.query('COMMIT');

        return res.json({
            sucesso: true,
            mensagem: 'Venda realizada com sucesso!',
            venda: vendaRes.rows[0]
        });

    } catch (erro) {
        await client.query('ROLLBACK');
        console.error('Erro ao realizar venda:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao processar venda.'
        });
    } finally {
        client.release();
    }
});

app.put('/api/vendas/:id', autenticar, async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const vendaId = Number(req.params.id);
        const { itens, forma_pagamento_id, desconto = 0, observacao = null } = req.body;

        if (!Number.isInteger(vendaId) || vendaId <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                sucesso: false,
                mensagem: 'ID de venda inválido.'
            });
        }

        const vendaExistente = await client.query(
            'SELECT * FROM vendas WHERE id = $1',
            [vendaId]
        );

        if (vendaExistente.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                sucesso: false,
                mensagem: 'Venda não encontrada.'
            });
        }

        const itensAntigos = await client.query(
            'SELECT * FROM itens_venda WHERE venda_id = $1',
            [vendaId]
        );

        for (const item of itensAntigos.rows) {
            await client.query(
                'UPDATE produtos SET estoque = estoque + $1 WHERE id = $2',
                [item.quantidade, item.produto_id]
            );
        }

        await client.query(
            'DELETE FROM itens_venda WHERE venda_id = $1',
            [vendaId]
        );

        let subtotal = 0;

        for (const item of itens) {
            const prodRes = await client.query(
                'SELECT preco, estoque FROM produtos WHERE id = $1 AND ativo = true',
                [item.produto_id]
            );

            if (prodRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    sucesso: false,
                    mensagem: `Produto ID ${item.produto_id} não encontrado.`
                });
            }

            const produto = prodRes.rows[0];

            if (produto.estoque < item.quantidade) {
                await client.query('ROLLBACK');
                return res.status(400).json({
                    sucesso: false,
                    mensagem: `Estoque insuficiente para o produto ID ${item.produto_id}.`
                });
            }

            subtotal += Number(produto.preco) * Number(item.quantidade);
        }

        const total = Math.max(0, subtotal - Number(desconto));

        const vendaAtualizada = await client.query(
            `
            UPDATE vendas
            SET
                forma_pagamento_id = $1,
                subtotal = $2,
                desconto = $3,
                total = $4,
                observacao = $5
            WHERE id = $6
            RETURNING *
            `,
            [forma_pagamento_id, subtotal, desconto, total, observacao, vendaId]
        );

        for (const item of itens) {
            const prodRes = await client.query(
                'SELECT preco FROM produtos WHERE id = $1',
                [item.produto_id]
            );

            const precoUnitario = prodRes.rows[0].preco;
            const itemTotal = Number(precoUnitario) * Number(item.quantidade);

            await client.query(
                `
                INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario, subtotal)
                VALUES ($1, $2, $3, $4, $5)
                `,
                [vendaId, item.produto_id, item.quantidade, precoUnitario, itemTotal]
            );

            await client.query(
                `
                UPDATE produtos
                SET estoque = estoque - $1
                WHERE id = $2
                `,
                [item.quantidade, item.produto_id]
            );
        }

        await client.query('COMMIT');

        return res.json({
            sucesso: true,
            mensagem: 'Venda atualizada com sucesso!',
            venda: vendaAtualizada.rows[0]
        });

    } catch (erro) {
        await client.query('ROLLBACK');
        console.error('Erro ao atualizar venda:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao atualizar venda.'
        });
    } finally {
        client.release();
    }
});

// =========================
// ROTAS DE RELATÓRIOS
// =========================

app.get('/api/relatorios/vendas-hoje', autenticar, async (req, res) => {
    try {
        const resultado = await pool.query(
            `
            SELECT
                v.*,
                u.nome as usuario_nome,
                fp.nome as forma_pagamento_nome
            FROM vendas v
            LEFT JOIN usuarios u ON v.usuario_id = u.id
            LEFT JOIN formas_pagamento fp ON v.forma_pagamento_id = fp.id
            WHERE DATE(v.data_venda) = CURRENT_DATE
            ORDER BY v.data_venda DESC
            `
        );

        return res.json({
            sucesso: true,
            vendas: resultado.rows
        });
    } catch (erro) {
        console.error('Erro ao buscar vendas de hoje:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar vendas de hoje.'
        });
    }
});

// =========================
// ROTAS DE EVENTOS
// =========================

app.get('/api/eventos', autenticar, async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM eventos ORDER BY data_inicio DESC'
        );

        return res.json({
            sucesso: true,
            eventos: resultado.rows
        });
    } catch (erro) {
        console.error('Erro ao buscar eventos:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao buscar eventos.'
        });
    }
});

app.post('/api/eventos', autenticar, async (req, res) => {
    try {
        const { nome, descricao = null, data_inicio = null, data_fim = null } = req.body;

        if (!nome || !String(nome).trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O nome do evento é obrigatório.'
            });
        }

        const novoEvento = await pool.query(
            `
            INSERT INTO eventos (nome, descricao, data_inicio, data_fim, status, criado_em)
            VALUES ($1, $2, $3, $4, 'ATIVO', NOW())
            RETURNING *
            `,
            [String(nome).trim(), descricao ? String(descricao).trim() : null, data_inicio || null, data_fim || null]
        );

        return res.json({
            sucesso: true,
            mensagem: 'Evento criado com sucesso!',
            evento: novoEvento.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao criar evento:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao criar evento.'
        });
    }
});

app.put('/api/eventos/:id', autenticar, async (req, res) => {
    try {
        const eventoId = Number(req.params.id);

        const {
            nome,
            descricao = null,
            data_inicio = null,
            data_fim = null,
            status
        } = req.body;

        if (!Number.isInteger(eventoId) || eventoId <= 0) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Evento inválido.'
            });
        }

        if (!nome || !String(nome).trim()) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'O nome do evento é obrigatório.'
            });
        }

        const statusPermitidos = ['ATIVO', 'FINALIZADO', 'CANCELADO'];
        const statusFinal = String(status || 'ATIVO').toUpperCase();

        if (!statusPermitidos.includes(statusFinal)) {
            return res.status(400).json({
                sucesso: false,
                mensagem: 'Status do evento inválido.'
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
            mensagem: 'Evento alterado com sucesso!',
            evento: resultado.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao editar evento:', erro);
        return res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao editar evento.'
        });
    }
});

// =========================
// INICIALIZAÇÃO DO SERVIDOR
// =========================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});