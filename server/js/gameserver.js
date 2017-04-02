/**
 * @author  Will Taylor
 * Game Server that handles all the game logic, distributing messages from client, etc.
 */

// Set up the Database
var mongojs = require('mongojs');
var db = mongojs('browserpg', ['account', 'counters']);

// Require needed node modules
var _ = require('underscore');
var Mailman = require('./mailman.js')

// Export the GameServer module
module.exports = GameServer;

/**
 * Game server that handles all the game logic, distributing messages, etc.
 */
function GameServer(){
  // Initialization
  this.players = {};

  this.mailman = new Mailman();

  this.started = false;

  /**
   * Initialize the server, start the loop
   */
  this.init = function(){
    this.started = true;

    var self = this;

    setInterval(function(){
      self.tick();
    }, 1000/60)
  }

  /**
   * Logic that happens once every loop
   */
  this.tick = function(){
    // TODO: Write tick function
  }

  /**
   * Handle the connection from the given client
   * @param  {Object} client The client that has connected
   */
  this.onConnection = function(client){
    // TODO: Handle the connection
    if(!this.started) this.init();
    console.log('Client', client.id, 'connected.');
  }

  /**
   * Handle the disconnection of the given client. Log out their player if they are
   * logged in.
   * @param  {Object} client The client that has disconnected
   */
  this.onDisconnect = function(client){
    // TODO: Logout if the player is logged in
    console.log('Client', client.id, 'disconnected.');
  }

  /**
   * Handle the message sent by the given client
   * @param {Object} client The client that has sent the message
   * @param {Object} message  The message that was sent by the client
   */
  this.onMessage = function(client, message){
    // TODO: Decide on a default message format
    // TODO: Implement message handling
  }
}
