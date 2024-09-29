var canvas = document.getElementById("game");
var context = canvas.getContext("2d");

const GROUND_HEIGHT = 32;
const PLATFORM_WIDTH = 150;
const PLATFORM_HEIGHT = 16;

const defaultPlayerRad = 14;
const defaultPlayerHP = 50;
const defaultPlayerSpd = 16;
const defaultPlayerJmp = 120;

const defaultBubbleRad = 10;
const defaultBubbleHP = 10;
const defaultBubbleDmg = 10;
const defaultBubbleSpd = 2;
const defaultBubbleJmp = 6;

const defaultFriction = 90;
const defaultGravity = -0.55;
const defaultBubbleGravity = -0.15;
const defaultBulletGravity = -0.01;

const medkitChance = 10;
const minCoins = 2;
const maxCoins = 4;

const KEY_NONE = -1;
const KEY_ESCAPE = 27;
const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_1 = 49;
const KEY_2 = 50;
const KEY_3 = 51;
const KEY_4 = 52;
const KEY_5 = 53;
const KEY_7 = 55;
const KEY_8 = 56;
const KEY_9 = 57;
const KEY_A = 65;
const KEY_C = 67;
const KEY_D = 68;
const KEY_E = 69;
const KEY_Q = 81;
const KEY_W = 87;

var player;
var savedPlayer;
var bubbles = [];
var platforms = [];
var bullets = [];
var rockets = [];
var particles = [];
var medkits = [];
var coins = [];
var floatingTexts = [];
var stage;

var round = 0;
var roundCooldown = 450;
var roundComplete = false;
const defaultRoundCooldown = 900;
var deathCooldown = 0;
const defaultDeathCooldown = 450;
var freezeBubbles = true;
var paused = true;
var initScreen = true;
var inShop = false;
var shopScreenID = 0;
var inUpgrade = false;
var showInfo = false;

var keyStatus_LEFT;
var keyStatus_UP;
var keyStatus_RIGHT;
var keyStatus_DOWN;
var keyStatus_A;
var keyStatus_D;
var keyStatus_W;

var showBubbleHP = false;
var showBubbleLv = false;
var showDamage = false;


function update() {
    setTimeout(updateFunc, 10);
}

