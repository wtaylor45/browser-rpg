/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

 var Game = require('./game'),
     Player = require('./player'),
     Socket = require('./socket');

 var game;

module.exports = App = class App{
  /**
   * Create the app that contains the game
   */
  constructor(){
    this.game = false;
    this.ready = false;

    this.setGame(new Game());

    Socket.on('connected', this.onConnected.bind(this));
  }

  /**
   * Set this app's game
   */
  setGame(game){
    this.game = game;
    this.ready = true;
  }

  /**
   * Start the game
   */
  start(){
    if(this.ready && this.game.player){
      this.game.start();
    }
  }

  /**
   * When the server confirms the connection
   */
  onConnected(id){
    if(this.game){
      this.game.setPlayer(new Player(id, 0));
      this.start();
    }
  }
}
