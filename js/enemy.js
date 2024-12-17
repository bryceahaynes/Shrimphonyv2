// enemy.js
class Enemy {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'enemy');
    this.sprite.setCollideWorldBounds(true);

    // Health and health text
    this.health = 3;
    this.healthText = scene.add.text(x, y - 25, this.health, {
      fontSize: '16px',
      color: '#ff0000',
      align: 'center'
    }).setOrigin(0.5, 0.5);
    this.sprite.enemy = this; // Attach to sprite for easier access
  }

  destroy() {
    if (this.healthText) this.healthText.destroy();
    if (this.sprite) this.sprite.destroy();
  }
}