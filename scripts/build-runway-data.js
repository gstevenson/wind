// Downloads OurAirports airports.csv + runways.csv and writes a compact JSON:
//   { "EGCS": { "n": "Sturgate Airfield", "r": [["09","27"],["14","32"]] }, ... }
// Used as a prebuild/prestart step — output is js/runway-data.json.

const { writeFileSync } = require('fs')
const { resolve } = require('path')

const OUTPUT_PATH = resolve(__dirname, '../js/runway-data.json')
const BASE_URL = 'https://raw.githubusercontent.com/davidmegginson/ourairports-data/main'

// airports.csv stable column layout
const AP_IDENT_COL = 1
const AP_NAME_COL = 3

// runways.csv stable column layout
const RW_AIRPORT_IDENT_COL = 2
const RW_CLOSED_COL = 7
const RW_LE_IDENT_COL = 8
const RW_HE_IDENT_COL = 14

const unquote = (s) => (s || '').replace(/"/g, '').trim()

;(async () => {
    console.log('Fetching airport and runway data from OurAirports...')

    const [airportsRes, runwaysRes] = await Promise.all([
        fetch(`${BASE_URL}/airports.csv`),
        fetch(`${BASE_URL}/runways.csv`),
    ])
    if (!airportsRes.ok) throw new Error(`Failed to fetch airports.csv: ${airportsRes.status}`)
    if (!runwaysRes.ok) throw new Error(`Failed to fetch runways.csv: ${runwaysRes.status}`)

    const [airportsCsv, runwaysCsv] = await Promise.all([airportsRes.text(), runwaysRes.text()])

    // Build ICAO → name lookup
    const names = {}
    for (const line of airportsCsv.split(/\r?\n/).slice(1)) {
        if (!line) continue
        const cols = line.split(',')
        const icao = unquote(cols[AP_IDENT_COL])
        const name = unquote(cols[AP_NAME_COL])
        if (icao && name) names[icao] = name
    }

    // Build ICAO → runway numbers, merging in names
    const data = {}
    for (const line of runwaysCsv.split(/\r?\n/).slice(1)) {
        if (!line) continue
        const cols = line.split(',')
        if (cols.length < 15) continue

        const icao = unquote(cols[RW_AIRPORT_IDENT_COL])
        if (!icao) continue
        if (unquote(cols[RW_CLOSED_COL]) === '1') continue

        const le = unquote(cols[RW_LE_IDENT_COL])
        const he = unquote(cols[RW_HE_IDENT_COL])
        if (!le && !he) continue

        if (!data[icao]) data[icao] = { n: names[icao] || icao, r: [] }
        const pair = [le, he].filter(Boolean)
        if (pair.length) data[icao].r.push(pair)
    }

    writeFileSync(OUTPUT_PATH, JSON.stringify(data))
    console.log(`Done — ${Object.keys(data).length} airports written to js/runway-data.json`)
})()