function updateFunc() {
    requestAnimationFrame(update);
    context.clearRect(0, 0, canvas.width, canvas.height);
        
    stage.draw();
    platforms.forEach(plat => {
        plat.draw();
    });
    
    if(!paused) {
        context.fillStyle = '#ffffff';
        context.font = "12px Orbitron";
        context.textAlign = "left";
        context.fillText("HP: " + player.hp + "/" + player.maxHP, 0, 10, 100);
        context.fillText("Coins: " + player.coins, 0, 25, 100);
        context.fillText("Selected: " + player.currentItem.name, 0, 50, 150);
        context.fillText(player.currentItem.unit + ": " +
                         player.currentItem.mag + "/" +
                         player.currentItem.defaultMag, 0, 65, 100);

        context.textAlign = "left";
        context.fillText("Round: " + round, canvas.width-80, 10, 80);
        context.fillText("Lives left: " + player.lives, canvas.width-99, 25, 116);
        context.fillText("Bubbles left: " + bubbles.length, canvas.width-116, 50, 116);

        if(player.currentItem.reloadCooldown > 0) {
            context.fillStyle = '#ff0000';
            context.fillText("Reloading", 0, 80, 1000);
        }

        // Reward previously completed round
        if(round > 0 && roundCooldown == 0 && bubbles.length == 0 && !player.isDead) {

            roundComplete = true;
            savedPlayer = player;
            freezeBubbles = true;
            roundCooldown = defaultRoundCooldown;
            playsound("win1");
            playsound("win2");
            
            if(round%10 == 0) player.lifeUp();

            let numCoins = 50;
            for(let n = 0; n < numCoins; n++) {
                let rXVel = getRandomInt(-200, 200)*0.01;
                let rYVel = getRandomInt(-200, 200)*0.01;
                coins.push(new Coin(0, 1000, rXVel, rYVel, round*10));
            }
        }

        // Handling player death
        else if(player.isDead) {
            
            if(deathCooldown == 0) {
                deathCooldown = defaultDeathCooldown;
                player.lives--;
            }

            if(player.lives > 0) {
                context.fillStyle = '#ff0000';
                context.font = "40px Orbitron";
                context.textAlign = "center";
                if(player.lives == 1)
                    context.fillText("1 Life Left",
                                 400, 150, 1000);
                else context.fillText(player.lives + " Lives Left",
                                 400, 150, 1000);
            }
            
            else {
                context.fillStyle = '#ff0000';
                context.font = "40px Orbitron";
                context.textAlign = "center";
                context.fillText("Game Over",
                                 400, 150, 1000);
            }
            
            context.fillStyle = '#ffffff';
            context.font = "25px Orbitron";
            context.textAlign = "center";
            context.fillText("You died in round " + round + "!", 400, 200, 1000);

            if(deathCooldown == 1) {
                
                player.isDead = false;
                                
                if(player.lives > 0) {
                    player = savedPlayer;
                    player.hp = player.maxHP;
                    bubbles = [];
                    medkits = [];
                    coins = [];
                    bullets = [];
                    rockets = [];
                    freezeBubbles = true;
                    roundCooldown = defaultRoundCooldown;
                    round--;
                    
                    if(round > 1) {
                        let numCoins = 50;
                        for(let n = 0; n < numCoins; n++) {
                            let rXVel = getRandomInt(-200, 200)*0.01;
                            let rYVel = getRandomInt(-200, 200)*0.01;
                            coins.push(new Coin(0, 1000, rXVel, rYVel, round*10));
                        }
                    }
                }
                
                else {
                    bubbles = [];
                    coins = [];
                    medkits = [];
                    player.coins = 500;
                    player.maxHP = defaultPlayerHP;
                    player.hp = player.maxHP;
                    player.item1 = new PewPew();
                    player.item2 = new Empty();
                    player.item3 = new Empty();
                    player.item4 = new Empty();
                    player.item5 = new Empty();
                    player.currentItem = player.item1;
                    player.hpUpNum = 0;
                    player.spdUpNum = 0;
                    player.spd = defaultPlayerSpd;
                    player.jmpUpNum = 0;
                    player.jmp = defaultPlayerJmp;
                    player.frcUpNum = 0;
                    player.frc = defaultFriction;
                    freezeBubbles = true;
                    roundCooldown = defaultRoundCooldown;
                    round = 0;
                }
            }

            deathCooldown--;
        }

        // Starting new round
        else if(roundCooldown > 0) {

            // Adding new bubbles
            if(roundCooldown == defaultRoundCooldown) {

                // White "default" bubbles
                let blLvL = Math.ceil(round/2)+2;
                let blLvR = Math.ceil((round-1)/2)+2;
                bubbles.push(new Bubble(300, 500, -defaultBubbleSpd, blLvL,
                                        '#ffffff', 1, 1, 1, 1, blLvL*5));
                bubbles.push(new Bubble(-300, 500, defaultBubbleSpd, blLvR,
                                        '#fffff', 1, 1, 1, 1, blLvR*5));

                // Yellow "fast" bubbles
                if((round+1)%3 == 0) {
                    let yeLv = Math.ceil((round+1)/3/2);
                    bubbles.push(new Bubble(250, 550, -3*defaultBubbleSpd, yeLv,
                                            '#ffff00', 1, 1, 1, 0.5, yeLv*10));
                    bubbles.push(new Bubble(-250, 550, 3*defaultBubbleSpd, yeLv,
                                            '#ffff00', 1, 1, 1, 0.5, yeLv*10));
                }

                // Magenta "jumpy" bubbles
                if((round+1)%5 == 0) {
                    let maLv = Math.ceil((round+1)/5/2);
                    bubbles.push(new Bubble(350, 450, -0.5*defaultBubbleSpd, maLv, 
                                            '#ff00ff', 1, 1, 1, 1.7, maLv*15));
                    bubbles.push(new Bubble(-350, 450, 0.5*defaultBubbleSpd, maLv, 
                                            '#ff00ff', 1, 1, 1, 1.7, maLv*15));
                }

                // Red "huge" bubbles
                if((round+1)%6 == 0) {
                    let reLv = Math.ceil((round+1)/6/2);
                    bubbles.push(new Bubble(150, 600, -1.5*defaultBubbleSpd, reLv, 
                                            '#ff0000', 2, 1.5, 1, 1, reLv*20));
                    bubbles.push(new Bubble(-150, 600, 1.5*defaultBubbleSpd, reLv, 
                                            '#ff0000', 2, 1.5, 1, 1, reLv*20));
                }

                // Gray "tanky" bubbles
                if((round+1)%8 == 0) {
                    let grLv = Math.ceil((round+1)/8/2);
                    bubbles.push(new Bubble(200, 500, -defaultBubbleSpd, grLv,
                                            '#888888', 0.5, 3, 1, 1, grLv*25));
                    bubbles.push(new Bubble(-200, 500, defaultBubbleSpd, grLv,
                                            '#888888', 0.5, 3, 1, 1, grLv*25));
                }

                // Cyan "powerful" bubbles
                if((round+1)%9 == 0) {
                    let cyLv = Math.ceil((round+1)/9/2);
                    bubbles.push(new Bubble(300, 400, -0.7*defaultBubbleSpd, cyLv,
                                            '#00ffff', 1, 1, 2.5, 0.7, cyLv*30));
                    bubbles.push(new Bubble(-300, 400, 0.7*defaultBubbleSpd, cyLv,
                                            '#00ffff', 1, 1, 2.5, 0.7, cyLv*30));
                }
            }

            // Round complete title
            if(roundComplete) {
                context.fillStyle = '#00ffff';
                context.font = "40px Orbitron";
                context.textAlign = "center";
                context.fillText("Round " + round + " Complete!",
                                 400, 150, 1000);

            // First round or revived round title
            } else {
                context.fillStyle = '#ffff00';
                context.font = "40px Orbitron";
                context.textAlign = "center";
                context.fillText("Get Ready",
                                 400, 150, 1000);
            }

            // Start next round
            if(roundCooldown == 1) {
                player.hp = player.maxHP;
                round++;
                freezeBubbles = false;
                roundComplete = false;
            }

            // Loading subtitle
            context.fillStyle = '#ffffff';
            context.font = "25px Orbitron";
            context.textAlign = "center";
            let percentage = Math.round((1-roundCooldown/defaultRoundCooldown)*100);
            context.fillText("Round " + (round+1) + " loading... " + percentage + "%", 400, 200, 1000);

            roundCooldown--;
        }
    }
    
    // Player update
    if(!player.isDead && !paused) {
        player.update();
        player.updateItem();
        player.applyAcceleration();
        player.applyVelocity();
        player.checkCoin();
        player.checkMedkit();
        player.checkHit();
    }
    player.draw();
    
    // Bubbles update
    for(let i = 0; i < bubbles.length; i++) {
        if(!freezeBubbles && !paused) {
            if(bubbles[i].isDead) {
                if(i+1 < bubbles.length) {
                    let temp = bubbles[i];
                    bubbles[i] = bubbles[bubbles.length-1];
                    bubbles[bubbles.length-1] = temp;
                }
                bubbles.pop();
                i--;
                continue;
            }

            bubbles[i].applyAcceleration();
            bubbles[i].applyVelocity();
        }
        bubbles[i].draw();
    }
    
    // Bullets update
    for(let i = 0; i < bullets.length; i++) {
        if(!paused) {
            if(bullets[i].isHit) {
                if(i+1 < bullets.length) {
                    let temp = bullets[i];
                    bullets[i] = bullets[bullets.length-1];
                    bullets[bullets.length-1] = temp;
                }
                bullets.pop();
                i--;
                continue;
            }

            bullets[i].applyAcceleration();
            bullets[i].applyVelocity();
            bullets[i].checkHit();
            bullets[i].update();
        }
        bullets[i].draw();
    }
    
    // Rockets update
    for(let i = 0; i < rockets.length; i++) {
        if(!paused) {
            if(rockets[i].isHit) {
                if(i+1 < rockets.length) {
                    let temp = rockets[i];
                    rockets[i] = rockets[rockets.length-1];
                    rockets[rockets.length-1] = temp;
                }
                rockets.pop();
                i--;
                continue;
            }

            rockets[i].applyAcceleration();
            rockets[i].applyVelocity();
            rockets[i].checkHit();
            rockets[i].update();
        }
        rockets[i].draw();
    }
    
    // Particles update
    for(let i = 0; i < particles.length; i++) {
        if(!paused) {
            if(!particles[i].exists) {
                if(i+1 < particles.length) {    
                    let temp = particles[i];
                    particles[i] = particles[particles.length-1];
                    particles[particles.length-1] = temp;
                }
                particles.pop();
                i--;
                continue;
            }

            particles[i].update();
            particles[i].applyAcceleration();
            particles[i].applyVelocity();
        }
        particles[i].draw();
    }
    
    // Floating texts update
    for(let i = 0; i < floatingTexts.length; i++) {
        if(!paused) {
            if(!floatingTexts[i].exists) {
                if(i+1 < floatingTexts.length) {    
                    let temp = floatingTexts[i];
                    floatingTexts[i] = floatingTexts[floatingTexts.length-1];
                    floatingTexts[floatingTexts.length-1] = temp;
                }
                floatingTexts.pop();
                i--;
                continue;
            }

            floatingTexts[i].update();
            floatingTexts[i].applyAcceleration();
            floatingTexts[i].applyVelocity();
        }
        floatingTexts[i].draw();
    }
    
    // Coins update
    for(let i = 0; i < coins.length; i++) {
        if(!paused) {
            if(coins[i].pickedUp) {
                if(i+1 < coins.length) {
                    let temp = coins[i];
                    coins[i] = coins[coins.length-1];
                    coins[coins.length-1] = temp;
                }
                coins.pop();
                i--;
                continue;
            }

            coins[i].update();
            coins[i].applyAcceleration();
            coins[i].applyVelocity();
        }
        coins[i].draw();
    }
    
    // Medkits update
    for(let i = 0; i < medkits.length; i++) {
        if(!paused) {
            if(medkits[i].pickedUp) {
                if(i+1 < medkits.length) {
                    let temp = medkits[i];
                    medkits[i] = medkits[medkits.length-1];
                    medkits[medkits.length-1] = temp;
                }
                medkits.pop();
                i--;
                continue;
            }

            medkits[i].update();
            medkits[i].applyAcceleration();
            medkits[i].applyVelocity();
        }
        medkits[i].draw();
    }
    
    if(paused) {
        
        if(initScreen) {            
            context.fillStyle = '#00ffff';
            context.font = "40px Orbitron";
            context.textAlign = "center";
            context.fillText("Press \"ESC\" to begin",
                             canvas.width/2, 150, 1000);
            
            context.fillStyle = '#ffffff';
            context.font = "16px Orbitron";
            context.textAlign = "right";
            context.fillText("A, D, W", canvas.width/2-20, 200, 1000);
            context.fillText("Arrow Keys", canvas.width/2-20, 220, 1000);
            context.fillText("1, 2, 3, 4, 5", canvas.width/2-20, 240, 1000);
            context.fillText("Q", canvas.width/2-20, 270, 1000);
            context.fillText("E", canvas.width/2-20, 290, 1000);
            context.fillText("C", canvas.width/2-20, 310, 1000);
            context.fillText("7, 8, 9", canvas.width/2-20, 330, 1000);
            context.fillText("ESC", canvas.width/2-20, 350, 1000);
            
            context.fillStyle = '#88ffff';
            context.textAlign = "left";
            context.fillText("Movement", canvas.width/2+20, 200, 1000);
            context.fillText("Fire", canvas.width/2+20, 220, 1000);
            context.fillText("Select item", canvas.width/2+20, 240, 1000);
            context.fillText("Player upgrade menu", canvas.width/2+20, 270, 1000);
            context.fillText("Item shop", canvas.width/2+20, 290, 1000);
            context.fillText("Show held item info", canvas.width/2+20, 310, 1000);
            context.fillText("Toggle display options", canvas.width/2+20, 330, 1000);
            context.fillText("Pause / Resume", canvas.width/2+20, 350, 1000);
        }
        
        else if(inShop) {
            
            context.fillStyle = '#ff00ff';
            context.font = "40px Orbitron";
            context.textAlign = "center";
            context.fillText("Item Shop", canvas.width/2, 70, 1000);
            
            context.fillStyle = '#ffffff';
            context.font = "12px Orbitron";
            context.textAlign = "center";
            context.fillText("Coins: " + player.coins, canvas.width/2, 25, 100);
            
            if(shopScreenID != 0) {
                context.fillStyle = '#888888';
                context.font = "12px Orbitron";
                context.textAlign = "center";
                context.fillText("Press \"W\" to go back", canvas.width/2, 90, 1000);
            }
            
            switch(shopScreenID) {
                case 0:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Select item slot", canvas.width/2, 120, 1000);
                    
                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-110, 170, 1000);
                    context.fillText("[2]", canvas.width/2-110, 200, 1000);
                    context.fillText("[3]", canvas.width/2-110, 230, 1000);
                    context.fillText("[4]", canvas.width/2-110, 260, 1000);
                    context.fillText("[5]", canvas.width/2-110, 290, 1000);
                    
                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText("Slot 1", canvas.width/2-20, 170, 1000);
                    context.fillText("Slot 2", canvas.width/2-20, 200, 1000);
                    context.fillText("Slot 3", canvas.width/2-20, 230, 1000);
                    context.fillText("Slot 4", canvas.width/2-20, 260, 1000);
                    context.fillText("Slot 5", canvas.width/2-20, 290, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.textAlign = "left";
                    context.fillText(player.item1.name,
                                     canvas.width/2+20, 170, 1000);
                    context.fillText(player.item2.name,
                                     canvas.width/2+20, 200, 1000);
                    context.fillText(player.item3.name,
                                     canvas.width/2+20, 230, 1000);
                    context.fillText(player.item4.name,
                                     canvas.width/2+20, 260, 1000);
                    context.fillText(player.item5.name,
                                     canvas.width/2+20, 290, 1000);
                    break;
                    
                case 1: case 2: case 3: case 4: case 5:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Choose action", canvas.width/2, 120, 1000);
                    
                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-20, 170, 1000);
                    context.fillText("[2]", canvas.width/2-20, 200, 1000);
                    context.fillText("[3]", canvas.width/2-20, 230, 1000);
                    
                    context.fillStyle = '#ffffff';
                    context.textAlign = "left";
                    context.fillText("Upgrade", canvas.width/2+20, 170, 1000);
                    context.fillText("Buy", canvas.width/2+20, 200, 1000);
                    context.fillText("Sell", canvas.width/2+20, 230, 1000);
                    break;
                    
                case 1.1:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Choose upgrade", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-210, 170, 1000);
                    context.fillText("[2]", canvas.width/2-210, 220, 1000);
                    context.fillText("[3]", canvas.width/2-210, 270, 1000);
                    context.fillText("[4]", canvas.width/2-210, 320, 1000);
                    
                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText(player.item1.up1, canvas.width/2-20, 170, 1000);
                    context.fillText(player.item1.up2, canvas.width/2-20, 220, 1000);
                    context.fillText(player.item1.up3, canvas.width/2-20, 270, 1000);
                    context.fillText(player.item1.up4, canvas.width/2-20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    context.fillText(player.item1.up1Num + " / "
                                     + player.item1.up1Max,
                                     canvas.width/2-20, 190, 1000);
                    context.fillText(player.item1.up2Num + " / "
                                     + player.item1.up2Max,
                                     canvas.width/2-20, 240, 1000);
                    context.fillText(player.item1.up3Num + " / "
                                     + player.item1.up3Max,
                                     canvas.width/2-20, 290, 1000);
                    context.fillText(player.item1.up4Num + " / "
                                     + player.item1.up4Max,
                                     canvas.width/2-20, 340, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    if(player.item1.up1Num == player.item1.up1Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 170, 1000);
                    else
                        context.fillText(player.item1.up1Cost*(player.item1.up1Num+1) + " coins", canvas.width/2+20, 170, 1000);
                    if(player.item1.up2Num == player.item1.up2Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 220, 1000);
                    else
                        context.fillText(player.item1.up2Cost*(player.item1.up2Num+1) + " coins", canvas.width/2+20, 220, 1000);
                    if(player.item1.up3Num == player.item1.up3Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 270, 1000);
                    else
                        context.fillText(player.item1.up3Cost
                            *Math.pow(player.item1.up3Mult, player.item1.up3Num+1) + " coins", canvas.width/2+20, 270, 1000);
                    if(player.item1.up4Num == player.item1.up4Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 320, 1000);
                    else
                        context.fillText(player.item1.up4Cost
                            *Math.pow(player.item1.up4Mult, player.item1.up4Num+1) + " coins", canvas.width/2+20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    if(player.item1.up1Num == player.item1.up1Max)
                        context.fillText(player.item1.currUp1(),
                                     canvas.width/2+20, 190, 1000);
                    else
                        context.fillText(player.item1.currUp1() + " -> "
                                     + (player.item1.currUp1()+player.item1.up1Inc),
                                     canvas.width/2+20, 190, 1000);
                    if(player.item1.up2Num == player.item1.up2Max)
                        context.fillText(player.item1.currUp2(),
                                     canvas.width/2+20, 240, 1000);
                    else
                        context.fillText(player.item1.currUp2() + " -> "
                                     + (player.item1.currUp2()+player.item1.up2Inc),
                                     canvas.width/2+20, 240, 1000);
                    if(player.item1.up3Num == player.item1.up3Max)
                        context.fillText(player.item1.currUp3(),
                                     canvas.width/2+20, 290, 1000);
                    else
                        context.fillText(player.item1.currUp3() + " -> "
                                     + (player.item1.currUp3()+player.item1.up3Inc),
                                     canvas.width/2+20, 290, 1000);
                    if(player.item1.up4Num == player.item1.up4Max)
                        context.fillText(player.item1.currUp4(),
                                     canvas.width/2+20, 340, 1000);
                    else
                        context.fillText(player.item1.currUp4() + " -> "
                                     + (player.item1.currUp4()+player.item1.up4Inc),
                                     canvas.width/2+20, 340, 1000);
                    break;
                    
                case 2.1:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Choose upgrade", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-210, 170, 1000);
                    context.fillText("[2]", canvas.width/2-210, 220, 1000);
                    context.fillText("[3]", canvas.width/2-210, 270, 1000);
                    context.fillText("[4]", canvas.width/2-210, 320, 1000);
                    
                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText(player.item2.up1, canvas.width/2-20, 170, 1000);
                    context.fillText(player.item2.up2, canvas.width/2-20, 220, 1000);
                    context.fillText(player.item2.up3, canvas.width/2-20, 270, 1000);
                    context.fillText(player.item2.up4, canvas.width/2-20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    context.fillText(player.item2.up1Num + " / "
                                     + player.item2.up1Max,
                                     canvas.width/2-20, 190, 1000);
                    context.fillText(player.item2.up2Num + " / "
                                     + player.item2.up2Max,
                                     canvas.width/2-20, 240, 1000);
                    context.fillText(player.item2.up3Num + " / "
                                     + player.item2.up3Max,
                                     canvas.width/2-20, 290, 1000);
                    context.fillText(player.item2.up4Num + " / "
                                     + player.item2.up4Max,
                                     canvas.width/2-20, 340, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    if(player.item2.up1Num == player.item2.up1Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 170, 1000);
                    else
                        context.fillText(player.item2.up1Cost*(player.item2.up1Num+1) + " coins", canvas.width/2+20, 170, 1000);
                    if(player.item2.up2Num == player.item2.up2Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 220, 1000);
                    else
                        context.fillText(player.item2.up2Cost*(player.item2.up2Num+1) + " coins", canvas.width/2+20, 220, 1000);
                    if(player.item2.up3Num == player.item2.up3Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 270, 1000);
                    else
                        context.fillText(player.item2.up3Cost
                            *Math.pow(player.item2.up3Mult, player.item2.up3Num+1) + " coins", canvas.width/2+20, 270, 1000);
                    if(player.item2.up4Num == player.item2.up4Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 320, 1000);
                    else
                        context.fillText(player.item2.up4Cost
                            *Math.pow(player.item2.up4Mult, player.item2.up4Num+1) + " coins", canvas.width/2+20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    if(player.item2.up1Num == player.item2.up1Max)
                        context.fillText(player.item2.currUp1(),
                                     canvas.width/2+20, 190, 1000);
                    else
                        context.fillText(player.item2.currUp1() + " -> "
                                     + (player.item2.currUp1()+player.item2.up1Inc),
                                     canvas.width/2+20, 190, 1000);
                    if(player.item2.up2Num == player.item2.up2Max)
                        context.fillText(player.item2.currUp2(),
                                     canvas.width/2+20, 240, 1000);
                    else
                        context.fillText(player.item2.currUp2() + " -> "
                                     + (player.item2.currUp2()+player.item2.up2Inc),
                                     canvas.width/2+20, 240, 1000);
                    if(player.item2.up3Num == player.item2.up3Max)
                        context.fillText(player.item2.currUp3(),
                                     canvas.width/2+20, 290, 1000);
                    else
                        context.fillText(player.item2.currUp3() + " -> "
                                     + (player.item2.currUp3()+player.item2.up3Inc),
                                     canvas.width/2+20, 290, 1000);
                    if(player.item2.up4Num == player.item2.up4Max)
                        context.fillText(player.item2.currUp4(),
                                     canvas.width/2+20, 340, 1000);
                    else
                        context.fillText(player.item2.currUp4() + " -> "
                                     + (player.item2.currUp4()+player.item2.up4Inc),
                                     canvas.width/2+20, 340, 1000);
                    break;
                    
                case 3.1:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Choose upgrade", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-210, 170, 1000);
                    context.fillText("[2]", canvas.width/2-210, 220, 1000);
                    context.fillText("[3]", canvas.width/2-210, 270, 1000);
                    context.fillText("[4]", canvas.width/2-210, 320, 1000);
                    
                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText(player.item3.up1, canvas.width/2-20, 170, 1000);
                    context.fillText(player.item3.up2, canvas.width/2-20, 220, 1000);
                    context.fillText(player.item3.up3, canvas.width/2-20, 270, 1000);
                    context.fillText(player.item3.up4, canvas.width/2-20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    context.fillText(player.item3.up1Num + " / "
                                     + player.item3.up1Max,
                                     canvas.width/2-20, 190, 1000);
                    context.fillText(player.item3.up2Num + " / "
                                     + player.item3.up2Max,
                                     canvas.width/2-20, 240, 1000);
                    context.fillText(player.item3.up3Num + " / "
                                     + player.item3.up3Max,
                                     canvas.width/2-20, 290, 1000);
                    context.fillText(player.item3.up4Num + " / "
                                     + player.item3.up4Max,
                                     canvas.width/2-20, 340, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    if(player.item3.up1Num == player.item3.up1Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 170, 1000);
                    else
                        context.fillText(player.item3.up1Cost*(player.item3.up1Num+1) + " coins", canvas.width/2+20, 170, 1000);
                    if(player.item3.up2Num == player.item3.up2Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 220, 1000);
                    else
                        context.fillText(player.item3.up2Cost*(player.item3.up2Num+1) + " coins", canvas.width/2+20, 220, 1000);
                    if(player.item3.up3Num == player.item3.up3Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 270, 1000);
                    else
                        context.fillText(player.item3.up3Cost
                            *Math.pow(player.item3.up3Mult, player.item3.up3Num+1) + " coins", canvas.width/2+20, 270, 1000);
                    if(player.item3.up4Num == player.item3.up4Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 320, 1000);
                    else
                        context.fillText(player.item3.up4Cost
                            *Math.pow(player.item3.up4Mult, player.item3.up4Num+1) + " coins", canvas.width/2+20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    if(player.item3.up1Num == player.item3.up1Max)
                        context.fillText(player.item3.currUp1(),
                                     canvas.width/2+20, 190, 1000);
                    else
                        context.fillText(player.item3.currUp1() + " -> "
                                     + (player.item3.currUp1()+player.item3.up1Inc),
                                     canvas.width/2+20, 190, 1000);
                    if(player.item3.up2Num == player.item3.up2Max)
                        context.fillText(player.item3.currUp2(),
                                     canvas.width/2+20, 240, 1000);
                    else
                        context.fillText(player.item3.currUp2() + " -> "
                                     + (player.item3.currUp2()+player.item3.up2Inc),
                                     canvas.width/2+20, 240, 1000);
                    if(player.item3.up3Num == player.item3.up3Max)
                        context.fillText(player.item3.currUp3(),
                                     canvas.width/2+20, 290, 1000);
                    else
                        context.fillText(player.item3.currUp3() + " -> "
                                     + (player.item3.currUp3()+player.item3.up3Inc),
                                     canvas.width/2+20, 290, 1000);
                    if(player.item3.up4Num == player.item3.up4Max)
                        context.fillText(player.item3.currUp4(),
                                     canvas.width/2+20, 340, 1000);
                    else
                        context.fillText(player.item3.currUp4() + " -> "
                                     + (player.item3.currUp4()+player.item3.up4Inc),
                                     canvas.width/2+20, 340, 1000);
                    break;
                    
                case 4.1:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Choose upgrade", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-210, 170, 1000);
                    context.fillText("[2]", canvas.width/2-210, 220, 1000);
                    context.fillText("[3]", canvas.width/2-210, 270, 1000);
                    context.fillText("[4]", canvas.width/2-210, 320, 1000);
                    
                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText(player.item4.up1, canvas.width/2-20, 170, 1000);
                    context.fillText(player.item4.up2, canvas.width/2-20, 220, 1000);
                    context.fillText(player.item4.up3, canvas.width/2-20, 270, 1000);
                    context.fillText(player.item4.up4, canvas.width/2-20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    context.fillText(player.item4.up1Num + " / "
                                     + player.item4.up1Max,
                                     canvas.width/2-20, 190, 1000);
                    context.fillText(player.item4.up2Num + " / "
                                     + player.item4.up2Max,
                                     canvas.width/2-20, 240, 1000);
                    context.fillText(player.item4.up3Num + " / "
                                     + player.item4.up3Max,
                                     canvas.width/2-20, 290, 1000);
                    context.fillText(player.item4.up4Num + " / "
                                     + player.item4.up4Max,
                                     canvas.width/2-20, 340, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    if(player.item4.up1Num == player.item4.up1Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 170, 1000);
                    else
                        context.fillText(player.item4.up1Cost*(player.item4.up1Num+1) + " coins", canvas.width/2+20, 170, 1000);
                    if(player.item4.up2Num == player.item4.up2Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 220, 1000);
                    else
                        context.fillText(player.item4.up2Cost*(player.item4.up2Num+1) + " coins", canvas.width/2+20, 220, 1000);
                    if(player.item4.up3Num == player.item4.up3Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 270, 1000);
                    else
                        context.fillText(player.item4.up3Cost
                            *Math.pow(player.item4.up3Mult, player.item4.up3Num+1) + " coins", canvas.width/2+20, 270, 1000);
                    if(player.item4.up4Num == player.item4.up4Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 320, 1000);
                    else
                        context.fillText(player.item4.up4Cost
                            *Math.pow(player.item4.up4Mult, player.item4.up4Num+1) + " coins", canvas.width/2+20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    if(player.item4.up1Num == player.item4.up1Max)
                        context.fillText(player.item4.currUp1(),
                                     canvas.width/2+20, 190, 1000);
                    else
                        context.fillText(player.item4.currUp1() + " -> "
                                     + (player.item4.currUp1()+player.item4.up1Inc),
                                     canvas.width/2+20, 190, 1000);
                    if(player.item4.up2Num == player.item4.up2Max)
                        context.fillText(player.item4.currUp2(),
                                     canvas.width/2+20, 240, 1000);
                    else
                        context.fillText(player.item4.currUp2() + " -> "
                                     + (player.item4.currUp2()+player.item4.up2Inc),
                                     canvas.width/2+20, 240, 1000);
                    if(player.item4.up3Num == player.item4.up3Max)
                        context.fillText(player.item4.currUp3(),
                                     canvas.width/2+20, 290, 1000);
                    else
                        context.fillText(player.item4.currUp3() + " -> "
                                     + (player.item4.currUp3()+player.item4.up3Inc),
                                     canvas.width/2+20, 290, 1000);
                    if(player.item4.up4Num == player.item4.up4Max)
                        context.fillText(player.item4.currUp4(),
                                     canvas.width/2+20, 340, 1000);
                    else
                        context.fillText(player.item4.currUp4() + " -> "
                                     + (player.item4.currUp4()+player.item4.up4Inc),
                                     canvas.width/2+20, 340, 1000);
                    break;
                    
                case 5.1:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Choose upgrade", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-210, 170, 1000);
                    context.fillText("[2]", canvas.width/2-210, 220, 1000);
                    context.fillText("[3]", canvas.width/2-210, 270, 1000);
                    context.fillText("[4]", canvas.width/2-210, 320, 1000);
                    
                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText(player.item5.up1, canvas.width/2-20, 170, 1000);
                    context.fillText(player.item5.up2, canvas.width/2-20, 220, 1000);
                    context.fillText(player.item5.up3, canvas.width/2-20, 270, 1000);
                    context.fillText(player.item5.up4, canvas.width/2-20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    context.fillText(player.item5.up1Num + " / "
                                     + player.item5.up1Max,
                                     canvas.width/2-20, 190, 1000);
                    context.fillText(player.item5.up2Num + " / "
                                     + player.item5.up2Max,
                                     canvas.width/2-20, 240, 1000);
                    context.fillText(player.item5.up3Num + " / "
                                     + player.item5.up3Max,
                                     canvas.width/2-20, 290, 1000);
                    context.fillText(player.item5.up4Num + " / "
                                     + player.item5.up4Max,
                                     canvas.width/2-20, 340, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    if(player.item5.up1Num == player.item5.up1Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 170, 1000);
                    else
                        context.fillText(player.item5.up1Cost*(player.item5.up1Num+1) + " coins", canvas.width/2+20, 170, 1000);
                    if(player.item5.up2Num == player.item5.up2Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 220, 1000);
                    else
                        context.fillText(player.item5.up2Cost*(player.item5.up2Num+1) + " coins", canvas.width/2+20, 220, 1000);
                    if(player.item5.up3Num == player.item5.up3Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 270, 1000);
                    else
                        context.fillText(player.item5.up3Cost
                            *Math.pow(player.item5.up3Mult, player.item5.up3Num+1) + " coins", canvas.width/2+20, 270, 1000);
                    if(player.item5.up4Num == player.item5.up4Max)
                        context.fillText("MAXED OUT", canvas.width/2+20, 320, 1000);
                    else
                        context.fillText(player.item5.up4Cost
                            *Math.pow(player.item5.up4Mult, player.item5.up4Num+1) + " coins", canvas.width/2+20, 320, 1000);
                    
                    context.fillStyle = '#aa88aa';
                    context.font = "12px Orbitron";
                    if(player.item5.up1Num == player.item5.up1Max)
                        context.fillText(player.item5.currUp1(),
                                     canvas.width/2+20, 190, 1000);
                    else
                        context.fillText(player.item5.currUp1() + " -> "
                                     + (player.item5.currUp1()+player.item5.up1Inc),
                                     canvas.width/2+20, 190, 1000);
                    if(player.item5.up2Num == player.item5.up2Max)
                        context.fillText(player.item5.currUp2(),
                                     canvas.width/2+20, 240, 1000);
                    else
                        context.fillText(player.item5.currUp2() + " -> "
                                     + (player.item5.currUp2()+player.item5.up2Inc),
                                     canvas.width/2+20, 240, 1000);
                    if(player.item5.up3Num == player.item5.up3Max)
                        context.fillText(player.item5.currUp3(),
                                     canvas.width/2+20, 290, 1000);
                    else
                        context.fillText(player.item5.currUp3() + " -> "
                                     + (player.item5.currUp3()+player.item5.up3Inc),
                                     canvas.width/2+20, 290, 1000);
                    if(player.item5.up4Num == player.item5.up4Max)
                        context.fillText(player.item5.currUp4(),
                                     canvas.width/2+20, 340, 1000);
                    else
                        context.fillText(player.item5.currUp4() + " -> "
                                     + (player.item5.currUp4()+player.item5.up4Inc),
                                     canvas.width/2+20, 340, 1000);
                    break;
                    
                case 1.2: case 2.2: case 3.2: case 4.2: case 5.2:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Choose Item", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-150, 170, 1000);
                    context.fillText("[2]", canvas.width/2-150, 200, 1000);
                    context.fillText("[3]", canvas.width/2-150, 230, 1000);
                    context.fillText("[4]", canvas.width/2-150, 260, 1000);
                    context.fillText("[5]", canvas.width/2-150, 290, 1000);

                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText("Pew Pew", canvas.width/2-20, 170, 1000);
                    context.fillText("Pow Pow", canvas.width/2-20, 200, 1000);
                    context.fillText("Bam Bam", canvas.width/2-20, 230, 1000);
                    context.fillText("Boom Boom", canvas.width/2-20, 260, 1000);
                    context.fillText("BRRRRR", canvas.width/2-20, 290, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    context.fillText("1000 coins",
                                     canvas.width/2+20, 170, 1000);
                    context.fillText("1500 coins",
                                     canvas.width/2+20, 200, 1000);
                    context.fillText("3500 coins",
                                     canvas.width/2+20, 230, 1000);
                    context.fillText("10500 coins",
                                     canvas.width/2+20, 260, 1000);
                    context.fillText("22000 coins",
                                     canvas.width/2+20, 290, 1000);
                    break;
                    
                case 1.3:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Confirm Sell?", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-200, 170, 1000);

                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText("Sell " + player.item1.name,
                                     canvas.width/2-20, 170, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    context.fillText("for " + player.item1.worth + " coins",
                                     canvas.width/2+20, 170, 1000);
                    break;
                    
                case 2.3:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Confirm Sell?", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-200, 170, 1000);

                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText("Sell " + player.item2.name,
                                     canvas.width/2-20, 170, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    context.fillText("for " + player.item2.worth + " coins",
                                     canvas.width/2+20, 170, 1000);
                    break;
                    
                case 3.3:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Confirm Sell?", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-200, 170, 1000);

                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText("Sell " + player.item3.name,
                                     canvas.width/2-20, 170, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    context.fillText("for " + player.item3.worth + " coins",
                                     canvas.width/2+20, 170, 1000);
                    break;
                    
                case 4.3:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Confirm Sell?", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-200, 170, 1000);

                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText("Sell " + player.item4.name,
                                     canvas.width/2-20, 170, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    context.fillText("for " + player.item4.worth + " coins",
                                     canvas.width/2+20, 170, 1000);
                    break;
                    
                case 5.3:
                    context.fillStyle = '#ffffff';
                    context.font = "25px Orbitron";
                    context.textAlign = "center";
                    context.fillText("Confirm Sell?", canvas.width/2, 120, 1000);

                    context.fillStyle = '#ffaaff';
                    context.font = "16px Orbitron";
                    context.textAlign = "center";
                    context.fillText("[1]", canvas.width/2-200, 170, 1000);

                    context.fillStyle = '#ffffff';
                    context.textAlign = "right";
                    context.fillText("Sell " + player.item5.name,
                                     canvas.width/2-20, 170, 1000);
                    
                    context.fillStyle = '#ff88ff';
                    context.font = "16px Orbitron";
                    context.textAlign = "left";
                    context.fillText("for " + player.item5.worth + " coins",
                                     canvas.width/2+20, 170, 1000);
                    break;
            }
            
        }
        
        else if(inUpgrade) {
            context.fillStyle = '#0000ff';
            context.font = "40px Orbitron";
            context.textAlign = "center";
            context.fillText("Player Upgrader", canvas.width/2, 70, 1000);
            
            context.fillStyle = '#ffffff';
            context.font = "12px Orbitron";
            context.textAlign = "center";
            context.fillText("Coins: " + player.coins, canvas.width/2, 25, 100);
            
            context.fillStyle = '#ffffff';
            context.font = "25px Orbitron";
            context.textAlign = "center";
            context.fillText("Choose upgrade", canvas.width/2, 120, 1000);

            context.fillStyle = '#aaaaff';
            context.font = "16px Orbitron";
            context.textAlign = "center";
            context.fillText("[1]", canvas.width/2-110, 170, 1000);
            context.fillText("[2]", canvas.width/2-110, 220, 1000);
            context.fillText("[3]", canvas.width/2-110, 270, 1000);
            context.fillText("[4]", canvas.width/2-110, 320, 1000);

            context.fillStyle = '#ffffff';
            context.textAlign = "right";
            context.fillText("HP", canvas.width/2-20, 170, 1000);
            context.fillText("Speed", canvas.width/2-20, 220, 1000);
            context.fillText("Jump", canvas.width/2-20, 270, 1000);
            context.fillText("Friction", canvas.width/2-20, 320, 1000);

            context.fillStyle = '#8888aa';
            context.font = "12px Orbitron";
            context.fillText(player.hpUpNum + " / " + player.hpUpMax,
                             canvas.width/2-20, 190, 1000);
            context.fillText(player.spdUpNum + " / " + player.spdUpMax,
                             canvas.width/2-20, 240, 1000);
            context.fillText(player.jmpUpNum + " / " + player.jmpUpMax,
                             canvas.width/2-20, 290, 1000);
            context.fillText(player.frcUpNum + " / " + player.frcUpMax,
                             canvas.width/2-20, 340, 1000);

            let up1Cost = player.hpUpCost*(player.hpUpNum+1);
            let up2Cost = player.spdUpCost
                    *Math.pow(player.spdUpMult, player.spdUpNum+1);
            let up3Cost = player.jmpUpCost
                    *Math.pow(player.jmpUpMult, player.jmpUpNum+1);
            let up4Cost = player.frcUpCost
                    *Math.pow(player.frcUpMult, player.frcUpNum+1);
            context.fillStyle = '#8888ff';
            context.font = "16px Orbitron";
            context.textAlign = "left";
            context.fillText(up1Cost + " coins", canvas.width/2+20, 170, 1000);
            context.fillText(up2Cost + " coins", canvas.width/2+20, 220, 1000);
            context.fillText(up3Cost + " coins", canvas.width/2+20, 270, 1000);
            context.fillText(up4Cost + " coins", canvas.width/2+20, 320, 1000);

            context.fillStyle = '#8888aa';
            context.font = "12px Orbitron";
            context.fillText(player.maxHP + " -> " + (player.maxHP+player.hpUpInc),
                             canvas.width/2+20, 190, 1000);
            context.fillText(player.spd + " -> " + (player.spd+player.spdUpInc),
                             canvas.width/2+20, 240, 1000);
            context.fillText(player.jmp + " -> " + (player.jmp+player.jmpUpInc),
                             canvas.width/2+20, 290, 1000);
            context.fillText(player.frc + " -> " + (player.frc+player.frcUpInc)
                             + " slippiness", canvas.width/2+20, 340, 1000);
            
                  
        }
        
        else if(showInfo) {
            context.fillStyle = '#ff8800';
            context.font = "40px Orbitron";
            context.textAlign = "center";
            context.fillText("Item Information", canvas.width/2, 70, 1000);
            
            var item = player.currentItem;
            if(item.name != "Empty") {
                context.fillStyle = '#ffffff';
                context.font = "16px Orbitron";
                context.textAlign = "right";
                context.fillText("Name", canvas.width/2-20, 120, 1000);
                context.fillText("Sell price", canvas.width/2-20, 150, 1000);
                context.fillText(item.up1, canvas.width/2-20, 200, 1000);
                context.fillText(item.up2, canvas.width/2-20, 230, 1000);
                context.fillText(item.up3, canvas.width/2-20, 260, 1000);
                context.fillText(item.up4, canvas.width/2-20, 290, 1000);
                
                context.fillStyle = '#ffaa88';
                context.textAlign = "left";
                context.fillText(item.name, canvas.width/2+20, 120, 1000);
                context.fillText(item.worth + " coins",
                                 canvas.width/2+20, 150, 1000);
                context.fillText(item.currUp1() + " " + item.up1Unit,
                                 canvas.width/2+20, 200, 1000);
                context.fillText(item.currUp2() + " " + item.up2Unit,
                                 canvas.width/2+20, 230, 1000);
                context.fillText(item.currUp3() + " " + item.up3Unit,
                                 canvas.width/2+20, 260, 1000);
                context.fillText(item.currUp4() + " " + item.up4Unit,
                                 canvas.width/2+20, 290, 1000);
            }

            else {
                context.fillStyle = '#ffffff';
                context.font = "20px Orbitron";
                context.textAlign = "center";
                context.fillText("Item does not exist (empty slot)", canvas.width/2, 120, 1000);
            }
            
            
        }
        
        else {
            context.fillStyle = '#00ff00';
            context.font = "40px Orbitron";
            context.textAlign = "center";
            context.fillText("Game Paused",
                             canvas.width/2, 150, 1000);
            
            context.fillStyle = '#ffffff';
            context.font = "16px Orbitron";
            context.textAlign = "right";
            context.fillText("A, D, W", canvas.width/2-20, 200, 1000);
            context.fillText("Arrow Keys", canvas.width/2-20, 220, 1000);
            context.fillText("1, 2, 3, 4, 5", canvas.width/2-20, 240, 1000);
            context.fillText("Q", canvas.width/2-20, 270, 1000);
            context.fillText("E", canvas.width/2-20, 290, 1000);
            context.fillText("C", canvas.width/2-20, 310, 1000);
            context.fillText("7, 8, 9", canvas.width/2-20, 330, 1000);
            context.fillText("ESC", canvas.width/2-20, 350, 1000);
            
            context.fillStyle = '#88ff88';
            context.textAlign = "left";
            context.fillText("Movement", canvas.width/2+20, 200, 1000);
            context.fillText("Fire", canvas.width/2+20, 220, 1000);
            context.fillText("Select item", canvas.width/2+20, 240, 1000);
            context.fillText("Player upgrade menu", canvas.width/2+20, 270, 1000);
            context.fillText("Item shop", canvas.width/2+20, 290, 1000);
            context.fillText("Show held item info", canvas.width/2+20, 310, 1000);
            context.fillText("Toggle display options", canvas.width/2+20, 330, 1000);
            context.fillText("Pause / Resume", canvas.width/2+20, 350, 1000);
        }
    }
}



function Player(x, y) {
    this.xPos = x;
    this.yPos = y;
    this.xVel = 0;
    this.yVel = 0;
    this.xAcc = 0;
    this.rad = defaultPlayerRad;

    this.hp = defaultPlayerHP;
    this.maxHP = defaultPlayerHP;
    this.spd = defaultPlayerSpd;
    this.jmp = defaultPlayerJmp;
    this.frc = defaultFriction;
    this.coins = 500;
    
    this.hpUpCost = 100;
    this.hpUpInc = 25;
    this.hpUpMax = 1000;
    this.hpUpNum = 0;
    
    this.spdUpCost = 75;
    this.spdUpInc = 1;
    this.spdUpMult = 2;
    this.spdUpMax = 25;
    this.spdUpNum = 0;
    
    this.jmpUpCost = 125;
    this.jmpUpInc = 5;
    this.jmpUpMult = 2;
    this.jmpUpMax = 12;
    this.jmpUpNum = 0;
    
    this.frcUpCost = 75;
    this.frcUpInc = -5;
    this.frcUpMult = 2;
    this.frcUpMax = 18;
    this.frcUpNum = 0;

    this.airJumpActive = false;
    this.isDead = false;
    this.invincibility = 0;
    this.lives = 3;
    
    this.item1 = new PewPew();
    this.item2 = new Empty();
    this.item3 = new Empty();
    this.item4 = new Empty();
    this.item5 = new Empty();
    this.currentItem = this.item1;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.xVel += this.xAcc;
        if(this.xVel > 0 && this.xVel > this.spd/4)
            this.xVel = this.spd/4;
        else if(this.xVel < 0 && this.xVel < -this.spd/4)
            this.xVel = -this.spd/4;

        if(stage.inGround(this))
            this.yVel = 0;
        else
            this.yVel += defaultGravity;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        
        this.xPos += this.xVel;
        
        if(stage.inRightWall(this)) {
            this.xPos = -canvas.width/2+this.rad;
            this.xVel = -this.xVel;
        } else if(stage.inLeftWall(this)) {
            this.xPos = canvas.width/2-this.rad;
            this.xVel = -this.xVel;
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.xPos = this.xVel > 0 ?
                        plat.x-this.rad : plat.x+plat.w+this.rad;
                    this.xVel = 0;
                    return false;
                } else return true;
            });
        }
        
        this.yPos += this.yVel;
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad;
            this.yVel = 0;
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.yPos = this.yVel > 0 ?
                        plat.y-plat.h-this.rad : plat.y+this.rad;
                    this.yVel = 0;
                    return false;
                } else return true;
            });
        }
        
        if(!keyStatus_A && !keyStatus_D) {
            this.xVel *= this.frc/100;
            this.xAcc = 0;
        }
    };
    
    // Movement to left
    this.moveLeft = function() {
        this.xAcc = 1.1-this.frc/100;
    };

    // Movement to right
    this.moveRight = function() {
        this.xAcc = -1.1+this.frc/100;
    };
    
    // Jump movement
    this.jump = function() {
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad+0.01;
            this.yVel = this.jmp/10;
            
        } else {
            platforms.every(plat => {
                if(plat.onPlatform(this)) {
                    this.yPos = plat.y+this.rad+0.01;
                    this.yVel = this.jmp/10;
                    return false;
                } else return true;
            });
        }
    };
    
    // Check bubble collision
    this.checkHit = function() {
        if(this.invincibility == 0) {
            bubbles.every(bub => {
                if(distance(this.xPos, this.yPos, bub.xPos, bub.yPos)
                        < bub.rad+this.rad && !bub.isDead) {
                    this.hurt(bub.dmg);
                    bub.kill();
                    return false;
                } else return true;
            });
        }
    };
    
    // Check medkit collision
    this.checkMedkit = function() {
        medkits.every(med => {
            if(distance(this.xPos, this.yPos, med.xPos, med.yPos)
                    < med.rad+this.rad && !med.pickedUp) {
                this.heal(this.maxHP*med.hp);
                med.delete();
                return false;
            } else return true;
        });
    };
    
    // Check coin collision
    this.checkCoin = function() {
        coins.every(coi => {
            if(distance(this.xPos, this.yPos, coi.xPos, coi.yPos)
                    < coi.rad+this.rad && !coi.pickedUp) {
                this.addCoins(coi.worth);
                coi.delete();
                return false;
            } else return true;
        });
    };
    
    this.lifeUp = function() {
        playsound("regen");
        floatingTexts.push(new FloatingText("+1 Life", this.xPos, this.yPos,
                           0, 1, 0, 0, 30, 200, '#00ffff'));
    }
    
    this.heal = function(hp) {
        this.hp += hp;
        if(this.hp > this.maxHP)
            this.hp = this.maxHP;
        playsound("pickup");
        playsound("regen");
        
        if(showDamage) {
            let text = "+" + hp;
            let rXVel = getRandomInt(-5, 5)*0.1;
            let rYVel = getRandomInt(-5, 5)*0.1;
            let r = Math.floor(5*Math.log(hp));
            floatingTexts.push(new FloatingText(text, this.xPos, this.yPos,
                               rXVel, rYVel, 0, 0, r, 100, '#88ff88'));
        }
    }
    
    this.hurt = function(dmg) {
        this.hp -= dmg;
        this.invincibility = 50;
        
        if(this.hp > 0)
            playsound("damage");
        else {
            this.hp = 0;
            this.isDead = true;
            playsound("brrrrr");
            
            let rXVel = getRandomInt(-3, 3)*0.1;
            let rYVel = getRandomInt(3, 6)*0.1;
            particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                            this.rad, 300, '#ff8800'));
        }
        
        if(showDamage) {
            let text = "-" + dmg;
            let rXVel = getRandomInt(-5, 5)*0.1;
            let rYVel = getRandomInt(-5, 5)*0.1;
            let r = Math.floor(10*Math.log(dmg));
            floatingTexts.push(new FloatingText(text, this.xPos, this.yPos,
                               rXVel, rYVel, 0, 0, r, 100, '#ff88ff'));
        }
    };
    
    this.addCoins = function(n) {
        this.coins += n;
        playsound("pickup");
    }
    
    this.removeCoins = function(n) {
        if(n > this.coins)
            return false;
        
        this.coins -= n;
        return true;
    }
    
    this.useItem = function(direction) {
        switch(direction) {
            case "left":
                this.currentItem.useLeft(this);
                break;
            case "up":
                this.currentItem.useUp(this);
                break;
            case "right":
                this.currentItem.useRight(this);
                break;
            case "down":
                this.currentItem.useDown(this);
                break;
        }
    }
    
    this.updateItem = function() {
        this.currentItem.update();
    }
    
    this.selectItem = function(item) {
        switch(item) {
            case 1:
                this.currentItem = this.item1;
                break;
            case 2:
                this.currentItem = this.item2;
                break;
            case 3:
                this.currentItem = this.item3;
                break;
            case 4:
                this.currentItem = this.item4;
                break;
            case 5:
                this.currentItem = this.item5;
                break;
        }
    }
    
    this.draw = function() {
        context.fillStyle = '#ff8800';
        if(this.invincibility > 0) context.fillStyle = '#aa6600';
        if(this.isDead) context.fillStyle = '#777777';
        context.fillRect(canvas.width/2-this.xPos-this.rad,
                         canvas.height-this.yPos-this.rad,
                         this.rad*2, this.rad*2);
        
        let length = (this.rad*2+7) * (this.hp/this.maxHP);
        if(length < 0) length = 0;
        context.fillStyle = '#888888';
        context.fillRect(canvas.width/2-this.xPos-this.rad-4,
                         canvas.height-this.yPos-this.rad-10,
                         this.rad*2+7, 4);
        context.fillStyle = '#00ff00';
        context.fillRect(canvas.width/2-this.xPos-this.rad-4,
                         canvas.height-this.yPos-this.rad-10,
                         length, 4);
    };
    
    this.update = function() {
            if(this.invincibility > 0) this.invincibility--;
    }
}



function Bubble(x, y, xV, lv, color, radMult, hpMult, dmgMult, jmpMult, worth) {
    this.xPos = x;
    this.yPos = y;
    this.xVel = xV;
    this.yVel = 0;
    this.lv = lv;
    this.color = color;
    this.worth = worth;
    
    this.isDead = false;
    
    // Calculates bubble radius based on its level
    this.radiusFunction = function() {
        let n = defaultBubbleRad * 0.3*this.lv + defaultBubbleRad;
        if(n > 100) return 100;
        else return n;
    };
    
    // Calculates bubble HP based on its level
    this.HPFunction = function() {
        return defaultBubbleHP * Math.pow(this.lv, 2);
    };
    
    // Calculates bubble damage based on its level
    this.dmgFunction = function() {
        return defaultBubbleDmg * Math.pow(this.lv, 2);
    };
    
    // Calculates bubble jump based on its level
    this.jmpFunction = function() {
        let n = defaultBubbleJmp*Math.log(this.lv+2);
        if(n > 14) return 14;
        else return n;
    };
    
    this.radMult = radMult;
    this.hpMult = hpMult;
    this.dmgMult = dmgMult;
    this.jmpMult = jmpMult;
    this.rad = this.radiusFunction()*this.radMult;
    this.hp = this.HPFunction()*this.hpMult;
    this.maxHP = this.HPFunction()*this.hpMult;
    this.dmg = this.dmgFunction()*this.dmgMult;
    this.jmp = this.jmpFunction()*this.jmpMult;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.yVel += defaultBubbleGravity;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        
        this.xPos += this.xVel;
        
        if(stage.inRightWall(this)) {
            this.xPos = -canvas.width/2+this.rad;
            this.xVel = -this.xVel;
            playsound("bubble_bounce");
        } else if(stage.inLeftWall(this)) {
            this.xPos = canvas.width/2-this.rad;
            this.xVel = -this.xVel;
            playsound("bubble_bounce");
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.xPos = this.xVel > 0 ?
                        plat.x-this.rad : plat.x+plat.w+this.rad;
                    this.xVel = -this.xVel;
                    playsound("bubble_bounce");
                    return false;
                } else return true;
            });
        }
        
        this.yPos += this.yVel;
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad-0.01;
            this.jump();
            playsound("bubble_bounce");
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.yPos = this.yVel > 0 ?
                        plat.y-plat.h-this.rad : plat.y+this.rad-0.01;
                    this.yVel = 0;
                    this.jump();
                    playsound("bubble_bounce");
                    return false;
                } else return true;
            });
        }
    };
    
    // Jump movement
    this.jump = function() {
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad+0.01;
            this.yVel = this.jmp;
            
        } else {
            platforms.every(plat => {
                if(plat.onPlatform(this)) {
                    this.yPos = plat.y+this.rad+0.01;
                    this.yVel = this.jmp;
                    return false;
                } else return true;
            });
        }
    };
    
    this.hurt = function(dmg) {
        if(!freezeBubbles) {
            this.hp -= dmg;
            if(this.hp <= 0) {
                this.kill();
            } else {
                playsound("bubble_hit");
            }
            
            if(showDamage) {
                let text = "-" + dmg;
                let rXVel = getRandomInt(-5, 5)*0.1;
                let rYVel = getRandomInt(-5, 5)*0.1;
                let r = Math.floor(10*Math.log(dmg));
                floatingTexts.push(new FloatingText(text, this.xPos, this.yPos,
                                   rXVel, rYVel, 0, 0, r, 100, '#ff8888'));
            }
            
        } else {
            playsound("bubble_pop");
        }
    };
    
    this.kill = function() {
        this.isDead = true;
        playsound("bubble_pop");
        this.split();
        
        if(this.lv > 2 && getRandomInt(0, medkitChance) == 0)
            medkits.push(new Medkit(this.xPos, this.yPos));
        
        let numCoins = getRandomInt(minCoins, maxCoins);
        for(let n = 0; n < numCoins; n++) {
            let rXVel = getRandomInt(-20, 20)*0.01;
            let rYVel = getRandomInt(-20, 20)*0.01;
            coins.push(new Coin(this.xPos, this.yPos, rXVel, rYVel, this.worth));
        }
        
        for(n = 0; n < this.rad/4; n++) {
            let rXVel = getRandomInt(-this.rad, this.rad)*0.2;
            let rYVel = getRandomInt(-this.rad, this.rad)*0.2;
            let r = getRandomInt(1, 4);
            
            if(this.color == '#000000')
                particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                            r, 20, '#ffffff'));
            else
                particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                            r, 20, this.color));
        }
    };
    
    this.split = function() {
        if(this.lv > 1) {
            bubbles.push(new Bubble(this.xPos, this.yPos, -1, this.lv-1, this.color,
                                    this.radMult, this.hpMult, this.dmgMult,
                                    this.jmpMult, this.worth));
            bubbles.push(new Bubble(this.xPos, this.yPos, 1, this.lv-1, this.color,
                                    this.radMult, this.hpMult, this.dmgMult,
                                    this.jmpMult, this.worth));
        }
    };
    
    this.draw = function() {
        context.beginPath();
        context.arc(canvas.width/2-this.xPos, canvas.height-this.yPos,
                    this.rad, 0, 2*Math.PI);

        context.globalAlpha = 0.25;
        context.fillStyle = this.color;
        context.fill();
        context.globalAlpha = 1;
        
        context.strokeStyle = this.color;
        context.lineWidth = this.rad/8;
        context.stroke();
        
        if(showBubbleHP) {
            let length = (this.rad*2+7) * (this.hp/this.maxHP);
            let height = this.rad*0.2;
            if(length < 0) length = 0;
            context.fillStyle = '#888888';
            context.fillRect(canvas.width/2-this.xPos-this.rad-4,
                             canvas.height-this.yPos-this.rad-height*2,
                             this.rad*2+7, height);
            context.fillStyle = '#ff0000';
            context.fillRect(canvas.width/2-this.xPos-this.rad-4,
                             canvas.height-this.yPos-this.rad-height*2,
                             length, height);
        }
        
        if(showBubbleLv) {
            context.textAlign = 'center';
            context.font = (this.rad*0.7) + "px Orbitron";
            context.fillStyle = '#ffffff';
            context.fillText("Lv. " + this.lv, canvas.width/2-this.xPos,
                            canvas.height-this.yPos-this.rad-this.rad*0.6);
        }

    };
};



