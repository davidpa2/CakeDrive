class Car {
    constructor(x, y, speed, originalSpeed, sizeX, sizeY, rotationAngle) {
        this.x = x
        this.y = y
        this.speed = speed
        this.originalSpeed = originalSpeed
        this.sizeX = sizeX
        this.sizeY = sizeY
        this.rotationAngle = rotationAngle
    }
}

class Cake {
    constructor(x, y, speed, sizeX, sizeY) {
        this.x = x
        this.y = y
        this.speed = speed
        this.sizeX = sizeX
        this.sizeY = sizeY
    }
}

class Obstacle {
    constructor(x, y, speed, sizeX, sizeY, image) {
        this.x = x
        this.y = y
        this.speed = speed
        this.sizeX = sizeX
        this.sizeY = sizeY
        this.image = image
    }
}