const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 480,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 800 }, debug: false }
    },
    scene: { preload, create, update }
};

let player, cursors, bullets, enemyBullets, enemies, platforms, powerups;
let lastFired = 0, lives = 3, weaponType = "normal", specialAmmo = 0, score = 0;
let scoreText, livesText, gameOverText;
const game = new Phaser.Game(config);

function preload() {
    this.load.image('platform', 'platform.png');
    this.load.image('player', 'player.png');
    this.load.image('enemy', 'enemy.png');
    this.load.image('powerup_health', 'powerup_health.png');
    this.load.image('powerup_weapon', 'powerup_weapon.png');
}

function create() {
    this.add.rectangle(400, 240, 800, 480, 0x87CEEB); // Sky background

    // Ground with brown color
    platforms = this.physics.add.staticGroup();
    for (let i = 0; i < 9; i++) {
        if (Math.random() > 0.01) {
            let ground = platforms.create(i * 100 + 50, 460, 'platform');
            ground.setTint(0x8B4513); // Brown color for ground
        }
    }
    
    // Platforms
    platforms.create(600, 350, 'platform');
    platforms.create(200, 280, 'platform');

    // Player
    player = this.physics.add.sprite(100, 400, 'player').setCollideWorldBounds(true);
    player.setTint(0x00ff00); // Green
    this.physics.add.collider(player, platforms);

    // Controls
    cursors = this.input.keyboard.createCursorKeys();

    // Groups
    bullets = this.physics.add.group();
    enemyBullets = this.physics.add.group();
    enemies = this.physics.add.group();
    powerups = this.physics.add.group();

    // Enemy & Powerup Timers
    this.time.addEvent({ delay: 2000, callback: spawnEnemy, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 10000, callback: spawnPowerUp, callbackScope: this, loop: true });

    // Collision handling
    this.physics.add.collider(enemies, platforms, enemyPatrol, null, this);
    this.physics.add.collider(player, enemies, playerHit, null, this);
    this.physics.add.collider(player, powerups, collectPowerUp, null, this);
    this.physics.add.overlap(bullets, enemies, destroyEnemy, null, this);
    this.physics.add.overlap(enemyBullets, player, enemyBulletHit, null, this);

    // HUD
    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#fff' });
    livesText = this.add.text(10, 40, 'Lives: 3', { fontSize: '20px', fill: '#fff' });
    gameOverText = this.add.text(400, 240, '', { fontSize: '32px', fill: '#ff0000' }).setOrigin(0.5);
    
    // Shooting
    this.input.keyboard.on('keydown-Z', () => shootBullet(this));
}

function update(time) {
    if (cursors.left.isDown) player.setVelocityX(-200);
    else if (cursors.right.isDown) player.setVelocityX(200);
    else player.setVelocityX(0);

    if (cursors.space.isDown && player.body.touching.down) player.setVelocityY(-400);
}

function shootBullet(scene) {
    if (scene.time.now > lastFired) {
        let bullet = bullets.create(player.x + 20, player.y, null);
        bullet.setDisplaySize(10, 10); // Make it a triangle shape
        bullet.setVelocityX(500);
        bullet.body.gravity.y = 100; // Reduced bullet gravity
        lastFired = scene.time.now + 300;
    }
}

function spawnEnemy() {
    let enemy = enemies.create(800, 400, 'enemy').setVelocityX(-100);
    enemy.setTint(0xff0000); // Red
    enemy.shootTimer = setInterval(() => enemyShoot(enemy), 2000); // Enemy fires every 2 seconds
}

function enemyShoot(enemy) {
    if (enemy.active) {
        let bullet = enemyBullets.create(enemy.x - 10, enemy.y, null);
        bullet.setDisplaySize(10, 10); // Triangle shape
        bullet.setTint(0xffaa00); // Yellow bullets
        bullet.setVelocityX(-300);
    }
}

function enemyPatrol(enemy, platform) {
    if (Math.random() > 0.5) {
        enemy.setVelocityY(-300);
    }
    enemy.setVelocityX(enemy.body.velocity.x * -1);
}

function spawnPowerUp() {
    let type = Math.random() < 0.5 ? 'powerup_health' : 'powerup_weapon';
    let powerup = powerups.create(800, 400, type).setVelocityX(-100);
    powerup.type = type;
}

function destroyEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    score += 10;
    scoreText.setText(`Score: ${score}`);
}

function playerHit(player, enemy) {
    enemy.destroy();
    lives--;
    livesText.setText(`Lives: ${lives}`);
    if (lives <= 0) endGame();
}

function enemyBulletHit(player, bullet) {
    bullet.destroy();
    lives--;
    livesText.setText(`Lives: ${lives}`);
    if (lives <= 0) endGame();
}

function collectPowerUp(player, powerup) {
    if (powerup.type === 'powerup_health') {
        lives = Math.min(3, lives + 1);
    } else if (powerup.type === 'powerup_weapon') {
        let weapons = ['spread', 'laser'];
        weaponType = weapons[Math.floor(Math.random() * weapons.length)];
        if (weaponType === "laser") specialAmmo = 5;
    }
    livesText.setText(`Lives: ${lives}`);
    powerup.destroy();
}

function endGame() {
    gameOverText.setText("GAME OVER\nPress R to Restart");
    this.input.keyboard.once('keydown-R', () => this.scene.restart());
}
