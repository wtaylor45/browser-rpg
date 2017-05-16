

module.exports = Projectile = class Projectile extends Entity {
  constructor(id, x, y, species){
    super(id, species, x, y, 16, 16);
    console.log('Fireball made');
  }
}
