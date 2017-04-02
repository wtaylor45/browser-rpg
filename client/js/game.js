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

    this.mail = {};

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
    stage.removeAllChildren();

    // Updates go here
    if(this.player){
      this.player.update(dt);
    }

    for(var i in this.mail){
      var pack = this.mail[i];
      switch(pack.type){
        case 'p':
          if(pack.data.id != this.player.id)
            this.draw(pack.data.x, pack.data.y, pack.data.sprite);
      }
    }

    stage.update();
  }

  draw(x, y, sprite){
    var bitmap = Sprite.getPlayerSprite(sprite)
    bitmap.x = x;
    bitmap.y = y;
    stage.addChild(bitmap)
  }
}
