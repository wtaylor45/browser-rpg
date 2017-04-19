/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Character = require('./character'),
    Message = require('./message');

/**
 * Player class, keeps track of player position, movement, etc.
 */
module.exports = Player = class Player extends Character{
  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(id, sprite, width, height){
    super(id, Types.Entities.PLAYER, width, height)

    // Player movement variables
    this.speed = 10;

    // Variables for client-side prediction
    this.pending_inputs = []
    this.input_seq = 0;

    this.setSprite(new Sprite("player"));

    this.idle();
  }

  setGame(game){
    this.game = game;
  }

  /**
   * Apply the given input to the character
   *
   * @param {Object} input  The input to be applied
   */
  applyInput(input){
    var map = this.game.currentMap;
    // Update the player x and y based on the movement vector
    this.x += input.vector.x*input.pressTime*this.speed;
    this.corners = map.nearestTilePositions(this);
    if(map.isColliding(this.corners)){
      this.x = this.lastPos[0];
    }
    this.y += input.vector.y*input.pressTime*this.speed;
    this.corners = map.nearestTilePositions(this);
    if(map.isColliding(this.corners)){
      this.y = this.lastPos[1];
    }
  }

  onMove(message){
    this.setPos(message.x, message.y);
    // Preform reconciliation
    var k = 0;
    while (k < this.pending_inputs.length){
      var input = this.pending_inputs[k];
      // Check if this input has already been processed client side
      if(input.seq <= message.lastProcessedInput){
        // This input has been processed by the server
        // Therefore there is no need to reapply it
        this.pending_inputs.splice(k,1);
      }
      else{
        // This input has not been processed by the server yet
        // Reapply it
        this.applyInput(input);
        k++;
      }
    }
  }

  /**
   * Update logic for the players
   *
   * @param {number} dt Delta time: time passed since last update
   */
  update(dt){
    // Check which commands were issued, package it
    var input;

    // The vector defining which direction we are moving in
    var movementVector = Input.getMovementVector();

    // The type of input
    var inputType;

    // If there is movement vector will not be [0,0]
    if(movementVector.x != 0 || movementVector.y != 0){
      input = {pressTime: dt/100, vector: movementVector}
    }

    if(input){
      // Send the input package to the server
      input.seq = this.input_seq++;

      var message = new Message(Types.Messages.MOVE, input);
      message.send();

      this.applyInput(input);

      // Save input to validated later
      this.pending_inputs.push(input);
    }
  }
}
