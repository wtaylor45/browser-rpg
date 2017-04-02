/**
 * @author Will Taylor
 * Created on: 4/2/17
 */
console.log('added')
/**
 * The client instance of the game
 */
class Game{
  constructor(){
    // Has the game started yet on the client side?
    this.started = false;

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

  /**
   * The logic to run every loop
   */
  update(){
    console.log('loopy');
  }
}
