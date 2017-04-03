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
  constructor(id, path){
    this.sprite = new Sprite(path)
    this.id = id;

    // The world coordinates of the player
    this.worldX = 0;
    this.worldY = 0;

    // Player movement variables
    this.MAX_SPEED = 15;
    this.speed = 10;

    this.controller = new CharacterController(this);
  }

  setPos(x, y){
    this.worldX = x;
    this.worldY = y;
  }

  /**
   * Update logic for the players
   *
   * @param {number} dt Delta time: time passed since last update
   */
  update(dt){
    /*if(sprint) this.speed = this.MAX_SPEED;
    else this.speed = 10;*/

    var command = this.controller.nextInput();

    if(command){
      // Check which command was issued
      switch(command){
        case 'up':
          // Create a new state, add it to the queue to be verified
          var state = new PredictedState(this.worldX, this.worldY, dt);
          game.states.addState(state);
          break;
        case 'down':
          break;
      }
    }
  }

  draw(){
    this.sprite.setScreenPosition(this.worldX, this.worldY);
    this.sprite.draw();
  }
}

class CharacterController{
  constructor(player){
    this.player = player;

    this.commandQueue = [];
  }

  nextInput(){
    return this.commandQueue.shift();
  }

  queueCommand(command){
    commandQueue.push(command);
  }
}

CharacterController.Commands = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right'
}

function checkKeyDown(game){
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
    var message = -1;

    if(event.keyCode === 68){    //d
      right = false;
      var seq = game.states.addState(new PredictedState(this.worldX, this.worldY));
      message = new Message(Message.MessageType.MOVE, {inputId:'right',state:false, seq})
    }
    else if(event.keyCode === 83){   //s
      down = false;
      var seq = game.states.addState(new PredictedState(this.worldX, this.worldY));
      message = new Message(Message.MessageType.MOVE, {inputId:'down',state:false, seq})
    }
    else if(event.keyCode === 65){ //a
      left = false;
      var seq = game.states.addState(new PredictedState(this.worldX, this.worldY));
      message = new Message(Message.MessageType.MOVE, {inputId:'left',state:false, seq})
    }
    else if(event.keyCode === 87){ // w
      up = false;
      var seq = game.states.addState(new PredictedState(this.worldX, this.worldY));
      message = new Message(Message.MessageType.MOVE, {inputId:'down',state:false, seq})
    }
    else if(event.keyCode == 16){
      sprint = false;
      var seq = game.states.addState(new PredictedState(this.worldX, this.worldY));
      message = new Message(Message.MessageType.MOVE, {inputId:'shift',state:false, seq})
    }

    if(message) message.send();
  }
}
