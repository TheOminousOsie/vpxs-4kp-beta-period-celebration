$ErrorActionPreference = "Stop"
$root = "C:\Git\vpxs-4kp-beta-period-celebration"
$tablesDir = Join-Path $root "data\tables"
$wizFile = Join-Path $root "dev\wizard_tables.txt"
$releasesPath = Join-Path $root "dev\releases.json"
$manifestPath = Join-Path $root "dev\manifest-2.json"

$releases = [System.IO.File]::ReadAllText($releasesPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$manifest = [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8) | ConvertFrom-Json

$nameMap = @{}
foreach ($rel in $releases) {
    foreach ($t in @($rel.tables_added) + @($rel.tables_updated)) {
        if ($null -ne $t -and $t.slug -and $t.name) {
            $nameMap[$t.slug] = $t.name
        }
    }
}
Write-Host "Release name map entries: $($nameMap.Count)"

function ToTitle($slug) {
    $s = $slug -replace '^vpx[-_]', ''
    $s = $s -replace '[_-]+', ' '
    $ti = (Get-Culture).TextInfo
    return $ti.ToTitleCase($s)
}

$slugs = Get-Content $wizFile | Where-Object { $_.Trim().Length -gt 0 }
$index = @()
$i = 0
foreach ($slug in $slugs) {
    $i++
    $slug = $slug.Trim()
    $jsonPath = Join-Path $tablesDir ($slug + ".json")
    $commitCount = 0
    $first = $null
    $last = $null
    if (Test-Path $jsonPath) {
        $data = Get-Content $jsonPath -Raw | ConvertFrom-Json
        $commitCount = $data.commit_count
        $dates = $data.commits | ForEach-Object { $_.date.Substring(0,10) } | Sort-Object
        if ($dates.Count -gt 0) {
            $first = $dates[0]
            $last = $dates[-1]
        }
    }

    $m = $manifest.$slug
    $name = $null
    $manufacturer = $null
    $year = $null
    if ($m) {
        $name = $m.name
        $manufacturer = $m.manufacturer
        $year = $m.year
    }
    if (-not $name) { $name = $nameMap[$slug] }
    if (-not $name) { $name = ToTitle $slug }

    $hasArt = Test-Path (Join-Path $root "assets\launchers\$slug.png")
    $hasHistory = Test-Path (Join-Path $root "assets\launcher-history\$slug.png")
    $index += [PSCustomObject]@{
        slug = $slug
        name = $name
        manufacturer = $manufacturer
        year = $year
        commits = $commitCount
        first = $first
        last = $last
        art = $hasArt
        history = $hasHistory
        hasMeta = [bool]$m
    }
    if ($i % 50 -eq 0) { Write-Host "processed $i / $($slugs.Count)" }
}

$json = $index | ConvertTo-Json -Depth 5 -Compress
$outPath = Join-Path $root "data\table_index.js"
[System.IO.File]::WriteAllText($outPath, "window.TABLE_INDEX = $json;`n", (New-Object System.Text.UTF8Encoding($false)))
Write-Host "DONE. $($index.Count) entries written to data/table_index.js"

$missing = $index | Where-Object { -not $_.hasMeta } | Select-Object -ExpandProperty slug
Write-Host "Tables missing manifest metadata ($($missing.Count)):"
$missing | ForEach-Object { Write-Host "  $_" }
