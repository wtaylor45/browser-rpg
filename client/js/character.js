var Types = require('../../shared/js/types'),
    _ = require('underscore');

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
}
