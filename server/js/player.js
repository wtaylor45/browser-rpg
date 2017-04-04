/**
 * @author Will Taylor
 * Contains all server-side information about the player
 */

module.exports = Player;

function Player(id){
  this.id = id;
  this.x = 0;
  this.y = 0;

  this.width = 32;
  this.height = 64;

  this.maxSpeed = 15;
  this.speed = 10;

  this.inputs = [];
  this.last_input = false;

  this.keyLeft = false;
  this.keyRight = false;
  this.keyUp = false;
  this.keyDown = false;

  this.queueInput = function(input){
    this.inputs.push(input);
  }

  this.applyInput = function(input){
    this.x += input.vector[0]*input.press_time*this.speed;
    this.y += input.vector[1]*input.press_time*this.speed;

    this.last_input = input.seq;
  }

  this.update = function(dt){
    var i = 0;
    while(i<this.inputs.length){
      this.applyInput(this.inputs[i]);
      this.inputs.splice(i,1)
    }
  }

  this.pack = function(){
    var send = {
      x: this.x,
      y: this.y,
      last_input: this.last_input,
      id: this.id,
      sprite: 1
    }

    return send;
  }
}
