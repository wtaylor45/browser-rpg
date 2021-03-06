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
  constructor(id, name, sprite, x, y, width, height){
    super(id, name, Types.Entities.PLAYER, x, y, width, height);

    // Player movement variables
    this.speed = 10;

    // Variables for client-side prediction
    this.pending_inputs = []
    this.input_seq = 0;

    this.setSprite(new Sprite("player"));

    this.idle();

    this.abilities = [];
    //this.setAbility(0, Types.Abilities.FIREBALL);
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
    if(!this.canMove) return;

    var map = this.game.currentMap;
    this.x += vector.x*input.pressTime*this.speed;
    var collision = map.isColliding(map.nearestTilePositions(this));
    if(collision){
      if(collision == Types.Collisions.WALL){
        this.x = this.lastPos[0];
      }else{
        this.handleCollision(collision);
      }
    }

    this.y += vector.y*input.pressTime*this.speed;
    var collision = map.isColliding(map.nearestTilePositions(this));
    if(collision == Types.Collisions.WALL){
      this.y = this.lastPos[1];
    }else{
      this.handleCollision(collision);
    }

    if(this.lastPos[1] < this.y){
      this.setDirection(Types.Directions.UP)
    }
    else if(this.lastPos[1] > this.y){
      this.setDirection(Types.Directions.DOWN)
    }
    else if(this.lastPos[0] < this.x){
      this.setDirection(Types.Directions.LEFT)
    }
    else if(this.lastPos[0] > this.x){
      this.setDirection(Types.Directions.RIGHT)
    }
  }

  handleCollision(collision){
    switch(collision){
    }
  }

  onMove(message){
    this.setPos(message.x, message.y);
    this.setDirection(message.dir);
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
    this.lastMove = message.time;
  }

  setAbility(index, ability){
    this.abilities[index] = ability;
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

    var chat = Input.getState().enter;

    if(chat){
      this.game.enableChat();
    }

    if(Input.getState().hotkey1){
      this.fireAbility(0);
    }

    if(Input.getState().mouse){
      var mouse = this.game.screenToGameCoords(Input.getMouseCoords());
      var mouseX = mouse[0];
      var mouseY = mouse[1];

      var message = new Message(Types.Messages.ATTACK, {x: mouseX, y: mouseY});
      message.send();
    }
  }

  fireAbility(index){
    var ability = this.abilities[index];

    if(!ability) return;

    var message = new Message(Types.Messages.ABILITY, [ability, this.angle]);
    message.send();
  }

  setStats(stats){
    console.log(stats);
    // Health
    this.maxHealth = stats.maxHealth;
    this.currentHealth = stats.currentHealth;

    // Attack
    this.maxAttackPower = stats.maxAttackPower;
    this.currentAttackPower = stats.currentAttackPower;
  }
}
