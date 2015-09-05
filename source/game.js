/*
Reverse Ground Battle
by Mattia Fortunati
developed for the 2015 edition of js13games competition
code released under MIT license
https://github.com/MattiaFortunati
http://www.mattiafortunati.com
mattia@mattiafortunati.com
*/



//----------------GLOBAL VARs Declaration------------------
//player ship
var char = {
    x: 0,
    y: 0
};

//ground rectangle for double color
var groundRect;

//arrays for enemies, shots and particles
var enemiesArray = [];
var shotsArray = [];
var particlesArray = [];

//colors for reversing and writing
var color1 = 255;
var color2 = 0;
var colorBlack = makecol(0, 0, 0)
var colorWhite = makecol(255, 255, 255)
var colorBlue = makecol(0, 0, 255)

//game status
var gameStatus = "loading" //"start", "game" or "end"

//score
var score = 0
var killingScore = 100

//interval and timeouts for timed calls
var charShotInterval;
var waveTimeout;

//audio
audioArray = [];

//mute toggle
var mute = false

//screen size
s_width = 640
s_height = 480

//store if on mobile
var ISMOBILE = false

//if loaded
var ISAUDIOLOADED = false
var audioToLoad = 0
var audioLoaded = 0




//----------------USEFUL FUNCTIONS------------------
//used to remove an object from an array
//directly from stack overflow
function removeFromArray(arr) {
    var what, a = arguments,
        L = a.length,
        ax;
    while (L > 1 && arr.length) {
        what = a[--L];
        while ((ax = arr.indexOf(what)) !== -1) {
            arr.splice(ax, 1);
        }
    }
    return arr;
}

//to calculate distance between two points, object in this case
//directly from snipplr
function lineDistance(point1, point2) {
    var xs = 0;
    var ys = 0;

    xs = point2.x - point1.x;
    xs = xs * xs;

    ys = point2.y - point1.y;
    ys = ys * ys;

    return Math.sqrt(xs + ys);
}




//----------------WAVE HANDLING and creation------------------
//create n enemy1
//with random color (RED or GREEN)
//just outside from the top of the screen and with random x
function createEnemy1(n) {
    for (var i = 1; i <= n; i++) {
        colorRan = rand() % 2;
        var ee = new enemy("enemy1", (rand() % (SCREEN_W - 100) + 50), -20, colorRan, 0)
        enemiesArray.push(ee);
    }
}

//create n enemy2
//with random color (RED or GREEN)
//and random y
//x is set within the enemy2 creation
function createEnemy2(n) {
    for (var i = 1; i <= n; i++) {
        colorRan = rand() % 2;
        var ee = new enemy("enemy2", 0, (rand() % (SCREEN_H - 200)), colorRan, 0)
        enemiesArray.push(ee);
    }
}

//create 10 enemy3 on the left side of the screen
//and 10 enemy3 on the right side of the screen
//create one enemy3 each 200ms so they have a little space between them
//each one with random color (RED or GREEN)
function createEnemy3() {
    var cInterval1 = setInterval(function() {
        colorRan = rand() % 2;
        var ee = new enemy("enemy3", 0, SCREEN_H / 2, colorRan, -90)
        enemiesArray.push(ee);
    }, 200);
    setTimeout(function() {
        clearInterval(cInterval1)
    }, 1000)
    var cInterval2 = setInterval(function() {
        colorRan = rand() % 2;
        var ee = new enemy("enemy3", SCREEN_W, SCREEN_H / 2, colorRan, +90)
        enemiesArray.push(ee);
    }, 200);
    setTimeout(function() {
        clearInterval(cInterval2)
    }, 1000)
}

//create 2 enemy4 one on the right and one on the left side
//of the game screen
//with random color (RED or GREEN)
//and random y
function createEnemy4() {
    colorRan = rand() % 2;
    var ee = new enemy("enemy4", -20, rand() % SCREEN_H, colorRan, 0)
    enemiesArray.push(ee);
    colorRan = rand() % 2;
    var ee = new enemy("enemy4", SCREEN_W + 20, rand() % SCREEN_H, colorRan, 0)
    enemiesArray.push(ee);
}

