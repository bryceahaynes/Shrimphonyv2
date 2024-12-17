const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
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

const game = new Phaser.Game(config);

function preload() {
  // Load assets
  this.load.image('player', 'assets/player.png'); // Local player image
  this.load.image('bullet', 'assets/bullet.png'); // Local bullet image
  this.load.image('enemy', 'assets/enemy.png');   // Local enemy image
}

function create() {
  // Initialize player
  player = new Player(this, 400, 300);

  // Create bullets group with bullet reusability
  bullets = this.physics.add.group({
    defaultKey: 'bullet',
    maxSize: 50, // Max bullets allowed
    runChildUpdate: true // Allow bullet updates
  });

  // Attach enemies group to the scene
  this.enemies = this.physics.add.group();

  // Spawn enemies
  spawnEnemies(this);

  // Mouse input
  mousePointer = this.input.activePointer;

  // Collision between bullets and enemies
  this.physics.add.collider(bullets, this.enemies, (bullet, enemy) => {
    bullet.disableBody(true, true); // Remove bullet
    enemy.disableBody(true, true); // Remove enemy
  });
}


function update(time) {
  // Update the player
  player.update(time, mousePointer, bullets, lastFired);

  // Update enemies to face the player and move towards them
  this.enemies.children.iterate((enemy) => {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.sprite.x, player.sprite.y);
    enemy.rotation = angle + Math.PI / 2; // Face the player
    this.physics.moveToObject(enemy, player.sprite, 100); // Move towards the player
  });
}

function spawnEnemies(scene) {
  // Spawn enemies at intervals
  scene.time.addEvent({
    delay: 2000,
    callback: () => {
      const enemy = new Enemy(scene, Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600));
      scene.enemies.add(enemy.sprite); // Add enemy sprite to group
    },
    loop: true
  });
}