function Platform(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    
    this.onPlatform = function(obj) {
        let cY = obj.yPos-obj.rad; // Current y
        let cX = obj.xPos; // Current x
        let r = obj.rad;
        
        return (cY <= y && cY > y-h && cX+r >= x && cX-r < x+w);
    };
    
    this.inPlatform = function(obj) {
        let cY = obj.yPos; // Current y
        let cX = obj.xPos; // Current x
        let r = obj.rad;
        
        return (cY-r < y && cY+r > y-h && cX+r > x && cX-r < x+w);
    };
    
    this.draw = function() {
        context.beginPath();
        context.rect(canvas.width/2+x+2, canvas.height-y+3, w-4, h-6);

        context.strokeStyle = '#ffffff';
        context.lineWidth = 5;
        context.stroke();
    };
}



function Stage() {
    
    // Checks if player is in the ground hitbox
    this.inGround = function(obj) {
        let cY = obj.yPos-obj.rad; // Current y
        return cY <= GROUND_HEIGHT;
    }
    
    this.inLeftWall = function(obj) {
        let cX = obj.xPos+obj.rad; // Current x
        return cX > canvas.width/2;
    }
    
    this.inRightWall = function(obj) {
        let cX = obj.xPos-obj.rad; // Current x
        return cX < -canvas.width/2;
    }
    
    this.draw = function() {
        context.beginPath();
        context.rect(2, canvas.height-GROUND_HEIGHT+3,
                     canvas.width-4, GROUND_HEIGHT-6);

        context.strokeStyle = '#ffffff';
        context.lineWidth = 5;
        context.stroke();
    }
}



