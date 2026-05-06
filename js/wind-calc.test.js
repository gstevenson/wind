import { describe, it, expect } from 'vitest'
import { degreesToRadians, angleToRunwayNumber, findClosest, calcWindComponents, parseRunwayInput } from './wind-calc.js'

describe('angleToRunwayNumber', () => {
    it('converts cardinal headings', () => {
        expect(angleToRunwayNumber(0)).toBe('36')
        expect(angleToRunwayNumber(90)).toBe('09')
        expect(angleToRunwayNumber(180)).toBe('18')
        expect(angleToRunwayNumber(270)).toBe('27')
        expect(angleToRunwayNumber(360)).toBe('36') // 360 → runway 36, not 00 (no runway 00 in aviation)
    })

    it('rounds to nearest 10 degrees', () => {
        expect(angleToRunwayNumber(14)).toBe('01')  // rounds to 10
        expect(angleToRunwayNumber(15)).toBe('02')  // rounds to 20
        expect(angleToRunwayNumber(355)).toBe('36') // rounds to 360 → 36
    })

    it('pads single-digit runway numbers', () => {
        expect(angleToRunwayNumber(50)).toBe('05')
        expect(angleToRunwayNumber(80)).toBe('08')
    })
})

describe('findClosest', () => {
    const runways = [20, 200, 140, 320]

    it('returns the closest runway to the wind direction', () => {
        expect(findClosest(runways, 25)).toBe(20)
        expect(findClosest(runways, 180)).toBe(200)
        expect(findClosest(runways, 300)).toBe(320)
        expect(findClosest(runways, 130)).toBe(140)
    })

    it('wraps correctly near 0/360 boundary', () => {
        // Wind 20°, runways 140 and 320: circular distance to 320 is 60°, to 140 is 120°
        expect(findClosest([140, 320], 20)).toBe(320)
        // Wind 350°, runways 140 and 320: circular distance to 320 is 30°, to 140 is 150°
        expect(findClosest([140, 320], 350)).toBe(320)
    })

    it('returns exact match when wind aligns with a runway', () => {
        expect(findClosest(runways, 20)).toBe(20)
        expect(findClosest(runways, 140)).toBe(140)
    })
})

describe('calcWindComponents', () => {
    it('produces pure headwind when wind is straight down the runway', () => {
        const { headTailComponent, crosswindComponent, isHeadwind } = calcWindComponents(360, 20, 360)
        expect(headTailComponent).toBeCloseTo(20, 1)
        expect(crosswindComponent).toBeCloseTo(0, 1)
        expect(isHeadwind).toBe(true)
    })

    it('produces pure tailwind when wind is directly behind', () => {
        const { headTailComponent, crosswindComponent, isHeadwind } = calcWindComponents(180, 20, 360)
        expect(Math.abs(headTailComponent)).toBeCloseTo(20, 1)
        expect(crosswindComponent).toBeCloseTo(0, 1)
        expect(isHeadwind).toBe(false)
    })

    it('produces pure crosswind when wind is 90 degrees to the runway', () => {
        const { headTailComponent, crosswindComponent } = calcWindComponents(90, 20, 360)
        expect(headTailComponent).toBeCloseTo(0, 1)
        expect(crosswindComponent).toBeCloseTo(20, 1)
    })

    it('correctly identifies crosswind from right', () => {
        // Wind from east (090), runway heading north (360) — wind is from the right
        const { crosswindFromRight } = calcWindComponents(90, 10, 360)
        expect(crosswindFromRight).toBe(true)
    })

    it('correctly identifies crosswind from left', () => {
        // Wind from west (270), runway heading north (360) — wind is from the left
        const { crosswindFromRight } = calcWindComponents(270, 10, 360)
        expect(crosswindFromRight).toBe(false)
    })

    it('scales with wind speed', () => {
        const light = calcWindComponents(90, 10, 360)
        const strong = calcWindComponents(90, 20, 360)
        expect(strong.crosswindComponent).toBeCloseTo(light.crosswindComponent * 2, 1)
    })
})

