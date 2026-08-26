const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

require('dotenv').config({
    path: path.join(__dirname, '..', 'backend', '.env')
});

async function aplicarMigracao() {

    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
SSSSS
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
