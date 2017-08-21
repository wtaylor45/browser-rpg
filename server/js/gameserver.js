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

  // How many miliseconds between health autogeneration
  this.HEALTH_GEN = 2;
  this.healthGenTimer = 0;

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
   */
  this.tick = function(dt){
    this.healthGenTimer += dt/10;

    // Update all players on the server
    this.updateEntities(dt);
    // Send each player their messages
    this.sendPlayerMessages();

    if(this.healthGenTimer >= this.HEALTH_GEN) this.healthGenTimer = 0;
  }

  /**
   * Update every entity on the server
   */
  this.updateEntities = function(dt){
    for(var i in this.groups){
      this.groups[i].update(dt);

      if(this.healthGenTimer >= this.HEALTH_GEN){
        this.generateHealthForGroup(this.groups[i]);
      }
    }
  }

  /**
   * Add 1 health to every character in the given group.
   * @param  {Object} group The group to generate the health for
   */
  this.generateHealthForGroup = function(group){
    for(var i in group.entities){
      var entity = group.entities[i];
      if(!entity.currentHealth) continue;

      var heal = entity.heal(1);
      this.pushToGroup(group.id, heal.serialize());
    }
  }

  /**
   * Creates and sends a message to the entity's group that the entity has moved.
   * @param  {Object} entity The entity that has moved
   */
  this.onEntityMove = function(entity){
    var message = new Messages.Move(entity);
    this.pushToGroup(entity.map, message.serialize());
  }

  /**
   * Create and send a spawn message to the entity's group.
   * @param  {Object} entity The entity that has spawned
   */
  this.onEntitySpawn = function(entity){
    this.pushGroupEntityIDsTo(entity);

    var message = new Messages.Spawn(entity);
    this.pushToGroup(entity.map, message.serialize(), entity.id);
  }

  /**
   * Create and send a DESPAWN message to the entity's group.
   * @param  {Object} entity The entity that has been despawned
   */
  this.onEntityDespawn = function(entity){
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
    if(!this.started) this.init();
    console.log('User', username, 'connected.');

    // Add the player to the global player's list
    this.players[client.id] = this.createPlayer(client, username);
  }

  /**
   * Create a new player
   * @param  {Object} connection The client's connection who owns the player
   * @param  {String} name       The username of the player
   * @return {Object}            The player created
   */
  this.createPlayer = function(connection, name){
    var player = new Player(connection, this, name);
    player.onMove(this.onEntityMove.bind(this));
    player.onSpawn(this.onEntitySpawn.bind(this));
    player.onDespawn(this.onEntityDespawn.bind(this));

    // Set up their outgoing messages
    self.outgoingMessages[player.id] = [];


    self.addEntityToServer(player);

    // What to do when this player broadcasts a message
    player.onBroadcast(function(message){
      self.pushToGroup(player.map, message.serialize());
    });

    // Send the login message to the client with the player created
    var message = new Messages.Login(player);
    player.connection.emit(Types.Messages.LOGIN, message.serialize());

    return player;
  }

  /**
   * Handle the disconnection of the given client. Log out their player if they are
   * logged in.
   * @param  {Object} client The client that has disconnected
   */
  this.disconnect = function(id){
    var player = this.players[id];

    delete global.SOCKET_LIST[id];
    this.removeEntityFromServer(player);
    delete this.outgoingMessages[id];
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

  /**
   * Adds a new entity to the server
   * @param  {Object} entity The entity to be added
   */
  this.addEntityToServer = function(entity){
    // Add the entity to the global entity list
    this.entities[entity.id] = entity;
    // Set the map the entity will spawn in
    this.addEntityToGroup(entity, entity.map || 'septoria');
    // Spawn the entity
    entity.spawn();
  }

  /**
   * Remove the entity from the server entirely.
   * @param  {Object} entity The entity to be removed from the server
   */
  this.removeEntityFromServer = function(entity){
    var entity = this.entities[entity.id];
    if(!entity) throw "Entity "+entity.id+" not found";

    this.removeFromGroup(entity);
    entity.despawn();
    delete this.entities[entity.id];
  }

  /**
   * Push a given message to a group, optionally ignoring an entitys.
   * @param  {String} groupId          The name of the group to push the message to
   * @param  {Object} message          The message to be sent to the group
   * @param  {String} entityToIgnoreId The entity to ignore when sending messages
   */
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

  /**
   * Add a given entity to a given group.
   * @param  {Object} entity The entity to be added
   * @param  {String} groupId  The ID of the group to be added to
   */
  this.addEntityToGroup = function(entity, groupId){
    this.groups[groupId].addEntity(entity);
    entity.map = groupId;
  }

  /**
   * Remove a give entity from their group.
   * @param  {Object} entity The entity to be removed from their group
   */
  this.removeFromGroup = function(entity){
    this.groups[entity.map].removeEntity(entity.id);
    entity.map = "";
  }

  /**
   * Switch an entity from their current group to a given new group
   * @param  {Object} entity The entity to be switched to a new group
   * @param  {String} groupId  The ID of the group to be added to
   * @return {[type]}        [description]
   */
  this.switchEntityGroupTo = function(entity, groupId){
    if(entity.map)
      this.removeFromGroup(entity);

    this.addEntityToGroup(entity, groupId);
  }

  /**
   * Send the list of entity IDs in the given player's group to the player.
   * @param  {Object} player Player receiving the IDs
   */
  this.pushGroupEntityIDsTo = function(player){
    if(!player.map) return;

    var group = this.groups[player.map].entities;
    // Get the IDs of each entity from the list of entities
    var entities = _.pluck(group, "id");
    // Create a new LIST message to send the IDs
    var message = new Messages.List(entities);
    this.addMessageToOutbox(player.id, message.serialize());
  }

  /**
   * Send a SPAWN message for each entity in the given list to the given player.
   * @param  {} player [description]
   * @param  {[type]} list   [description]
   * @return {[type]}        [description]
   */
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

  this.sendAllUpdate = function(player){
    var self = this;
    var group = this.groups[player.map].entities;
    _.each(group, function(entity){
      if(entity.id != player.id){
        var message = new Messages.Spawn(entity);
        self.addMessageToOutbox(player.id, message.serialize());
      }
    });
  }

  /**
   * Add a message to a given player's outbox.
   * @param  {String} playerId    The ID of the player to send the message to
   * @param  {Object} message     The message to send to the player
   */
  this.addMessageToOutbox = function(playerId, message){
    this.outgoingMessages[playerId].push(message);
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

    this.pushToGroup(player.map, message.serialize());
  }

  this.sendNotification = function(player, message){
    var message = sanitizeHtml(message);
    message = new Messages.Notification(message);
    this.addMessageToOutbox(player, message.serialize());
  }

  this.findPlayer = function(name){
    for(var i in this.groups){
      for(var p in this.groups[i].players){
        var player = this.groups[i].players[p];
        if(player.name == name) return player;
      }
    }
  }

  this.respawnEntity = function(entity){
    this.moveEntityToMap(entity, entity.map)

    var message = new Messages.Spawn(entity);
    this.pushToGroup(entity.map, message.serialize());
  }

  this.moveEntityToMap = function(entity, map, entrance){
    var pos = entrance ? this.maps[map].getEntrancePosition(entrance)
      : [entity.spawnPoint.x, entity.spawnPoint.y]
    var message = new Messages.Transition(map, pos);
    this.addMessageToOutbox(entity.id, message.serialize());

    this.switchEntityGroupTo(entity, map);

    entity.despawn();
    entity.spawn();

    entity.moveTo(pos[0], pos[1]);

    // Get list of this map's entities
    this.pushGroupEntityIDsTo(entity);
  }

  this.getTarget = function(entity, x, y){
    var group = this.groups[entity.map];

    for(var i in group.entities){
      var target = group.entities[i];

      if(target.id == entity.id) continue;
      if(!Types.isCharacter(target.species)) continue;

      var box = target.targetBox;
      if(x < box[0] || x > box[2] || y < box[1] || y > box[3]) continue;

      return target;
    }
  }

  this.attack = function(attacker, target){
    var message = target.dealDamage(attacker.currentAttackPower);
    this.checkAlive(target);
    this.pushToGroup(target.map, message.serialize());
  }

  this.checkAlive = function(entity){
    if(entity.currentHealth <= 0){
      entity.resetStats();
      this.respawnEntity(entity);
    }
  }
}
