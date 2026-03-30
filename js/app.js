const canvas = document.getElementById('myCanvas')

canvas.width = Math.min(window.innerWidth - 32, 560)
canvas.height = canvas.width

const ctx = canvas.getContext('2d')

const centerX = canvas.width / 2
const centerY = canvas.height / 2
const radius = (canvas.width / 2) * 0.8

const DEG_TO_RAD = Math.PI / 180

// Cached DOM references
const windInputEl = document.getElementById('windInput')
const windSpeedEl = document.getElementById('windSpeed')
const idealRunwayValueEl = document.getElementById('idealRunwayValue')
const headWindValueEl = document.getElementById('headWindValue')
const crossWindValueEl = document.getElementById('crossWindValue')

let runways = JSON.parse(localStorage.getItem('runways'))

function degreesToRadians(degrees, offset = 0) {
    return (degrees + offset) * DEG_TO_RAD
}

function setupCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Rose background
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#0a1520'
    ctx.fill()
    ctx.strokeStyle = '#2e5a7a'
    ctx.lineWidth = 3
    ctx.stroke()

    // Compass tick marks
    for (let deg = 0; deg < 360; deg += 10) {
        const angleRad = degreesToRadians(deg, -90)
        const isCardinal = deg % 90 === 0
        const tickLen = isCardinal ? 16 : deg % 30 === 0 ? 11 : 6
        ctx.beginPath()
        ctx.strokeStyle = isCardinal ? '#4a9fd4' : '#2a5070'
        ctx.lineWidth = isCardinal ? 2 : 1
        ctx.moveTo(centerX + radius * Math.cos(angleRad), centerY + radius * Math.sin(angleRad))
        ctx.lineTo(centerX + (radius - tickLen) * Math.cos(angleRad), centerY + (radius - tickLen) * Math.sin(angleRad))
        ctx.stroke()
    }

    // Cardinal labels
    ;[{ label: 'N', deg: 0 }, { label: 'E', deg: 90 }, { label: 'S', deg: 180 }, { label: 'W', deg: 270 }].forEach(({ label, deg }) => {
        const angleRad = degreesToRadians(deg, -90)
        const r = radius - 28
        ctx.fillStyle = '#4a9fd4'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(label, centerX + r * Math.cos(angleRad), centerY + r * Math.sin(angleRad))
    })

    runways.forEach((angle) => drawRunwayLine(angle))
}


function angleToRunwayNumber(angleDegrees) {
    let runwayNumber = Math.round(angleDegrees / 10)
    if (runwayNumber >= 100) {
        runwayNumber = runwayNumber % 100
    }
    return runwayNumber.toString().padStart(2, '0')
}

function drawWindLine(angleDegrees) {
    const angleRadians = degreesToRadians(angleDegrees, -90)
    const tipX = centerX + radius * 0.85 * Math.cos(angleRadians)
    const tipY = centerY + radius * 0.85 * Math.sin(angleRadians)
    const tailX = centerX - radius * 0.3 * Math.cos(angleRadians)
    const tailY = centerY - radius * 0.3 * Math.sin(angleRadians)

    ctx.strokeStyle = '#ffaa00'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(tailX, tailY)
    ctx.lineTo(tipX, tipY)
    ctx.stroke()

    ctx.fillStyle = '#ffaa00'
    ctx.save()
    ctx.translate(tipX, tipY)
    ctx.rotate(angleRadians + Math.PI / 2)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-8, -20)
    ctx.lineTo(8, -20)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
}

function drawRunwayLine(angleDegrees) {
    const angleRadians = degreesToRadians(angleDegrees, -270)
    const lineLength = Math.sqrt(2) * radius * 0.5

    const startX = centerX - lineLength * Math.cos(angleRadians)
    const startY = centerY - lineLength * Math.sin(angleRadians)
    const endX = centerX + lineLength * Math.cos(angleRadians)
    const endY = centerY + lineLength * Math.sin(angleRadians)

    // Asphalt surface
    ctx.beginPath()
    ctx.strokeStyle = '#3a3f52'
    ctx.lineWidth = 10
    ctx.lineCap = 'butt'
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Dashed centreline
    ctx.beginPath()
    ctx.strokeStyle = '#c8ccd8'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.setLineDash([8, 6])
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.setLineDash([])

    const textPadding = 18
    const textX = endX + textPadding * Math.cos(angleRadians - Math.PI / 2)
    const textY = endY + textPadding * Math.sin(angleRadians - Math.PI / 2)

    ctx.fillStyle = '#c8ccd8'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(angleToRunwayNumber(angleDegrees), textX, textY)
}

function updateWindLine() {
    const windAngle = windInputEl.value
    const windSpeed = windSpeedEl.value

    if (windAngle !== '' && windSpeed !== '') {
        setupCanvas()
        drawWindLine(parseInt(windAngle, 10))

        const closest = findClosest(windAngle)
        idealRunwayValueEl.textContent = angleToRunwayNumber(closest)
        calcWind(windAngle, windSpeed, closest)
    }
}

function calcWind(windAngle, windSpeed, runway) {
    const recip = runway < 180 ? runway + 180 : runway - 180
    const rwyrad = runway * DEG_TO_RAD
    const windrad = windAngle * DEG_TO_RAD

    const rwyVector = { x: Math.sin(rwyrad), y: Math.cos(rwyrad) }
    const windVector = { x: Math.sin(windrad), y: Math.cos(windrad) }

    const dotprod = rwyVector.x * windVector.x + rwyVector.y * windVector.y
    const thetarad = Math.acos(dotprod)

    const sigfig = 100
    const headTailComponent = Math.round(sigfig * windSpeed * Math.cos(thetarad)) / sigfig
    const crosswindComponent = Math.round(sigfig * windSpeed * Math.sin(thetarad)) / sigfig

    const headOrTail = headTailComponent >= 0 ? 'Headwind: ' : 'Tailwind: '
    const crosswindSide =
        'Crosswind from ' + ((windAngle >= runway && windAngle < recip) || (runway >= 180 && (windAngle >= runway || windAngle < recip)) ? 'Right: ' : 'Left: ')

    headWindValueEl.textContent = headOrTail + headTailComponent + 'kt(s)'
    crossWindValueEl.textContent = crosswindSide + crosswindComponent + 'kt(s)'
}

function findClosest(value) {
    return runways.reduce((closest, current) => (Math.abs(current - value) < Math.abs(closest - value) ? current : closest))
}

function configureLocalStorage() {
    runways = [20, 200, 140, 320]
    localStorage.setItem('runways', JSON.stringify(runways))
}

function reconfigureRunways() {
    const newRunways = window.prompt('Enter a comma separated list of runways, using full magnetic heading', runways.join(', '))

    if (newRunways === null || newRunways === '') {
        return
    }

    runways = newRunways.split(', ').map((item) => parseInt(item, 10))
    localStorage.setItem('runways', JSON.stringify(runways))

    updateWindLine()
}

function reset() {
    configureLocalStorage()
    updateWindLine()
}

if (localStorage.getItem('runways') === null) {
    configureLocalStorage()
}

setupCanvas()
updateWindLine()

window.updateWindLine = updateWindLine
window.reconfigureRunways = reconfigureRunways
window.reset = reset
