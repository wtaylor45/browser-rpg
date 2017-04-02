/**
 * @author Will Taylor
 * Created on: 4/2/17
 */

/**
 * Player class, keeps track of player position, movement, etc.
 */
class Player{
  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(path){
    this.sprite = new Sprite(path)

    // The world coordinates of the player
    this.worldX = 0;
    this.worldY = 0;

    // Player movement variables
    this.MAX_SPEED = 15;
    this.speed = 10;
  }

  update(dt){
    var lastX = this.worldX;
    var lastY = this.worldY;

    if(sprint) this.speed = this.MAX_SPEED;
    else this.speed = 10;

    if(up){
      this.worldY -= this.speed * dt;
    }
    else if(down){
      this.worldY += this.speed * dt;
    }
    if(left){
      this.worldX -= this.speed * dt;
    }
    else if(right){
      this.worldX += this.speed * dt;
    }

    this.sprite.setScreenPosition(this.worldX, this.worldY);
    this.sprite.draw();

    if(lastX != this.worldX || lastY != this.worldY){
      var message = new Message(Message.MessageType.MOVE, {x: this.worldX, y: this.worldY, dt: dt})
      message.send();
    }
  }
}

var up = false;
var down = false;
var left = false;
var right = false;
var sprint = false;

document.onkeydown = function(event){
    if(event.keyCode === 68)    //d
      right = true;
    else if(event.keyCode === 83)   //s
      down = true;
    else if(event.keyCode === 65) //a
      left = true;
    else if(event.keyCode === 87) // w
      up = true;
    else if(event.keyCode == 16)
      sprint = true;
}

document.onkeyup = function(event){
  if(event.keyCode === 68)    //d
    right = false;
  else if(event.keyCode === 83)   //s
    down = false;
  else if(event.keyCode === 65) //a
    left = false;
  else if(event.keyCode === 87) // w
    up = false;
  else if(event.keyCode == 16)
    sprint = false;
}
