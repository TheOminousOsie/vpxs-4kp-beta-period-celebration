$ErrorActionPreference = "Stop"
$root = "C:\Git\vpxs-4kp-beta-period-celebration"
$manifestPath = Join-Path $root "dev\manifest-2.json"
$wizFile = Join-Path $root "dev\wizard_tables.txt"

$manifestRaw = [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8)
$manifest = $manifestRaw | ConvertFrom-Json
$slugs = Get-Content $wizFile | Where-Object { $_.Trim().Length -gt 0 } | ForEach-Object { $_.Trim() }

$MDOT = " " + [char]0x00B7 + " "

function J($v) {
    if ($null -eq $v) { return $null }
    if ($v -is [System.Array]) {
        $arr = @($v | Where-Object { $_ -ne $null -and $_ -ne "" })
        if ($arr.Count -eq 0) { return $null }
        return ($arr -join $MDOT)
    }
    if ($v -is [string] -and $v.Trim() -eq "") { return $null }
    return $v
}

$out = [ordered]@{}
$missing = @()

foreach ($slug in $slugs) {
    $m = $manifest.$slug
    if ($null -eq $m) { $missing += $slug; continue }

    $romRequired = "No"
    if ($m.romFileUrl -or $m.romAuthors -or $m.romVersion) { $romRequired = "Yes" }

    $metaPairs = New-Object System.Collections.Generic.List[object]
    $tableAuthor = J $m.tableAuthors
    if ($tableAuthor) {
        $v = $tableAuthor
        if ($m.tableVersion) { $v = "$v$($MDOT)v$($m.tableVersion)" }
        $metaPairs.Add(@("Table author", $v))
    }
    $bg = J $m.backglassAuthors
    if ($bg) { $metaPairs.Add(@("Backglass", $bg)) }
    $testers = J $m.testers
    if ($testers) { $metaPairs.Add(@("Testers", $testers)) }
    if ($m.fps) { $metaPairs.Add(@("FPS", "$($m.fps)")) }
    $metaPairs.Add(@("ROM required", $romRequired))
    if ($m.tableVpsId) { $metaPairs.Add(@("VPS table id", $m.tableVpsId)) }
    if ($m.backglassVpsId) { $metaPairs.Add(@("VPS backglass id", $m.backglassVpsId)) }
    if ($m.firstAvailableRelease) {
        $dateStr = $null
        if ($m.firstAvailableAt) {
            try { $dateStr = ([datetime]$m.firstAvailableAt).ToString("d MMM yyyy") } catch {}
        }
        $v = $m.firstAvailableRelease
        if ($dateStr) { $v = "$v$($MDOT)$dateStr" }
        $metaPairs.Add(@("Added to wizard", $v))
    }
    if ($m.designers -and $m.designers.Count -gt 0) {
        $metaPairs.Add(@("Designers", ($m.designers -join " · ")))
    }
    if ($m.tutorialTitle) {
        $metaPairs.Add(@("Tutorial", $m.tutorialTitle))
    }

    $entry = [ordered]@{
        name = $m.name
        manufacturer = $m.manufacturer
        year = $m.year
        tagline = J $m.tagline
        meta = $metaPairs
    }
    $out[$slug] = $entry
}

$json = ($out | ConvertTo-Json -Depth 6 -Compress)
$outPath = Join-Path $root "data\table_meta.js"
[System.IO.File]::WriteAllText($outPath, "window.TABLE_META = $json;`n", (New-Object System.Text.UTF8Encoding($false)))

Write-Host "Written entries: $($out.Count)"
Write-Host "Missing from manifest ($($missing.Count)):"
$missing | ForEach-Object { Write-Host "  $_" }
