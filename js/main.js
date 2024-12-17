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
let hitCooldown = 0;
let enemySpawnDelay = 2000;
let elapsedGameTime = 0;
let spawnMultiplier = 1;
let currency = 0;
let currencyText;
let door;
let isBlankRoomOpen = false;
let blankRoomWindow = null;

const game = new Phaser.Game(config);

function cleanupUI() {
  // Clean up currency text
  if (currencyText) currencyText.destroy();
  
  // Clean up all enemy health numbers
  if (this.enemies) {
    this.enemies.children.iterate((enemySprite) => {
      if (enemySprite.enemy && enemySprite.enemy.healthText) {
        enemySprite.enemy.healthText.destroy();
      }
    });
  }
  
  // Clean up player health text
  if (player && player.healthText) {
    player.healthText.destroy();
  }

  // Clean up warning text if it exists
  if (this.warningText) {
    this.warningText.destroy();
  }
}

function initializeUI() {
  // Initialize currency text
  currencyText = this.add.text(16, 16, `Currency: ${currency}`, {
    fontSize: '20px',
    fill: '#ffffff'
  });

  // Initialize player health text
  if (player) {
    player.initHealthText();
  }
}

function preload() {
  this.load.image('player', 'assets/player.png');
  this.load.image('bullet', 'assets/bullet.png');
  this.load.image('enemy', 'assets/enemy.png');
  this.load.image('door', 'assets/door.png');
}

function create() {
  // Get initial currency from URL if present
  const params = new URLSearchParams(window.location.search);
  currency = parseInt(params.get('currency')) || 0;

  // Initialize player
  player = new Player(this, window.innerWidth / 2, window.innerHeight / 2);

  // Create bullets group
  bullets = this.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 50,
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

  // Initialize UI
  initializeUI.call(this);

  // Add door to the scene
  door = this.physics.add.sprite(100, 100, 'door').setInteractive();
  this.add.text(80, 140, 'Go through the door', { fontSize: '16px', fill: '#ffffff' });

  // Player-door interaction to open new tab with a new room
  this.physics.add.overlap(player.sprite, door, () => {
    if (!isBlankRoomOpen) {
      const query = `?currency=${currency}`;
      blankRoomWindow = window.open('room.html' + query, '_blank');
      isBlankRoomOpen = true;

      // Clean up UI
      cleanupUI.call(this);

      // Stop enemy spawning and clear existing enemies
      this.time.removeAllEvents();
      this.enemies.clear(true, true);

      // Add warning text
      this.warningText = this.add.text(window.innerWidth / 2, window.innerHeight / 2, 'Return to the blank room tab!', {
        fontSize: '24px',
        fill: '#ff0000'
      }).setOrigin(0.5);

      // Check for updates from blank room
      const checkBlankRoom = () => {
        if (blankRoomWindow && !blankRoomWindow.closed) {
          setTimeout(checkBlankRoom, 500);
        } else {
          isBlankRoomOpen = false;
          blankRoomWindow = null;

          // Clean up and reinitialize UI
          cleanupUI.call(this);
          
          // Get updated currency from URL if present
          const returnParams = new URLSearchParams(window.location.search);
          const returnedCurrency = parseInt(returnParams.get('currency'));
          if (!isNaN(returnedCurrency)) {
            currency = returnedCurrency;
          }

          // Reset player position and reinitialize UI
          player.sprite.setPosition(window.innerWidth / 2, window.innerHeight / 2);
          initializeUI.call(this);
          
          // Restart enemy spawning
          spawnEnemies(this);
        }
      };
      checkBlankRoom();
    }
  });

  // Collision between bullets and enemies
  this.physics.add.collider(bullets, this.enemies, (bullet, enemySprite) => {
    const enemy = enemySprite.enemy;
    if (enemy && enemy.health > 0) {
      bullet.disableBody(true, true);
      enemy.health -= 1;

      currency += 10;
      currencyText.setText(`Currency: ${currency}`);

      if (enemy.healthText) {
        enemy.healthText.setText(enemy.health);
      }
      if (enemy.health <= 0) {
        enemy.destroy();
      }
    }
  });

  // Collision between player and enemies
  this.physics.add.collider(player.sprite, this.enemies, (playerSprite, enemySprite) => {
    const enemy = enemySprite.enemy;
    if (hitCooldown <= 0 && player.health > 0) {
      player.health -= 1;
      player.healthText.setText(player.health);
      hitCooldown = 2000;
      if (player.health <= 0) {
        player.healthText.destroy();
        player.sprite.disableBody(true, true);
        console.log('Game Over!');
      }
    }
  });
}

function update(time, delta) {
  if (isBlankRoomOpen) {
    if (!blankRoomWindow || blankRoomWindow.closed) {
      isBlankRoomOpen = false;
      blankRoomWindow = null;

      // Wipe enemies and reposition the player in the center
      this.enemies.clear(true, true);
      player.sprite.setPosition(window.innerWidth / 2, window.innerHeight / 2);
      spawnEnemies(this);
    } else {
      return;
    }
  }

  // Update the player
  player.update(time, mousePointer, bullets, lastFired);

  // Track elapsed game time to adjust enemy spawn rate
  elapsedGameTime += delta;
  if (elapsedGameTime >= 5000) {
    elapsedGameTime = 0;
    enemySpawnDelay = Math.max(200, enemySpawnDelay - 200);
    spawnMultiplier += 0.5;
  }

  // Update enemies to face the player and move towards them
  this.enemies.children.iterate((enemySprite) => {
    const enemy = enemySprite.enemy;
    if (enemy && enemy.health > 0) {
      const angle = Phaser.Math.Angle.Between(
        enemy.sprite.x, enemy.sprite.y,
        player.sprite.x, player.sprite.y
      );
      enemy.sprite.rotation = angle + Math.PI / 2;
      this.physics.moveToObject(enemy.sprite, player.sprite, 100);

      if (enemy.healthText) {
        enemy.healthText.setPosition(enemy.sprite.x, enemy.sprite.y - 25);
      }
    }
  });

  // Update player health text position
  if (player && player.healthText) {
    player.healthText.setPosition(player.sprite.x, player.sprite.y - 25);
  }

  // Decrease cooldown timer
  if (hitCooldown > 0) hitCooldown -= delta;
}

function spawnEnemies(scene) {
  scene.time.addEvent({
    delay: enemySpawnDelay,
    callback: () => {
      for (let i = 0; i < spawnMultiplier; i++) {
        const edge = Phaser.Math.Between(1, 4);
        let x, y;

        switch (edge) {
          case 1: // Top
            x = Phaser.Math.Between(0, window.innerWidth);
            y = -50;
            break;
          case 2: // Bottom
            x = Phaser.Math.Between(0, window.innerWidth);
            y = window.innerHeight + 50;
            break;
          case 3: // Left
            x = -50;
            y = Phaser.Math.Between(0, window.innerHeight);
            break;
          case 4: // Right
            x = window.innerWidth + 50;
            y = Phaser.Math.Between(0, window.innerHeight);
            break;
        }

        const enemy = new Enemy(scene, x, y);
        scene.enemies.add(enemy.sprite);
        scene.physics.moveTo(enemy.sprite, player.sprite.x, player.sprite.y, 100);
      }
    },
    loop: true
  });
}