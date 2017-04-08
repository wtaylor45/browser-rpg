/**
 * @author  Will Taylor
 * Game Server that handles all the game logic, distributing messages from client, etc.
 */

// Set up the Database
var mongojs = require('mongojs');
var db = mongojs('browserpg', ['account', 'counters']);

// Require needed node modules
var _ = require('underscore');
var Mailman = require('./mailman.js');
var Entity = require('./entity')
var Player = require('./player.js');

// Export the GameServer module
module.exports = GameServer;

/**
 * Game server that handles all the game logic, distributing messages, etc.
 */
function GameServer(){
  var self = this;
  // Initialization
  this.players = {};
  this.entities = {};

  this.outgoingMessages = {};

  this.population = 0;

  this.started = false;

  this.FPS = 60;
  this.delay = 1/this.FPS;

  this.onLogin = function(player){
    self.players[player.id] = player;
    self.outgoingMessages[player.id] = [];

    player.onBroadcast(function(message){
      for(var i in self.players){
        self.outgoingMessages[self.players[i].id].push(message.serialize());
      }
    });
  }

  /**
   * Initialize the server, start the loop
   */
  this.init = function(){
    this.started = true;

    new Entity();

    // ∆t variables
    var lastTime = new Date().getTime();
    var curTime, dt;

    var self = this;

    setInterval(function(){
      // ∆t calculation
      curTime = new Date().getTime();
      dt = (curTime - lastTime)/100;
      lastTime = curTime;

      self.tick(dt);
    }, 1000/this.FPS);
  }

  /**
   * Logic that happens once every loop
   */
  this.tick = function(dt){
    this.sendPlayerMessages();
  }

  this.sendPlayerMessages = function(){
    for(var i in this.outgoingMessages){
      var connection = this.getConnection(i);
      for(var j in this.outgoingMessages[i])
      connection.emit('message', this.outgoingMessages[i][j]);
    }
  }

  /**
   * Handle the connection from the given client
   * @param  {Object} client The client that has connected
   */
  this.onConnection = function(client){
    // TODO: Handle the connection
    if(!this.started) this.init();
    console.log('Client', client.id, 'connected.');

    this.players[client.id] = new Player(client, this);
    client.emit('connected', client.id);
  }

  /**
   * Handle the disconnection of the given client. Log out their player if they are
   * logged in.
   * @param  {Object} client The client that has disconnected
   */
  this.onDisconnect = function(client){
    // TODO: Logout if the player is logged in
    delete global.SOCKET_LIST[client.id];
    delete this.players[client.id];
    console.log('Client', client.id, 'disconnected.');
  }

  this.validateInput = function(input){
    return (Math.abs(input.press_time) <= 1/60)
  }

  this.getConnection = function(id){
    return this.players[id].connection;
  }
}