//this will handle the waves by generating a random number
//between 0 and 5 and by creating, depending on the case, 
//different setups of enemies
function createWave() {
    if (gameStatus == "game") {
        num = rand() % 6
        if (num == 0) {
            createEnemy1(10)
        } else if (num == 1) {
            createEnemy2(8)
        } else if (num == 2) {
            createEnemy3()
            createEnemy1(2)
            createEnemy2(3)
        } else if (num == 3) {
            createEnemy4()
            createEnemy1(3)
        } else if (num == 4) {
            createEnemy4()
            createEnemy4()
            createEnemy1(2)
            createEnemy2(2)
        } else if (num == 5) {
            createEnemy3()
            createEnemy1(2)
            createEnemy2(3)
        }
        play_sound("newWave");
        waveTimeout = setTimeout(createWave, 8000)
    }

}




//----------------GAME STATE FUNCTIONS------------------

//call this to pass from Title Screen to Game Screen
function gameStart() {
    //start wave in 1 second
    waveTimeout = setTimeout(createWave, 1000)
        //set score to zero
    score = 0;
    //player starts shooting and jumps to center of the screen
    charShotInterval = setInterval(createShot, 200, "player");
    char.x = SCREEN_W / 2
    char.y = SCREEN_H / 2
        //create random particles simulating stars and giving the effect of movement
        //not on mobile for having less objects as possible for performance reasons
    if (ISMOBILE == false) {
        for (var i = 0; i <= 20; i++) {
            createParticle("ground")
        }
    }
    //set game status to game
    gameStatus = "game"
}

//call this to pass from Game Screen to Game Over Screen
function gameEnd() {
    //each enemy should stop shooting
    for (var i = 0; i < enemiesArray.length; i++) {
        enemiesArray[i].stopShooting()
    }
    //empty all the arrays
    enemiesArray = [];
    shotsArray = [];
    particlesArray = [];
    //clear the intervals and timeouts
    clearInterval(charShotInterval)
    clearTimeout(waveTimeout)
        //set game status to end
    gameStatus = "end"
}

//call this to pass from Game Over Screen to Title Screen
function gameRestart() {
    //set game status to start
    gameStatus = "start"
}




//----------------ENEMY PROTOTYPE------------------

/*
There are 4 different enemies
enemy1 = will enter the screen from top, reaching a random y and then star moving left and right, shooting each 1 second
enemy2 = will entere from right or left, reaching a random x and stopping. It will also move in circle, shooting 3 shots
	in 3 different directions each 1.5 seconds
enemy3 = it will rotate around the center of the left or right border of the screen. Will not shot
enemy4 = it will come from left or right and it will slowly chase the player. It won't shot

Prototype functions:
drawItself - will draw the object
destroy - will remove the object fron enemiesArray
stopShooting - will stop shooting
checkCollision - will check collision with player shots
move - handles the movement

*/