function PewPew() {
    
    this.name = "Pew Pew";
    this.unit = "Magazine";
    
    this.dmg = 10;
    this.vel = 15;
    
    this.mag = 20;
    this.defaultMag = 20;
    this.cooldown = 0;
    this.defaultCooldown = 14;
    this.reloadCooldown = 0;
    this.defaultReloadCooldown = 300;
    
    this.up1 = "Magazine size";
    this.up1Unit = "rounds";
    this.up1Inc = 10;
    this.up1Num = 0;
    this.up1Max = 1000;
    this.up1Cost = 100;
    
    this.up2 = "Damage";
    this.up2Unit = "HP";
    this.up2Inc = 5;
    this.up2Num = 0;
    this.up2Max = 1000;
    this.up2Cost = 120;
    
    this.up3 = "Fire rate";
    this.up3Unit = "ticks delay";
    this.up3Inc = -1;
    this.up3Num = 0;
    this.up3Max = 12;
    this.up3Cost = 25;
    this.up3Mult = 2;
    
    this.up4 = "Reload speed";
    this.up4Unit = "ticks delay";
    this.up4Inc = -30;
    this.up4Num = 0;
    this.up4Max = 9;
    this.up4Cost = 75;
    this.up4Mult = 2;
    
    this.worth = 1000;
    
    this.currUp1 = function() {
        return this.defaultMag;
    }
    this.currUp2 = function() {
        return this.dmg;
    }
    this.currUp3 = function() {
        return this.defaultCooldown;
    }
    this.currUp4 = function() {
        return this.defaultReloadCooldown;
    }
    
    this.setUp1 = function(x) {
        this.defaultMag = x;
    }
    this.setUp2 = function(x) {
        this.dmg = x;
    }
    this.setUp3 = function(x) {
        this.defaultCooldown = x;
    }
    this.setUp4 = function(x) {
        this.defaultReloadCooldown = x;
    }

    this.useLeft = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        bullets.push(new Bullet(p.xPos, p.yPos,
                                this.vel, 0.1, this.dmg, 3, '#ffff00'));
        this.cooldown = this.defaultCooldown;
        playsound("pew");
    };
    
    this.useUp = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        bullets.push(new Bullet(p.xPos, p.yPos,
                                0, this.vel, this.dmg, 3, '#ffff00'));
        this.cooldown = this.defaultCooldown;
        playsound("pew");
    };
    
    this.useRight = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        bullets.push(new Bullet(p.xPos, p.yPos,
                                -this.vel, 0.1, this.dmg, 3, '#ffff00'));
        this.cooldown = this.defaultCooldown;
        playsound("pew");
    };
    
    this.useDown = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        bullets.push(new Bullet(p.xPos, p.yPos,
                                0, -this.vel, this.dmg, 3, '#ffff00'));
        this.cooldown = this.defaultCooldown;
        playsound("pew");
    };
    
    this.update = function() {
        if(this.cooldown > 0) {
            this.cooldown -= 1;
        } 
        
        if(this.reloadCooldown > 0) {
            if(this.reloadCooldown == 1) {
                this.mag = this.defaultMag;
                playsound("reload_complete");
            }
            this.reloadCooldown -= 1;
        }
    };
    
    this.reload = function() {
        this.reloadCooldown = this.defaultReloadCooldown;
        playsound("reload");
    };
}



