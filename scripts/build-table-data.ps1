$ErrorActionPreference = "Stop"

$root = "C:\Git\vpxs-4kp-beta-period-celebration"
$wizFile = Join-Path $root "dev\wizard_tables.txt"
$srcFile = Join-Path $root "dev\table_history_with_diffs.json"
$outDir  = Join-Path $root "data\tables"

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir -Force | Out-Null }

$wanted = New-Object 'System.Collections.Generic.HashSet[string]'
foreach ($line in [System.IO.File]::ReadAllLines($wizFile)) {
    $t = $line.Trim()
    if ($t.Length -gt 0) { [void]$wanted.Add($t) }
}
Write-Host "Wanted slugs: $($wanted.Count)"

$reader = New-Object System.IO.StreamReader($srcFile)
$sw = [System.Diagnostics.Stopwatch]::StartNew()

$buffer = New-Object System.Collections.Generic.List[string]
$capturing = $false
$currentKey = $null
$writtenCount = 0
$lineNo = 0

$startRegex = [regex]'^  "([^"]+)": \{$'
$endRegex   = [regex]'^  \},?$'

while ($null -ne ($rawLine = $reader.ReadLine())) {
    $lineNo++
    if (-not $capturing) {
        $m = $startRegex.Match($rawLine)
        if ($m.Success) {
            $currentKey = $m.Groups[1].Value
            $capturing = $true
            $buffer.Clear()
            $buffer.Add("{")
        }
    } else {
        $m2 = $endRegex.Match($rawLine)
        if ($m2.Success) {
            $buffer.Add("}")
            if ($currentKey -like "external/*") {
                $slug = $currentKey.Substring("external/".Length)
                if ($wanted.Contains($slug)) {
                    $outPath = Join-Path $outDir ($slug + ".json")
                    [System.IO.File]::WriteAllLines($outPath, $buffer.ToArray())
                    $writtenCount++
                }
            }
            $capturing = $false
            $currentKey = $null
        } else {
            $buffer.Add($rawLine)
        }
    }
    if ($lineNo % 20000 -eq 0) {
        Write-Host "line $lineNo, written $writtenCount, elapsed $($sw.Elapsed.TotalSeconds)s"
    }
}
$reader.Close()
Write-Host "DONE. Total lines: $lineNo. Files written: $writtenCount. Elapsed: $($sw.Elapsed.TotalSeconds)s"
