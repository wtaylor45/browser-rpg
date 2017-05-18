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
var sanitizeHtml = require('sanitize-html');
var Group = require('./group')

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
    // Set up their outgoing messages
    self.outgoingMessages[player.id] = [];

    self.addEntity(player);

    self.pushGroupEntityIDsTo(player);

    // What to do when this player broadcasts a message
    // TODO: Change to only broadcast to certain group
    player.onBroadcast(function(message){
      self.pushToGroup(player.map, message.serialize());
    });
  }

  /**
   * Initialize the server, start the loop
   */
  this.init = function(){
    this.started = true;

    this.createMaps();

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
    this.updateEntities(dt);
    // Send each player their messages
    this.sendPlayerMessages();
  }

  /**
   * Update every player on the server
   */
  this.updateEntities = function(dt){
    for(var i in this.groups){
      this.groups[i].update(dt);
    }
  }

  this.onEntityMove = function(entity){
    var message = new Messages.Move(entity);
    this.pushToGroup(entity.map, message.serialize());
  }

  this.onEntityDespawn = function(entity){
    this.groups[entity.map].removeEntity(entity);

    var message = new Messages.Despawn(entity.id);
    this.pushToGroup(entity.map, message.serialize(), entity.id);
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
  this.onConnection = function(client, username){
    // TODO: Handle the connection
    if(!this.started) this.init();
    console.log('Client', client.id, 'connected.');

    this.players[client.id] = new Player(client, this, username);
    var player = this.players[client.id];
    var message = {
      id: client.id,
      name: username,
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
    //this.tellOthersDespawned(id);

    var player = this.players[id];

    delete global.SOCKET_LIST[id];
    this.removeEntity(player);
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

  this.addEntity = function(entity){
    this.entities[entity.id] = entity;
    if(Types.isMob(entity.species)) this.mobs[entity.id] = entity;
    map = entity.map || 'septoria';
    this.addToGroup(map, entity);
  }

  this.removeEntity = function(entity){
    var entity = this.entities[entity.id];
    if(!entity) throw "Entity "+entity.id+" not found";

    entity.despawn();
    delete this.entities[entity.id];
  }

  this.pushToGroup = function(groupId, message, entityToIgnoreId){
    var group = this.groups[groupId];
    if(!group) throw groupId, "not found!";
    if(!message) throw "Message was not defined!";
    var players = group.players;

    for(var i in players){
      if(i != entityToIgnoreId){
        this.addMessageToOutbox(i, message);
      }
    }
  }

  this.addToGroup = function(groupId, entity){
    this.groups[groupId].addEntity(entity);
    entity.map = groupId;
    this.tellOthersSpawned(entity);
  }

  this.removeFromGroup = function(entity){
    this.groups[entity.map].removeEntity(entity.id);
    this.tellOthersDespawned(entity);
  }

  this.pushGroupEntityIDsTo = function(player){
    if(!player.map) return;

    var group = this.groups[player.map].entities;
    var entities = _.pluck(group, "id");
    var message = new Messages.List(entities);
    this.addMessageToOutbox(player.id, message.serialize());
  }

  this.tellOthersSpawned = function(entity){
    if(!entity) return;

    var message = new Messages.Spawn(entity);
    console.log(entity.map);
    this.pushToGroup(entity.map, message.serialize(), entity.id);
  }

  this.tellOthersDespawned = function(entity){
    var message = new Messages.Despawn(entity);
    this.pushToGroup(entity.map, message.serialize(), entity.id);
  }

  this.sendBatchSpawns = function(player, list){
    var self = this;
    var group = this.groups[player.map].entities;
    _.each(list, function(id){
      if(id != player.id){
        var message = new Messages.Spawn(group[id]);
        self.addMessageToOutbox(player.id, message.serialize());
      }
    });
  }

  this.addMessageToOutbox = function(id, message){
    this.outgoingMessages[id].push(message);
  }

  this.createMaps = function(){
    this.maps = {};
    this.groups = {};

    for(var i in Map.mapData){
      this.maps[i] = new Map(i);
      this.groups[i] = new Group(i);
    }
  }

  this.sendChatToGroup = function(player, chat){
    var group = this.maps[player.map].entities;
    var self = this;

    chat = sanitizeHtml(chat, {allowedTags:[], allowedAttributes:[]});

    var message = new Messages.Chat(chat, player.id);

    this.pushToGroup(player.map, message.serialize);
  }

  this.sendNotification = function(player, message){
    var message = new Messages.Notification(message);

    this.addMessageToOutbox(player, message.serialize());
  }

  this.findPlayer = function(name){
    for(var i in this.groups){
      for(var p in this.groups[i].players){
        var player = this.groups[i].players[p];
        if(player.name == name) return player;
      }
    }
    console.log(name, 'not found');
  }

  this.spawnEntity = function(entity){
    entity.onMove(this.onEntityMove.bind(this));
    entity.onDespawn(this.onEntityDespawn.bind(this));
    this.groups[entity.map].addEntity(entity);
    this.tellOthersSpawned(entity);
  }

  this.moveEntityToMap = function(entity, map, entrance){
    var pos = this.maps[map].getEntrancePosition(entrance);

    var message = new Messages.Transition(map, pos);
    this.addMessageToOutbox(entity.id, message.serialize());

    this.removeFromGroup(entity);
    this.addToGroup(map, entity);

    entity.moveTo(pos[0], pos[1]);

    // Get list of this map's entities
    this.pushGroupEntityIDsTo(entity.id);
  }
}
