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
    if(input.input == 'up' || input.input == 'down'){
      this.y += this.speed * input.press_time;
    }
    else if(input.input == 'left' || input.input == 'right'){
      this.x += this.speed * input.press_time;
    }

    this.last_input = input.seq;
    this.inputs.splice(0,1);
  }

  this.update = function(dt){
    if(this.inputs.length > 0)
      this.applyInput(this.inputs[0]);
  }

  this.pack = function(){
    var send = {
      x: this.x,
      y: this.y,
      last_input: this.last_input,
      sprite: 0
    }

    return send;
  }
}
