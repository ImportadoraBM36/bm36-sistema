const fs = require('fs');
const path = require('path');
const { Pool } = require(
    path.join(__dirname, '..', 'backend', 'node_modules', 'pg')
);

require(
    path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv')
).config({
    path: path.join(__dirname, '..', 'backend', '.env')
});

async function aplicarMigracao() {

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
    try {

        const sql = fs.readFileSync(
            path.join(__dirname, '..', 'sql', 'adicionar-localizacao-produtos.sql'),
            'utf8'
        );

        await pool.query(sql);

        console.log('Colunas de localização criadas com sucesso.');

    } finally {

        await pool.end();

    }

}

aplicarMigracao().catch(
    erro => {

        console.error(erro);
        process.exitCode = 1;

    }
);
