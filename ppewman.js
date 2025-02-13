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

let player, cursors, bullets, enemies, platforms, powerups;
let lastFired = 0, lives = 3, weaponType = "normal", specialAmmo = 0, score = 0;
let scoreText, livesText;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'player.png'); // Replace with colored version
    this.load.image('enemy', 'enemy.png'); // Replace with colored version
    this.load.image('bullet', 'bullet.png');
    this.load.image('ground', 'ground.png');
    this.load.image('platform', 'platform.png');
    this.load.image('powerup_health', 'powerup_health.png');
    this.load.image('powerup_weapon', 'powerup_weapon.png');
}

function create() {
    this.add.rectangle(400, 240, 800, 480, 0x87CEEB); // Background color

    // Ground and platforms
    platforms = this.physics.add.staticGroup();
    platforms.create(400, 460, 'ground').setScale(2).refreshBody();
    platforms.create(600, 350, 'platform');
    platforms.create(200, 280, 'platform');

    // Player setup
    player = this.physics.add.sprite(100, 400, 'player').setCollideWorldBounds(true);
    player.setTint(0x00ff00); // Green player
    this.physics.add.collider(player, platforms);

    // Controls
    cursors = this.input.keyboard.createCursorKeys();

    // Groups
    bullets = this.physics.add.group();
    enemies = this.physics.add.group();
    powerups = this.physics.add.group();

    // Timers
    this.time.addEvent({ delay: 2000, callback: spawnEnemy, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 10000, callback: spawnPowerUp, callbackScope: this, loop: true });

    // Collision handling
    this.physics.add.collider(enemies, platforms);
    this.physics.add.collider(player, enemies, playerHit, null, this);
    this.physics.add.collider(player, powerups, collectPowerUp, null, this);
    this.physics.add.overlap(bullets, enemies, destroyEnemy, null, this);

    // Score & Lives HUD
    scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#fff' });
    livesText = this.add.text(10, 40, 'Lives: 3', { fontSize: '20px', fill: '#fff' });

    // Shooting
    this.input.keyboard.on('keydown-Z', () => shootBullet(this));
}

function update(time) {
    if (cursors.left.isDown) player.setVelocityX(-200);
    else if (cursors.right.isDown) player.setVelocityX(200);
    else player.setVelocityX(0);

    if (cursors.space.isDown && player.body.touching.down) player.setVelocityY(-300);
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
    enemy.setTint(0xff0000); // Red enemies
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
    if (lives <= 0) game.scene.scenes[0].scene.restart();
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
