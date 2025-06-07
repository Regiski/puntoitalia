class Player {
    constructor(game, x, y, color) {
        this.game = game;
        this.graphics = new PIXI.Graphics();
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.speed = 3;
        this.jumpPower = -8.5;
        this.gravity = 0.45;
        this.onGround = false;
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.dashDir = 0;
        this.dashSpeed = 10;
        this.facing = 1;
        this.weapon = "pistol";
        this.color = color;
        this.width = 20;
        this.height = 32;
        this.shootCooldown = 0;
        this.dead = false;
        this.respawnTimer = 0;
        this.draw();
        this.game.stage.addChild(this.graphics);
    }
    draw() {
        this.graphics.clear();
        let c = this.color;
        this.graphics.beginFill(0x222222);
        this.graphics.drawRect(this.x-10, this.y-16, 20, 32);
        this.graphics.endFill();
        this.graphics.beginFill(c);
        this.graphics.drawRect(this.x-8, this.y-16, 16, 16);
        this.graphics.endFill();
        this.graphics.beginFill(0xffffff);
        this.graphics.drawRect(this.x-4, this.y-8, 8, 8);
        this.graphics.endFill();
        if (this.weapon === "pistol") {
            this.graphics.beginFill(0xcccccc);
            this.graphics.drawRect(this.x+this.facing*8, this.y-8, 8*this.facing, 4);
            this.graphics.endFill();
        }
        if (this.weapon === "machinegun") {
            this.graphics.beginFill(0x00ff00);
            this.graphics.drawRect(this.x+this.facing*8, this.y-8, 12*this.facing, 4);
            this.graphics.endFill();
        }
        if (this.weapon === "flamethrower") {
            this.graphics.beginFill(0xff6600);
            this.graphics.drawRect(this.x+this.facing*8, this.y-8, 10*this.facing, 4);
            this.graphics.endFill();
        }
        if (this.weapon === "laser") {
            this.graphics.beginFill(0x00eaff);
            this.graphics.drawRect(this.x+this.facing*8, this.y-8, 14*this.facing, 2);
            this.graphics.endFill();
        }
    }
    update(input) {
        if (this.dead) {
            this.respawnTimer -= 1;
            if (this.respawnTimer <= 0) this.respawn();
            return;
        }
        if (this.dashCooldown > 0) this.dashCooldown -= 1;
        if (this.dashTimer > 0) {
            this.x += this.dashDir * this.dashSpeed;
            this.dashTimer -= 1;
            if (this.dashTimer <= 0) this.dashCooldown = 35;
        } else {
            let left = input.left, right = input.right;
            if (left) {
                this.vx = -this.speed;
                this.facing = -1;
            } else if (right) {
                this.vx = this.speed;
                this.facing = 1;
            } else {
                this.vx = 0;
            }
            if (input.jump && this.onGround) {
                this.vy = this.jumpPower;
                this.onGround = false;
            }
            if (input.dash && this.dashCooldown <= 0) {
                this.dashDir = this.facing;
                this.dashTimer = 10;
            }
            this.x += this.vx;
        }
        this.vy += this.gravity;
        this.y += this.vy;
        if (this.y > this.game.groundY - this.height/2) {
            this.y = this.game.groundY - this.height/2;
            this.vy = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
        }
        if (this.shootCooldown > 0) this.shootCooldown -= 1;
        if (input.shoot && this.shootCooldown <= 0) {
            this.shoot();
        }
        this.draw();
    }
    shoot() {
        let px = this.x+this.facing*16;
        let py = this.y-8;
        let dir = this.facing;
        if (this.weapon === "pistol") {
            this.game.spawnProjectile(px, py, dir*7, 0, "pistol", 0xffe000);
            this.shootCooldown = 18;
        }
        if (this.weapon === "machinegun") {
            this.game.spawnProjectile(px, py, dir*11, Math.random()*1.3-0.65, "machinegun", 0x00ff00);
            this.shootCooldown = 6;
        }
        if (this.weapon === "flamethrower") {
            this.game.spawnProjectile(px, py, dir*5.5, Math.random()*2.5-1.25, "flame", 0xff6611);
            this.shootCooldown = 4;
        }
        if (this.weapon === "laser") {
            this.game.spawnProjectile(px, py, dir*16, 0, "laser", 0x00eaff);
            this.shootCooldown = 28;
        }
    }
    die() {
        this.dead = true;
        this.respawnTimer = 60;
        this.x = -1000;
        this.y = -1000;
        this.graphics.visible = false;
    }
    respawn() {
        this.x = 100;
        this.y = this.game.groundY-this.height/2;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;
        this.graphics.visible = true;
        this.weapon = "pistol";
    }
}
class Projectile {
    constructor(game, x, y, vx, vy, type, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.type = type;
        this.color = color;
        this.lifetime = 80;
        this.graphics = new PIXI.Graphics();
        this.radius = 5;
        this.game.stage.addChild(this.graphics);
        this.draw();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.type === "flame") {
            this.vy += 0.1;
            this.vx *= 0.985;
        }
        if (this.type === "laser") {
            this.radius = 3+Math.random()*2;
        }
        this.lifetime -= 1;
        this.draw();
        if (this.x < 0 || this.x > this.game.width || this.y < 0 || this.y > this.game.height || this.lifetime < 0) {
            this.destroy();
            return false;
        }
        for (let enemy of this.game.enemies) {
            if (!enemy.dead && Math.abs(this.x-enemy.x)<enemy.width/2+this.radius && Math.abs(this.y-enemy.y)<enemy.height/2+this.radius) {
                enemy.hit(this.type);
                this.destroy();
                return false;
            }
        }
        return true;
    }
    draw() {
        this.graphics.clear();
        if (this.type === "laser") {
            this.graphics.beginFill(this.color, 0.8+0.2*Math.random());
            this.graphics.drawRect(this.x-2, this.y-3, 18, 6);
            this.graphics.endFill();
        } else if (this.type === "flame") {
            this.graphics.beginFill(this.color, 0.5+0.5*Math.random());
            this.graphics.drawCircle(this.x, this.y, this.radius*Math.random());
            this.graphics.endFill();
        } else {
            this.graphics.beginFill(this.color);
            this.graphics.drawCircle(this.x, this.y, this.radius);
            this.graphics.endFill();
        }
    }
    destroy() {
        this.game.stage.removeChild(this.graphics);
        this.graphics.destroy();
        this.lifetime = -1;
    }
}
class Enemy {
    constructor(game, x, y, type="soldier") {
        this.game = game;
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = 22;
        this.height = 30;
        this.graphics = new PIXI.Graphics();
        this.color = 0x44ff44;
        this.hp = 2;
        this.dead = false;
        this.vx = -2.1-Math.random();
        this.vy = 0;
        this.gravity = 0.4;
        this.jumpTimer = 0;
        this.shootTimer = Math.floor(Math.random()*60+40);
        this.learnJump = false;
        this.draw();
        this.game.stage.addChild(this.graphics);
    }
    update() {
        if (this.dead) return;
        let p = this.game.player;
        if (this.type === "soldier") {
            if (Math.abs(this.x-p.x)<200 && this.jumpTimer<=0 && p.vy < -2 && Math.random()<0.18) {
                this.vy = -7.5;
                this.jumpTimer = 38;
            }
            if (this.jumpTimer>0) this.jumpTimer -= 1;
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;
            if (this.y > this.game.groundY-this.height/2) {
                this.y = this.game.groundY-this.height/2;
                this.vy = 0;
            }
            this.shootTimer -= 1;
            if (this.shootTimer<=0) {
                this.shoot();
                this.shootTimer = 80+Math.floor(Math.random()*60);
            }
        }
        this.draw();
        if (this.x<-40) this.die();
        if (!this.dead && Math.abs(this.x-p.x)<p.width/2+this.width/2 && Math.abs(this.y-p.y)<p.height/2+this.height/2) {
            p.die();
        }
    }
    shoot() {
        let px = this.x-12;
        let py = this.y-8;
        this.game.spawnEnemyProjectile(px, py, -6, 0, 0xff2222);
    }
    hit(type) {
        this.hp -= (type==="laser"?2:1);
        if (this.hp<=0) this.die();
    }
    die() {
        this.dead = true;
        this.graphics.visible = false;
        this.game.spawnExplosion(this.x, this.y, 0xff3333);
        this.game.onEnemyKilled();
    }
    draw() {
        this.graphics.clear();
        this.graphics.beginFill(0x2c2c2c);
        this.graphics.drawRect(this.x-11, this.y-15, 22, 30);
        this.graphics.endFill();
        this.graphics.beginFill(this.color);
        this.graphics.drawRect(this.x-9, this.y-13, 18, 13);
        this.graphics.endFill();
        this.graphics.beginFill(0xffffff);
        this.graphics.drawRect(this.x-5, this.y-7, 10, 6);
        this.graphics.endFill();
        this.graphics.beginFill(0x333333);
        this.graphics.drawRect(this.x-7, this.y+2, 14, 8);
        this.graphics.endFill();
    }
}
class EnemyProjectile {
    constructor(game, x, y, vx, vy, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.radius = 5;
        this.lifetime = 90;
        this.graphics = new PIXI.Graphics();
        this.game.stage.addChild(this.graphics);
        this.draw();
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime -= 1;
        this.draw();
        let p = this.game.player;
        if (!p.dead && Math.abs(this.x-p.x)<p.width/2+this.radius && Math.abs(this.y-p.y)<p.height/2+this.radius) {
            p.die();
            this.destroy();
            return false;
        }
        if (this.x<0||this.x>this.game.width||this.y<0||this.y>this.game.height||this.lifetime<0) {
            this.destroy();
            return false;
        }
        return true;
    }
    draw() {
        this.graphics.clear();
        this.graphics.beginFill(this.color);
        this.graphics.drawCircle(this.x, this.y, this.radius);
        this.graphics.endFill();
    }
    destroy() {
        this.game.stage.removeChild(this.graphics);
        this.graphics.destroy();
        this.lifetime = -1;
    }
}
class Explosion {
    constructor(game, x, y, color) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = 10+Math.random()*10;
        this.lifetime = 18;
        this.graphics = new PIXI.Graphics();
        this.filter = new PIXI.filters.AdvancedBloomFilter({threshold:0.2, bloomScale:1.6, brightness:2.8});
        this.graphics.filters = [this.filter];
        this.game.stage.addChild(this.graphics);
        this.draw();
    }
    update() {
        this.radius += 3+Math.random()*2;
        this.lifetime -= 1;
        this.draw();
        if (this.lifetime<=0) {
            this.game.stage.removeChild(this.graphics);
            this.graphics.destroy();
            return false;
        }
        return true;
    }
    draw() {
        this.graphics.clear();
        this.graphics.beginFill(this.color, 0.7+0.3*Math.random());
        this.graphics.drawCircle(this.x, this.y, this.radius*(0.6+0.4*Math.random()));
        this.graphics.endFill();
    }
}
class WeaponPickup {
    constructor(game, x, y, weapon) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.weapon = weapon;
        this.width = 20;
        this.height = 16;
        this.graphics = new PIXI.Graphics();
        this.game.stage.addChild(this.graphics);
        this.timer = 400;
        this.draw();
    }
    update() {
        this.timer -= 1;
        this.draw();
        let p = this.game.player;
        if (!p.dead && Math.abs(this.x-p.x)<p.width/2+this.width/2 && Math.abs(this.y-p.y)<p.height/2+this.height/2) {
            p.weapon = this.weapon;
            this.destroy();
            return false;
        }
        if (this.timer<=0) {
            this.destroy();
            return false;
        }
        return true;
    }
    draw() {
        this.graphics.clear();
        if (this.weapon === "machinegun") {
            this.graphics.beginFill(0x00ff00);
            this.graphics.drawRect(this.x-10, this.y-8, 20, 16);
            this.graphics.endFill();
            this.graphics.beginFill(0x333333);
            this.graphics.drawRect(this.x-8, this.y-4, 16, 8);
            this.graphics.endFill();
        }
        if (this.weapon === "flamethrower") {
            this.graphics.beginFill(0xff6600);
            this.graphics.drawRect(this.x-10, this.y-8, 20, 16);
            this.graphics.endFill();
            this.graphics.beginFill(0x333333);
            this.graphics.drawRect(this.x-6, this.y-4, 12, 8);
            this.graphics.endFill();
        }
        if (this.weapon === "laser") {
            this.graphics.beginFill(0x00eaff);
            this.graphics.drawRect(this.x-10, this.y-8, 20, 16);
            this.graphics.endFill();
            this.graphics.beginFill(0x333333);
            this.graphics.drawRect(this.x-8, this.y-4, 16, 8);
            this.graphics.endFill();
        }
    }
    destroy() {
        this.game.stage.removeChild(this.graphics);
        this.graphics.destroy();
        this.timer = -1;
    }
}
class Game {
    constructor() {
        this.width = 800;
        this.height = 600;
        this.groundY = 510;
        this.app = app;
        this.stage = app.stage;
        this.state = "title";
        this.titleFade = 0;
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.explosions = [];
        this.pickups = [];
        this.spawnTimer = 0;
        this.wave = 1;
        this.kills = 0;
        this.scoreText = new PIXI.Text("", {fontFamily:"monospace", fontSize:20, fill:0xffffff});
        this.scoreText.x = 10;
        this.scoreText.y = 10;
        this.stage.addChild(this.scoreText);
        this.input = {left:false,right:false,jump:false,dash:false,shoot:false};
        this.keyMap = {
            37: "left", 65: "left",
            39: "right", 68: "right",
            38: "jump", 87: "jump", 32: "jump",
            16: "dash", 17: "dash", 90: "dash",
            88: "shoot", 67: "shoot", 70: "shoot"
        };
        this.setupInput();
        this.createBG();
        this.filters = [
            new PIXI.filters.GlowFilter({distance:8,outerStrength:1.2,color:0xff00ff}),
            new PIXI.filters.CRTFilter({vignetting:0.35,curvature:2.2,noise:0.08}),
        ];
        this.stage.filters = this.filters;
        this.updateScore();
        this.scoreText.visible = false;
        this.startTitle();
    }
    setupInput() {
        window.addEventListener("keydown", e=>{
            let k = this.keyMap[e.keyCode];
            if (k) this.input[k] = true;
            if (this.state==="title" && (e.keyCode===13||e.keyCode===32)) this.startGame();
            if (this.state==="gameover" && (e.keyCode===13||e.keyCode===32)) this.restart();
        });
        window.addEventListener("keyup", e=>{
            let k = this.keyMap[e.keyCode];
            if (k) this.input[k] = false;
        });
    }
    createBG() {
        this.bg = new PIXI.Container();
        this.bgSky = new PIXI.Graphics();
        this.bg.addChild(this.bgSky);
        this.bgCity = new PIXI.Graphics();
        this.bg.addChild(this.bgCity);
        this.bgJungle = new PIXI.Graphics();
        this.bg.addChild(this.bgJungle);
        this.bgGround = new PIXI.Graphics();
        this.bg.addChild(this.bgGround);
        this.bgMoon = new PIXI.Graphics();
        this.bg.addChild(this.bgMoon);
        this.stage.addChild(this.bg);
        this.drawBG();
    }
    drawBG() {
        this.bgSky.clear();
        let grad = this.bgSky.beginTextureFill({texture:this.createSkyGradient()});
        this.bgSky.drawRect(0,0,this.width,this.height);
        this.bgSky.endFill();
        this.bgMoon.clear();
        this.bgMoon.beginFill(0xe6e6ff,0.16);
        this.bgMoon.drawCircle(700,90,60);
        this.bgMoon.endFill();
        this.bgCity.clear();
        for(let i=0;i<8;i++) {
            let x=60+i*90, h=130+Math.random()*50;
            this.bgCity.beginFill(0x330033+((i%2)*0x220000),0.8);
            this.bgCity.drawRect(x,this.groundY-h,70,h);
            this.bgCity.endFill();
            this.bgCity.beginFill(0xff00cc,Math.random()*0.2+0.2);
            for(let j=0;j<4;j++) {
                this.bgCity.drawRect(x+10+j*12,this.groundY-h+Math.random()*h*0.7,8,4);
            }
            this.bgCity.endFill();
        }
        this.bgJungle.clear();
        for(let i=0;i<11;i++) {
            let x=20+i*70, h=40+Math.random()*30;
            this.bgJungle.beginFill(0x004d1a+((i%2)*0x006600),0.7);
            this.bgJungle.drawRect(x,this.groundY-h,50,h);
            this.bgJungle.endFill();
            this.bgJungle.beginFill(0x00ff44,0.28);
            for(let j=0;j<3;j++) {
                this.bgJungle.drawCircle(x+10+j*12,this.groundY-h+6+Math.random()*h*0.6,6+Math.random()*4);
            }
            this.bgJungle.endFill();
        }
        this.bgGround.clear();
        this.bgGround.beginFill(0x222222);
        this.bgGround.drawRect(0,this.groundY,this.width,this.height-this.groundY);
        this.bgGround.endFill();
        this.bgGround.beginFill(0xff6600,0.12);
        for(let i=0;i<7;i++) {
            this.bgGround.drawRect(i*110+Math.random()*20,this.groundY+14+Math.random()*20,80,6);
        }
        this.bgGround.endFill();
    }
    createSkyGradient() {
        let canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = this.height;
        let ctx = canvas.getContext("2d");
        let grad = ctx.createLinearGradient(0,0,0,this.height);
        grad.addColorStop(0,"#e400ff");
        grad.addColorStop(0.45,"#7f3fff");
        grad.addColorStop(0.7,"#2e2e5b");
        grad.addColorStop(1,"#1a1c24");
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,1,this.height);
        return PIXI.Texture.from(canvas);
    }
    startTitle() {
        this.state = "title";
        this.titleFade = 0;
        this.scoreText.visible = false;
        if (this.player) {
            this.stage.removeChild(this.player.graphics);
            this.player.graphics.destroy();
        }
        for (let arr of [this.enemies,this.projectiles,this.enemyProjectiles,this.explosions,this.pickups]) {
            for (let o of arr) {
                if (o.graphics) {
                    this.stage.removeChild(o.graphics);
                    o.graphics.destroy();
                }
            }
            arr.length = 0;
        }
    }
    startGame() {
        this.state = "playing";
        this.wave = 1;
        this.kills = 0;
        this.spawnTimer = 80;
        this.player = new Player(this, 100, this.groundY-16, 0xff2244);
        this.enemies = [];
        this.projectiles = [];
        this.enemyProjectiles = [];
        this.explosions = [];
        this.pickups = [];
        this.updateScore();
        this.scoreText.visible = true;
    }
    spawnProjectile(x, y, vx, vy, type, color) {
        this.projectiles.push(new Projectile(this, x, y, vx, vy, type, color));
    }
    spawnEnemyProjectile(x, y, vx, vy, color) {
        this.enemyProjectiles.push(new EnemyProjectile(this, x, y, vx, vy, color));
    }
    spawnExplosion(x, y, color) {
        this.explosions.push(new Explosion(this, x, y, color));
    }
    spawnPickup(x, y, weapon) {
        this.pickups.push(new WeaponPickup(this, x, y, weapon));
    }
    spawnEnemy() {
        let x = this.width+30;
        let y = this.groundY-15;
        this.enemies.push(new Enemy(this, x, y, "soldier"));
    }

    onEnemyKilled() {
        this.kills += 1;
        if (this.kills % 10 === 0) {
            this.wave += 1;
        }
        this.updateScore();
    }

    updateScore() {
        this.scoreText.text = `Punti: ${this.kills}  Ondata: ${this.wave}`;
    }
    update(delta) {
        if (this.state==="title") {
            this.titleFade = Math.min(1,this.titleFade+delta*0.03);
            this.drawBG();
            this.drawTitle();
            return;
        }
        if (this.state==="gameover") {
            this.drawGameOver();
            return;
        }
        this.drawBG();
        this.player.update(this.input);
        this.projectiles = this.projectiles.filter(p=>p.update());
        this.enemyProjectiles = this.enemyProjectiles.filter(p=>p.update());
        this.enemies = this.enemies.filter(e=>(!e.dead));
        for (let e of this.enemies) e.update();
        this.explosions = this.explosions.filter(e=>e.update());
        this.pickups = this.pickups.filter(p=>p.update());
        this.spawnTimer -= 1;
        if (this.spawnTimer<=0) {
            this.spawnEnemy();
            this.spawnTimer = Math.max(36, 90-8*this.wave+Math.random()*20);
            if (Math.random()<0.16) {
                let w = ["machinegun","flamethrower","laser"][Math.floor(Math.random()*3)];
                this.spawnPickup(140+Math.random()*500, this.groundY-16, w);
            }
        }
        if (this.player.dead) {
            this.state = "gameover";
        }
    }
    drawTitle() {
        if (!this.titleText) {
            this.titleText = new PIXI.Text("La guerra di Regskilla", {fontFamily:"monospace",fontSize:54,fill:0xff2244,stroke:0xffffff,strokeThickness:6,letterSpacing:2});
            this.titleText.anchor.set(0.5);
            this.titleText.x = this.width/2;
            this.titleText.y = 130;
            this.stage.addChild(this.titleText);
        }
        this.titleText.alpha = 0.92*this.titleFade;
        if (!this.subText) {
            this.subText = new PIXI.Text("Premi INVIO o SPAZIO per iniziare", {fontFamily:"monospace",fontSize:26,fill:0xffffff,stroke:0x000000,strokeThickness:3});
            this.subText.anchor.set(0.5);
            this.subText.x = this.width/2;
            this.subText.y = 210;
            this.stage.addChild(this.subText);
        }
        this.subText.alpha = 0.8*Math.abs(Math.sin(Date.now()/600))*this.titleFade;
        if (!this.demoGuy) {
            this.demoGuy = new PIXI.Graphics();
            this.stage.addChild(this.demoGuy);
        }
        this.demoGuy.clear();
        let t = Date.now()/390;
        let dx = 320+Math.sin(t)*120;
        let dy = this.groundY-16;
        this.demoGuy.beginFill(0x222222);
        this.demoGuy.drawRect(dx-10, dy-16, 20, 32);
        this.demoGuy.endFill();
        this.demoGuy.beginFill(0xff2244);
        this.demoGuy.drawRect(dx-8, dy-16, 16, 16);
        this.demoGuy.endFill();
        this.demoGuy.beginFill(0xffffff);
        this.demoGuy.drawRect(dx-4, dy-8, 8, 8);
        this.demoGuy.endFill();
        this.demoGuy.beginFill(0xcccccc);
        this.demoGuy.drawRect(dx+8, dy-8, 8, 4);
        this.demoGuy.endFill();
    }
    drawGameOver() {
        if (!this.gameOverText) {
            this.gameOverText = new PIXI.Text("GAME OVER", {fontFamily:"monospace",fontSize:54,fill:0xff2244,stroke:0xffffff,strokeThickness:6,letterSpacing:2});
            this.gameOverText.anchor.set(0.5);
            this.gameOverText.x = this.width/2;
            this.gameOverText.y = 190;
            this.stage.addChild(this.gameOverText);
        }
        this.gameOverText.alpha = 0.95;
        if (!this.restartText) {
            this.restartText = new PIXI.Text("Premi INVIO o SPAZIO per ricominciare", {fontFamily:"monospace",fontSize:26,fill:0xffffff,stroke:0x000000,strokeThickness:3});
            this.restartText.anchor.set(0.5);
            this.restartText.x = this.width/2;
            this.restartText.y = 270;
            this.stage.addChild(this.restartText);
        }
        this.restartText.alpha = 0.8*Math.abs(Math.sin(Date.now()/400));
    }
    restart() {
        if (this.gameOverText) { this.stage.removeChild(this.gameOverText); this.gameOverText.destroy(); this.gameOverText = null; }
        if (this.restartText) { this.stage.removeChild(this.restartText); this.restartText.destroy(); this.restartText = null; }
        if (this.titleText) { this.stage.removeChild(this.titleText); this.titleText.destroy(); this.titleText = null; }
        if (this.subText) { this.stage.removeChild(this.subText); this.subText.destroy(); this.subText = null; }
        if (this.demoGuy) { this.stage.removeChild(this.demoGuy); this.demoGuy.destroy(); this.demoGuy = null; }
        this.startGame();
    }
}
const app = new PIXI.Application({
    autoStart: false,
    width: 800,
    height: 600,
    backgroundColor: 0x1a1c24,
    antialias: true,
    resolution: 1
});
document.body.appendChild(app.view);
let game = new Game();
let lastTime = performance.now();
function gameLoop() {
    const now = performance.now();
    const delta = (now - lastTime)/16.6667;
    lastTime = now;
    game.update(delta);
    app.renderer.render(app.stage);
    setTimeout(gameLoop, 1000/60);
}
gameLoop();
