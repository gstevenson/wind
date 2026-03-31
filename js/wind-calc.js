export const DEG_TO_RAD = Math.PI / 180

export function degreesToRadians(degrees, offset = 0) {
    return (degrees + offset) * DEG_TO_RAD
}

export function angleToRunwayNumber(angleDegrees) {
    let runwayNumber = Math.round(angleDegrees / 10)
    if (runwayNumber >= 100) {
        runwayNumber = runwayNumber % 100
    }
    return runwayNumber.toString().padStart(2, '0')
}

export function parseRunwayInput(input) {
    return input.split(/,\s*/).map((item) => parseInt(item, 10) * 10)
}

export function findClosest(runways, value) {
    const angularDist = (a, b) => {
        const diff = Math.abs(a - b) % 360
        return diff > 180 ? 360 - diff : diff
    }
    return runways.reduce((closest, current) => (angularDist(current, value) < angularDist(closest, value) ? current : closest))
}

export function calcWindComponents(windAngle, windSpeed, runway) {
    const recip = runway < 180 ? runway + 180 : runway - 180
    const rwyVector = { x: Math.sin(runway * DEG_TO_RAD), y: Math.cos(runway * DEG_TO_RAD) }
    const windVector = { x: Math.sin(windAngle * DEG_TO_RAD), y: Math.cos(windAngle * DEG_TO_RAD) }

    const dotprod = rwyVector.x * windVector.x + rwyVector.y * windVector.y
    const thetarad = Math.acos(Math.min(1, Math.max(-1, dotprod)))

    const sigfig = 100
    const headTailComponent = Math.round(sigfig * windSpeed * Math.cos(thetarad)) / sigfig
    const crosswindComponent = Math.round(sigfig * windSpeed * Math.sin(thetarad)) / sigfig

    const isHeadwind = headTailComponent >= 0
    const crosswindFromRight =
        (windAngle >= runway && windAngle < recip) || (runway >= 180 && (windAngle >= runway || windAngle < recip))

    return { headTailComponent, crosswindComponent, isHeadwind, crosswindFromRight }
}
