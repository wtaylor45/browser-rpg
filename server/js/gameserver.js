/**
 * @author  Will Taylor
 * Game Server that handles all the game logic, distributing messages from client, etc.
 */

// Set up the Database
var mongojs = require('mongojs');
var db = mongojs('browserpg', ['account', 'counters']);

// Require needed node modules
var _ = require('underscore');
var Entity = require('./entity');
var Player = require('./player.js');
var Messages = require('./message');
var Map = require('./map');

// Export the GameServer module
module.exports = GameServer;

/**
 * Game server that handles all the game logic, distributing messages, etc.
 */
function GameServer(){
  var self = this;
  // Initialization
  this.players = {}
  this.entities = {};

  // Messages, index by player it is going to
  this.outgoingMessages = {};

  // Amount of players on the server
  this.population = 0;

  // Has the server started
  this.started = false;

  // Frames, aka updates, per second
  this.FPS = 60;
  this.delay = 1/this.FPS;

  /**
   * Performed on player login
   * @param  {Object} player The player who logged in
   */
  this.onLogin = function(player){
    // Add player to the list of players
    self.entities[player.id] = player;

    // Set up their outgoing messages
    self.outgoingMessages[player.id] = [];

    self.maps['septoria'].addEntity(player);

    self.pushEntityIDs(player);
    self.tellOthersSpawned(player);

    // What to do when this player broadcasts a message
    // TODO: Change to only broadcast to certain group
    player.onBroadcast(function(message){
      var group = self.maps[player.map].entities;
      for(var i in group){
        self.outgoingMessages[group[i].id].push(message.serialize());
      }
    });
  }

  /**
   * Initialize the server, start the loop
   */
  this.init = function(){
    this.started = true;

    this.maps = this.createMaps();

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
   * TODO: Update entities as well
   */
  this.tick = function(dt){
    // Update all players on the server
    this.updatePlayers();
    // Send each player their messages
    this.sendPlayerMessages();
  }

  /**
   * Update every player on the server
   */
  this.updatePlayers = function(){
    for(var i in this.players){
      var player = this.players[i];
      player.update();
    }
  }

  /**
   * Send each player their messages
   */
  this.sendPlayerMessages = function(){
    for(var i in this.outgoingMessages){
      var connection = this.getConnection(i);
      for(var j=0;j<this.outgoingMessages[i].length;j++){
        var message = this.outgoingMessages[i].shift();
        connection.emit('message', message);
      }
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
    var player = this.players[client.id];
    var message = {
      id: client.id,
      width: player.width,
      height: player.height,
      x: player.x,
      y: player.y
    }
    client.emit('connected', message);
  }

  /**
   * Handle the disconnection of the given client. Log out their player if they are
   * logged in.
   * @param  {Object} client The client that has disconnected
   */
  this.disconnect = function(id){
    // TODO: Logout if the player is logged in
    this.tellOthersDespawned(id);

    var player = this.players[id];

    delete global.SOCKET_LIST[id];
    delete this.players[id];
    delete this.entities[id];
    delete this.maps[player.map].entities[id];
    delete this.outgoingMessages[id];
    console.log('Player', id, 'disconnected.');
  }

  /**
   * Make sure input was valid
   * @param  {Object} input The input to check
   * @return {boolean}      The validity of the input
   */
  this.validateInput = function(input){
    return (Math.abs(input.press_time) <= 1/60)
  }

  /**
   * Get the connection of the given player
   * @param  {String} id ID of the player
   * @return {Object}    The player's connection
   */
  this.getConnection = function(id){
    if(this.players[id])
      return this.players[id].connection;
  }

  this.pushEntityIDs = function(player){
    if(!player.map) return;

    var group = this.maps[player.map].entities;
    var entities = _.pluck(group, "id");

    var message = new Messages.List(entities);
    this.addMessageToOutbox(player, message.serialize());
  }

  this.tellOthersSpawned = function(player){
    var group = this.maps[player.map].entities;
    for(var i in group){
      var message = new Messages.Spawn(player);
      this.addMessageToOutbox(group[i], message.serialize());
    }
  }

  this.tellOthersDespawned = function(id){
    var message = new Messages.Despawn(id);
    for(var i in this.players){
      this.addMessageToOutbox(this.players[i], message.serialize());
    }
  }

  this.sendBatchSpawns = function(player, list){
    var self = this;
    var group = this.maps[player.map].entities;
    _.each(list, function(id){
      if(id != player.id){
        var message = new Messages.Spawn(group[id]);
        self.addMessageToOutbox(player, message.serialize());
      }
    });
  }

  this.addMessageToOutbox = function(player, message){
    this.outgoingMessages[player.id].push(message);
  }

  this.createMaps = function(){
    var maps = {};
    for(var i in Map.mapData){
      maps[i] = new Map(i);
      console.log('Created', i)
    }

    return maps;
  }
}
