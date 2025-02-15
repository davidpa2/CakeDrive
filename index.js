const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let roadY = 0;
let roadWidth = 280;

let curveOffset = 0;
let curveAmplitude = 40;

let xMove = 0;

gameLoop();
var game = setInterval(gameLoop, 15)


function drawRoad() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Green background (grass)

    ctx.fillStyle = "gray";
    
    for (let y = 0; y < canvas.height; y += 10) {
        let curve = calculateCurve(y); // Curve movement

        let i = random(0, 5000);

        let leftX = 0
        switch (i) {
            case 1:
                if (true) {
                    console.log('Aquí, cambia derecha');
                    xMove += 1;
                    break;
                }
                
            case 2, 3:
                console.log('Aquí, cambia izquierda');
                xMove -= 1;
                break;
        }

        leftX = 115 + curve - 30 + xMove;
        let rightX = leftX + roadWidth;
        // console.log(leftX);
        ctx.beginPath();
        ctx.moveTo(leftX, y);
        ctx.lineTo(rightX, y);
        ctx.lineTo(rightX, y + 10);
        ctx.lineTo(leftX, y + 10);
        ctx.closePath();
        ctx.fill();
    }

    // Central road lines
    ctx.fillStyle = "white";
    for (let y = 0; y < canvas.height; y += 50) { // The y increment is for the lines separation
        let curve = calculateCurve(y);
        let centerX = 225 + curve - 16 + xMove; // Increasing 16 to center the line
        ctx.fillRect(centerX - 5, (y + roadY - 30) % canvas.height, 8, 15);
    }
}

function update() {
    roadY += 2;
    curveOffset += 2; // Curve speed
    if (roadY >= 40) roadY = 0;
}

function calculateCurve(y) {
    return Math.sin((y + curveOffset) * 0.01) * curveAmplitude;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    update();
    // requestAnimationFrame(gameLoop);
}

function random(min, max) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}