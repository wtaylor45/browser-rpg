/**
 * @author Will Taylor
 * Contains all server-side information about the player
 */

var cls = require('./lib/class'),
    Types = require('../../shared/js/types'),
    Character = require('./character'),
    Messages = require('./message'),
    _ = require('underscore');

module.exports = Player = Character.extend({
  init: function(connection, server, name){
    var self = this;

    // The server on this player's connection
    this.server = server;
    this.connection = connection;

    // Create this player using the Character super class
    this._super(this.connection.id, name, "player", Types.Entities.PLAYER, 210, 205,32,48);

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

    this.permission = Types.Permissions.GOD;

    // When the player disconnects
    this.connection.on('disconnect', function(){
      server.disconnect(this.id);
    });

    // Tell the server the player has logged on
    server.onLogin(this);

    // Listen for and handle messages from this player's client
    this.connection.on('message', function(message){
      if(message.type == Types.Messages.MOVE){
        self.queuedInputs.push(message.data);
      }
      else if(message.type == Types.Messages.WHO){
        self.server.sendBatchSpawns(self, message.data);
      }
      else if(message.type == Types.Messages.CHAT){
        self.server.sendChatToGroup(self, message.data);
      }
      else if(message.type == Types.Messages.COMMAND){
        self.parseCommand(message.data);
      }
    });
  },

  /**
   * Apply all inputs that have been queued
   */
  applyQueuedInputs: function(){
    this.lastPos = [this.x, this.y]
    for(var i=0;i<this.queuedInputs.length;i++){
      var map = this.server.maps[this.map];
      var input = this.queuedInputs.shift();
      var vector = input.vector;

      this.x += vector.x*input.pressTime*this.speed;
      var collision = map.isColliding(map.nearestTilePositions(this));
      if(collision >= 0){
        if(collision == Types.Collisions.WALL){
          this.x = this.lastPos[0];
        }else{
          this.handleCollision(collision);
        }
      }

      this.y += vector.y*input.pressTime*this.speed;
      var collision = map.isColliding(map.nearestTilePositions(this));
      if(collision >= 0){
        if(collision == Types.Collisions.WALL){
          this.y = this.lastPos[1];
        }else{
          this.handleCollision(collision);
        }
      }

      this.lastProcessedInput = input.seq;
    }

    if(this.x > this.lastPos[0]) this.direction = Types.Directions.RIGHT;
    if(this.x < this.lastPos[0]) this.direction = Types.Directions.LEFT;
    if(this.y > this.lastPos[1]) this.direction = Types.Directions.DOWN;
    if(this.y < this.lastPos[1]) this.direction = Types.Directions.UP;
  },

  handleCollision: function(collision){
    switch(collision){
      case Types.Collisions.DOOR:
        var map = this.server.maps[this.map];
        var door = map.whichDoor(this.x, this.y+this.height/2);
        this.queuedInputs = []
        this.switchMap(door[0], door[1]);

    }
  },

  switchMap: function(name, entrance){
    var pos = this.server.maps[name].getEntrancePosition(entrance);

    var message = new Messages.Transition(name, pos);
    this.server.addMessageToOutbox(this.id, message.serialize());

    // Tell players on this map that you are no longer there
    this.server.tellOthersDespawned(this.id);
    this.server.maps[this.map].removeEntity(this.id);

    // Add entity to new map
    this.server.maps[name].addEntity(this);
    this.setPosition(pos[0], pos[1]);

    // Tell players on the map that you have arrived
    this.server.tellOthersSpawned(this)

    // Get list of this map's entities
    this.server.pushEntityIDs(this);
  },

  /**
   * Update loop to run every server update
   */
  update: function(){
    // Check if there are any inputs to apply
    if(this.queuedInputs.length > 0){
      this.applyQueuedInputs();
      this.checkCollisions();

      // Broadcast our new position
      this.broadcast(new Messages.Move(this));
    }
  },

  checkCollisions: function(){
    var self = this;

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
  },

  parseCommand: function(command){
    var command = command.split('/')[1];
    var args = command.split(' ');
    switch(args[0]){
      case 'moveto':
        if(this.permission >= Types.Permissions.ADMIN)
          this.moveto(args)
        break;
      case 'movetoplayer':
        if(this.permission >= Types.Permissions.ADMIN)
          this.movetoPlayer(args[1]);
        break;
      case 'setpermission':
        if(this.permission >= Types.Permissions.GOD)
          this.setPermissionPlayer(args[1], parseInt(args[2]));
        break;
    }
  },

  moveto: function(args){
    if(!args[1] || !args[2]) return;
    if(this.permission > 0) return;

    if(args[3]){
      this.switchMap(args[3], 0);
    }

    this.setPosition(parseInt(args[1]), parseInt(args[2]));
    this.broadcast(new Messages.Move(this));
  },

  movetoPlayer: function(player){
    if(player == this.name) return;

    var target = this.server.findPlayer(player);

    if(target){
      var map = target.map;
      var x = target.x;
      var y = target.y;

      if(map != this.map){
        this.switchMap(map, 0);
      }

      this.setPosition(x, y);
      this.broadcast(new Messages.Move(this));
    }
  },

  setPermission: function(permission){
    this.permission = permission;
    console.log(permission)
  },

  setPermissionPlayer: function(player, permission){
    if(player == this.name){
      this.setPermission(permission);
    }
    else{
      var target = this.server.findPlayer(player);
      target.setPermission(permission);
    }
  }
});
