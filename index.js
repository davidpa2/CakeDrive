const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let roadY = 0;
let roadWidth = 290;

let curveOffset = 0;
let curveAmplitude = 40;
let time = 0; //Progress game time

// car dimension
var car = new Car(canvas.width / 2 - 20, canvas.height / 1.35, 4, 4, 60, 100, 15)

// Images
var carImg = new Image();
carImg.src = "Car.png";
var obstacleImgBanana = new Image();
obstacleImgBanana.src = "banana.png";
var obstacleImgRice = new Image();
obstacleImgRice.src = "rice.png";
var obstacleImgWheel = new Image();
obstacleImgWheel.src = "wheel.png";
var cakeImg = new Image();
cakeImg.src = "cake.png";
//---------------

let offRoadTime = 0; // Count if time off road
let inRoadTime = 0; // Count if time in road
const maxOffRoadTime = 3; // Allowed seconds off road
const penaltySpeed = 0.8; // If car is off road, it will be applyed

var cakes = new Map();
var cakeIdGenerator = 0;
var generateCakeChance = 40;
var eatenCakes = 0;
var cakesToEat = 36;
var cakeSize = 35;

var obstacles = new Map();
var obstacleIdGenerator = 0;
var generateObstacle = 0;
var obstacleFrequency = 150;

var generateObstacleSpeed = 4;
var minObstacleSize = 25;
var maxObstacleSize = 30;

let movingLeft = false;
let movingRight = false;

var showAdvice = true;
let theEnd = false;
let lost = false;

gameLoop();
var game = setInterval(gameLoop, 15);
var won = 0;

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
    if (lost) {
        window.location.reload();
    }
}

