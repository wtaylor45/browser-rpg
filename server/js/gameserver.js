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
var Player = require('./player.js');

// Export the GameServer module
module.exports = GameServer;

/**
 * Game server that handles all the game logic, distributing messages, etc.
 */
function GameServer(){
  // Initialization
  this.players = {};

  this.mailman = new Mailman(this);

  this.started = false;

  this.FPS = 60;
  this.delay = 1/this.FPS;

  /**
   * Initialize the server, start the loop
   */
  this.init = function(){
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

      self.tick(dt);
    }, 1000/this.FPS)
  }

  /**
   * Logic that happens once every loop
   */
  this.tick = function(dt){
    // The mailbag to send out to each client
    var mail = {players: {}}

    for(var i in this.players){
      var player = this.players[i];
      player.update(dt);
      mail.players[player.id] = player.pack();
    }

    this.mailman.sendMail(mail);
  }

  /**
   * Handle the connection from the given client
   * @param  {Object} client The client that has connected
   */
  this.onConnection = function(client){
    // TODO: Handle the connection
    if(!this.started) this.init();
    console.log('Client', client.id, 'connected.');

    this.players[client.id] = new Player(client.id);
    client.emit('connected', client.id);
    console.log('Added a player for this client.')
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

  /**
   * Handle the message sent by the given client
   * @param {Object} client The client that has sent the message
   * @param {Object} message  The message that was sent by the client
   */
  this.onMessage = function(client, message){
    // First, check if this client has a player
    var player = this.players[client.id];
    // Check the message type, distribute accordingly
    switch(message.type){
      case 'move':
        if(player){
          var input = message.data;
          if(true){
            player.queueInput(input);
          }
        }
    }
  }

  this.validateInput = function(input){
    return !(Math.abs(input.press_time) > this.delay)
  }
}