function enemy(type, x, y, colorType, angle) {
    //set properties
    this.type = type
    this.x = x;
    this.y = y;
    this.angle = angle
    this.colorType = colorType;
    //random color
    if (this.colorType == 1) {
        this.c1 = color2;
        this.c2 = color1;
    } else {
        this.c1 = color1;
        this.c2 = color2;
    }
    this.color = makecol(this.c1, this.c2, 0)
        //
    if (type == "enemy1") {
        //random stepWalk, to randomly moving left or right
        ranV = rand() % 2
        if (ranV == 0) {
            this.stepWalk = 1
        } else {
            this.stepWalk = -1
        }
        this.enterWalk = 1
        this.posY = rand() % (SCREEN_H - 200)
            //start shooting
        this.shotInterval = setInterval(createShot, 1000, "enemy1", this);
    } else if (type == "enemy2") {
        this.stepWalk = 1
            //start shooting
        this.shotInterval = setInterval(createShot, 1500, "enemy2", this);
        //random x, if from left or right side of the screen
        ranV = rand() % 2
        if (ranV == 0) {
            this.x = -20
        } else {
            this.x = SCREEN_W + 20
        }
        this.posX = rand() % SCREEN_W
    } else if (type == "enemy3") {
        this.centerx = this.x
        this.centery = this.y
    } else if (type == "enemy4") {
        //
    }

    //draw
    this.drawitself = function() {
            if (type == "enemy1") {
                trianglefill(canvas, this.x + 0, this.y + 12, this.x + 6, this.y - 6, this.x - 6, this.y - 6, this.color);
                trianglefill(canvas, this.x + 12, this.y + 6, this.x + 12, this.y - 6, this.x + 6, this.y - 6, this.color);
                trianglefill(canvas, this.x - 12, this.y + 6, this.x - 6, this.y - 6, this.x - 12, this.y - 6, this.color);
                polygonfill(canvas, 4, [this.x - 12, this.y + 0, this.x + 12, this.y + 0, this.x + 12, this.y - 6, this.x - 12, this.y - 6], this.color)
                circlefill(canvas, this.x - 6, this.y - 6, 3, this.color);
                circlefill(canvas, this.x + 6, this.y - 6, 3, this.color);
            } else if (type == "enemy2") {
                trianglefill(canvas, this.x + 0, this.y - 6, this.x + 12, this.y - 6, this.x + 6, this.y + 12, this.color);
                trianglefill(canvas, this.x + 0, this.y - 6, this.x - 6, this.y + 12, this.x - 12, this.y - 6, this.color);
                circlefill(canvas, this.x, this.y, 6, this.color);
                circlefill(canvas, this.x - 6, this.y - 6, 3, this.color);
                circlefill(canvas, this.x + 6, this.y - 6, 3, this.color);
            } else if (type == "enemy3") {
                polygonfill(canvas, 6, [this.x - 12, this.y + 6, this.x + 12, this.y + 6, this.x + 6, this.y - 6, this.x + 6, this.y + 0, this.x - 6, this.y + 0, this.x - 6, this.y - 6], this.color)
                circlefill(canvas, this.x, this.y + 6, 3, this.color);
            } else if (type == "enemy4") {
                circle(canvas, this.x, this.y, 10, this.color, 5);
                trianglefill(canvas, this.x, this.y - 20, this.x + 5, this.y - 10, this.x - 5, this.y - 10, this.color);
                trianglefill(canvas, this.x, this.y + 20, this.x + 5, this.y + 10, this.x - 5, this.y + 10, this.color);
                trianglefill(canvas, this.x - 20, this.y, this.x - 10, this.y + 5, this.x - 10, this.y - 5, this.color);
                trianglefill(canvas, this.x + 20, this.y, this.x + 10, this.y + 5, this.x + 10, this.y - 5, this.color);
                circlefill(canvas, this.x - 8, this.y - 8, 5, this.color);
                circlefill(canvas, this.x + 8, this.y - 8, 5, this.color);
                circlefill(canvas, this.x - 8, this.y + 8, 5, this.color);
                circlefill(canvas, this.x + 8, this.y + 8, 5, this.color);
            }
        }
        //destroy
    this.destroy = function() {
            removeFromArray(enemiesArray, this);
        }
        //stop shooting
    this.stopShooting = function() {
            clearInterval(this.shotInterval);
        }
        //collision with player shots
    this.checkCollision = function() {
            for (var i = 0; i < shotsArray.length; i++) {
                if (shotsArray[i].name == "charShot" && lineDistance(this, shotsArray[i]) < 20) {
                    this.destroy();
                    this.stopShooting();
                    shotsArray[i].destroy()
                    play_sound("hit");
                    createParticle("explosion", this.x, this.y, this.color)
                    createParticle("score", this.x, this.y, this.color)
                    score = score + killingScore
                }
            }
        }
        //move in x changing direction at border
        //move in y until posY has been reached
    this.move = function() {
        if (type == "enemy1") {
            if (this.x > SCREEN_W || this.x < 0) {
                this.stepWalk = -this.stepWalk;
            }
            this.x = this.x + this.stepWalk
            if (this.y < this.posY) {
                this.y = this.y + this.enterWalk
            }
        } else if (type == "enemy2") {
            if (this.x > this.posX) {
                this.x = this.x - this.stepWalk
            } else if (this.x < this.posX) {
                this.x = this.x + this.stepWalk
            }
            radius = 5
            this.x = this.x + Math.sin(this.angle) * radius;
            this.y = this.y + Math.cos(this.angle) * radius;
            this.angle = this.angle + 0.1
        } else if (type == "enemy3") {
            radius = 200
            this.x = this.centerx + Math.sin(this.angle) * radius;
            this.y = this.centery + Math.cos(this.angle) * radius;
            this.angle = this.angle + 0.02
        } else if (type == "enemy4") {
            this.angle = Math.atan2(char.y - this.y, char.x - this.x);
            // Move towards the char
            this.x = this.x + Math.cos(this.angle) * 1
            this.y = this.y + Math.sin(this.angle) * 1
        }

    }

}



//----------------BULLET PROTOTYPE AND CREATION FUNCION------------------


