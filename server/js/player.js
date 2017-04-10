/**
 * @author Will Taylor
 * Contains all server-side information about the player
 */

var cls = require('./lib/class'),
    Types = require('../../shared/js/types'),
    Character = require('./character'),
    Messages = require('./message');

module.exports = Player = Character.extend({
  init: function(connection, server){
    var self = this;

    // The server on this player's connection
    this.server = server;
    this.connection = connection;

    // This player's id, just use connection ID
    this.id = connection.id;

    // Create this player using the Character super class
    this._super(this.connection.id, "player", Types.Entities.PLAYER, 0, 0, 32, 64);

    // Is the player in game yet
    this.inGame = false;

    // The player movement speed
    this.speed = 10;

    // The last input processed for this player by the server
    this.lastProcessedInput = 0;

    // List of NPCs that are aggressive to the player
    this.enemies = {};

    // Inputs that need to be processed
    this.queuedInputs = [];

    // What to do when broadcasting, set by server on login
    this.broadcastCallback = null;

    // Listen for and handle messages from this player's client
    this.connection.on('message', function(message){
      if(message.type == Types.Messages.MOVE){
        self.queuedInputs.push(message.data);
      }
    });

    // When the player disconnects
    this.connection.on('disconnect', function(){
      server.disconnect(this.id);
    });

    // Tell the server the player has logged on
    server.onLogin(this);
  },

  /**
   * Apply all inputs that have been queued
   */
  applyQueuedInputs: function(){
    for(var i=0;i<this.queuedInputs.length;i++){
      var input = this.queuedInputs.shift();
      var vector = input.vector;

      this.x += vector.x*input.pressTime*this.speed;
      this.y += vector.y*input.pressTime*this.speed;

      this.lastProcessedInput = input.seq;
    }

    // Broadcast our new position
    this.broadcast(new Messages.Move(this));
  },

  /**
   * Update loop to run every server update
   */
  update: function(){
    // Check if there are any inputs to apply
    if(this.queuedInputs.length > 0)
      this.applyQueuedInputs();
  },

  /**
   * Broadcast a message to the other players on the server
   * @param  {Object} message The message to broadcast
   */
  broadcast: function(message){
    // Make sure there is a callback function
    if(this.broadcastCallback){
      this.broadcastCallback(message);
    }
  },

  /**
   * Set the broadcast callback for this player
   * @param  {Function} callback The function to set as the callback
   */
  onBroadcast: function(callback){
    this.broadcastCallback = callback;
  }
});
