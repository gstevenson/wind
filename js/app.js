var canvas = document.getElementById('myCanvas')

var heightRatio = 1
canvas.height = canvas.width * heightRatio

var ctx = canvas.getContext('2d')

var centerX = canvas.width / 2
var centerY = canvas.height / 2
var radius = (canvas.width / 2) * 0.6

ctx.beginPath()

function setupCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Redraw any static elements here (e.g., the circle or fixed lines)
    ctx.beginPath()
    ctx.strokeStyle = 'black'
    ctx.lineWidth = 1
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.stroke()

    // Example: Redraw fixed runway lines
    drawRunwayLine(20)
    drawRunwayLine(200)
    drawRunwayLine(140)
    drawRunwayLine(320)
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
    var lineLength = Math.sqrt(2) * radius
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
    var recip

    if (runway < 180) {
        recip = runway + 180
    } else {
        recip = runway - 180
    }

    var recip_wind

    if (windAngle < 180) {
        recip_wind = windAngle + 180
    } else {
        recip_wind = windAngle - 180
    }

    var rwyrad = (runway * Math.PI) / 180

    var windrad = (windAngle * Math.PI) / 180

    var rwyx = Math.sin(rwyrad)

    var rwyy = Math.cos(rwyrad)

    var windx = Math.sin(windrad)

    var windy = Math.cos(windrad)

    var dotprod = rwyx * windx + rwyy * windy

    var thetarad = Math.acos(dotprod)

    var sigfig = 100

    var headortail_component = Math.round(sigfig * windSpeed * Math.cos(thetarad)) / sigfig

    var xwind_component = Math.round(sigfig * windSpeed * Math.sin(thetarad)) / sigfig

    var headOrTail

    var wind_direction

    if (headortail_component >= 0) {
        headOrTail = 'Headwind: '
    } else {
        headOrTail = 'Tailwind: '
    }

    if (runway < 180) {
        if (windAngle >= runway && windAngle < recip) {
            wind_direction = 'Crosswind from Right: '
        } else {
            wind_direction = 'Crosswind from Left: '
        }
    } else {
        if (windAngle >= runway || windAngle < recip) {
            wind_direction = 'Crosswind from Right: '
        } else {
            wind_direction = 'Crosswind from Left: '
        }
    }

    document.getElementById('headWindValue').textContent = headOrTail + ' ' + headortail_component + 'kt(s)'
    document.getElementById('crossWindValue').textContent = wind_direction + ' ' + xwind_component + 'kt(s)'
}

function findClosest(value) {
    // Hard-coded values
    const values = [20, 200, 140, 320]

    // Find the closest value
    return values.reduce((closest, current) => {
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