function PowPow() {
    
    this.name = "Pow Pow";
    this.unit = "Magazine";
    
    this.dmg = 5;
    this.vel = 12;
    
    this.pellets = 6;
    this.spread = 8;
    
    this.mag = 8;
    this.defaultMag = 8;
    this.cooldown = 0;
    this.defaultCooldown = 40;
    this.reloadCooldown = 0;
    this.defaultReloadCooldown = 220;
    
    this.up1 = "Magazine size";
    this.up1Unit = "rounds";
    this.up1Inc = 4;
    this.up1Num = 0;
    this.up1Max = 1000;
    this.up1Cost = 100;
    
    this.up2 = "Damage";
    this.up2Unit = "HP";
    this.up2Inc = 3;
    this.up2Num = 0;
    this.up2Max = 1000;
    this.up2Cost = 150;
    
    this.up3 = "Fire rate";
    this.up3Unit = "ticks delay";
    this.up3Inc = -3;
    this.up3Num = 0;
    this.up3Max = 12;
    this.up3Cost = 200;
    this.up3Mult = 2;
    
    this.up4 = "Pellets";
    this.up4Unit = "per shot";
    this.up4Inc = 1;
    this.up4Num = 0;
    this.up4Max = 50;
    this.up4Cost = 50;
    this.up4Mult = 2;
    
    this.worth = 1500;
    
    this.currUp1 = function() {
        return this.defaultMag;
    }
    this.currUp2 = function() {
        return this.dmg;
    }
    this.currUp3 = function() {
        return this.defaultCooldown;
    }
    this.currUp4 = function() {
        return this.pellets;
    }
    
    this.setUp1 = function(x) {
        this.defaultMag = x;
    }
    this.setUp2 = function(x) {
        this.dmg = x;
    }
    this.setUp3 = function(x) {
        this.defaultCooldown = x;
    }
    this.setUp4 = function(x) {
        this.pellets = x;
    }
    
    this.useLeft = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.pellets; i++) {
            let rXVel = this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = 0.1 + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos, p.yPos,
                                    rXVel, rYVel, this.dmg, 4, '#ff0000'));
        }
        
        playsound("pow");

        this.cooldown = this.defaultCooldown;
    };
    
    this.useUp = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.pellets; i++) {
            let rXVel = getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos, p.yPos,
                                    rXVel, rYVel, this.dmg, 4, '#ff0000'));
        }
        
        playsound("pow");

        this.cooldown = this.defaultCooldown;
    };
    
    this.useRight = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.pellets; i++) {
            let rXVel = -this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = 0.1 + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos, p.yPos,
                                    rXVel, rYVel, this.dmg, 4, '#ff0000'));
        }
        
        playsound("pow");

        this.cooldown = this.defaultCooldown;
    };
    
    this.useDown = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.pellets; i++) {
            let rXVel = getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = -this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos, p.yPos,
                                    rXVel, rYVel, this.dmg, 4, '#ff0000'));
        }

        playsound("pow");
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.update = function() {
        if(this.cooldown > 0) {
            this.cooldown -= 1;
        } 
        
        if(this.reloadCooldown > 0) {
            if(this.reloadCooldown == 1) {
                this.mag = this.defaultMag;
                playsound("reload_complete");
            }
            this.reloadCooldown -= 1;
        }
    };
    
    this.reload = function() {
        this.reloadCooldown = this.defaultReloadCooldown;
        playsound("reload");
    };
}



function BamBam() {
    
    this.name = "Bam Bam";
    this.unit = "Magazine";
    
    this.dmg = 20;
    this.vel = 36;
    
    this.piercing = 3;
    this.spacing = 10;
    
    this.mag = 5;
    this.defaultMag = 5;
    this.cooldown = 0;
    this.defaultCooldown = 60;
    this.reloadCooldown = 0;
    this.defaultReloadCooldown = 170;
    
    this.up1 = "Magazine size";
    this.up1Unit = "rounds";
    this.up1Inc = 2;
    this.up1Num = 0;
    this.up1Max = 1000;
    this.up1Cost = 100;
    
    this.up2 = "Damage";
    this.up2Unit = "HP";
    this.up2Inc = 10;
    this.up2Num = 0;
    this.up2Max = 1000;
    this.up2Cost = 180;
    
    this.up3 = "Fire rate";
    this.up3Unit = "ticks delay";
    this.up3Inc = -3;
    this.up3Num = 0;
    this.up3Max = 18;
    this.up3Cost = 75
    this.up3Mult = 2;
    
    this.up4 = "Piercing";
    this.up4Unit = "bubbles per shot";
    this.up4Inc = 1;
    this.up4Num = 0;
    this.up4Max = 12;
    this.up4Cost = 60;
    this.up4Mult = 3;
    
    this.worth = 3500;
    
    this.currUp1 = function() {
        return this.defaultMag;
    }
    this.currUp2 = function() {
        return this.dmg;
    }
    this.currUp3 = function() {
        return this.defaultCooldown;
    }
    this.currUp4 = function() {
        return this.piercing;
    }
    
    this.setUp1 = function(x) {
        this.defaultMag = x;
    }
    this.setUp2 = function(x) {
        this.dmg = x;
    }
    this.setUp3 = function(x) {
        this.defaultCooldown = x;
    }
    this.setUp4 = function(x) {
        this.piercing = x;
    }
    
    this.useLeft = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.piercing; i++) {
            bullets.push(new Bullet(p.xPos+i*this.spacing, p.yPos,
                                    this.vel, 0.1, this.dmg, 3, '#AAAAAA'));
        }

        playsound("bam");
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.useUp = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.piercing; i++) {
            bullets.push(new Bullet(p.xPos, p.yPos+i*this.spacing,
                                    0, this.vel, this.dmg, 3, '#AAAAAA'));
        }

        playsound("bam");

        
        this.cooldown = this.defaultCooldown;
    };
    
    this.useRight = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.piercing; i++) {
            bullets.push(new Bullet(p.xPos-i*this.spacing, p.yPos,
                                    -this.vel, 0.1, this.dmg, 3, '#AAAAAA'));
        }
        
        playsound("bam");

        this.cooldown = this.defaultCooldown;
    };
    
    this.useDown = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.piercing; i++) {
            bullets.push(new Bullet(p.xPos, p.yPos-i*this.spacing,
                                    0, -this.vel, this.dmg, 3, '#AAAAAA'));
        }
        
        playsound("bam");

        this.cooldown = this.defaultCooldown;
    };
    
    this.update = function() {
        if(this.cooldown > 0) {
            this.cooldown -= 1;
        } 
        
        if(this.reloadCooldown > 0) {
            if(this.reloadCooldown == 1) {
                this.mag = this.defaultMag;
                playsound("reload_complete");
            }
            this.reloadCooldown -= 1;
        }
    };
    
    this.reload = function() {
        this.reloadCooldown = this.defaultReloadCooldown;
        playsound("reload");
    };
}



