/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

/**
 * Player class, keeps track of player position, movement, etc.
 */
class Player{
  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(id, path){
    this.sprite = new Sprite(path)
    this.id = id;

    // The world coordinates of the player
    this.worldX = 0;
    this.worldY = 0;

    // Player movement variables
    this.MAX_SPEED = 15;
    this.speed = 10;

    // Variables for client-side prediction
    this.pending_inputs = []
    this.input_seq = 0;
  }

  setPos(x, y){
    this.worldX = x;
    this.worldY = y;
  }

  applyInput(input){
    var x = this.worldX;
    var y = this.worldY;

    if(input.input == 'up' || input.input == 'down'){
      y += this.speed * input.press_time;
    }
    else if(input.input == 'left' || input.input == 'right'){
      x += this.speed * input.press_time;
    }

    this.setPos(x, y);
  }

  /**
   * Update logic for the players
   *
   * @param {number} dt Delta time: time passed since last update
   */
  update(dt){
    // Check which commands were issued, package it
    if(up){
      var input = {press_time: -dt, input: 'up'}
      this.packInputAndSend(input);
    }
    else if(down){
      var input = {press_time: dt, input: 'down'}
      this.packInputAndSend(input);
    }
    if(left){
      var input = {press_time: -dt, input: 'left'}
      this.packInputAndSend(input);
    }
    else if(right){
      var input = {press_time: dt, input: 'right'}
      this.packInputAndSend(input);
    }
  }

  /**
   * Marks a given input package with a sequence number and sends it to server.
   * Also will apply and queue the input as a pending input
   *
   * @param {Object} input  The input to package, send, and apply
   */
  packInputAndSend(input){
    // Send the input package to the server
    input.seq = this.input_seq++;
    var message = new Message(Message.MessageType.MOVE, input)
    message.send();

    // Apply the package to the client now
    this.applyInput(input);

    // Save input to validated later
    this.pending_inputs.push(input);
  }

  draw(){
    this.sprite.setScreenPosition(this.worldX, this.worldY);
    this.sprite.draw();
  }
}