function bullet(type, x, y, c1, c2, shape, xmove) {
    if (type == "player") {
        this.x = x
        this.y = y
            //to distinguish this from enemy shot
        this.name = "charShot"
    } else if (type == "enemy") {
        this.x = x
        this.y = y
        this.c1 = c1
        this.c2 = c2
            //name to distinguish this from player shot
        this.name = "enemyShot"
        this.shape = shape
            //step to move in x
        this.xmove = xmove
        this.color = makecol(this.c1, this.c2, 0)
    }

    //draw
    this.drawitself = function() {
            if (type == "player") {
                polygonfill(canvas, 6, [this.x + 0, this.y - 3, this.x + 3, this.y + 0, this.x + 3, this.y + 3, this.x + 0, this.y + 9, this.x - 3, this.y + 3, this.x - 3, this.y + 0], colorBlue)
            } else if (type == "enemy") {
                //shape 0 is for enemy1, shape 1 is for enemy2
                if (this.shape == 0) {
                    polygonfill(canvas, 4, [this.x + 4, this.y - 6, this.x + 6, this.y - 4, this.x - 4, this.y + 6, this.x - 6, this.y + 4], this.color)
                    polygonfill(canvas, 4, [this.x - 4, this.y - 6, this.x + 6, this.y + 4, this.x + 4, this.y + 6, this.x - 6, this.y - 4], this.color)
                } else {
                    circle(canvas, this.x, this.y, 3, this.color, 2);
                }
            }

        }
        //move
    this.move = function() {
            if (type == "player") {
                this.y = this.y - 10;
            } else if (type == "enemy") {
                this.y = this.y + 4;
                this.x = this.x + this.xmove
            }

        }
        //check outside, if outside it is destroyed
    this.checkOutside = function() {
            if (this.y > SCREEN_H || this.y < 0) {
                this.destroy();
            }

        }
        //destroy
    this.destroy = function() {
        removeFromArray(shotsArray, this);
    }
}



function createShot(type, parentObject) {
    if (type == "enemy1") {
        var ss = new bullet("enemy", parentObject.x, parentObject.y, parentObject.c1, parentObject.c2, 0, 0);
        play_sound("enemyShot");
        shotsArray.push(ss);
    } else if (type == "enemy2") {
        var ss1 = new bullet("enemy", parentObject.x - 10, parentObject.y, parentObject.c1, parentObject.c2, 1, 1);
        var ss2 = new bullet("enemy", parentObject.x + 10, parentObject.y, parentObject.c1, parentObject.c2, 1, -1);
        var ss3 = new bullet("enemy", parentObject.x, parentObject.y, parentObject.c1, parentObject.c2, 1, 0);
        play_sound("enemyShot");
        shotsArray.push(ss1);
        shotsArray.push(ss2);
        shotsArray.push(ss3);
    } else if (type == "player") {
        var ss = new bullet("player", char.x, char.y);
        play_sound("shot");
        shotsArray.push(ss);
    }
}


//----------------PARTICLE PROTOTYPE AND CREATION FUNCTION------------------

function particle(type, x, y, color) {
    if (type == "score") {
        this.x = x
        this.y = y
        this.color = color
            //timeout for self removal
        setTimeout(function(obj) {
            obj.destroy()
        }, 500, this)
    } else if (type == "explosion") {
        this.x = x
        this.y = y
        this.color = color
            //starting size
        this.size = 1
    } else if (type == "ground") {
        //random position
        this.x = rand() % SCREEN_W
        this.y = rand() % SCREEN_H
            //random speed
        this.speed = rand() % 3 + 1
    }
    //draw
    this.drawitself = function() {
            if (type == "score") {
                textout_centre(canvas, font, killingScore, this.x, this.y, 12, this.color);
            } else if (type == "explosion") {
                circle(canvas, this.x, this.y, this.size, this.color, 2);
            } else if (type == "ground") {
                circlefill(canvas, this.x, this.y, 0.8, colorBlue);
            }
        }
        //destroy
    this.destroy = function() {
            removeFromArray(particlesArray, this);
        }
        //check outside
    this.checkOutside = function() {
            if (type == "score") {
                //
            } else if (type == "explosion") {
                //
            } else if (type == "ground") {
                if (this.y > SCREEN_H) {
                    this.y = -20
                    this.x = rand() % SCREEN_W
                    this.speed = rand() % 3 + 1
                }
            }
        }
        //check outside
    this.move = function() {
        if (type == "score") {
            //	
        } else if (type == "explosion") {
            if (this.size < 20) {
                this.size = this.size + 1
            } else {
                this.destroy()
            }
        } else if (type == "ground") {
            this.y = this.y + this.speed;
        }
    }
}



