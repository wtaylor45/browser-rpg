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
  constructor(path){
    this.sprite = new Sprite(path)

    // The world coordinates of the player
    this.worldX = 0;
    this.worldY = 0;
  }

  update(){
    this.sprite.setScreenPosition(0, 0);
    this.sprite.draw();
  }
}
