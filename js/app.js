var canvas = document.getElementById('myCanvas')

var heightRatio = 1
canvas.height = canvas.width * heightRatio

var ctx = canvas.getContext('2d')

var centerX = canvas.width / 2
var centerY = canvas.height / 2
var radius = (canvas.width / 2) * 0.8

var runways = [20, 200, 140, 320]

ctx.beginPath()

function setupCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Setup for the circle
    ctx.beginPath()
    ctx.strokeStyle = '#99005b'
    ctx.lineWidth = 6
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.fillStyle = '#c5c6d0'
    ctx.fill()
    ctx.stroke()

    // Draw the fixed runway lines
    runways.forEach(function (angle) {
        drawRunwayLine(angle)
    })
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
    let runwayNumber = Math.round(angleDegrees / 10) // Divide by 10 and round to get the basic number
    if (runwayNumber >= 100) {
        // If the runway number is 100 or more, modulo by 100 to keep it within two digits
        runwayNumber = runwayNumber % 100
    }
    return runwayNumber.toString().padStart(2, '0') // Ensure it's a two-digit string
}

function drawWindLine(angleDegrees, numberOfArrows) {
    var adjustedAngleDegrees = angleDegrees - 90
    var angleRadians = adjustedAngleDegrees * (Math.PI / 180)

    var lineLength = radius * 1.5 // Length of the line from center

    // Draw the main wind line
    ctx.strokeStyle = 'blue'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(centerX + lineLength * Math.cos(angleRadians), centerY + lineLength * Math.sin(angleRadians))
    ctx.stroke()

    // Calculate the interval at which arrows should be placed on the line
    var interval = lineLength / (numberOfArrows + 1)

    // Set the style for the arrows
    ctx.fillStyle = 'blue'

    // Draw the arrows along the line
    for (var i = 1; i <= numberOfArrows; i++) {
        var x = centerX + i * interval * Math.cos(angleRadians)
        var y = centerY + i * interval * Math.sin(angleRadians)
        drawArrowhead(ctx, x, y, angleRadians + Math.PI / 2)
    }
}

function drawRunwayLine(angleDegrees) {
    // Adjust the angle by subtracting 90 degrees
    var adjustedAngleDegrees = angleDegrees - 270
    var angleRadians = adjustedAngleDegrees * (Math.PI / 180)

    // Calculate start and end points for the line
    var lineLength = Math.sqrt(2) * radius * 0.5
    var startX = centerX - lineLength * Math.cos(angleRadians)
    var startY = centerY - lineLength * Math.sin(angleRadians)
    var endX = centerX + lineLength * Math.cos(angleRadians)
    var endY = centerY + lineLength * Math.sin(angleRadians)

    // Drawing the line
    ctx.beginPath()
    ctx.strokeStyle = 'grey'
    ctx.lineWidth = 4
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Adding runway number text at the end of the line
    var textPadding = 15 // Padding from the end of the line to the start of the text
    var textX = endX + textPadding * Math.cos(angleRadians - Math.PI / 2)
    var textY = endY + textPadding * Math.sin(angleRadians - Math.PI / 2)

    ctx.fillStyle = 'black'
    ctx.font = '16px Arial' // Set the font size and family
    ctx.textAlign = 'center' // Center the text horizontally on the calculated point
    ctx.textBaseline = 'middle' // Center the text vertically on the calculated point

    let runwayText = angleToRunwayNumber(angleDegrees) // Convert to runway number
    ctx.fillText(runwayText, textX, textY)
}

function updateWindLine() {
    var windAngle = document.getElementById('windInput').value
    var windSpeed = document.getElementById('windSpeed').value

    if (windAngle !== '' && windSpeed !== '') {
        setupCanvas() // Clears the canvas and redraws the base elements
        drawWindLine(parseInt(windAngle, 10), 3) // Draws the wind line with the specified number of arrows

        var runway = angleToRunwayNumber(findClosest(windAngle))

        document.getElementById('idealRunwayValue').textContent = runway

        calcWind(windAngle, windSpeed, findClosest(windAngle))
    }
}

function calcWind(windAngle, windSpeed, runway) {
    var recip = runway < 180 ? runway + 180 : runway - 180

    // Convert degrees to radians more concisely
    var rwyrad = (runway * Math.PI) / 180
    var windrad = (windAngle * Math.PI) / 180

    // Calculate runway and wind vectors
    var rwyVector = { x: Math.sin(rwyrad), y: Math.cos(rwyrad) }
    var windVector = { x: Math.sin(windrad), y: Math.cos(windrad) }

    // Dot product and angle between runway and wind vectors
    var dotprod = rwyVector.x * windVector.x + rwyVector.y * windVector.y
    var thetarad = Math.acos(dotprod)

    // Rounding for significant figures
    var sigfig = 100
    var headortail_component = Math.round(sigfig * windSpeed * Math.cos(thetarad)) / sigfig
    var xwind_component = Math.round(sigfig * windSpeed * Math.sin(thetarad)) / sigfig

    // Determine head/tailwind and crosswind direction more efficiently
    var headOrTail = headortail_component >= 0 ? 'Headwind: ' : 'Tailwind: '

    // Simplified logic for determining crosswind direction
    var wind_direction =
        'Crosswind from ' + ((windAngle >= runway && windAngle < recip) || (runway >= 180 && (windAngle >= runway || windAngle < recip)) ? 'Right: ' : 'Left: ')

    // Update DOM elements
    document.getElementById('headWindValue').textContent = headOrTail + headortail_component + 'kt(s)'
    document.getElementById('crossWindValue').textContent = wind_direction + xwind_component + 'kt(s)'
}

function findClosest(value) {
    // Find the closest value
    return runways.reduce((closest, current) => {
        // Calculate the absolute difference
        const diffClosest = Math.abs(closest - value)
        const diffCurrent = Math.abs(current - value)

        // If the current value is closer, return it; otherwise, keep the previous closest
        return diffCurrent < diffClosest ? current : closest
    })
}

function angleToRunwayNumber(angleDegrees) {
    let runwayNumber = Math.round(angleDegrees / 10) // Divide by 10 and round to get the basic number
    if (runwayNumber >= 100) {
        // If the runway number is 100 or more, modulo by 100 to keep it within two digits
        runwayNumber = runwayNumber % 100
    }
    return runwayNumber.toString().padStart(2, '0') // Ensure it's a two-digit string
}

setupCanvas()
updateWindLine()

window.updateWindLine = updateWindLine
window.calcWind = calcWind