function createParticle(type, x, y, color) {
    var pp = new particle(type, x, y, color);
    particlesArray.push(pp);
}




//----------------REVERSE RECTANGLE OBJECT FOR DOUBLE COLOR------------------

//this rectangle will move from top to botton, then when outside
//of the screen, go back to top and randomize the size.
//it has to be the exact reversed color of the background
function reverseRectangle() {
    this.x = 0
    this.y = -SCREEN_H
    this.size = rand() % SCREEN_H + SCREEN_H / 2
    this.move = function() {
        this.y = this.y + 2
    }
    this.checkOutside = function() {
        if (this.y > SCREEN_H) {
            this.size = rand() % SCREEN_H + SCREEN_H / 2
            this.y = -this.size
        }
    }
    this.drawItself = function() {
        rectfill(canvas, this.x, this.y, SCREEN_W, this.size, makecol(color2, color1, 0))
    }
}




//----------------REVERSE COLOR------------------

//swap color1 with color2
function reverse() {
    c1 = color1
    c2 = color2
    color1 = c2
    color2 = c1
    play_sound("reverse");
}




//----------------PLAYER COLLISION HANDLING------------------

//execute player death moving it far away
//calling gameEnd in 0.5 sec
function playerDeath() {
    play_sound("death");
    createParticle("explosion", char.x, char.y, colorBlue)
    char.x = 99999
    char.y = 99999
    setTimeout(gameEnd, 300)
}

//check collision with player
function checkCharCollision() {
    //enemy shots
    for (var i = 0; i < shotsArray.length; i++) {
        if (shotsArray[i].name == "enemyShot" && lineDistance(char, shotsArray[i]) < 10) {
            playerDeath()
        }
    }
    //enemies themselves
    for (var i = 0; i < enemiesArray.length; i++) {
        if (lineDistance(char, enemiesArray[i]) < 20) {
            playerDeath()
        }
    }
}




//----------------PLAYER MOVEMENT------------------

function movePlayer(loc) {

    //move player keeping it inside the screen
    if (loc == "left" && char.x > 10) {
        char.x -= 4
    } else if (loc == "right" && char.x < SCREEN_W - 10) {
        char.x += 4
    } else if (loc == "up" && char.y > 10) {
        char.y -= 4
    } else if (loc == "down" && char.y < SCREEN_H - 10) {
        char.y += 4
    }

}




//----------------CORE jALLEGRO FUNCTIONS------------------

//For more information see jAllegro documentation
//its my first time using jAllegro too :D
//you can find it here: http://jallegro.sos.gd/


