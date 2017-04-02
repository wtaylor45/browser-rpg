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

  this.checkMove = function(x, y, dt){
    var threshold = this.maxSpeed * dt;
    if(Math.abs(this.x - x) < threshold+.01 && Math.abs(this.y - y) < threshold+0.1){
      this.x = x;
      this.y = y;
    }
  }

  this.pack = function(){
    var send = {
      x: this.x,
      y: this.y
    }

    return send;
  }
}
