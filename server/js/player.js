/**
 * @author Will Taylor
 * Contains all server-side information about the player
 */

var cls = require('./lib/class'),
    Types = require('../../shared/js/types'),
    Character = require('./character'),
    Messages = require('./message'),
    _ = require('underscore'),
    Projectile = require('./projectile')

module.exports = Player = class Player extends Character {
  constructor(connection, server, name){
    // Create this player using the Character super class
    super(connection.id, name, Types.Entities.PLAYER, 210, 205,32,48);

    var self = this;

    // The server on this player's connection
    this.server = server;
    this.connection = connection;

    // Is the player in game yet
    this.inGame = false;

    // The player's current health
    this.currentHealth = 5;

    this.COOLDOWN = 3;
    this.currentCooldown = 0;

    // The last input processed for this player by the server
    this.lastProcessedInput = 0;

    // List of NPCs that are aggressive to the player
    this.enemies = {};

    // The location at which the player will spawn when they die
    this.spawnPoint = {
      map: "test",
      x: 0,
      y: 0
    }

    // Inputs that need to be processed
    this.queuedInputs = [];

    // What to do when broadcasting, set by server on login
    this.broadcastCallback = null;

    this.permission = Types.Permissions.GOD;

    // When the player disconnects
    this.connection.on('disconnect', function(){
      server.onDisconnect(this.id);
    });

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
      else if(message.type == Types.Messages.ABILITY){
        self.handleAbility(message.data[0], message.data[1]);
      }
      else if(message.type == Types.Messages.ALLUPDATE){
        self.server.sendAllUpdate(self);
      }
      else if(message.type = Types.Messages.ATTACK){
        var target = self.server.getTarget(self, message.data.x, message.data.y);
        if(!target) return;
        self.attack(target);
      }
    });
  }

  /**
   * Apply all inputs that have been queued
   */
  applyQueuedInputs(){
    this.lastPos = [this.x, this.y]
    for(var i=0;i<this.queuedInputs.length;i++){
      var map = this.server.maps[this.map];
      var input = this.queuedInputs.shift();
      var vector = input.vector;

      this.x += vector.x*input.pressTime*this.currentSpeed;
      var collision = map.isColliding(map.nearestTilePositions(this));
      if(collision >= 0){
        if(collision == Types.Collisions.WALL){
          console.log('collide');          
          this.x = this.lastPos[0];
        }else{
          this.handleCollision(collision);
        }
      }

      this.y += vector.y*input.pressTime*this.currentSpeed;
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

    this.setPosition(this.x, this.y);
  }

  handleCollision(collision){
    switch(collision){
      case Types.Collisions.DOOR:
        var map = this.server.maps[this.map];
        var door = map.whichDoor(this.x, this.y+this.height/2);
        this.queuedInputs = []
        this.switchMap(door[0], door[1]);

    }
  }

  switchMap(name, entrance){
    this.server.moveEntityToMap(this, name, entrance);
  }

  /**
   * Update loop to run every server update
   */
  update(dt){
    // Check if there are any inputs to apply
    if(this.queuedInputs.length > 0){
      this.applyQueuedInputs();

      // Broadcast our new position
      this.broadcast(new Messages.Move(this));
    }

    if(this.currentCooldown > 0){
      this.currentCooldown -= dt/10;
    }
  }

  /**
   * Broadcast a message to the other players on the server
   * @param  {Object} message The message to broadcast
   */
  broadcast(message){
    // Make sure there is a callback function
    if(this.broadcastCallback){
      this.broadcastCallback(message);
    }
  }

  /**
   * Set the broadcast callback for this player
   * @param  {Function} callback The function to set as the callback
   */
  onBroadcast(callback){
    this.broadcastCallback = callback;
  }

  parseCommand(command){
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
  }

  /**
   * Command: /moveto [mapName] <x> <y>
   */
  moveto(args){
    // At least 2 args needed
    if(!args[1] || !args[2]){
      this.server.sendNotification(this.id, "Missing arguments: Correct usage: /moveto [mapName] x y");
      return;
    }

    if(args.length > 3){
      if(!this.server.maps[args[1]]){
        this.server.sendNotification(this.id, "Map " + args[1] + " not found!");
        return;
      }
      if(isNaN(parseInt(args[2], 10)) || isNaN(parseInt(args[3], 10))){
        this.server.sendNotification(this.id, "Coordinates must be a number!");
        return;
      }
      this.switchMap(args[1], 0);
      this.setPosition(parseInt(args[2]), parseInt(args[3]));
    }else{
      if(isNaN(parseInt(args[1], 10)) || isNaN(parseInt(args[2], 10))){
        this.server.sendNotification(this.id, "Coordinates must be a number!");
        return;
      }
      this.setPosition(parseInt(args[1]), parseInt(args[2]));
    }

    this.broadcast(new Messages.Move(this));
    this.server.sendNotification(this.id, "Moved to new position.");
  }

  movetoPlayer(player){
    if(player == this.name){
      this.server.sendNotification(this.id, "You're already there!");
      return;
    }

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
      this.server.sendNotification(this.id, "Moved to "+player+".");
    }else{
      this.server.sendNotification(this.id, "Player "+player+" not found.");
    }
  }

  setPermission(permission){
    this.permission = permission;
  }

  setPermissionPlayer(player, permission){
    if(player == this.name){
      this.setPermission(permission);
      this.server.sendNotification(this.id, "Permission set to "+permission+".");
    }
    else{
      var target = this.server.findPlayer(player);
      if(!target) return;
      target.setPermission(permission);
      this.server.sendNotification(this.id, player + "'s permission set to "+permission+".");
    }
  }

  handleAbility(ability, angle){
    var ability = Projectile.builder[ability](angle, this);
    this.server.spawnEntity(ability);
  }
}
