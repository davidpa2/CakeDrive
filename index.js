const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let roadY = 0;
let roadWidth = 280;

let curveOffset = 0;
let curveAmplitude = 40;
let time = 0; //Progress game time

// car dimension
var car = new Car(canvas.width / 2 - (100 / 2), canvas.height / 1.2, 4, 70, 120)

var carImg = new Image();
carImg.src = "Car.png";


let movingLeft = false;
let movingRight = false;

var showAdvice = true;
let theEnd = false;

gameLoop();
var game = setInterval(gameLoop, 15);


// KeyEvents
(function (element, events) {
    events.forEach(e => element.addEventListener(e, arrowEvent, false))
})(document, ["keydown", "keyup"])
function arrowEvent(e) {
    switch (e.keyCode) {
        case 37: // Left arrow
            if (e.type == "keydown") {
                movingLeft = true;
            } else if (e.type == "keyup") {
                movingLeft = false;
            }
            break;
        case 39: // Right arrow
            if (e.type == "keydown") {
                movingRight = true;
            } else if (e.type == "keyup") {
                movingRight = false;
            }
            break;
    }
    if (theEnd) {
        window.location.reload();
    }
}

// Pointer Events
(function (element, events) {
    events.forEach(e => element.addEventListener(e, clickEvent, false))
})(document, ["pointerdown", "pointerup"])
function clickEvent(e) {
    switch (e.type) {
        case "pointerdown":
            if (e.x < canvas.width / 2) {
                if (car.x > 10) {
                    movingLeft = true;
                }
            } else {
                if (car.x + car.sizeX + 10 < canvas.width) {
                    movingRight = true;
                }
            }
            break;
        case "pointerup":
            movingRight = false;
            movingLeft = false;
            break;
    }
    if (theEnd) {
        window.location.reload();
    }
}

function moving() {
    if (movingLeft) {
        if (car.x > 10) {
            car.x -= car.speed;
        }
    }
    if (movingRight) {
        if (car.x + car.sizeX + 10 < canvas.width) {
            car.x += car.speed;
        }
    }
}



function drawRoad() {
    ctx.fillStyle = "green";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Green background (grass)

    ctx.fillStyle = "gray";
    
    updateCurveAmplitude();

    for (let y = 0; y < canvas.height; y += 10) {
        let curve = calculateCurve(y); // Curve movement

        let leftX = 115 + curve - 30;
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
        let centerX = 225 + curve;
        ctx.fillRect(centerX - 5, (y + roadY - 30) % canvas.height, 8, 15);
    }
}

/**
 * Draw car
 */
function drawCar() {
    // if (movingLeft) {
    //     carImg.src = "DaniLeft.png"
    // } else if (movingRight) {
    //     carImg.src = "DaniRight.png"
    // }

    ctx.beginPath();
    ctx.drawImage(carImg, car.x, car.y, car.sizeX, car.sizeY);
    ctx.closePath();
}


function update() {
    roadY += 2;
    curveOffset += 2; // Curve speed
    if (roadY >= 40) roadY = 0;
}

function calculateCurve(y) {
    return Math.sin((y + curveOffset) * 0.01) * curveAmplitude;
}

// Modify smoothly curve amplitude
function updateCurveAmplitude() {
    //Add 30 so that the minimum amplitude is not too small
    curveAmplitude = 30 + Math.sin(time * 0.005) * 20; // Modify the product of time to change the movement speed
    // console.log(curveAmplitude);
    time++;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    moving()

    drawRoad();
    drawCar();
    update();
    // requestAnimationFrame(gameLoop);
}

function random(min, max) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}