//draw things
function draw() {
    //title screen
    if (gameStatus == "start") {
        rectfill(canvas, 0, 0, SCREEN_W, SCREEN_H, colorBlack)
        textout(canvas, font, "a game by Mattia Fortunati", 10, SCREEN_H - 10, 12, colorWhite);
        textout_right(canvas, font, "js13kGames competition 2015", SCREEN_W - 10, SCREEN_H - 10, 12, colorWhite);
        textout_centre(canvas, font, "R", SCREEN_W / 2 - 50, SCREEN_H / 2 - 130, 72, makecol(255, 0, 0));
        textout_centre(canvas, font, "G", SCREEN_W / 2, SCREEN_H / 2 - 130, 72, makecol(0, 255, 0));
        textout_centre(canvas, font, "B", SCREEN_W / 2 + 50, SCREEN_H / 2 - 130, 72, colorBlue);
        textout_centre(canvas, font, "Reverse Ground Battle", SCREEN_W / 2, SCREEN_H / 2 - 70, 24, colorWhite);
        if (ISMOBILE) {
            textout_centre(canvas, font, "TILT the DEVICE to MOVE", SCREEN_W / 2, SCREEN_H / 2 - 30, 15, colorWhite);
            textout_centre(canvas, font, "TAP to REVERSE GROUND COLOR", SCREEN_W / 2, SCREEN_H / 2 - 10, 15, colorWhite);
            textout_centre(canvas, font, "TAP to START", SCREEN_W / 2, SCREEN_H / 2 + 160, 18, colorWhite);
        } else {
            textout_centre(canvas, font, "Use ARROW KEYS to MOVE", SCREEN_W / 2, SCREEN_H / 2 - 30, 15, colorWhite);
            textout_centre(canvas, font, "SPACEBAR to REVERSE GROUND COLOR", SCREEN_W / 2, SCREEN_H / 2 - 10, 15, colorWhite);
            textout_centre(canvas, font, "press M to mute/unmute sounds", SCREEN_W / 2, SCREEN_H / 2 + 10, 15, colorWhite);
            textout_centre(canvas, font, "Press SPACEBAR to START", SCREEN_W / 2, SCREEN_H / 2 + 160, 18, colorWhite);
        }
        textout_centre(canvas, font, "Have Fun!", SCREEN_W / 2, SCREEN_H / 2 + 30, 15, colorWhite);
        rect(canvas, 0 + 100, +30, SCREEN_W - 200, SCREEN_H - 70, colorWhite)
    }
    //game over screen
    else if (gameStatus == "end") {
        rectfill(canvas, 0, 0, SCREEN_W, SCREEN_H, colorBlack)
        textout_centre(canvas, font, "GAME OVER", SCREEN_W / 2, SCREEN_H / 2 - 140, 48, colorWhite);
        textout_centre(canvas, font, "SCORE:", SCREEN_W / 2, SCREEN_H / 2 - 90, 36, colorWhite);
        textout_centre(canvas, font, score, SCREEN_W / 2, SCREEN_H / 2 - 40, 36, colorWhite);
        textout_centre(canvas, font, "TIPS:", SCREEN_W / 2, SCREEN_H / 2 + 20, 15, colorWhite);
        textout_centre(canvas, font, "Don't die next time", SCREEN_W / 2, SCREEN_H / 2 + 40, 15, colorWhite);
        textout_centre(canvas, font, "Destroy more enemy ships instead", SCREEN_W / 2, SCREEN_H / 2 + 60, 15, colorWhite);
        textout_centre(canvas, font, "N00b", SCREEN_W / 2, SCREEN_H / 2 + 80, 15, colorWhite);
        if (ISMOBILE) {
            textout_centre(canvas, font, "TAP to TRY AGAIN", SCREEN_W / 2, SCREEN_H / 2 + 160, 18, colorWhite);
        } else {
            textout_centre(canvas, font, "Press SPACEBAR to TRY AGAIN", SCREEN_W / 2, SCREEN_H / 2 + 160, 18, colorWhite);
        }
        textout_centre(canvas, font, "if you DARE ...", SCREEN_W / 2, SCREEN_H / 2 + 180, 12, colorWhite);
        rect(canvas, 0 + 100, +30, SCREEN_W - 200, SCREEN_H - 70, colorWhite)
    } else if (gameStatus == "loading") {
        rectfill(canvas, 0, 0, SCREEN_W, SCREEN_H, colorBlack)
        textout_centre(canvas, font, "Loading " + Math.floor(100 * audioLoaded / audioToLoad) + "%", SCREEN_W / 2, SCREEN_H / 2, 36, colorWhite);
        rect(canvas, 0 + 100, +30, SCREEN_W - 200, SCREEN_H - 70, colorWhite)
    }
    //game screen
    else if (gameStatus == "game") {
        //background
        rectfill(canvas, 0, 0, SCREEN_W, SCREEN_H, makecol(color1, color2, 0))
            //moving ground rect
        groundRect.drawItself()
            //draw each particle in particlesArray
        for (var i = 0; i < particlesArray.length; i++) {
            try {
                particlesArray[i].drawitself();
            } catch (e) {}
        }
        //draw each shot in shotsArray
        for (var i = 0; i < shotsArray.length; i++) {
            try {
                shotsArray[i].drawitself();
            } catch (e) {}
        }
        //draw each enemy in enemiesArray
        for (var i = 0; i < enemiesArray.length; i++) {
            try {
                enemiesArray[i].drawitself();
            } catch (e) {}
        }
        //draw player
        polygonfill(canvas, 5, [char.x + 0, char.y - 15, char.x + 10, char.y + 0, char.x + 5, char.y + 5, char.x - 5, char.y + 5, char.x - 10, char.y + 0], colorBlue)
        circlefill(canvas, char.x - 4, char.y + 5, 2, colorBlue);
        circlefill(canvas, char.x + 4, char.y + 5, 2, colorBlue);
        //score text
        textout_centre(canvas, font, "SCORE: " + score, SCREEN_W / 2, 20, 18, colorBlue);
    }

}



