# Build OSRM graph data as docker/osrm/data/map.osrm* (default: Monaco extract for dev).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$DataDir = Join-Path $Root "docker\osrm\data"
$PbfUrl = if ($env:OSRM_PBF_URL) { $env:OSRM_PBF_URL } else { "https://download.geofabrik.de/europe/monaco-latest.osm.pbf" }
$Image = if ($env:OSRM_IMAGE) { $env:OSRM_IMAGE } else { "osrm/osrm-backend" }
$PbfPath = Join-Path $DataDir "map.osm.pbf"
$Graph = Join-Path $DataDir "map.osrm"

New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

if ((Test-Path $Graph) -or (Test-Path "$Graph.hsgr") -or (Test-Path "$Graph.mldgr")) {
    Write-Host "OSRM graph already present ($Graph). Skipping."
    exit 0
}

Write-Host "Downloading $PbfUrl ..."
Invoke-WebRequest -Uri $PbfUrl -OutFile $PbfPath -UseBasicParsing

Write-Host "Extracting ..."
docker run --rm -t --platform linux/amd64 -v "${DataDir}:/data" $Image osrm-extract -p /opt/car.lua /data/map.osm.pbf

Write-Host "Contracting ..."
docker run --rm -t --platform linux/amd64 -v "${DataDir}:/data" $Image osrm-contract /data/map.osrm

Write-Host "Done. Start routing: docker compose up -d osrm-backend osrm"