function BoomBoom() {
    
    this.name = "Boom Boom";
    this.unit = "Magazine";
        
    this.dmg = 20;
    this.vel = 4;
    
    this.radius = 80;
    this.acc = 0.5
    
    this.mag = 4;
    this.defaultMag = 4;
    this.cooldown = 0;
    this.defaultCooldown = 36;
    this.reloadCooldown = 0;
    this.defaultReloadCooldown = 520;
    
    this.up1 = "Magazine size";
    this.up1Unit = "rounds";
    this.up1Inc = 4;
    this.up1Num = 0;
    this.up1Max = 1000;
    this.up1Cost = 400;
    
    this.up2 = "Damage";
    this.up2Unit = "HP";
    this.up2Inc = 6;
    this.up2Num = 0;
    this.up2Max = 1000;
    this.up2Cost = 100;
    
    this.up3 = "Radius";
    this.up3Unit = "pixels";
    this.up3Inc = 20;
    this.up3Num = 0;
    this.up3Max = 9;
    this.up3Cost = 125;
    this.up3Mult = 4;
    
    this.up4 = "Reload speed";
    this.up4Unit = "ticks delay";
    this.up4Inc = -35;
    this.up4Num = 0;
    this.up4Max = 13;
    this.up4Cost = 30;
    this.up4Mult = 3;
    
    this.worth = 10500;
    
    this.currUp1 = function() {
        return this.defaultMag;
    }
    this.currUp2 = function() {
        return this.dmg;
    }
    this.currUp3 = function() {
        return this.radius;
    }
    this.currUp4 = function() {
        return this.defaultReloadCooldown;
    }
    
    this.setUp1 = function(x) {
        this.defaultMag = x;
    }
    this.setUp2 = function(x) {
        this.dmg = x;
    }
    this.setUp3 = function(x) {
        this.radius = x;
    }
    this.setUp4 = function(x) {
        this.defaultReloadCooldown = x;
    }
    
    this.useLeft = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        rockets.push(new Rocket(p.xPos, p.yPos, this.vel, 0, this.acc, 0,
                                    this.dmg, this.radius, 7, '#88aa88'));
        
        playsound("boom_fire");

        this.cooldown = this.defaultCooldown;
    };
    
    this.useUp = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        rockets.push(new Rocket(p.xPos, p.yPos, 0, this.vel, 0, this.acc,
                                    this.dmg, this.radius, 7, '#88aa88'));

        playsound("boom_fire");
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.useRight = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        rockets.push(new Rocket(p.xPos, p.yPos, -this.vel, 0, -this.acc, 0,
                                    this.dmg, this.radius, 7, '#88aa88'));

        playsound("boom_fire");
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.useDown = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        rockets.push(new Rocket(p.xPos, p.yPos, 0, -this.vel, 0, -this.acc,
                                    this.dmg, this.radius, 7, '#88aa88'));

        playsound("boom_fire");
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.update = function() {
        if(this.cooldown > 0) {
            this.cooldown -= 1;
        } 
        
        if(this.reloadCooldown > 0) {
            if(this.reloadCooldown == 1) {
                this.mag = this.defaultMag;
                playsound("reload_complete");
            }
            this.reloadCooldown -= 1;
        }
    };
    
    this.reload = function() {
        this.reloadCooldown = this.defaultReloadCooldown;
        playsound("reload");
    };
}



function Brrrrr() {
    
    this.name = "BRRRRR";
    this.unit = "Magazine";
    
    this.dmg = 4;
    this.vel = 12;
    
    this.pellets = 3;
    this.spread = 3;
    
    this.mag = 100;
    this.defaultMag = 100;
    this.cooldown = 0;
    this.defaultCooldown = 3;
    this.reloadCooldown = 0;
    this.defaultReloadCooldown = 750;
    
    this.up1 = "Magazine size";
    this.up1Unit = "rounds";
    this.up1Inc = 25;
    this.up1Num = 0;
    this.up1Max = 1000;
    this.up1Cost = 200;
    
    this.up2 = "Damage";
    this.up2Unit = "HP";
    this.up2Inc = 3;
    this.up2Num = 0;
    this.up2Max = 1000;
    this.up2Cost = 150;
    
    this.up3 = "Spread";
    this.up3Unit = "width of spread";
    this.up3Inc = 1;
    this.up3Num = 0;
    this.up3Max = 8;
    this.up3Cost = 75;
    this.up3Mult = 4;
    
    this.up4 = "Reload Speed";
    this.up4Unit = "ticks delay";
    this.up4Inc = -40;
    this.up4Num = 0;
    this.up4Max = 18;
    this.up4Cost = 100;
    this.up4Mult = 3;
    
    this.worth = 22000;
    
    this.currUp1 = function() {
        return this.defaultMag;
    }
    this.currUp2 = function() {
        return this.dmg;
    }
    this.currUp3 = function() {
        return this.spread;
    }
    this.currUp4 = function() {
        return this.defaultReloadCooldown;
    }
    
    this.setUp1 = function(x) {
        this.defaultMag = x;
    }
    this.setUp2 = function(x) {
        this.dmg = x;
    }
    this.setUp3 = function(x) {
        this.spread = x;
    }
    this.setUp4 = function(x) {
        this.defaultReloadCooldown = x;
    }
    
    this.useLeft = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;

        for(let i = 0; i < this.pellets; i++) {
            let rXVel = this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = 0.1 + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos+i*6, p.yPos,
                                    rXVel, rYVel, this.dmg, 2, '#ffff00'));
            playsound("brrrrr");
        }

        this.cooldown = this.defaultCooldown;
    };
    
    this.useUp = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.pellets; i++) {
            let rXVel = 0.1 + getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos, p.yPos+i*6,
                                    rXVel, rYVel, this.dmg, 2, '#ffff00'));
            playsound("brrrrr");
        }
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.useRight = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.pellets; i++) {
            let rXVel = -this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = 0.1 + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos-i*6, p.yPos,
                                    rXVel, rYVel, this.dmg, 2, '#ffff00'));
            playsound("brrrrr");
        }
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.useDown = function(p) {
        if(this.mag == 1 && this.cooldown == 0) {
            this.reload();
        } else if(this.cooldown > 0 || this.reloadCooldown > 0) return;
        
        this.mag -= 1;
        
        for(let i = 0; i < this.pellets; i++) {
            let rXVel = 0.1 + getRandomInt(-this.spread, this.spread)*0.1;
            let rYVel = -this.vel + getRandomInt(-this.spread, this.spread)*0.1;
            bullets.push(new Bullet(p.xPos, p.yPos-i*6,
                                    rXVel, rYVel, this.dmg, 2, '#ffff00'));
            playsound("brrrrr");
        }
        
        this.cooldown = this.defaultCooldown;
    };
    
    this.update = function() {
        if(this.cooldown > 0) {
            this.cooldown -= 1;
        } 
        
        if(this.reloadCooldown > 0) {
            if(this.reloadCooldown == 1) {
                this.mag = this.defaultMag;
                playsound("reload_complete");
            }
            this.reloadCooldown -= 1;
        }
    };
    
    this.reload = function() {
        this.reloadCooldown = this.defaultReloadCooldown;
        playsound("reload");
    };
}



function Empty() {
        
    this.name = "Empty";
    this.unit = "Amount";
    this.mag = "N";
    this.defaultMag = "A";
    
    this.worth = 0;
    
    this.useLeft = function() {};
    this.useUp = function() {};
    this.useRight = function() {};
    this.useDown = function() {};
    this.update = function() {};
}



function Bullet(x, y, xVel, yVel, dmg, r, color) {
    this.xPos = x;
    this.yPos = y;
    this.xVel = xVel;
    this.yVel = yVel;
    
    this.rad = r;
    this.dmg = dmg;
    this.life = 300;
    this.color = color;
    
    this.isHit = false;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.yVel += -0.01;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        
        this.xPos += this.xVel;
        this.yPos += this.yVel;
        
        if(stage.inRightWall(this) || stage.inLeftWall(this)
           || stage.inGround(this)) {
            this.hit();
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.hit();
                    return false;
                } else return true;
            });
        }
    };
    
    // Check bubble collision
    this.checkHit = function() {
        bubbles.every(bub => {
            if(distance(this.xPos, this.yPos, bub.xPos, bub.yPos)
                    < bub.rad+this.rad && !bub.isDead) {
                this.damage(bub);
                return false;
            } else return true;
        });
    };
    
    this.damage = function(obj) {
        obj.hurt(this.dmg);
        this.hit();
    };
    
    this.hit = function() {
        this.isHit = true;
        
        for(let n = 0; n < this.dmg/5; n++) {
            let rXVel = getRandomInt(-this.dmg/2, this.dmg/2)*0.1;
            let rYVel = getRandomInt(-this.dmg/2, this.dmg/2)*0.1;
            let r = getRandomInt(1, 5);
            particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                        r, 30, '#ffff00'));
        }
        
        playsound("bullet_hit");
    };
    
    this.draw = function() {
        context.beginPath();
        context.arc(canvas.width/2-this.xPos, canvas.height-this.yPos,
                    this.rad, 0, 2*Math.PI);

        context.fillStyle = color;
        context.fill();
        
        rXVel = this.xVel*0.1;
        rYVel = this.yVel*0.1;
        c = getRandomInt(0, 9);
        particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                    2, 30, '#' + c+c+c+c+c+c));
    };
    
    this.update = function() {
        this.life--;
        if(this.life == 0)
            this.isHit = true;
    };
}



function Rocket(x, y, xVel, yVel, xAcc, yAcc, dmg, ran, r, color) {
    this.xPos = x;
    this.yPos = y;
    this.xVel = xVel;
    this.yVel = yVel;
    this.xAcc = xAcc;
    this.yAcc = yAcc;
    
    this.rad = r;
    this.dmg = dmg;
    this.ran = ran;
    this.life = 300;
    this.color = color;
    
    this.isHit = false;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.xVel += xAcc;
        this.yVel += yAcc;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        
        this.xPos += this.xVel;
        this.yPos += this.yVel;
        
        if(stage.inRightWall(this) || stage.inLeftWall(this)
           || stage.inGround(this)) {
            this.explode();
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.explode();
                    return false;
                } else return true;
            });
        }
    };
    
    // Check bubble collision
    this.checkHit = function() {
        bubbles.every(bub => {
            if(distance(this.xPos, this.yPos, bub.xPos, bub.yPos)
                    < bub.rad+this.rad && !bub.isDead) {
                this.explode();
                return false;
            } else return true;
        });
    };
    
    // Check bubble collision
    this.explode = function() {
        bubbles.forEach(bub => {
            let dist = distance(this.xPos, this.yPos, bub.xPos, bub.yPos);
            if(dist < bub.rad+this.rad+this.ran && !bub.isDead) {
                
                if(dist < bub.rad+this.rad+this.ran*0.33)
                    this.damage(bub, 2);
                else if(dist < bub.rad+this.rad+this.ran*0.67)
                    this.damage(bub, 1.5);
                else this.damage(bub, 1);
            }
        });
        
        this.hit();
    };
    
    this.damage = function(obj, mult) {
        obj.hurt(this.dmg*mult);
        this.hit();
    };
    
    this.hit = function() {
        for(n = 0; n < 30; n++) {
            rXVel = getRandomInt(-this.ran*3, this.ran*3)*0.01;
            rYVel = getRandomInt(-this.ran*3, this.ran*3)*0.01;
            r = getRandomInt(2, 5);
            c = getRandomInt(0, 9);
            particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                        r, 50, '#' + c+c+c+c+c+c));
        }
        
        for(n = 0; n < this.dmg/5; n++) {
            let rXVel = getRandomInt(-this.ran*2, this.ran*2)*0.01;
            let rYVel = getRandomInt(-this.ran*2, this.ran*2)*0.01;
            let r = getRandomInt(10, 3);
            let c = getRandomInt(0, 9);
            particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                        r, 25, '#ff' + c+c + '00'));
        }
        
        playsound("boom");
        
        this.isHit = true;
    };
    
    this.draw = function() {
        context.beginPath();
        context.arc(canvas.width/2-this.xPos, canvas.height-this.yPos,
                    this.rad, 0, 2*Math.PI);

        context.fillStyle = this.color;
        context.fill();
        
        let rXVel = -this.xVel*0.1 + getRandomInt(-10, 10)*0.01;
        let rYVel = -this.yVel*0.1 + getRandomInt(-10, 10)*0.01;
        let r = getRandomInt(1, 3);
        let c = getRandomInt(0, 9);
        particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                    r, 25, '#ff' + c+c + '00'));
        
        rXVel = -this.xVel*0.2 + getRandomInt(-20, 20)*0.01;
        rYVel = -this.yVel*0.2 + getRandomInt(-20, 20)*0.01;
        r = getRandomInt(2, 5);
        c = getRandomInt(0, 9);
        particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0,
                                    r, 50, '#' + c+c+c+c+c+c));
    };
    
    this.update = function() {
        this.life--;
        if(this.life == 0)
            this.isHit = true;
    };
}



function Particle(x, y, xVel, yVel, xAcc, yAcc, r, life, color) {
    this.xPos = x;
    this.yPos = y;
    this.xVel = xVel;
    this.yVel = yVel;
    this.xAcc = xAcc;
    this.yAcc = yAcc;
    
    this.rad = r;
    this.initLife = life;
    this.life = life;
    this.color = color;
    
    this.exists = true;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.xVel += xAcc;
        this.yVel += yAcc;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        this.xPos += this.xVel;
        this.yPos += this.yVel;
    };

    this.delete = function() {
        this.exists = false;
    };
    
    this.update = function() {
        this.life--;
        if(this.life == 0)
            this.delete();
    };
    
    this.draw = function() {
        context.fillStyle = this.color;
        context.globalAlpha = this.life/this.initLife;
        context.fillRect(canvas.width/2-this.xPos-this.rad,
                         canvas.height-this.yPos-this.rad,
                         this.rad*2, this.rad*2);
        context.globalAlpha = 1;
    };
}



function FloatingText(text, x, y, xVel, yVel, xAcc, yAcc, r, life, color) {
    this.text = text;
    this.xPos = x;
    this.yPos = y;
    this.xVel = xVel;
    this.yVel = yVel;
    this.xAcc = xAcc;
    this.yAcc = yAcc;
    
    this.rad = r;
    this.initLife = life;
    this.life = life;
    this.color = color;
    
    this.exists = true;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.xVel += xAcc;
        this.yVel += yAcc;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        this.xPos += this.xVel;
        this.yPos += this.yVel;
    };

    this.delete = function() {
        this.exists = false;
    };
    
    this.update = function() {
        this.life--;
        if(this.life == 0)
            this.delete();
    };
    
    this.draw = function() {
        context.fillStyle = this.color;
        context.textAlign = 'center';
        context.font = this.rad + 'px Orbitron';
        context.globalAlpha = this.life/this.initLife;
        context.fillText(this.text, canvas.width/2-this.xPos,
                         canvas.height-this.yPos);
        context.globalAlpha = 1;
    };
}



