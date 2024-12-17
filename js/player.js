// player.js
class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);

    // Health but no text yet - we'll let the UI manager handle that
    this.health = 4;

    // WASD input
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D
    });

    // Mouse input
    this.scene.input.on('pointerdown', () => {
      this.shootBullet();
    });

    // Store reference to player in sprite for easier access
    this.sprite.player = this;
  }

  initHealthText() {
    // Clean up any existing health text first
    if (this.healthText) {
      this.healthText.destroy();
    }
    // Create new health text
    this.healthText = this.scene.add.text(this.sprite.x, this.sprite.y - 25, this.health, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5, 0.5);
  }

  update(time, mousePointer, bullets, lastFired) {
    // Movement logic
    const velocity = 200;
    this.sprite.setVelocity(0);

    if (this.keys.W.isDown) this.sprite.setVelocityY(-velocity);
    if (this.keys.S.isDown) this.sprite.setVelocityY(velocity);
    if (this.keys.A.isDown) this.sprite.setVelocityX(-velocity);
    if (this.keys.D.isDown) this.sprite.setVelocityX(velocity);

    // Rotate player to face mouse (adjust by 90 degrees clockwise)
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, mousePointer.worldX, mousePointer.worldY
    );
    this.sprite.rotation = angle + Math.PI / 2;
  }

  shootBullet() {
    const angle = Phaser.Math.Angle.Between(
      this.sprite.x, this.sprite.y, mousePointer.worldX, mousePointer.worldY
    );
    Bullet.shoot(this.scene, this.sprite.x, this.sprite.y, angle, bullets);
  }

  destroy() {
    // Clean up health text
    if (this.healthText) {
      this.healthText.destroy();
      this.healthText = null;
    }
    // Clean up sprite
    if (this.sprite) {
      this.sprite.destroy();
      this.sprite = null;
    }
    // Clean up key bindings
    if (this.keys) {
      this.scene.input.keyboard.removeKey(this.keys.W);
      this.scene.input.keyboard.removeKey(this.keys.A);
      this.scene.input.keyboard.removeKey(this.keys.S);
      this.scene.input.keyboard.removeKey(this.keys.D);
      this.keys = null;
    }
  }
}