describe('parseRunwayInput', () => {
    it('handles space after comma', () => {
        expect(parseRunwayInput('09, 27')).toEqual([90, 270])
    })

    it('handles no space after comma', () => {
        expect(parseRunwayInput('09,27')).toEqual([90, 270])
    })

    it('handles multiple runways with consistent spacing', () => {
        expect(parseRunwayInput('09,27,14,32')).toEqual([90, 270, 140, 320])
    })

    it('handles multiple runways with mixed spacing', () => {
        expect(parseRunwayInput('09, 27, 14,32')).toEqual([90, 270, 140, 320])
    })
})

describe('degreesToRadians', () => {
    it('converts 0 degrees to 0 radians', () => {
        expect(degreesToRadians(0)).toBeCloseTo(0)
    })

    it('converts 180 degrees to PI radians', () => {
        expect(degreesToRadians(180)).toBeCloseTo(Math.PI)
    })

    it('converts 360 degrees to 2*PI radians', () => {
        expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI)
    })

    it('applies offset before converting', () => {
        expect(degreesToRadians(0, 90)).toBeCloseTo(Math.PI / 2)
        expect(degreesToRadians(90, -90)).toBeCloseTo(0)
    })
})

describe('parseRunwayInput — validation', () => {
    it('filters out non-numeric entries', () => {
        expect(parseRunwayInput('09, abc, 27')).toEqual([90, 270])
    })

    it('returns empty array for all-invalid input', () => {
        expect(parseRunwayInput('foo, bar')).toEqual([])
    })

    it('filters out-of-range runway numbers', () => {
        expect(parseRunwayInput('09, 37, 27')).toEqual([90, 270])
        expect(parseRunwayInput('0, 09')).toEqual([90])
    })

    it('returns empty array for empty string', () => {
        expect(parseRunwayInput('')).toEqual([])
    })

    it('handles a single runway', () => {
        expect(parseRunwayInput('18')).toEqual([180])
    })
})

describe('findClosest — edge cases', () => {
    it('works with a single-element array', () => {
        expect(findClosest([90], 270)).toBe(90)
    })

    it('treats 0 and 360 as equivalent wind directions', () => {
        const runways = [20, 200, 140, 320]
        expect(findClosest(runways, 0)).toBe(findClosest(runways, 360))
    })

    it('returns first match when two runways are equidistant', () => {
        // Wind 90°, runways [0, 180] — both 90° away, first one wins via reduce
        expect(findClosest([0, 180], 90)).toBe(0)
    })
})

describe('calcWindComponents — edge cases', () => {
    it('returns zero components when wind speed is zero', () => {
        const { headTailComponent, crosswindComponent } = calcWindComponents(45, 0, 360)
        expect(headTailComponent).toBe(0)
        expect(crosswindComponent).toBe(0)
    })

    it('handles quartering wind (45 degrees off runway)', () => {
        const { headTailComponent, crosswindComponent } = calcWindComponents(45, 20, 360)
        const expected = 20 * Math.cos(Math.PI / 4)
        expect(headTailComponent).toBeCloseTo(expected, 1)
        expect(crosswindComponent).toBeCloseTo(expected, 1)
    })

    it('treats wind 0 and runway 360 as aligned', () => {
        const { headTailComponent, crosswindComponent, isHeadwind } = calcWindComponents(0, 15, 360)
        expect(headTailComponent).toBeCloseTo(15, 1)
        expect(crosswindComponent).toBeCloseTo(0, 1)
        expect(isHeadwind).toBe(true)
    })
})

describe('integration: best runway has lowest crosswind', () => {
    it('findClosest picks the runway with minimum crosswind', () => {
        const runways = [90, 270, 140, 320]
        const windAngle = 150
        const windSpeed = 20

        const best = findClosest(runways, windAngle)
        const bestCrosswind = calcWindComponents(windAngle, windSpeed, best).crosswindComponent

        for (const rwy of runways) {
            const { crosswindComponent } = calcWindComponents(windAngle, windSpeed, rwy)
            expect(bestCrosswind).toBeLessThanOrEqual(crosswindComponent + 0.01)
        }
    })
})
