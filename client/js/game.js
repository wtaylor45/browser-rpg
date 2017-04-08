/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Input = require('./input'),
    Stage = require('./stage'),
    Types = require('../../shared/js/types'),
    Socket = require('./socket');

/**
 * The client instance of the game
 *
 * Handles the stage as well
 */
module.exports = Game = class Game{
  constructor(){
    var self = this;
    // Has the game started yet on the client side?
    this.started = false;

    Stage.init();

    // Who is the client's player?
    this.player = false;

    // Recieve messages from server to be processed here
    this.mailbox = [];

    // List of all entities to be drawn
    this.entities = {}

    this.FPS = 60;

    new Socket.on('message', function(message){
      self.mailbox.push(message);
    });
  }

  /**
   * Start the game and its loop
   */
  start(){
    // Make sure there is a player
    if(!this.player) return false;

    this.started = true;
    this.render();

    Input.init();

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

  readServerMessages(dt){
    // Read every message one at a time
    for(var i=0;i<this.mailbox.length;i++){
      var message = this.mailbox[i];
      if(message.type == Types.Messages.MOVE){
        if(message.id == this.player.id){
          this.player.setPos(message.x, message.y);
          // Preform reconciliation
          var k = 0;
          while (k < this.player.pending_inputs.length){
            var input = this.player.pending_inputs[k];
            // Check if this input has already been processed client side
            if(input.seq <= message.lastProcessedInput){
              // This input has been processed by the server
              // Therefore there is no need to reapply it
              this.player.pending_inputs.splice(k,1);
            }
            else{
              // This input has not been processed by the server yet
              // Reapply it
              this.player.applyInput(input);
              k++;
            }
          }
        }
      }
      this.mailbox.splice(i,1);
    }
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  update(dt){
    this.readServerMessages(dt);
    this.player.update(dt);

    var info = "Non-acknowledged inputs: " + this.player.pending_inputs.length;
    player_status.textContent = info;
  }

  render(){
    Stage.removeAllChildren();

    var circle = new createjs.Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = this.player.x+100;
    circle.y = this.player.y;
    Stage.addChild(circle);

    Stage.update();

    window.requestAnimationFrame(this.render.bind(this));
  }

  draw(x, y, sprite){
    var g = new createjs.Graphics();

    stage.addChild(bitmap)
  }
}
/*
// Input handling
var up = down = left = right = false;
var attack1 = false;
var allowed = true;

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
    else if(event.keyCode == 49){
      if(!allowed) return;
      attack1 = true;
      allowed = false;
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
    else if(event.keyCode == 49){
      // TODO: Make cool down dependant in actor class
      attack1 = false;
      allowed = true;
    }
  }
}
*/
/**
 * Get updates information from the server

socket.on('update', function(mail){
  // Only accept mail if game is created
  game.mailbox.push(mail);
});
*/
