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

    this.players = [];

    // This instance's camera
    //this.camera = new Camera();
  }

  /**
   * Start the game and its loop
   */
  start(){
    this.started = true;

    var self = this;
    setInterval(function(){
      self.update();
    }, 1000/60);
  }

  addPlayer(id, x, y){
    this.players[id] = new Player('client/assets/god.png')
  }

  /**
   * The logic to run every loop
   */
  update(){
    stage.removeAllChildren();

    // Updates go here
    for(var i in this.players){
      var player = this.players[i];
      player.update();
    }

    stage.update();
  }
}
