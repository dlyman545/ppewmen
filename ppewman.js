const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 480,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 500 }, debug: false }
    },
    scene: { preload, create, update }
};

let player, cursors, bullets, enemies, powerups, lastFired = 0, lives = 3, weaponType = "normal", specialAmmo = 0;
const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'background.png'); // Add a scrolling background
    this.load.image('player', 'player.png');
    this.load.image('bullet', 'bullet.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('powerup_health', 'powerup_health.png');
    this.load.image('powerup_weapon', 'powerup_weapon.png');
}

function create() {
    this.bg = this.add.tileSprite(0, 0, 800, 480, 'background').setOrigin(0, 0);

    player = this.physics.add.sprite(100, 400, 'player').setCollideWorldBounds(true);
    player.setBounce(0.1);

    cursors = this.input.keyboard.createCursorKeys();
    bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    enemies = this.physics.add.group();
    powerups = this.physics.add.group();

    this.time.addEvent({ delay: 2000, callback: spawnEnemy, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 10000, callback: spawnPowerUp, callbackScope: this, loop: true });

    this.input.keyboard.on('keydown-Z', () => shootBullet(this));

    this.livesText = this.add.text(10, 10, `Lives: ${lives}`, { fontSize: '20px', fill: '#fff' });
}

function update(time) {
    this.bg.tilePositionX += 2;  // Background scrolling

    if (cursors.left.isDown) player.setVelocityX(-200);
    else if (cursors.right.isDown) player.setVelocityX(200);
    else player.setVelocityX(0);

    if (cursors.space.isDown && player.body.touching.down) player.setVelocityY(-300);

    this.physics.overlap(bullets, enemies, destroyEnemy, null, this);
    this.physics.overlap(player, enemies, playerHit, null, this);
    this.physics.overlap(player, powerups, collectPowerUp, null, this);
}

function shootBullet(scene) {
    if (scene.time.now > lastFired) {
        if (weaponType === "normal") {
            bullets.create(player.x + 20, player.y, 'bullet').setVelocityX(500);
        } else if (weaponType === "spread") {
            bullets.create(player.x + 20, player.y, 'bullet').setVelocity(500, -50);
            bullets.create(player.x + 20, player.y, 'bullet').setVelocityX(500);
            bullets.create(player.x + 20, player.y, 'bullet').setVelocity(500, 50);
        } else if (weaponType === "laser" && specialAmmo > 0) {
            bullets.create(player.x + 20, player.y, 'bullet').setVelocityX(700);
            specialAmmo--;
        }
        lastFired = scene.time.now + 300;
    }
}

function spawnEnemy() {
    let enemy = enemies.create(800, 400, 'enemy').setVelocityX(-150);
}

function spawnPowerUp() {
    let type = Math.random() < 0.5 ? 'powerup_health' : 'powerup_weapon';
    let powerup = powerups.create(800, 400, type).setVelocityX(-100);
    powerup.type = type;
}

function destroyEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
}

function playerHit(player, enemy) {
    enemy.destroy();
    lives--;
    game.scene.scenes[0].livesText.setText(`Lives: ${lives}`);
    if (lives <= 0) {
        game.scene.scenes[0].scene.restart();
    }
}

function collectPowerUp(player, powerup) {
    if (powerup.type === 'powerup_health') {
        lives = Math.min(3, lives + 1);
    } else if (powerup.type === 'powerup_weapon') {
        let weapons = ['spread', 'laser'];
        weaponType = weapons[Math.floor(Math.random() * weapons.length)];
        if (weaponType === "laser") specialAmmo = 5;
    }
    game.scene.scenes[0].livesText.setText(`Lives: ${lives}`);
    powerup.destroy();
}

class Bullet extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'bullet');
    }
}
