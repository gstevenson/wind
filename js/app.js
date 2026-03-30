import { degreesToRadians, angleToRunwayNumber, findClosest, calcWindComponents, parseRunwayInput } from './wind-calc.js'

const canvas = document.getElementById('myCanvas')

canvas.width = Math.min(window.innerWidth - 32, 560)
canvas.height = canvas.width

const ctx = canvas.getContext('2d')

const centerX = canvas.width / 2
const centerY = canvas.height / 2
const radius = (canvas.width / 2) * 0.8

// Cached DOM references
const windInputEl = document.getElementById('windInput')
const windSpeedEl = document.getElementById('windSpeed')
const idealRunwayValueEl = document.getElementById('idealRunwayValue')
const headWindValueEl = document.getElementById('headWindValue')
const crossWindValueEl = document.getElementById('crossWindValue')

let runways = JSON.parse(localStorage.getItem('runways'))

function setupCanvas(highlightedRunway = null) {
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

    runways.forEach((angle) => drawRunwayLine(angle, angle === highlightedRunway))
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

function drawRunwayLine(angleDegrees, isHighlighted = false) {
    const angleRadians = degreesToRadians(angleDegrees, -270)
    const lineLength = Math.sqrt(2) * radius * 0.5

    const startX = centerX - lineLength * Math.cos(angleRadians)
    const startY = centerY - lineLength * Math.sin(angleRadians)
    const endX = centerX + lineLength * Math.cos(angleRadians)
    const endY = centerY + lineLength * Math.sin(angleRadians)

    if (isHighlighted) {
        // Soft outer glow
        ctx.beginPath()
        ctx.strokeStyle = 'rgba(79, 195, 247, 0.25)'
        ctx.lineWidth = 28
        ctx.lineCap = 'butt'
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // Solid cyan border (visible edge either side of the asphalt)
        ctx.beginPath()
        ctx.strokeStyle = '#4fc3f7'
        ctx.lineWidth = 16
        ctx.lineCap = 'butt'
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
    }

    // Asphalt surface
    ctx.beginPath()
    ctx.strokeStyle = isHighlighted ? '#0e2030' : '#3a3f52'
    ctx.lineWidth = 10
    ctx.lineCap = 'butt'
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Dashed centreline
    ctx.beginPath()
    ctx.strokeStyle = isHighlighted ? '#4fc3f7' : '#c8ccd8'
    ctx.lineWidth = 1.5
    ctx.lineCap = 'round'
    ctx.setLineDash([8, 6])
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.setLineDash([])

    const textPadding = isHighlighted ? 28 : 18
    const textX = endX + textPadding * Math.cos(angleRadians - Math.PI / 2)
    const textY = endY + textPadding * Math.sin(angleRadians - Math.PI / 2)

    if (isHighlighted) {
        ctx.beginPath()
        ctx.arc(textX, textY, 16, 0, 2 * Math.PI)
        ctx.fillStyle = '#4fc3f7'
        ctx.fill()
    }

    ctx.fillStyle = isHighlighted ? '#0a1520' : '#c8ccd8'
    ctx.font = isHighlighted ? 'bold 16px Arial' : 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(angleToRunwayNumber(angleDegrees), textX, textY)
}

// --- Wind particle animation ---
const PARTICLE_COUNT = 40
let particles = []
let animFrameId = null
let animState = { windAngle: null, windSpeed: null, closest: null }

function initParticles() {
    particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        along: (Math.random() * 2 - 1) * radius,
        across: (Math.random() * 2 - 1) * radius,
        speed: 1.2 + Math.random() * 1.6,
        trailLen: 8 + Math.random() * 14,
        alpha: 0.15 + Math.random() * 0.3,
    }))
}