// Pointer Events
(function (element, events) {
    events.forEach(e => element.addEventListener(e, clickEvent, false))
})(document, ["pointerdown", "pointerup", "pointermove", "pointerout"])
function clickEvent(e) {
    switch (e.type) {
        case "pointerdown":
        case "pointermove":
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
        case "pointerout":
            movingRight = false;
            movingLeft = false;
            break;
    }

    if (lost) {
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

        let centerX = canvas.width / 2;  // Canvas center

        let leftX = centerX - roadWidth / 2 + curve;   // Calcula el borde izquierdo centrado
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
    ctx.fillStyle = "white";
    ctx.textAlign = "center"
    ctx.fillText(eatenCakes, -car.sizeX / 53, car.sizeY / 3.8);

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


function drawCakes() {
    for (const [key, cake] of cakes) {
        ctx.beginPath();
        ctx.drawImage(cakeImg, cake.x, cake.y, cake.sizeX, cake.sizeY);
        ctx.closePath();
        cake.y += cake.speed // Increase its Y position to move the cake

        // If the cake beats the bottom bound, delete it
        if (cake.y > canvas.height) {
            cakes.delete(key);
        }

        if (checkImpact(cake)) {
            roadWidth -= 2;
            showAdvice = false;
            cakes.delete(key)
            eatenCakes++;
            // theEnd = true;
        }
    }

    // Generate a cake
    if (generateCakeChance > random(0, 10000)) {
        let offset = (canvas.width / 2) - (roadWidth / 2);

        // let cake = new Cake(random(0, canvas.width - cakeSize), 0, random(2, 5), cakeSize, cakeSize);
        let cake = new Cake(cakeIdGenerator, random(offset, canvas.width - offset), 0, random(2, 5), cakeSize, cakeSize);
        cakes.set(cakeIdGenerator, cake);

        cakeIdGenerator++;
    }
}

function drawObstacles() {
    for (const [key, obstacle] of obstacles) {
        ctx.beginPath();
        ctx.drawImage(obstacle.image, obstacle.x + calculateCurve(obstacle.y), obstacle.y, obstacle.sizeX, obstacle.sizeY);
        ctx.closePath();
        obstacle.y += obstacle.speed // Increase its Y position to move the cloud

        // If the cake beats the bottom bound, delete it
        if (obstacle.y > canvas.height) {
            obstacles.delete(key);
        }

        if (checkImpact(obstacle)) {
            showAdvice = false;
            theEnd = true;
            lost = true;
        }
    }

    // Generate an obstacle
    if (generateObstacle == obstacleFrequency) {
        let offset = (canvas.width / 2) - (roadWidth / 2);

        let obstacleSize = random(minObstacleSize, maxObstacleSize);
        let obstacle = new Obstacle(random(offset, canvas.width - offset), 0, generateObstacleSpeed, obstacleSize, obstacleSize, randomObstacleImg());
        obstacles.set(obstacleIdGenerator, obstacle);
        
        obstacleIdGenerator++;
        generateObstacle = 0;
    }

    generateObstacle++;
}

// Checking impacts with the car
function checkImpact(item) {
    let impact = false;
    let added = item.sizeX / 6;
    
    if (car.y + car.sizeY > item.y + added // Car bottom collision
        && car.y < item.y + item.sizeY - added // Car top collision
        && car.x + car.sizeX - (added / 2) > item.x // Car right collision
        && car.x + (added / 2) < item.x + item.sizeX // Car left collision
    ) {
        impact = true;
    }

    return impact
}

function randomObstacleImg() {
    let number = random(0,2); 
    
    switch (number) {
        case 0:
            return obstacleImgBanana;
        case 1:
            return obstacleImgRice;
        case 2:
            return obstacleImgWheel;
    }
}

function checkLevel() {
    switch (eatenCakes) {
        case 10:
            generateObstacleSpeed = 5;
            maxObstacleSize = 35;
            break;

        case 20:
            obstacleFrequency = 100;
            generateObstacle = 0;
            minObstacleSize = 30;
            break;

        case 30:
            generateObstacleSpeed = 6;
            obstacleFrequency = 80;
            generateObstacle = 0;
            minObstacleSize = 35;
            maxObstacleSize = 40;
            break;
    }
}

function update() {
    roadY += 2;
    curveOffset += 2; // Curve speed
    if (roadY >= 40) roadY = 0;

    time++;
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


function drawCakeCounter() {
    if (!theEnd) {
        ctx.font = "25px Times";
        ctx.textAlign = "left"
        ctx.fillStyle = "white";
        ctx.fillText("Tartas recogidas: " + eatenCakes, 20, 35);
    }
}

function drawAdvice() {
    if (showAdvice) {
        ctx.font = "7vw Times";
        ctx.lineWidth = 0.5;
        ctx.textAlign = "center"
        ctx.fillStyle = "red";
        ctx.strokeStyle = "white";
        ctx.fillText("¡Alcanza las tartas", canvas.width / 2, canvas.height / 2, canvas.width / 1.5);
        ctx.strokeText("¡Alcanza las tartas", canvas.width / 2, canvas.height / 2, canvas.width / 1.5);
        ctx.fillText("y esquiva los obstáculos!", canvas.width / 2, canvas.height / 2 + 35, canvas.width / 1.5);
        ctx.strokeText("y esquiva los obstáculos!", canvas.width / 2, canvas.height / 2 + 35, canvas.width / 1.5);
        ctx.font = "5vw Times";
        ctx.fillText("Toca un lado u otro de la pantalla para moverte", canvas.width / 2, canvas.height - 50, canvas.width - 40);
    }
}

function win() {
    theEnd = true;
    generateCakeChance = 800;
    canvas.addEventListener("click", click, false);
    won = setInterval(winLoop, 15);
}

function lose() {
    ctx.font = "13vw Times";
    ctx.textAlign = "center"
    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    ctx.fillText("¡Has perdido!", canvas.width / 2, canvas.height / 2 - 20, canvas.width);
    ctx.strokeText("¡Has perdido!", canvas.width / 2, canvas.height / 2 - 20, canvas.width);

    drawCar(); // Finally, refresh state of the car
}

function gameLoop() {
    moving()
    
    drawRoad();
    drawCar();
    drawCakes();
    drawObstacles();
    
    drawCakeCounter();

    drawAdvice();

    checkLevel();

    update();

    if (cakesToEat == eatenCakes) {
        win();
        clearInterval(game);
    }

    if (lost) {
        clearInterval(game);
        lose();
    }

    ctx.imageSmoothingQuality = "high";
}



function winLoop() {
    drawWinBackground();

    drawWinCar();
    drawWinCakes();
}

function drawWinBackground() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawWinCar() {
    let carWidth = car.sizeX * 3;
    let carHeight = car.sizeY * 3;
    let centerX = (canvas.width - carWidth) / 2;
    let centerY = (canvas.height - carHeight) / 1.1;

    ctx.beginPath();
    ctx.save(); // Save the state of canvas
    
    ctx.translate(centerX + carWidth / 2, centerY + carHeight / 2); // Traslate the origin of rotation to the center of the car
    ctx.rotate((15 * Math.PI) / 180);
    // Draw centered car
    ctx.drawImage(carImg, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
    
    //Cakes counter at car
    ctx.font = "20vw Times";
    ctx.textAlign = "center";
    ctx.fillStyle = "white";
    ctx.fillText(cakesToEat, 0, carHeight / 4);

    ctx.restore(); // Restore canvas rotation

    //Draw the different obstacles
    ctx.drawImage(obstacleImgRice, canvas.width / 1.5, canvas.height / 4, 80, 80);
    ctx.drawImage(obstacleImgBanana, canvas.width / 2, canvas.height / 10, 80, 80);
    ctx.drawImage(obstacleImgWheel, canvas.width / 5, canvas.height / 4.5, 80, 80);

    ctx.font = "8vw Times";
    ctx.textAlign = "center"
    ctx.fillStyle = "red";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 0.5;
    ctx.fillText("¡Muchísimas felicidades!", canvas.width / 2, canvas.height / 2 - 50, canvas.width);
    ctx.strokeText("¡Muchísimas felicidades!", canvas.width / 2, canvas.height / 2 - 50, canvas.width);
    ctx.fillText(`¡${cakesToEat} tartas, ${cakesToEat} años!`, canvas.width / 2, canvas.height / 2 + 50, canvas.width);
    ctx.strokeText(`¡${cakesToEat} tartas, ${cakesToEat} años!`, canvas.width / 2, canvas.height / 2 + 50, canvas.width);

    ctx.closePath();
}

function drawWinCakes() {
    for (const [key, cake] of cakes) {
        ctx.beginPath();
        ctx.drawImage(cakeImg, cake.x, cake.y, cake.sizeX, cake.sizeY);
        ctx.closePath();
        cake.y += cake.speed // Increase its Y position to move the cake

        // If the cake beats the bottom bound, delete it
        if (cake.y > canvas.height) {
            cakes.delete(key);
        }
    }

    // Generate a cake
    if (generateCakeChance > random(0, 10000)) {
        let offset = 10;
        let cake = new Cake(cakeIdGenerator, random(offset, canvas.width - offset - cakeSize), 0, random(2, 5), cakeSize, cakeSize);
        cakes.set(cakeIdGenerator, cake);

        cakeIdGenerator++;
    }
}

/**
 * That event is just for the end of the game, to be able to touch the cakes and remove them
 * @param {*} e 
 */
function click(e) {
    if (theEnd) {
        cakes.forEach(cake => {
            if ((e.x > cake.x && e.x < cake.x + 50) && (e.y > cake.y && e.y < cake.y + 50)) {//
                cakes.delete(cake.id);
            }
        })
    }
}

function random(min, max) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min;
    return num;
}
