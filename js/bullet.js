class Bullet {
  static shoot(scene, x, y, angle, bullets) {
    let bullet = bullets.get();

    if (bullet) {
      bullet.enableBody(true, x, y, true, true);

      // Set bullet velocity based on angle
      scene.physics.velocityFromRotation(angle, 500, bullet.body.velocity);

      // Rotate bullet to face its direction (adjusted by 90 degrees)
      bullet.rotation = angle + Math.PI / 2;

      // Ensure the bullet is destroyed when it goes out of bounds
      bullet.body.setCollideWorldBounds(true);
      bullet.body.onWorldBounds = true;

      // Listen for when bullets hit world bounds
      bullet.body.world.on('worldbounds', (body) => {
        if (body.gameObject === bullet) {
          bullet.disableBody(true, true); // Properly disable the bullet
        }
      });
    }
  }
}
