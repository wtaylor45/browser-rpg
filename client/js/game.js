/**
 * @author Will Taylor
 * Created on: 4/2/17
 */

var stage = new createjs.Stage('canvas');

/**
 * The client instance of the game
 *
 * Handles the stage as well
 */
class Game{
  constructor(){
    // Has the game started yet on the client side?
    this.started = false;

    // Who is the client's player?
    this.player = false;

    // Recieve messages from server to be processed here
    this.mailbox = [];

    this.FPS = 60;
  }

  /**
   * Start the game and its loop
   */
  start(){
    // Make sure there is a player
    if(!this.player) return false;

    this.started = true;
    Game.keyHandler(this);

    // ∆t variables
    var lastTime = new Date().getTime();
    var curTime, dt;

    // Keep track of loop iteration
    var iter = 0;

    var self = this;
    setInterval(function(){
      // ∆t calculation
      curTime = new Date().getTime();
      dt = (curTime - lastTime)/100;
      lastTime = curTime;

      // Update every loop
      self.update(dt);

      // Render every other
      self.render();

      iter++;
    }, 1000/this.FPS);
  }

  /**
   * Set this games player (the client's player)
   *
   * @param {Object} player The player object that belongs to this client
   */
  setPlayer(player){
    this.player = player;
  }

  readServerMessages(){
    // Read every message one at a time
    for(var i in this.mailbox){
      var mail = this.mailbox[i];

      // First, go through each player
      for(var j in mail.players){
        var server_player = mail.players[j];

        // Check if the player is this client's player
        if(server_player.id == game.player.id){
          // Update the player's position to where they are according to server
          // This is in essence a correction
          game.player.setPos(server_player.x, server_player.y);
          console.log('Player pos set')
          // Preform reconciliation
          for(var k in game.player.pending_inputs){
            var input = game.player.pending_inputs[i];

            // Check if this input has already been processed client side
            if(input.seq <= server_player.last_input){
              // This input has been processed by the server
              // Therefore there is no need to reapply it
              game.player.pending_inputs.splice(k,1);
            }
            else{
              // This input has not been processed by the server yet
              // Reapply it
              game.player.applyInput(input);
            }
          }
        }
        else{
          // TODO: Update other entities
        }
      }

      // Remove mail
      this.mailbox.splice(i,1);
    }
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  update(dt){
    this.readServerMessages();
    this.player.update(dt);
  }

  render(){
    stage.removeAllChildren();

    this.player.draw();

    stage.update();
  }

  draw(x, y, sprite){
    var bitmap = Sprite.getPlayerSprite(sprite)
    bitmap.x = x;
    bitmap.y = y;
    stage.addChild(bitmap)
  }
}

// Input handling
var up = down = left = right = false;

Game.keyHandler = function(game){
  document.onkeydown = function(event){
    if(event.keyCode === 68){    //d
      right = true;
    }
    else if(event.keyCode === 83){   //s
      down = true;
    }
    else if(event.keyCode === 65){ //a
      left = true;
    }
    else if(event.keyCode === 87){ // w
      up = true;
    }
    else if(event.keyCode == 16){
      sprint = true;
    }
  }

  document.onkeyup = function(event){
    if(event.keyCode === 68){    //d
      right = false;
    }
    else if(event.keyCode === 83){   //s
      down = false;
    }
    else if(event.keyCode === 65){ //a
      left = false;
    }
    else if(event.keyCode === 87){ // w
      up = false;
    }
    else if(event.keyCode == 16){
      sprint = false;
    }
  }
}

/**
 * Get updates information from the server
 */
socket.on('update', function(mail){
  // Only accept mail if game is created
  game.mailbox.push(mail);
});
