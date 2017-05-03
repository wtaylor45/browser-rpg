/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

 var Game = require('./game'),
     Player = require('./player'),
     Socket = require('./socket'),
     Message = require('./message');

 var game;

module.exports = App = class App{
  /**
   * Create the app that contains the game
   */
  constructor(){
    this.game = false;
    this.ready = false;

    Socket.on('connected', this.onConnected.bind(this));

    var username = document.getElementById('username');
    var login = document.getElementById('login-form');
    var loginDiv = document.getElementById('login');
    var game = document.getElementById('game-content')
    var self = this;

    login.onsubmit = function(e){
      e.preventDefault();

      loginDiv.style.display = 'none';
      game.className = "showing";

      self.signIn(username.value)
    }
  }

  /**
   * Set this app's game
   */
  setGame(game){
    this.game = game;
    this.ready = true;
  }

  signIn(username){
    Socket.emit('signin', username);
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
  onConnected(message){
    this.setGame(new Game());

    if(this.game){
      this.game.setPlayer(new Player(message.id, message.name, 0,
         message.x, message.y, message.width, message.height));
      this.start();
    }
  }
}