function update() {
    //game screen
    if (gameStatus == "game") {
        //player movement
        if (key[KEY_UP]) movePlayer("up");
        if (key[KEY_DOWN]) movePlayer("down");
        if (key[KEY_LEFT]) movePlayer("left");
        if (key[KEY_RIGHT]) movePlayer("right");

        //spacebar for reversing
        if (released[KEY_SPACE] || (ISMOBILE && mouse_released & 1)) {
            reverse();
        }

        //call move and check outside all shots in shotsArray
        for (var i = 0; i < shotsArray.length; i++) {
            try {
                shotsArray[i].move();
                shotsArray[i].checkOutside();
            } catch (e) {}
        }

        //call move and check outside all enemies in enemiesArray
        for (var i = 0; i < enemiesArray.length; i++) {
            try {
                enemiesArray[i].move();
                enemiesArray[i].checkCollision();
            } catch (e) {}
        }

        //call move and check outside all particles in particlesArray
        for (var i = 0; i < particlesArray.length; i++) {
            try {
                particlesArray[i].move();
                particlesArray[i].checkOutside();
            } catch (e) {}
        }

        //call move and check outside for background rect
        groundRect.move()
        groundRect.checkOutside()

        //check char collision
        checkCharCollision()
    }
    //title screen
    else if (gameStatus == "start") {
        //check spacebar for starting game
        if (released[KEY_SPACE] || (ISMOBILE && mouse_released & 1)) {
            gameStart();
            play_sound("click");
        }
    }
    //game over screen
    else if (gameStatus == "end") {
        //check spacebar for going back to title screen
        if (released[KEY_SPACE] || (ISMOBILE && (mouse_released & 1))) {
            gameRestart();
            play_sound("click");
        }
    } else if (gameStatus == "loading") {
        if (ISAUDIOLOADED == true) {
            gameRestart();
        }
    }
    //always but while loading
    if (gameStatus != "loading") {
        if (released[KEY_M]) {
            mute = !mute
        }
    }

}


function game() {
    //create canvas
    var canvas = document.createElement("canvas");
    canvas.className = "canvas"
    canvas.id = "game_canvas"
    canvas.style.border = "2px solid black"
    canvas.style.boxShadow = "#888 4px 4px 16px"
    canvas.style.margin = "10px auto"
    canvas.style.display = "block"
    document.body.appendChild(canvas);
    //
    //enable debug if needed
    //enable_debug('debug');
    allegro_init_all("game_canvas", s_width, s_height);

    //initial setup for audio
    setAudio()

    //create a unique instance of moving ground rect
    groundRect = new reverseRectangle()


    //check jAllegro docs for infomation here
    ready(function() {
        loop(function() {
            //clear_to_color(colorBlack);
            update();
            draw();
        }, BPS_TO_TIMER(60));
    });;
}

function main() {
    if (ISMOBILE == false) {
        game()
    } else {
        var element = document.createElement("input");
        element.type = "button";
        element.value = "CLICK HERE TO PLAY";
        element.name = "button";
        element.id = "button"
        element.style.fontSize = "56px";
        element.style.margin = "auto"
        element.style.display = "block"
        element.onclick = function() {
            var btn = document.getElementById("button");
            document.body.removeChild(btn);
            game()
        };
        document.body.appendChild(element);
        //

    }


}


END_OF_MAIN();




//----------------AUDIO------------------
//Handle sound effects

//audioObject prototype
function audioObject() {
    //array of sounds of the same type
    this.sounds = []
        //current index
    this.currentIndex = 0
        //play the sound at current index, then goes to the next sound or back to first sound of the array
    this.play = function() {
        this.sounds[this.currentIndex].play()
        this.currentIndex < this.sounds.length - 1 ? this.currentIndex++ : this.currentIndex = 0;
    }
}