function drawParticles() {
    const { windAngle, windSpeed } = animState
    const moveRad = degreesToRadians((windAngle + 180) % 360, -90)
    const dx = Math.cos(moveRad)
    const dy = Math.sin(moveRad)
    const perpX = -dy
    const perpY = dx
    const speedScale = Math.max(0.5, windSpeed / 18)

    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI)
    ctx.clip()
    ctx.lineCap = 'round'

    for (const p of particles) {
        p.along += p.speed * speedScale

        if (p.along - p.trailLen > radius) {
            p.along = -radius - p.trailLen
            p.across = (Math.random() * 2 - 1) * radius
        }

        const headX = centerX + p.along * dx + p.across * perpX
        const headY = centerY + p.along * dy + p.across * perpY
        const tailX = headX - p.trailLen * dx
        const tailY = headY - p.trailLen * dy

        ctx.beginPath()
        ctx.strokeStyle = `rgba(180, 215, 245, ${p.alpha})`
        ctx.lineWidth = 1.5
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(headX, headY)
        ctx.stroke()
    }

    ctx.restore()
}

function drawAirplane(closest) {
    const headingRad = degreesToRadians(closest, -90)
    // Place on the approach half of the runway, facing the landing direction
    const planeX = centerX - radius * 0.35 * Math.cos(headingRad)
    const planeY = centerY - radius * 0.35 * Math.sin(headingRad)

    ctx.save()
    ctx.translate(planeX, planeY)
    ctx.rotate(headingRad + Math.PI / 2)
    ctx.fillStyle = 'white'
    ctx.shadowColor = 'rgba(220, 240, 255, 0.6)'
    ctx.shadowBlur = 6

    // Fuselage
    ctx.beginPath()
    ctx.moveTo(0, -12)
    ctx.lineTo(2.5, -6)
    ctx.lineTo(2, 6)
    ctx.lineTo(4, 11)    // tail fin right
    ctx.lineTo(0, 9)
    ctx.lineTo(-4, 11)   // tail fin left
    ctx.lineTo(-2, 6)
    ctx.lineTo(-2.5, -6)
    ctx.closePath()
    ctx.fill()

    // Left wing
    ctx.beginPath()
    ctx.moveTo(-2.5, -3)
    ctx.lineTo(-13, 3)
    ctx.lineTo(-2, 5)
    ctx.closePath()
    ctx.fill()

    // Right wing
    ctx.beginPath()
    ctx.moveTo(2.5, -3)
    ctx.lineTo(13, 3)
    ctx.lineTo(2, 5)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
}

function animateFrame() {
    setupCanvas(animState.closest)
    drawParticles()
    drawAirplane(animState.closest)
    drawWindLine(animState.windAngle)
    animFrameId = requestAnimationFrame(animateFrame)
}

function updateWindLine() {
    const windAngle = windInputEl.value
    const windSpeed = windSpeedEl.value

    if (windAngle !== '' && windSpeed !== '') {
        const closest = findClosest(runways, windAngle)
        animState = { windAngle: parseInt(windAngle, 10), windSpeed: parseFloat(windSpeed), closest }

        if (animFrameId === null) {
            initParticles()
            animFrameId = requestAnimationFrame(animateFrame)
        }

        idealRunwayValueEl.textContent = angleToRunwayNumber(closest)
        calcWind(windAngle, windSpeed, closest)
    } else {
        cancelAnimationFrame(animFrameId)
        animFrameId = null
        setupCanvas()
    }
}

function calcWind(windAngle, windSpeed, runway) {
    const { headTailComponent, crosswindComponent, isHeadwind, crosswindFromRight } = calcWindComponents(
        parseInt(windAngle, 10),
        parseFloat(windSpeed),
        runway
    )
    headWindValueEl.textContent = (isHeadwind ? 'Headwind: ' : 'Tailwind: ') + headTailComponent + 'kt(s)'
    crossWindValueEl.textContent = 'Crosswind from ' + (crosswindFromRight ? 'Right: ' : 'Left: ') + crosswindComponent + 'kt(s)'
}

function configureLocalStorage() {
    runways = [90, 270]
    localStorage.setItem('runways', JSON.stringify(runways))
}

function reconfigureRunways() {
    const currentNumbers = runways.map((r) => angleToRunwayNumber(r)).join(', ')
    const newRunways = window.prompt('Enter a comma separated list of runway numbers (e.g. 09, 27)', currentNumbers)

    if (newRunways === null || newRunways === '') {
        return
    }

    runways = parseRunwayInput(newRunways)
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
