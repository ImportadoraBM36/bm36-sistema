param(
    [string]$ArquivoExcel = 'C:\Users\BM36-80\Downloads\ESTOQUE BM ,WC  26,0626.xls',
    [string]$ArquivoSaida = 'sql\importar-localizacoes-produtos.sql'
)

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false
$workbook = $null

function SqlTexto($valor) {
    if ($null -eq $valor -or [string]$valor -eq '') {
        return 'NULL'
    }

    return "'" + ([string]$valor).Trim().Replace("'", "''") + "'"
}

try {
    $workbook = $excel.Workbooks.Open((Resolve-Path -LiteralPath $ArquivoExcel), $null, $true)
    $planilha = $workbook.Worksheets.Item(1)
    $intervalo = $planilha.UsedRange
    $dadosPlanilha = $intervalo.Value2
    $linhas = New-Object System.Collections.Generic.List[string]

    for ($linha = 4; $linha -le $intervalo.Rows.Count; $linha++) {
        $codigo = $dadosPlanilha[$linha, 1]

        if ($null -eq $codigo -or [string]$codigo -eq '') {
            continue
        }

        $marca = $dadosPlanilha[$linha, 6]
        $origem = if ([string]$marca -eq 'WC') { 'WORLD CLASSIC' } else { [string]$marca }
        $linhas.Add("    (" + (SqlTexto $codigo) + ', ' + (SqlTexto $origem) + ', ' + (SqlTexto $dadosPlanilha[$linha, 3]) + ', ' + (SqlTexto $dadosPlanilha[$linha, 4]) + ')')
    }

    $conteudo = @"
-- Gerado da planilha de estoque em $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss').
-- Atualiza apenas corredor e prateleira; não altera as quantidades nem as movimentações.
BEGIN;

WITH dados(codigo, origem, corredor, prateleira) AS (
VALUES
$($linhas -join ",`n")
)
UPDATE produtos AS produto
SET
    corredor = dados.corredor,
    prateleira = dados.prateleira
FROM dados
WHERE TRIM(produto.codigo) = dados.codigo
  AND UPPER(TRIM(produto.origem)) = UPPER(dados.origem);

COMMIT;
"@

    $pastaSaida = Split-Path -Parent $ArquivoSaida
    if ($pastaSaida) {
        New-Item -ItemType Directory -Path $pastaSaida -Force | Out-Null
    }

    [System.IO.File]::WriteAllText(
        (Join-Path (Get-Location) $ArquivoSaida),
        $conteudo,
        [System.Text.UTF8Encoding]::new($false)
    )

    Write-Output "SQL gerado para $($linhas.Count) linhas: $ArquivoSaida"
}
finally {
    if ($workbook) {
        $workbook.Close($false)
        [void][Runtime.InteropServices.Marshal]::ReleaseComObject($workbook)
    }

    $excel.Quit()
    [void][Runtime.InteropServices.Marshal]::ReleaseComObject($excel)
}
