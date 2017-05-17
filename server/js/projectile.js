var Entity = require('./entity'),
    Message = require('./message');

module.exports = Projectile = class Projectile extends Entity{
  constructor(speed, w, h, range, angle, parent){
    super(-1, "projectile", Types.Entities.FIREBALL, parent.x, parent.y, w, h);
    this.range = range;
    this.angle = angle;
    this.parent = parent;
    this.map = parent.map;
    this.speed = 15;

    this.initX = this.x;
    this.initY = this.y;
  }

  update(dt){
    super.update(dt);

    this.x += this.speed*dt;
    this.y += this.speed*dt;

    if(this.distanceTraveled() > this.range){
      this.readyToKill = true;
    }
  }

  distanceTraveled(){
    return this.distanceTo(this.initX, this.initY);
  }
}

Projectile.Fireball = class Fireball extends Projectile{
  constructor(angle, parent){
    super(15, 16, 16, 500, angle, parent);
  }
}

Projectile.builder = {};

Projectile.builder[Types.Abilities.FIREBALL] = function(angle, parent){
  return new Projectile.Fireball(angle, parent);
}
