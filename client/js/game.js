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

    this.player = false;

    // This instance's camera
    //this.camera = new Camera();
  }

  /**
   * Start the game and its loop
   */
  start(){
    this.started = true;

    // ∆t variables
    var lastTime = new Date().getTime();
    var curTime, dt;

    var self = this;
    setInterval(function(){
      // ∆t calculation
      curTime = new Date().getTime();
      dt = (curTime - lastTime)/100;
      lastTime = curTime;
      
      self.update(dt);
    }, 1000/60);
  }

  setPlayer(player){
    this.player = player;
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  update(dt){
    stage.removeAllChildren();

    // Updates go here
    if(this.player){
      this.player.update(dt);
    }

    stage.update();
  }
}
