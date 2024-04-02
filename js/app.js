module.exports = {
  run: function () {
    console.log("run from app.js");
  },
};

var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");

var centerX = canvas.width / 2;
var centerY = canvas.height / 2;
var radius = 200; // Radius of the circle

function setupCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Redraw any static elements here (e.g., the circle or fixed lines)
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.stroke();

  // Example: Redraw fixed runway lines
  drawRunwayLine(20);
  drawRunwayLine(200);
  drawRunwayLine(140);
  drawRunwayLine(320);

  // drawWindLine(240, 3);

  // updateWindLine();
}

ctx.beginPath();

function drawArrowhead(ctx, x, y, radians) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(radians);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-5, -10);
  ctx.lineTo(5, -10);
  ctx.closePath();
  ctx.restore();
  ctx.fill();
}

// Function to convert angle to runway number format
function angleToRunwayNumber(angleDegrees) {
  let runwayNumber = Math.round(angleDegrees / 10); // Divide by 10 and round to get the basic number
  if (runwayNumber >= 100) {
    // If the runway number is 100 or more, modulo by 100 to keep it within two digits
    runwayNumber = runwayNumber % 100;
  }
  return runwayNumber.toString().padStart(2, "0"); // Ensure it's a two-digit string
}

function drawWindLine(angleDegrees, numberOfArrows) {
  var adjustedAngleDegrees = angleDegrees - 90;
  var angleRadians = adjustedAngleDegrees * (Math.PI / 180);

  var lineLength = 400; // Length of the line from center

  // Draw the main wind line
  ctx.strokeStyle = "blue";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + lineLength * Math.cos(angleRadians),
    centerY + lineLength * Math.sin(angleRadians)
  );
  ctx.stroke();

  // Calculate the interval at which arrows should be placed on the line
  var interval = lineLength / (numberOfArrows + 1);

  // Set the style for the arrows
  ctx.fillStyle = "blue";

  // Draw the arrows along the line
  for (var i = 1; i <= numberOfArrows; i++) {
    var x = centerX + i * interval * Math.cos(angleRadians);
    var y = centerY + i * interval * Math.sin(angleRadians);
    drawArrowhead(ctx, x, y, angleRadians + Math.PI / 2);
  }
}

function drawRunwayLine(angleDegrees) {
  // Adjust the angle by subtracting 90 degrees
  var adjustedAngleDegrees = angleDegrees - 90;
  var angleRadians = adjustedAngleDegrees * (Math.PI / 180);

  // Calculate start and end points for the line
  var lineLength = Math.sqrt(2) * radius;
  var startX = centerX - lineLength * Math.cos(angleRadians);
  var startY = centerY - lineLength * Math.sin(angleRadians);
  var endX = centerX + lineLength * Math.cos(angleRadians);
  var endY = centerY + lineLength * Math.sin(angleRadians);

  // Drawing the line
  ctx.beginPath();
  ctx.strokeStyle = "grey";
  ctx.lineWidth = 4;
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Adding runway number text at the end of the line
  var textPadding = 15; // Padding from the end of the line to the start of the text
  var textX = endX + textPadding * Math.cos(angleRadians - Math.PI / 2);
  var textY = endY + textPadding * Math.sin(angleRadians - Math.PI / 2);

  ctx.fillStyle = "black";
  ctx.font = "16px Arial"; // Set the font size and family
  ctx.textAlign = "center"; // Center the text horizontally on the calculated point
  ctx.textBaseline = "middle"; // Center the text vertically on the calculated point

  let runwayText = angleToRunwayNumber(angleDegrees); // Convert to runway number
  ctx.fillText(runwayText, textX, textY);
}

function updateWindLine() {
  var windAngle = document.getElementById("windInput").value;
  if (windAngle !== "") {
    // Check if the input is not empty
    setupCanvas(); // Clears the canvas and redraws the base elements
    drawWindLine(parseInt(windAngle, 10), 3); // Draws the wind line with the specified number of arrows
  }
}

function app() {
  console.log("line 8");
}

window.updateWindLine = updateWindLine;

setupCanvas();
updateWindLine();
