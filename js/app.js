const canvas = document.getElementById('myCanvas')

canvas.height = canvas.width

const ctx = canvas.getContext('2d')

const centerX = canvas.width / 2
const centerY = canvas.height / 2
const radius = (canvas.width / 2) * 0.8

let runways = JSON.parse(localStorage.getItem('runways'))

function setupCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.beginPath()
    ctx.strokeStyle = '#99005b'
    ctx.lineWidth = 6
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#c5c6d0'
    ctx.fill()
    ctx.stroke()

    runways.forEach(angle => drawRunwayLine(angle))
}

function drawArrowhead(ctx, x, y, radians) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(radians)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-5, -10)
    ctx.lineTo(5, -10)
    ctx.closePath()
    ctx.restore()
    ctx.fill()
}

function angleToRunwayNumber(angleDegrees) {
    let runwayNumber = Math.round(angleDegrees / 10)
    if (runwayNumber >= 100) {
        runwayNumber = runwayNumber % 100
    }
    return runwayNumber.toString().padStart(2, '0')
}

function drawWindLine(angleDegrees, numberOfArrows) {
    const adjustedAngleDegrees = angleDegrees - 90
    const angleRadians = adjustedAngleDegrees * (Math.PI / 180)
    const lineLength = radius * 1.5

    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + lineLength * Math.cos(angleRadians), centerY + lineLength * Math.sin(angleRadians))
    ctx.stroke()

    const interval = lineLength / (numberOfArrows + 1)
    ctx.fillStyle = 'blue'

    for (let i = 1; i <= numberOfArrows; i++) {
        const x = centerX + i * interval * Math.cos(angleRadians)
        const y = centerY + i * interval * Math.sin(angleRadians)
        drawArrowhead(ctx, x, y, angleRadians + Math.PI / 2)
    }
}

function drawRunwayLine(angleDegrees) {
    const adjustedAngleDegrees = angleDegrees - 270
    const angleRadians = adjustedAngleDegrees * (Math.PI / 180)
    const lineLength = Math.sqrt(2) * radius * 0.5

    const startX = centerX - lineLength * Math.cos(angleRadians)
    const startY = centerY - lineLength * Math.sin(angleRadians)
    const endX = centerX + lineLength * Math.cos(angleRadians)
    const endY = centerY + lineLength * Math.sin(angleRadians)

    ctx.beginPath()
    ctx.strokeStyle = 'grey'
    ctx.lineWidth = 4
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    const textPadding = 15
    const textX = endX + textPadding * Math.cos(angleRadians - Math.PI / 2)
    const textY = endY + textPadding * Math.sin(angleRadians - Math.PI / 2)

    ctx.fillStyle = 'black'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(angleToRunwayNumber(angleDegrees), textX, textY)
}

function updateWindLine() {
    const windAngle = document.getElementById('windInput').value
    const windSpeed = document.getElementById('windSpeed').value

    if (windAngle !== '' && windSpeed !== '') {
        setupCanvas()
        drawWindLine(parseInt(windAngle, 10), 3)

        const closest = findClosest(windAngle)
        document.getElementById('idealRunwayValue').textContent = angleToRunwayNumber(closest)
        calcWind(windAngle, windSpeed, closest)
    }
}

function calcWind(windAngle, windSpeed, runway) {
    const recip = runway < 180 ? runway + 180 : runway - 180
    const rwyrad = (runway * Math.PI) / 180
    const windrad = (windAngle * Math.PI) / 180

    const rwyVector = { x: Math.sin(rwyrad), y: Math.cos(rwyrad) }
    const windVector = { x: Math.sin(windrad), y: Math.cos(windrad) }

    const dotprod = rwyVector.x * windVector.x + rwyVector.y * windVector.y
    const thetarad = Math.acos(dotprod)

    const sigfig = 100
    const headortail_component = Math.round(sigfig * windSpeed * Math.cos(thetarad)) / sigfig
    const xwind_component = Math.round(sigfig * windSpeed * Math.sin(thetarad)) / sigfig

    const headOrTail = headortail_component >= 0 ? 'Headwind: ' : 'Tailwind: '
    const wind_direction =
        'Crosswind from ' + ((windAngle >= runway && windAngle < recip) || (runway >= 180 && (windAngle >= runway || windAngle < recip)) ? 'Right: ' : 'Left: ')

    document.getElementById('headWindValue').textContent = headOrTail + headortail_component + 'kt(s)'
    document.getElementById('crossWindValue').textContent = wind_direction + xwind_component + 'kt(s)'
}

function findClosest(value) {
    return runways.reduce((closest, current) =>
        Math.abs(current - value) < Math.abs(closest - value) ? current : closest
    )
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

    runways = newRunways.split(', ').map(item => parseInt(item, 10))
    localStorage.setItem('runways', JSON.stringify(runways))

    setupCanvas()
    updateWindLine()
}

function reset() {
    configureLocalStorage()
    setupCanvas()
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