function Medkit(x, y) {
    this.xPos = x;
    this.yPos = y;
    this.xVel = 0;
    this.yVel = 0;
    this.prevYVel = 0;
    
    this.life = 5500;
    this.pickedUp = false;
    
    this.rad = 10;
    this.hp = 0.2;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.yVel += defaultGravity;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        
        this.xPos += this.xVel;
        
        if(stage.inRightWall(this)) {
            this.xPos = -canvas.width/2+this.rad;
            this.xVel = -this.xVel;
        } else if(stage.inLeftWall(this)) {
            this.xPos = canvas.width/2-this.rad;
            this.xVel = -this.xVel;
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.xPos = this.xVel > 0 ?
                        plat.x-this.rad : plat.x+plat.w+this.rad;
                    this.xVel = 0;
                    return false;
                } else return true;
            });
        }
        
        this.yPos += this.yVel;
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad+1;
            this.prevYVel = this.yVel;
            this.jump();
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.yPos = this.yVel > 0 ?
                        plat.y-plat.h-this.rad : plat.y+this.rad-0.01
                    this.prevYVel = this.yVel;
                    this.yVel = 0;
                    this.jump();
                    return false;
                } else return true;
            });
        }
    };
    
    // Jump movement
    this.jump = function() {
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad+0.01;
            this.yVel = -this.prevYVel/2;
            
        } else {
            platforms.every(plat => {
                if(plat.onPlatform(this)) {
                    this.yPos = plat.y+this.rad+0.01;
                    this.yVel = -this.prevYVel/2;
                    return false;
                } else return true;
            });
        }
    };
    
    this.delete = function() {
        this.pickedUp = true;
    };
    
    this.draw = function() {
        context.beginPath();
        context.arc(canvas.width/2-this.xPos, canvas.height-this.yPos,
                    this.rad, 0, 2*Math.PI);

        context.lineWidth = 3;
        context.strokeStyle = '#ffffff';
        context.stroke();
        if(this.life < 600) context.fillStyle = '#ff8800';
        else context.fillStyle = '#00ff00';
        context.fill();
        
        context.fillStyle = '#ffffff';
        context.fillRect(canvas.width/2-this.xPos-this.rad+8,
                 canvas.height-this.yPos-this.rad+4,
                 this.rad*2-16, this.rad*2-8);
        context.fillRect(canvas.width/2-this.xPos-this.rad+4,
                 canvas.height-this.yPos-this.rad+8,
                 this.rad*2-8, this.rad*2-16);
        
        let rXVel = getRandomInt(-9, 9)*0.1;
        let rYVel = getRandomInt(-9, 9)*0.1;
        let r = getRandomInt(1, 3);
        let c = getRandomInt(0, 9);
        particles.push(new Particle(this.xPos, this.yPos, rXVel, rYVel, 0, 0.05,
                                    r, 40, '#' +c+c+ 'ff' + c+c));
    };
    
    this.update = function() {
        this.life--;
        if(this.life == 0)
            this.delete();
    };
};



function Coin(x, y, xVel, yVel, worth) {
    this.xPos = x;
    this.yPos = y;
    this.xVel = xVel;
    this.yVel = yVel;
    this.prevYVel = 0;
    
    this.life = 2400;
    this.pickedUp = false;
    
    this.rad = 6;
    this.worth = worth;
    
    // Applies acceleration into velocity
    this.applyAcceleration = function() {
        this.yVel += defaultGravity;
    };
    
    // Applies velocity into position
    this.applyVelocity = function() {
        
        this.xPos += this.xVel;
        
        if(stage.inRightWall(this)) {
            this.xPos = -canvas.width/2+this.rad;
            this.xVel = -this.xVel;
        } else if(stage.inLeftWall(this)) {
            this.xPos = canvas.width/2-this.rad;
            this.xVel = -this.xVel;
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.xPos = this.xVel > 0 ?
                        plat.x-this.rad : plat.x+plat.w+this.rad;
                    this.xVel = 0;
                    return false;
                } else return true;
            });
        }
        
        this.yPos += this.yVel;
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad+1;
            this.prevYVel = this.yVel;
            this.xVel *= 0.98;
            this.jump();
            
        } else {
            platforms.every(plat => {
                if(plat.inPlatform(this)) {
                    this.yPos = this.yVel > 0 ?
                        plat.y-plat.h-this.rad : plat.y+this.rad-0.01
                    this.prevYVel = this.yVel;
                    this.yVel = 0;
                    this.xVel *= 0.98;
                    this.jump();
                    return false;
                } else return true;
            });
        }
    };
    
    // Jump movement
    this.jump = function() {
        
        if(stage.inGround(this)) {
            this.yPos = GROUND_HEIGHT+this.rad+0.01;
            this.yVel = -this.prevYVel/2;
            
        } else {
            platforms.every(plat => {
                if(plat.onPlatform(this)) {
                    this.yPos = plat.y+this.rad+0.01;
                    this.yVel = -this.prevYVel/2;
                    return false;
                } else return true;
            });
        }
    };
    
    this.delete = function() {
        this.pickedUp = true;
    };
    
    this.draw = function() {
        context.beginPath();
        context.arc(canvas.width/2-this.xPos, canvas.height-this.yPos,
                    this.rad, 0, 2*Math.PI);

        context.lineWidth = 3;
        context.strokeStyle = '#000000';
        context.stroke();
        if(this.life < 600) {
            if(this.worth > 240) context.fillStyle = '#888888';
            else if(this.worth > 200) context.fillStyle = '#008888';
            else if(this.worth > 160) context.fillStyle = '#008800';
            else if(this.worth > 120) context.fillStyle = '#880000';
            else if(this.worth > 80) context.fillStyle = '#886600';
            else if(this.worth > 40) context.fillStyle = '#555555';
            else context.fillStyle = '#663322';
        }
        else {
            if(this.worth > 240) context.fillStyle = '#ffffff';
            else if(this.worth > 200) context.fillStyle = '#00ffff';
            else if(this.worth > 160) context.fillStyle = '#00ff00';
            else if(this.worth > 120) context.fillStyle = '#ff0000';
            else if(this.worth > 80) context.fillStyle = '#ffcc00';
            else if(this.worth > 40) context.fillStyle = '#aaaaaa';
            else context.fillStyle = '#cc7744';
        }
        context.fill();
        
        context.fillStyle = '#000000';
        context.fillRect(canvas.width/2-this.xPos-this.rad+4,
                 canvas.height-this.yPos-this.rad+2,
                 this.rad*2-8, this.rad*2-4);
        
        let rXVel = getRandomInt(-3, 3)*0.1;
        let rYVel = getRandomInt(-4, 4)*0.1;
        let r = getRandomInt(1, 3);
        let c = getRandomInt(0, 9);
    };
    
    this.update = function() {
        this.life--;
        if(this.life == 0)
            this.delete();
    };
};



// Returns a bounded random integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}

function playsound(type) {
    switch(type) {
        case "bam":
            let AUD_bam = new Audio('audio/bam.wav');
            AUD_bam.volume = 0.5;
            AUD_bam.play();
            break;
        case "boom":
            let AUD_boom = new Audio('audio/boom.wav');
            AUD_boom.volume = 0.5;
            AUD_boom.play();
            break;
        case "boom_fire":
            let AUD_boom_fire = new Audio('audio/boom_fire.wav');
            AUD_boom_fire.volume = 0.5;
            AUD_boom_fire.play();
            break;
        case "brrrrr":
            let AUD_brrrrr = new Audio('audio/brrrrr.wav');
            AUD_brrrrr.volume = 0.5;
            AUD_brrrrr.play();
            break;
        case "bubble_bounce":
            let AUD_bubble_bounce = new Audio('audio/bubble_bounce.wav');
            AUD_bubble_bounce.volume = 0.15;
            AUD_bubble_bounce.play();
            break;
        case "bubble_hit":
            let AUD_bubble_hit = new Audio('audio/bubble_hit.wav');
            AUD_bubble_hit.volume = 0.5;
            AUD_bubble_hit.play();
            break;
        case "bubble_pop":
            let AUD_bubble_pop = new Audio('audio/bubble_pop.wav');
            AUD_bubble_pop.volume = 0.5;
            AUD_bubble_pop.play();
            break;
        case "bullet_hit":
            let AUD_bullet_hit = new Audio('audio/bullet_hit.wav');
            AUD_bullet_hit.volume = 0.5;
            AUD_bullet_hit.play();
            break;
        case "damage":
            let AUD_damage = new Audio('audio/damage.wav');
            AUD_damage.play();
            break;
        case "pew":
            let AUD_pew = new Audio('audio/pew.wav');
            AUD_pew.volume = 0.5;
            AUD_pew.play();
            break;
        case "pickup":
            let AUD_pickup = new Audio('audio/pickup.wav');
            AUD_pickup.volume = 0.25;
            AUD_pickup.play();
            break;
        case "pow":
            let AUD_pow = new Audio('audio/pow.wav');
            AUD_pow.volume = 0.5;
            AUD_pow.play();
            break;
        case "regen":
            let AUD_regen = new Audio('audio/regen.wav');
            AUD_regen.volume = 0.5;
            AUD_regen.play();
            break;
        case "reload_complete":
            let AUD_reload_complete = new Audio('audio/reload_complete.wav');
            AUD_reload_complete.volume = 0.5;
            AUD_reload_complete.play();
            break;
        case "reload":
            let AUD_reload = new Audio('audio/reload.mp3');
            AUD_reload.volume = 0.5;
            AUD_reload.play();
            break;
        case "win1":
            let AUD_win1 = new Audio('audio/win1.wav');
            AUD_win1.volume = 0.5;
            AUD_win1.play();
            break;
        case "win2":
            let AUD_win2 = new Audio('audio/win2.wav');
            AUD_win2.volume = 0.5;
            AUD_win2.play();
            break;
    }
}



