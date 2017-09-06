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

    this.isDead = false;

    this.name = name;

    this.maxHealth = 100;
    this.currentHealth = 76;

    this.lastDamaged = 0;

    this.targetBox = [x, y, x+w, y+h];

    this.positionBuffer = [];
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

    var timestamp = +new Date()-(1000/60);

    while(this.positionBuffer.length >= 2 && this.positionBuffer[1][0] <= timestamp){
      this.positionBuffer.shift();
    }

    if(this.positionBuffer.length >= 2 && this.positionBuffer[0][0] <= timestamp && timestamp <= this.positionBuffer[1][0]){
      var x0 = this.positionBuffer[0][1];
      var x1 = this.positionBuffer[1][1];   
      var y0 = this.positionBuffer[0][2];
      var y1 = this.positionBuffer[1][2];    
      var t0 = this.positionBuffer[0][0];
      var t1 = this.positionBuffer[1][0];  

      this.x = x0 + (x1 - x0) * (timestamp - t0) / (t1 - t0);
      this.y = y0 + (y1 - y0) * (timestamp - t0) / (t1 - t0);
    }

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
    if(this.currentHealth > health){
      this.lastDamaged = Date.now();
    }
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

  setStats(stats){
    this.currentHealth = stats.currentHealth;
    this.maxHealth = stats.maxHealth;

    this.currentAttackPower = stats.currentAttackPower;
    this.maxAttackPower = stats.maxAttackPower;
  }

  addToPositionBuffer(x, y){
    this.positionBuffer.push([Date.now(), x, y]);
  }
}
