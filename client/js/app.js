/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

 var Game = require('./game'),
     Player = require('./player'),
     Socket = require('./socket');

 var game;

module.exports = App = class App{
  constructor(){
    this.game = false;
    this.ready = false;

    this.setGame(new Game());

    Socket.on('connected', this.onConnected.bind(this));
  }

  setGame(game){
    this.game = game;
  }

  start(){
    if(!this.game.started && this.game.player){
      this.game.start();
    }
  }

  onConnected(id){
    this.game.setPlayer(new Player(id, 0));
    this.start();
  }
}
