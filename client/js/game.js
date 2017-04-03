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

    this.player = -1;

    //
    this.states = new StateList(10);

    // This instance's camera
    //this.camera = new Camera();
  }

  /**
   * Start the game and its loop
   */
  start(){
    this.started = true;
    checkKeyDown(game);

    // ∆t variables
    var lastTime = new Date().getTime();
    var curTime, dt;

    // Keep track of state time
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
      if(iter % 2 == 0) self.render();

      iter++;
    }, 200);
  }

  /**
   * Set this games player (the client's player)
   *
   * @param {Object} player The player object that belongs to this client
   */
  setPlayer(player){
    this.player = player;
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  update(dt){
    if(this.serverStates.list.length > 0){
      var serverState = this.serverStates.list[0]
      var prediction = this.states.list[serverState.seq];
      if(prediction){
        if(serverState.seq == prediction.seq)
          prediction.validateAndApply(serverState);
      }
    }

    this.player.update(time, dt);
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

/**
 * Holds a list of at most n predicted states
 */
class StateList{
  /**
   * Creates a state list
   *
   * @param {number} size How many max states to hold
   */
  constructor(size){
    this.MAX_SIZE = size;

    this.size = 0;

    this.list = [];
  }

  /**
   * Adds a state to the end of the state list, removing the oldest state if
   * size of the list is > size
   *
   * @param {Object} state  The state to add
   * @return {number} The sequence number of the request
   */
  addState(state){
    state.seq = this.size-1;
    if(this.size < this.MAX_SIZE){
      this.list.push(state);
      this.size++;
    }
    else{
      this.list.splice(0,1);
      this.list.push(state);
    }

    return state.seq;
  }

  /**
   * Removes the oldest state in the list
   */
  removeOldest(){
    this.size--;
    this.list.splice(0,1);
  }
}

class State{
  constructor(x, y, t){
    this.x = x;
    this.y = y;
    this.t = t;
  }

  applyState(){
    game.player.setPos(this.x, this.y);
  }
}

/**
 * Keeps track of a game state to handle client-side prediction
 */
class PredictedState extends State{
  constructor(x, y, t){
    super(x, y, t);
    this.applyState();
  }

  /**
   * Validate the predicted state against the given server state and apply it
   *
   * @param {Object} serverState  The server state to validate against
   */
  validateAndApply(serverState){
    var serverX = serverState.x;
    var serverY = serverState.y;
    console.log(serverX, this.x)
    if(Math.abs(this.x - serverX) < 0.001 && Math.abs(this.y - serverY) < 0.001){
      // Apply this state
      this.applyState();
      console.log('Accepted state');
    }else{
      // Discard this state, apply server state.
      console.log('Rejecting state');
      serverState.applyState();
    }

    game.states.removeOldest();
    game.serverStates.removeOldest();
  }

  /**
   * Apply this predicted state to the player
   */
  applyState(){
    game.player.setPos(this.x, this.y);
  }
}

/**
 * Get state information from the server
 */
socket.on('update', function(mail){
  // Only accept mail if game is created
  if(game){
    // Start by getting ouy player's state
    var players = mail.players;
    var player = mail.players[game.player.id];

    if(player && player.seq >= 0)
      game.serverStates.addState(new State(player.x, player.y, player.seq));
  }
});
