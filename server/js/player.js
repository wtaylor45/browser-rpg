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

  this.currentSeq = -1;

  this.cmds = [];

  this.keyLeft = false;
  this.keyRight = false;
  this.keyUp = false;
  this.keyDown = false;

  this.queueCmd = function(input, state, seq){
    this.cmds.push({'input': input, 'state': state, 'seq': seq})
  }

  this.runCmd = function(){
    cmd = this.cmds[0];
    if(cmd){
      this.currentSeq = cmd.seq;

      var input = cmd.input;
      var state = cmd.state;

      if(input == 'up') this.keyUp = state;
      if(input == 'down') this.keyDown = state;
      if(input == 'left') this.keyLeft = state;
      if(input == 'right') this.keyRight = state;

      this.cmds.splice(0,1);
    }
  }

  this.update = function(dt){
    this.runCmd();

    if(this.keyUp){
      this.y -= this.speed * dt;
    }
    if(this.keyDown){
      this.y += this.speed * dt;
    }
    if(this.keyLeft){
      this.x -= this.speed * dt;
    }
    if(this.keyRight){
      this.x += this.speed * dt;
    }
  }

  this.pack = function(){
    var send = {
      x: this.x,
      y: this.y,
      seq: this.currentSeq,
      sprite: 0
    }

    return send;
  }
}