//key is sound key reference
//
//count is the number of instances of the same sound to be loaded, the pool for each different sound, in case the same sound
//has to be played before it is ready to be played again, for example if it has to be played twice or more times 
//within a small amount of time
//In this case, for example, player shot sound needs to be played several times in a small amount of time so 3 instances of
//the shot sound are created in the pool and then they are played one after another cycling through the pool array
//
//properties is the jsfxr generated sequence needed to create a sound
//
//Note: we can still find audio issues on Mobile Chrome and Opera.
//
//On Chrome Mobile there will be the warning:
// "Failed to execute 'play' on 'HTMLMediaElement': API can only be initiated by a user gesture."
//To avoid the problem go to: chrome://flags/#disable-gesture-requirement-for-media-playback and enable the media autoplay option.
//
//No issues found for Firefox Mobile
//
function addAudio(key, count, properties) {
    //add audio sound to soundArray
    //create audioObject
    var obj = new audioObject()
        //add it to array
    audioArray[key] = obj
        //put a count number of sounds within audioObject sounds array
    for (var i = 0; i <= count; i++) {
        //create sound object
        var aa = new Audio()
            //get url from jsfxr library
        var url = jsfxr(properties);
        aa.src = url
            //load the sound
        aa.load()
            //stores that the game has one more sound to load
        audioToLoad = audioToLoad + 1
            //put the sound into the audioObject array
        obj.sounds.push(aa)
            //set a listener to know when sound is ready to be played without interructions
        aa.addEventListener('canplaythrough', function() {
            //stores that another sound has been loaded
            audioLoaded = audioLoaded + 1
                //if all sounds have been loaded, all audio is loaded
            if (audioLoaded == audioToLoad) {
                ISAUDIOLOADED = true
            }
        }, false);

    }
}

function setAudio() {
    //initialse sounds
    addAudio("shot", 3, [1, , 0.2167, , 0.2475, 0.5776, 0.2, -0.2976, , , , , , 0.6403, -0.6301, , , , 1, , , 0.0549, , 0.2])
    addAudio("hit", 2, [2, , 0.2882, 0.2348, 0.0645, 0.5452, 0.2, -0.3095, , , , , , 0.4631, -0.4962, , , , 1, , , , , 0.5])
    addAudio("death", 1, [3, , 0.3767, 0.2177, 0.1242, 0.3057, , -0.3635, , , , , , , , , -0.2619, -0.1512, 1, , , , , 0.5])
    addAudio("click", 1, [0, , 0.0978, 0.3777, 0.2033, 0.6275, , , , , , 0.3506, 0.6886, , , , , , 1, , , , , 0.37])
    addAudio("reverse", 2, [1, , 0.1432, , 0.209, 0.4098, , 0.3977, , , , , , , , 0.6282, , , 1, , , , , 0.5])
    addAudio("enemyShot", 2, [1, , 0.1936, 0.2596, 0.2503, 0.9172, 0.227, -0.1971, , , , , , 0.6014, -0.2525, , , , 1, , , 0.0501, , 0.2])
    addAudio("newWave", 1, [1, , 0.2964, , 0.3585, 0.2542, , 0.1727, , 0.156, 0.4811, , , , , , , , 1, , , , , 0.23])
}


//play the sound
function play_sound(key) {
    if (mute == false) {
        audioArray[key].play()
    }

}




//----------------ACCELEROMETER AND MOBILE HANDLING------------------
//MOBILE COMPATIBILITY:
//Mobile Browsers, by default, don't allow automatic sounds (and video) reproduction.
//
//The user has to do something like for example clicking a button (canvas click does not seem to work)
//before any media can be played.
//So, if the game is played from a mobile device, the user is requested to click a play button.
//This will do the trick for Firefox, while warnings and audio issues still may appear on Chrome and Opera Mobile
//To avoid the problem go to: chrome://flags/#disable-gesture-requirement-for-media-playback and enable the media autoplay option.
//
//Also, some mobile browsers require more sound loading time than others so I've added a loading screen, too.

function accelerometerUpdate(event) {
    //move player according to device accelerometer
    if (gameStatus == "game") {
        var aX = event.accelerationIncludingGravity.x * 1;
        var aY = event.accelerationIncludingGravity.y * 1;
        //var aZ = event.accelerationIncludingGravity.z*1;
        if (aX < 0) {
            movePlayer("right")
        }
        if (aX > 0) {
            movePlayer("left")
        }
        if (aY > 0) {
            movePlayer("down")
        }
        if (aY < 0) {
            movePlayer("up")
        }
    }
}

if (window.DeviceMotionEvent == undefined) {
    //No accelerometer is present
} else {
    //Accelerometer found
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        //if on mobile device
        //stores if we are on mobile device
        ISMOBILE = true
            //add accelerometer listener
        window.addEventListener("devicemotion", accelerometerUpdate, true);

    }
}