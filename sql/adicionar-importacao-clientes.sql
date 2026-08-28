BEGIN;

ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS ie TEXT,
    ADD COLUMN IF NOT EXISTS codigo_sistema_antigo TEXT,
    ADD COLUMN IF NOT EXISTS origem_sistema_antigo TEXT;

-- Os relatórios antigos não possuem CPF/CNPJ para todos os clientes.
-- O cadastro normal da aplicação continua exigindo o documento; somente a
-- importação histórica pode criar registros sem ele.
ALTER TABLE clientes
    ALTER COLUMN documento DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS clientes_codigo_sistema_antigo_origem_uidx
    ON clientes (codigo_sistema_antigo, origem_sistema_antigo)
    WHERE codigo_sistema_antigo IS NOT NULL
      AND origem_sistema_antigo IS NOT NULL;

COMMIT;
