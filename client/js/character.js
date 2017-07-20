var Entity = require('./entity'),
    Types = require('../../shared/js/types');

var chatIconTimer;

module.exports = Character = class Character extends Entity{
  constructor(id, name, species, x,y, w, h){
    super(id, species, x, y, w, h);

    var self = this;

    this.direction = Types.Directions.DOWN;
    this.atkSpeed = 50;
    this.walkSpeed = 100;
    this.idleSpeed = 450;

    this.drawName = false;

    this.health = 0;
    this.maxHealth = 0;

    this.isDead = false;

    this.name = name;
    this.currentHealth = this.maxHealth = 100;
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

  getDirectionFromAngle(angle){
    if(angle >= 45 && angle < 135)
      return Types.Directions.DOWN;
    if(135 <= angle && angle < 225)
      return Types.Directions.LEFT;
    if(225 <= angle && angle < 315)
      return Types.Directions.UP;

    return Types.Directions.RIGHT;
  }

  updateMovement(){
    var lastPos = this.lastPos;

    if(lastPos[1] < this.y){
      this.walk(Types.Directions.DOWN);
      return;
    }
    if(lastPos[1] > this.y){
      this.walk(Types.Directions.UP);
      return;
    }
    if(lastPos[0] < this.x){
      this.walk(Types.Directions.RIGHT);
      return;
    }
    if(lastPos[0] > this.x){
      this.walk(Types.Directions.LEFT);
      return;
    }
    this.idle();
  }

  /**
   * Set the current health to the given value
   * @param  {number} health The value to set the current health to
   */
  updateHealth(health){
    this.currentHealth = health;
  }

  /**
   * Set the max health to the given value
   * @param  {number} health the int to set max health to
   */
  updateMaxHealth(health){
    this.maxHealth = health;
  }

  idle(){
    this.animate('idle', this.idleSpeed);
  }

  walk(direction){
    this.setDirection(direction);

    var self = this;
    this.animate('walk', this.walkSpeed, 0);
  }

  onChat(){
    if(this.chat) clearTimeout(chatIconTimer);
    this.chat = true;

    chatIconTimer = setTimeout(function(){
      this.chat = false;
    }.bind(this), 2000);
  }
}
