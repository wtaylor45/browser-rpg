var Entity = require('./entity'),
    Types = require('../../shared/js/types');

module.exports = Character = class Character extends Entity{
  constructor(id, species){
    super(id, species);

    var self = this;

    this.direction = Types.Directions.DOWN;
    this.atkSpeed = 50;
    this.walkSpeed = 100;
    this.idleSpeed = 450;

    this.health = 0;
    this.maxHealth = 0;

    this.isDead = false;
  }

  animate(animation, speed, count, onEnd){
    if(this.currentAnimation && this.currentAnimation.name == "die"){
      return;
    }
    this.setAnimation(animation, speed, count, onEnd);
  }

  setDirection(dir){
    this.direction = dir;
  }

  updateMovement(){
    var lastPos = this.lastPos;

    if(lastPos[0] > this.x) this.walk(Types.Directions.RIGHT);
    if(lastPos[0] < this.x) this.walk(Types.Directions.LEFT);
    if(lastPos[1] > this.y) this.walk(Types.Directions.DOWN);
    if(lastPos[1] < this.y) this.walk(Types.Directions.UP);
  }

  idle(){
    this.hasMoved = false;
    this.animate('idle', this.idleSpeed);
  }

  walk(direction){
    this.setDirection(direction);
    this.hasMoved = true;

    var self = this;
    this.animate('walk', this.walkSpeed, 1, function(){
      self.idle();
    });
  }
}
