class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player');
    this.sprite.setCollideWorldBounds(true);

    // WASD input
    this.keys = scene.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D
    });
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

    // Shooting
    if (mousePointer.isDown && time > lastFired) {
      Bullet.shoot(this.scene, this.sprite.x, this.sprite.y, angle, bullets);
      lastFired = time + 200; // Fire rate
    }
  }
}
