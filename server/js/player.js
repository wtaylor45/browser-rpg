/**
 * @author Will Taylor
 * Contains all server-side information about the player
 */

function Player(id){
  this.id = id;
  this.x = 0;
  this.y = 0;

  this.width = 32;
  this.height = 64;

  this.maxSpeed = 20;
  this.speed = 0;

  this.checkMove = function(x, y){
    
  }
}