document.addEventListener('keydown', function(event) {
    if(event.keyCode == KEY_A) {
        keyStatus_A = true;
        player.moveLeft();
    }
    if(event.keyCode == KEY_D) {
        keyStatus_D = true;
        player.moveRight();
    }
    if(event.keyCode == KEY_W) {
        if(inShop) {
            switch(shopScreenID) {
                case 1: case 2: case 3: case 4: case 5:
                    shopScreenID = 0;
                    break;
                case 1.1: case 2.1: case 3.1: case 4.1: case 5.1:
                case 1.2: case 2.2: case 3.2: case 4.2: case 5.2:
                case 1.3: case 2.3: case 3.3: case 4.3: case 5.3:
                    shopScreenID = Math.floor(shopScreenID);
                    break;
            }
        } else {
            keyStatus_W = true;
            player.jump();
        }
    }
    
    if(event.keyCode == KEY_LEFT) {
        player.useItem("left");
    }
    if(event.keyCode == KEY_UP) {
        player.useItem("up");
    }
    if(event.keyCode == KEY_RIGHT) {
        player.useItem("right");
    }
    if(event.keyCode == KEY_DOWN) {
        player.useItem("down");
    }
    
    if(event.keyCode == KEY_1) {
        if(!paused)
            player.selectItem(1);
        else if(inShop) {
            switch(shopScreenID) {
                case 0:
                    shopScreenID = 1;
                    break;
                    
                case 1:
                    if(player.item1.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.1;
                    break;
                    
                case 2:
                    if(player.item2.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.1;
                    break;
                
                case 3:
                    if(player.item3.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.1;
                    break;
                    
                case 4:
                    if(player.item4.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.1;
                    break;
                    
                case 5:
                    if(player.item5.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.1;
                    break;
                    
                case 1.1:                    
                    let upCost1 = player.item1.up1Cost*(player.item1.up1Num+1);
                    
                    if(player.item1.up1Max == player.item1.up1Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost1)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal1 = player.item1.up1Inc + player.item1.currUp1();
                    player.item1.setUp1(newVal1);
                    player.item1.up1Num++;
                    player.item1.worth += Math.ceil(upCost1/10*0.8)*10;
                    break;
                    
                case 2.1:
                    let upCost2 = player.item2.up1Cost*(player.item2.up1Num+1);
                    
                    if(player.item2.up1Max == player.item2.up1Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost2)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal2 = player.item2.up1Inc + player.item2.currUp1();
                    player.item2.setUp1(newVal2);
                    player.item2.up1Num++;
                    player.item2.worth += Math.ceil(upCost2/10*0.8)*10;
                    break;
                    
                case 3.1:
                    let upCost3 = player.item3.up1Cost*(player.item3.up1Num+1);
                    
                    if(player.item3.up1Max == player.item3.up1Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost3)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal3 = player.item3.up1Inc + player.item3.currUp1();
                    player.item3.setUp1(newVal3);
                    player.item3.up1Num++;
                    player.item3.worth += Math.ceil(upCost3/10*0.8)*10;
                    break;
                    
                case 4.1:
                    let upCost4 = player.item4.up1Cost*(player.item4.up1Num+1);
                    
                    if(player.item4.up1Max == player.item4.up1Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost4)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal4 = player.item4.up1Inc + player.item4.currUp1();
                    player.item4.setUp1(newVal4);
                    player.item4.up1Num++;
                    player.item4.worth += Math.ceil(upCost4/10*0.8)*10;
                    break;
                    
                case 5.1:
                    let upCost5 = player.item5.up1Cost*(player.item5.up1Num+1);
                    
                    if(player.item5.up1Max == player.item5.up1Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost5)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal5 = player.item5.up1Inc + player.item5.currUp1();
                    player.item5.setUp1(newVal5);
                    player.item5.up1Num++;
                    player.item5.worth += Math.ceil(upCost5/10*0.8)*10;
                    break;
                    
                case 1.2:
                    if(!player.removeCoins(1000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item1 = new PewPew();
                    shopScreenID = 0;
                    break;
                    
                case 2.2:
                    if(!player.removeCoins(1000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item2 = new PewPew();
                    shopScreenID = 0;
                    break;
                    
                case 3.2:
                    if(!player.removeCoins(1000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item3 = new PewPew();
                    shopScreenID = 0;
                    break;
                    
                case 4.2:
                    if(!player.removeCoins(1000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item4 = new PewPew();
                    shopScreenID = 0;
                    break;
                    
                case 5.2:
                    if(!player.removeCoins(1000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item5 = new PewPew();
                    shopScreenID = 0;
                    break;
                    
                case 1.3:
                    playsound("regen");
                    player.addCoins(player.item1.worth);
                    player.item1 = new Empty();
                    shopScreenID = 0;
                    break;
                    
                case 2.3:
                    playsound("regen");
                    player.addCoins(player.item2.worth);
                    player.item2 = new Empty();
                    shopScreenID = 0;
                    break;
                    
                case 3.3:
                    playsound("regen");
                    player.addCoins(player.item3.worth);
                    player.item3 = new Empty();
                    shopScreenID = 0;
                    break;
                    
                case 4.3:
                    playsound("regen");
                    player.addCoins(player.item4.worth);
                    player.item4 = new Empty();
                    shopScreenID = 0;
                    break;
                    
                case 5.3:
                    playsound("regen");
                    player.addCoins(player.item5.worth);
                    player.item5 = new Empty();
                    shopScreenID = 0;
                    break;
            }
        }
        
        else if(inUpgrade) {
            let upCost = player.hpUpCost*(player.hpUpNum+1);

            if(player.hpUpMax == player.hpUpNum) {
                playsound("brrrrr");
                return;
            } else if(!player.removeCoins(upCost)) {
                playsound("damage");
                return;
            } 

            playsound("regen");
            let newVal = player.hpUpInc + player.maxHP;
            player.maxHP = newVal;
            player.heal(player.hpUpInc);
            player.hpUpNum++;
        }
    }
    if(event.keyCode == KEY_2) {
        if(!paused)
            player.selectItem(2);
        else if(inShop) {
            switch(shopScreenID) {
                case 0:
                    shopScreenID = 2;
                    break;

                case 1:
                    if(player.item1.name != "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.2;
                    break;
                    
                case 2:
                    if(player.item2.name != "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.2;
                    break;
                
                case 3:
                    if(player.item3.name != "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.2;
                    break;
                    
                case 4:
                    if(player.item4.name != "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.2;
                    break;
                    
                case 5:
                    if(player.item5.name != "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.2;
                    break;
                    
                case 1.1:
                    let upCost1 = player.item1.up2Cost*(player.item1.up2Num+1);
                    
                    if(player.item1.up2Max == player.item1.up2Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost1)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal1 = player.item1.up2Inc + player.item1.currUp2();
                    player.item1.setUp2(newVal1);
                    player.item1.up2Num++;
                    player.item1.worth += Math.ceil(upCost1/10*0.8)*10;
                    break;
                    
                case 2.1:
                    let upCost2 = player.item2.up2Cost*(player.item2.up2Num+1);
                    
                    if(player.item2.up2Max == player.item2.up2Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost2)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal2 = player.item2.up2Inc + player.item2.currUp2();
                    player.item2.setUp2(newVal2);
                    player.item2.up2Num++;
                    player.item2.worth += Math.ceil(upCost2/10*0.8)*10;
                    break;
                    
                case 3.1:
                    let upCost3 = player.item3.up2Cost*(player.item3.up2Num+1);
                    
                    if(player.item3.up2Max == player.item3.up2Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost3)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal3 = player.item3.up2Inc + player.item3.currUp2();
                    player.item3.setUp2(newVal3);
                    player.item3.up2Num++;
                    player.item3.worth += Math.ceil(upCost3/10*0.8)*10;
                    break;
                    
                case 4.1:
                    let upCost4 = player.item4.up2Cost*(player.item4.up2Num+1);
                    
                    if(player.item4.up2Max == player.item4.up2Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost4)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal4 = player.item4.up2Inc + player.item4.currUp2();
                    player.item4.setUp2(newVal4);
                    player.item4.up2Num++;
                    player.item4.worth += Math.ceil(upCost4/10*0.8)*10;
                    break;
                    
                case 5.1:
                    let upCost5 = player.item5.up2Cost*(player.item5.up2Num+1);
                    
                    if(player.item5.up2Max == player.item5.up2Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost5)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal5 = player.item5.up2Inc + player.item5.currUp2();
                    player.item5.setUp2(newVal5);
                    player.item5.up2Num++;
                    player.item5.worth += Math.ceil(upCost5/10*0.8)*10;
                    break;
                    
                case 1.2:
                    if(!player.removeCoins(1500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item1 = new PowPow();
                    shopScreenID = 0;
                    break;
                    
                case 2.2:
                    if(!player.removeCoins(1500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item2 = new PowPow();
                    shopScreenID = 0;
                    break;
                    
                case 3.2:
                    if(!player.removeCoins(1500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item3 = new PowPow();
                    shopScreenID = 0;
                    break;
                    
                case 4.2:
                    if(!player.removeCoins(1500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item4 = new PowPow();
                    shopScreenID = 0;
                    break;
                    
                case 5.2:
                    if(!player.removeCoins(1500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item5 = new PowPow();
                    shopScreenID = 0;
                    break;
            }
        }
        
        else if(inUpgrade) {
            let upCost = player.spdUpCost
                            *Math.pow(player.spdUpMult, player.spdUpNum+1);

            if(player.spdUpMax == player.spdUpNum) {
                playsound("brrrrr");
                return;
            } else if(!player.removeCoins(upCost)) {
                playsound("damage");
                return;
            } 

            playsound("regen");
            let newVal = player.spdUpInc + player.spd;
            player.spd = newVal;
            player.spdUpNum++;
        }
    }
    if(event.keyCode == KEY_3) {
        if(!paused)
            player.selectItem(3);
        else if(inShop) {
            switch(shopScreenID) {
                case 0:
                    shopScreenID = 3;
                    break;

                case 1:
                    if(player.item1.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.3;
                    break;
                    
                case 2:
                    if(player.item2.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.3;
                    break;
                
                case 3:
                    if(player.item3.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.3;
                    break;
                    
                case 4:
                    if(player.item4.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.3;
                    break;
                    
                case 5:
                    if(player.item5.name == "Empty") {
                        playsound("brrrrr");
                        break;    
                    }
                    shopScreenID += 0.3;
                    break;
                    
                case 1.1:
                    let upCost1 = player.item1.up3Cost
                            *Math.pow(player.item1.up3Mult, player.item1.up3Num+1);
                    
                    if(player.item1.up3Max == player.item1.up3Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost1)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal1 = player.item1.up3Inc + player.item1.currUp3();
                    player.item1.setUp3(newVal1);
                    player.item1.up3Num++;
                    player.item1.worth += Math.ceil(upCost1/10*0.8)*10;
                    break;
                    
                case 2.1:
                    let upCost2 = player.item2.up3Cost
                            *Math.pow(player.item2.up3Mult, player.item2.up3Num+1);
                    
                    if(player.item2.up3Max == player.item2.up3Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost2)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal2 = player.item2.up3Inc + player.item2.currUp3();
                    player.item2.setUp3(newVal2);
                    player.item2.up3Num++;
                    player.item2.worth += Math.ceil(upCost2/10*0.8)*10;
                    break;
                    
                case 3.1:
                    let upCost3 = player.item3.up3Cost
                            *Math.pow(player.item3.up3Mult, player.item3.up3Num+1);
                    
                    if(player.item3.up3Max == player.item3.up3Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost3)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal3 = player.item3.up3Inc + player.item3.currUp3();
                    player.item3.setUp3(newVal3);
                    player.item3.up3Num++;
                    player.item3.worth += Math.ceil(upCost3/10*0.8)*10;
                    break;
                    
                case 4.1:
                    let upCost4 = player.item4.up3Cost
                            *Math.pow(player.item4.up3Mult, player.item4.up3Num+1);
                    
                    if(player.item4.up3Max == player.item4.up3Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost4)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal4 = player.item4.up3Inc + player.item4.currUp3();
                    player.item4.setUp3(newVal4);
                    player.item4.up3Num++;
                    player.item4.worth += Math.ceil(upCost4/10*0.8)*10;
                    break;
                    
                case 5.1:
                    let upCost5 = player.item5.up3Cost*(player.item5.up3Num+1);
                    
                    if(player.item5.up3Max == player.item5.up3Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost5)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal5 = player.item5.up3Inc + player.item5.currUp3();
                    player.item5.setUp3(newVal5);
                    player.item5.up3Num++;
                    player.item5.worth += Math.ceil(upCost5/10*0.8)*10;
                    break;
                    
                case 1.2:
                    if(!player.removeCoins(3500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item1 = new BamBam();
                    shopScreenID = 0;
                    break;
                    
                case 2.2:
                    if(!player.removeCoins(3500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item2 = new BamBam();
                    shopScreenID = 0;
                    break;
                    
                case 3.2:
                    if(!player.removeCoins(3500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item3 = new BamBam();
                    shopScreenID = 0;
                    break;
                    
                case 4.2:
                    if(!player.removeCoins(3500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item4 = new BamBam();
                    shopScreenID = 0;
                    break;
                    
                case 5.2:
                    if(!player.removeCoins(3500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item5 = new BamBam();
                    shopScreenID = 0;
                    break;
            }
        }
        
        else if(inUpgrade) {
            let upCost = player.jmpUpCost
                            *Math.pow(player.jmpUpMult, player.jmpUpNum+1);

            if(player.jmpUpMax == player.jmpUpNum) {
                playsound("brrrrr");
                return;
            } else if(!player.removeCoins(upCost)) {
                playsound("damage");
                return;
            } 

            playsound("regen");
            let newVal = player.jmpUpInc + player.jmp;
            player.jmp = newVal;
            player.jmpUpNum++;
        }
    }
    if(event.keyCode == KEY_4) {
        if(!paused)
            player.selectItem(4);
        else if(inShop) {
            switch(shopScreenID) {
                case 0:
                    shopScreenID = 4;
                    break;
                    
                case 1.1:
                    let upCost1 = player.item1.up4Cost
                            *Math.pow(player.item1.up4Mult, player.item1.up4Num+1);
                    
                    if(player.item1.up4Max == player.item1.up4Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost1)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal1 = player.item1.up4Inc + player.item1.currUp4();
                    player.item1.setUp4(newVal1);
                    player.item1.up4Num++;
                    player.item1.worth += Math.ceil(upCost1/10*0.8)*10;
                    break;
                    
                case 2.1:
                    let upCost2 = player.item2.up4Cost
                            *Math.pow(player.item2.up4Mult, player.item2.up4Num+1);
                    
                    if(player.item2.up4Max == player.item2.up4Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost2)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal2 = player.item2.up4Inc + player.item2.currUp4();
                    player.item2.setUp4(newVal2);
                    player.item2.up4Num++;
                    player.item2.worth += Math.ceil(upCost2/10*0.8)*10;
                    break;
                    
                case 3.1:
                    let upCost3 = player.item3.up4Cost
                            *Math.pow(player.item3.up4Mult, player.item3.up4Num+1);
                    
                    if(player.item3.up4Max == player.item3.up4Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost3)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal3 = player.item3.up4Inc + player.item3.currUp4();
                    player.item3.setUp4(newVal3);
                    player.item3.up4Num++;
                    player.item3.worth += Math.ceil(upCost3/10*0.8)*10;
                    break;
                    
                case 4.1:
                    let upCost4 = player.item4.up4Cost
                            *Math.pow(player.item4.up4Mult, player.item4.up4Num+1);
                    
                    if(player.item4.up4Max == player.item4.up4Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost4)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal4 = player.item4.up4Inc + player.item4.currUp4();
                    player.item4.setUp4(newVal4);
                    player.item4.up4Num++;
                    player.item4.worth += Math.ceil(upCost4/10*0.8)*10;
                    break;
                    
                case 5.1:
                    let upCost5 = player.item5.up4Cost*(player.item5.up4Num+1);
                    
                    if(player.item5.up4Max == player.item5.up4Num) {
                        playsound("brrrrr");
                        break;    
                    } else if(!player.removeCoins(upCost5)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    let newVal5 = player.item5.up4Inc + player.item5.currUp4();
                    player.item5.setUp4(newVal5);
                    player.item5.up4Num++;
                    player.item5.worth += Math.ceil(upCost5/10*0.8)*10;
                    break;
                    
                case 1.2:
                    if(!player.removeCoins(10500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item1 = new BoomBoom();
                    shopScreenID = 0;
                    break;
                    
                case 2.2:
                    if(!player.removeCoins(10500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item2 = new BoomBoom();
                    shopScreenID = 0;
                    break;
                    
                case 3.2:
                    if(!player.removeCoins(10500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item3 = new BoomBoom();
                    shopScreenID = 0;
                    break;
                    
                case 4.2:
                    if(!player.removeCoins(10500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item4 = new BoomBoom();
                    shopScreenID = 0;
                    break;
                    
                case 5.2:
                    if(!player.removeCoins(10500)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item5 = new BoomBoom();
                    shopScreenID = 0;
                    break;
            }
        }
        
        else if(inUpgrade) {
            let upCost = player.frcUpCost
                            *Math.pow(player.frcUpMult, player.frcUpNum+1);

            if(player.frcUpMax == player.frcUpNum) {
                playsound("brrrrr");
                return;
            } else if(!player.removeCoins(upCost)) {
                playsound("damage");
                return;
            } 

            playsound("regen");
            let newVal = player.frcUpInc + player.frc;
            player.frc = newVal;
            player.frcUpNum++;
        }
    }
    if(event.keyCode == KEY_5) {
        if(!paused)
            player.selectItem(5);
        else if(inShop) {
            switch(shopScreenID) {
                case 0:
                    shopScreenID = 5;
                    break;
                    
                case 1.2:
                    if(!player.removeCoins(22000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item1 = new Brrrrr();
                    shopScreenID = 0;
                    break;
                    
                case 2.2:
                    if(!player.removeCoins(22000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item2 = new Brrrrr();
                    shopScreenID = 0;
                    break;
                    
                case 3.2:
                    if(!player.removeCoins(22000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item3 = new Brrrrr();
                    shopScreenID = 0;
                    break;
                    
                case 4.2:
                    if(!player.removeCoins(22000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item4 = new Brrrrr();
                    shopScreenID = 0;
                    break;
                    
                case 5.2:
                    if(!player.removeCoins(22000)) {
                        playsound("damage");
                        break;
                    }
                    
                    playsound("regen");
                    player.item5 = new Brrrrr();
                    shopScreenID = 0;
                    break;
            }
        }
    }
    
    if(event.keyCode == KEY_ESCAPE) {
        paused = !paused;
        initScreen = false;
        inShop = false;
        inUpgrade = false;
        showInfo = false;
        shopScreenID = 0;
    }
    if(event.keyCode == KEY_E) {
        if(!paused) {
            paused = true;
            inShop = true;
            shopScreenID = 0;
        } else if(inShop) {
            paused = false;
            inShop = false;
            shopScreenID = 0;
        }
    }
    if(event.keyCode == KEY_Q) {
        if(!paused) {
            paused = true;
            inUpgrade = true;
        } else if(inUpgrade) {
            paused = false;
            inUpgrade = false;
        }
    }
    if(event.keyCode == KEY_C) {
        if(!paused) {
            paused = true;
            showInfo = true;
        } else if(showInfo) {
            paused = false;
            showInfo = false;
        }
    }
    
    if(event.keyCode == KEY_7) {
        showBubbleHP = !showBubbleHP;
    }
    if(event.keyCode == KEY_8) {
        showBubbleLv = !showBubbleLv;
    }
    if(event.keyCode == KEY_9) {
        showDamage = !showDamage;
    }
});

document.addEventListener('keyup', function(event) {
    if(event.keyCode == KEY_A)
        keyStatus_A = false;
    if(event.keyCode == KEY_D)
        keyStatus_D = false;
    if(event.keyCode == KEY_W)
        keyStatus_W = false;
});



stage = new Stage();
platforms.push(new Platform(50, 132, PLATFORM_WIDTH, PLATFORM_HEIGHT));
platforms.push(new Platform(-200, 132, PLATFORM_WIDTH, PLATFORM_HEIGHT));
platforms.push(new Platform(-75, 232, PLATFORM_WIDTH, PLATFORM_HEIGHT));
bubbles.push(new Bubble(300, 500, -defaultBubbleSpd, 2, '#ffffff', 1, 1, 1, 1, 10));
bubbles.push(new Bubble(-300, 500, defaultBubbleSpd, 2, '#ffffff', 1, 1, 1, 1, 10));
player = new Player(0, 1000);
savedPlayer = player;
requestAnimationFrame(update);
