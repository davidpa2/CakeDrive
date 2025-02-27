const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let roadY = 0;
let roadWidth = 280;

let curveOffset = 0;
let curveAmplitude = 40;
let time = 0; //Progress game time

// car dimension
var car = new Car(canvas.width / 2 - 20, canvas.height / 1.35, 4, 4, 60, 100, 15)

var carImg = new Image();
carImg.src = "Car.png";

let offRoadTime = 0; // Count if time off road
let inRoadTime = 0; // Count if time in road
const maxOffRoadTime = 3; // Allowed seconds off road
const penaltySpeed = 0.8; // If car is off road, it will be applyed

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
        if (car.x > 0) {
            car.x -= car.speed;
        }
    }
    if (movingRight) {
        if (car.x + car.sizeX < canvas.width) {
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

        let leftX = 115 + curve - 50;
        let rightX = leftX + roadWidth;

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
        ctx.fillRect(centerX - 20, (y + roadY - 30) % canvas.height, 8, 15);
    }
}

/**
 * Draw car
 */
function drawCar() {
    // Calculate Rotation Angle
    if (movingRight) {
        car.rotationAngle += (15 - car.rotationAngle) * 0.1; // Ease up rotation to 15°
    } else if (movingLeft) {
        car.rotationAngle += (-15 - car.rotationAngle) * 0.1; // Ease up rotation to -15°
    } else {
        car.rotationAngle += (0 - car.rotationAngle) * 0.1; // Return slowly to 0° when no moving
    }

    ctx.beginPath();
    ctx.save(); // Save the state of canvas
    
    ctx.translate(car.x + car.sizeX / 2, car.y + car.sizeY / 2); // Traslate the origin of rotation to the center of the car
    ctx.rotate((car.rotationAngle * Math.PI) / 180);

    // Draw centered car
    ctx.drawImage(carImg, -car.sizeX / 2, -car.sizeY / 2, car.sizeX, car.sizeY); 

    //Cakes counter at car
    ctx.font = "25px Times";
    ctx.fillText("35", -car.sizeX / 4.5, car.sizeY / 3.8);

    ctx.restore(); // Restore canvas rotation
    ctx.closePath();

    // Check if it's off road
    if (isOffRoad()) {
        offRoadTime += 1 / 60;

        if (car.speed > 1.5) { // Car speed can't be lower than 1.5
            car.speed *= penaltySpeed; //Reduce speed progressively
        }

        inRoadTime = 0;
    } else {        
        inRoadTime += 1 / 60;
        
        // If the car is again in road and it was recently off road
        if (inRoadTime > 0.5 && offRoadTime > 0) {
            car.speed = car.originalSpeed;
            offRoadTime = 0; //Reset off road time
        }
    }
}

function isOffRoad() {
    // Draw a square to know where is the checking point
    // ctx.beginPath();
    // ctx.fillStyle = "blue";
    // ctx.fillRect(car.x + car.sizeX / 2 - 20, car.y + car.sizeY , 10, 10);
    // ctx.closePath();
    
    // Get the color of the background where there is exactly the car
    let pixelData = ctx.getImageData(parseInt(car.x + car.sizeX - 30), parseInt(car.y + car.sizeY), 1, 1).data;
    let [r, g, b] = [pixelData[0], pixelData[1], pixelData[2]]; // Get RBG color
    
    return (r === 0 && g === 128 && b === 0); // Is green color?
    // return !(r === 128 && g === 128 && b === 128); // !Gray color 
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
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    moving()

    drawRoad();
    drawCar();
    update();
    // requestAnimationFrame(gameLoop);

    time++;
}

function random(min, max) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}