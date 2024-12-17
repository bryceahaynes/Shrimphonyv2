// main.js
const config = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  }
};

let player;
let bullets;
let mousePointer;
let lastFired = 0;
let hitCooldown = 0; // Prevent immediate consecutive hits
let enemySpawnDelay = 2000; // Initial delay between enemy spawns
let elapsedGameTime = 0; // Track elapsed game time
let spawnMultiplier = 1; // Controls the number of enemies spawning
let currency = 0; // Tracks the overall currency
let currencyText; // Display text for currency
let door; // Door object to transition to a new scene
let isBlankRoomOpen = false; // Tracks if the blank room tab is open
let blankRoomWindow = null; // Stores reference to the blank room window

const game = new Phaser.Game(config);

function preload() {
  // Load assets
  this.load.image('player', 'assets/player.png'); // Local player image
  this.load.image('bullet', 'assets/bullet.png'); // Local bullet image
  this.load.image('enemy', 'assets/enemy.png');   // Local enemy image
  this.load.image('door', 'assets/door.png');     // Door image for transitions
}

function create() {
  // Initialize player
  player = new Player(this, window.innerWidth / 2, window.innerHeight / 2);

  // Create bullets group
  bullets = this.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 50, // Allow multiple bullets
    runChildUpdate: true,
    allowGravity: false,
    collideWorldBounds: true
  });

  // Attach enemies group to the scene
  this.enemies = this.physics.add.group();

  // Spawn enemies
  spawnEnemies(this);

  // Mouse input
  mousePointer = this.input.activePointer;

  // Display currency text
  currencyText = this.add.text(16, 16, 'Currency: 0', {
    fontSize: '20px',
    fill: '#ffffff'
  });

  // Add door to the scene
  door = this.physics.add.sprite(100, 100, 'door').setInteractive();
  this.add.text(80, 140, 'Go through the door', { fontSize: '16px', fill: '#ffffff' });

  // Player-door interaction to open new tab with a new room
  this.physics.add.overlap(player.sprite, door, () => {
    if (!isBlankRoomOpen) {
      const query = `?currency=${currency}`;
      blankRoomWindow = window.open('room.html' + query, '_blank');
      isBlankRoomOpen = true;

      // Block the main scene while the room tab is open
      this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Return to the blank room tab!', {
        fontSize: '24px',
        fill: '#ff0000'
      }).setOrigin(0.5);

      // Stop enemy spawning and clear existing enemies
      this.time.removeAllEvents();
      this.enemies.clear(true, true);
    }
  });

  // Collision between bullets and enemies
  this.physics.add.collider(bullets, this.enemies, (bullet, enemySprite) => {
    const enemy = enemySprite.enemy; // Access enemy instance
    if (enemy && enemy.health > 0) {
      bullet.disableBody(true, true); // Remove bullet
      enemy.health -= 1; // Reduce enemy health (3 bullets to kill)

      // Add currency for hitting an enemy
      currency += 10;
      currencyText.setText(`Currency: ${currency}`);

      if (enemy.healthText) {
        enemy.healthText.setText(enemy.health); // Update UI health number
      }
      if (enemy.health <= 0) {
        enemy.destroy(); // Properly remove enemy and UI
      }
    }
  });

  // Collision between player and enemies
  this.physics.add.collider(player.sprite, this.enemies, (playerSprite, enemySprite) => {
    const enemy = enemySprite.enemy; // Access enemy instance
    if (hitCooldown <= 0 && player.health > 0) {
      player.health -= 1; // Deduct 1 from player health
      player.healthText.setText(player.health); // Update UI number
      hitCooldown = 2000; // 2 seconds cooldown
      if (player.health <= 0) {
        player.healthText.destroy();
        player.sprite.disableBody(true, true); // Remove player
        console.log('Game Over!');
      }
    }
  });
}

function update(time, delta) {
  // Block input if the blank room is open
  if (isBlankRoomOpen) {
    if (!blankRoomWindow || blankRoomWindow.closed) {
      isBlankRoomOpen = false;
      blankRoomWindow = null;

      // Wipe enemies and reposition the player in the center
      this.enemies.clear(true, true);
      player.sprite.setPosition(window.innerWidth / 2, window.innerHeight / 2);
      spawnEnemies(this); // Restart enemy spawning
    } else {
      return; // Pause main scene updates while room is open
    }
  }

  // Update the player
  player.update(time, mousePointer, bullets, lastFired);

  // Track elapsed game time to adjust enemy spawn rate
  elapsedGameTime += delta;
  if (elapsedGameTime >= 5000) { // Every 5 seconds, increase spawn rate
    elapsedGameTime = 0;
    enemySpawnDelay = Math.max(200, enemySpawnDelay - 200); // Reduce delay
    spawnMultiplier += 0.5; // Increase the number of enemies spawned
  }

  // Update enemies to face the player and move towards them
  this.enemies.children.iterate((enemySprite) => {
    const enemy = enemySprite.enemy; // Access enemy instance
    if (enemy && enemy.health > 0) {
      const angle = Phaser.Math.Angle.Between(enemy.sprite.x, enemy.sprite.y, player.sprite.x, player.sprite.y);
      enemy.sprite.rotation = angle + Math.PI / 2; // Face the player
      this.physics.moveToObject(enemy.sprite, player.sprite, 100); // Move towards the player

      // Update health text position
      if (enemy.healthText) {
        enemy.healthText.setPosition(enemy.sprite.x, enemy.sprite.y - 25);
      }
    }
  });

  // Update player health text position
  player.healthText.setPosition(player.sprite.x, player.sprite.y - 25);

  // Decrease cooldown timer
  if (hitCooldown > 0) hitCooldown -= delta;
}

function spawnEnemies(scene) {
  // Adjust enemy spawn logic to spawn on the edges
  scene.time.addEvent({
    delay: enemySpawnDelay,
    callback: () => {
      for (let i = 0; i < spawnMultiplier; i++) { // Scale enemy count
        const edge = Phaser.Math.Between(1, 4); // Random edge selection
        let x, y;

        // Determine spawn position based on edge
        switch (edge) {
          case 1: // Top edge
            x = Phaser.Math.Between(0, window.innerWidth);
            y = -50;
            break;
          case 2: // Bottom edge
            x = Phaser.Math.Between(0, window.innerWidth);
            y = window.innerHeight + 50;
            break;
          case 3: // Left edge
            x = -50;
            y = Phaser.Math.Between(0, window.innerHeight);
            break;
          case 4: // Right edge
            x = window.innerWidth + 50;
            y = Phaser.Math.Between(0, window.innerHeight);
            break;
        }

        const enemy = new Enemy(scene, x, y);
        scene.enemies.add(enemy.sprite); // Add enemy sprite to group

        // Make enemy "walk onto" the screen
        scene.physics.moveTo(enemy.sprite, player.sprite.x, player.sprite.y, 100); // Move towards player
      }
    },
    loop: true
  });
}