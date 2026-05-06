/**
 * Fetches METAR from VATSIM and parses wind data.
 */

const VATSIM_METAR_URL = 'https://metar.vatsim.net'

export async function fetchMetar(icao) {
    const response = await fetch(`${VATSIM_METAR_URL}/${icao}`)
    if (!response.ok) throw new Error(`METAR not available (${response.status})`)
    const text = (await response.text()).trim()
    if (!text || text.startsWith('No METAR')) throw new Error('No METAR available for this airport')
    return text
}

export function parseMetarWind(metar) {
    const match = metar.match(/\b(\d{3}|VRB)(\d{2,3})(G\d{2,3})?KT\b/)
    if (!match) return null
    return {
        direction: match[1] === 'VRB' ? null : parseInt(match[1], 10),
        speed: parseInt(match[2], 10),
        gust: match[3] ? parseInt(match[3].slice(1), 10) : null,
        variable: match[1] === 'VRB',
    }
}
