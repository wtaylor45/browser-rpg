/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Input = require('./input'),
    Renderer = require('./renderer'),
    Player = require('./player'),
    Updater = require('./updater'),
    Types = require('../../shared/js/types'),
    Socket = require('./socket'),
    _ = require('underscore'),
    Map = require('./map'),
    Message = require('./message'),
    sanitize = require('sanitize-html');

/**
 * The client instance of the game
 *
 * Handles the stage as well
 */
module.exports = Game = class Game{
  constructor(){
    var self = this;
    // Has the game started yet on the client side?
    this.started = false;
    this.running = false;

    // Who is the client's player?
    this.player = false;

    this.renderer = null;

    // Recieve messages from server to be processed here
    this.mailbox = [];

    // List of all entities to be drawn
    this.entities = {}
    this.entitiesToPrune = {};

    this.FPS = 60;

    new Socket.on('message', function(message){
      self.mailbox.push(message);
    });
  }

  /**
   * Start the game and its loops
   */
  start(){
    // Make sure there is a player
    if(!this.player) return false;
    this.started = true;
    this.running = true;
    this.setFrozen(false);

    // Create the renderer
    this.renderer = new Renderer(this, "canvas");
    // Create the map
    this.currentMap = new Map(this.player.map);
    this.renderer.setMap(this.currentMap);
    // Create the updater
    this.updater = new Updater(this);
    // Initialize the input handler
    Input.init();
    // Add listener to check if window is visible
    document.addEventListener('visibilitychange', this.visibilityChange.bind(this));

    // Update every loop
    var self = this;
    setInterval(function(){
      self.tick();
    }, 1000/this.FPS);
    this.render();
  }

  visibilityChange(){
    if(!document.hidden){
      this.requestAll = true;
    }
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  tick(){
    if(!this.isFrozen()) this.updater.update();
    if(this.requestAll){
      this.requestAllUpdates();
      this.requestAll = false;
    }
  }

  render(){
    if(this.running){
      this.renderer.render();
    }
    window.requestAnimationFrame(this.render.bind(this));
  }

  /**
   * Set this games player (the client's player)
   *
   * @param {Object} player The player object that belongs to this client
   */
  createPlayer(message){
    var player = new Player(
      message.id,
      message.name,
      "",
      message.x,
      message.y,
      message.w,
      message.h
    );
    player.setStats(message.stats)
    player.map = message.map;
    this.player = player;
    this.entities[player.id] = player;
    this.player.setGame(this);
  }

  pruneEntities(){
    var self = this;
    _.each(this.entitiesToPrune, function(entity){
      delete self.entities[entity.id];
    });
    this.entitiesToPrune = {};
  }

  /**
   * Read messages sent from the server since last update
   */
  readServerMessages(){
    // Read every message one at a time
    for(var i=0;i<this.mailbox.length;i++){
      var message = this.mailbox[i];
      if(message.type == Types.Messages.MOVE){
        if(message.id == this.player.id){
          this.player.onMove(message);
        }
        else{
          // Other entity
          this.receiveMove(message);
        }
      }
      else if(message.type == Types.Messages.LIST){
        this.receiveEntityList(message.list);
      }
      else if(message.type == Types.Messages.SPAWN){
        this.receiveSpawn(message);
      }
      else if(message.type == Types.Messages.DESPAWN){
        this.receiveDespawn(message);
      }
      else if(message.type == Types.Messages.TRANSITION){
        this.switchMap(message);
      }
      else if(message.type == Types.Messages.CHAT){
        this.receiveChat(message.chat, message.sender);
      }
      else if(message.type == Types.Messages.NOTIFICATION){
        this.receiveNotification(message.message);
      }
      else if(message.type == Types.Messages.DAMAGE){
        this.entities[message.target].updateHealth(message.newHealth);
      }
      else if(message.type == Types.Messages.HEAL){
        if(this.entities[message.target])
          this.entities[message.target].updateHealth(message.newHealth);
      }
      this.mailbox.splice(i,1);
    }
  }

  /**
   * Receive and prune a list of entities in the player's group,
   * ask for more information if relevant
   * @param  {Object} list List of IDs
   */
  receiveEntityList(list){
    // List of all entity IDs already known
    var entityIds = _.pluck(this.entities, 'id');
    // List of all entity IDs in the message already seen
    var alreadySeen = _.intersection(this.entityIds, list);
    // List of all entity IDs in the message that have not been seen
    var notSeen = _.difference(list, alreadySeen);
    var self = this;

    // Create a list of entities that have been seen, but do not appear in the
    // latest list
    this.entitiesToPrune = _.reject(this.entities, function(entity){
      return _.contains(this.alreadySeen, entity.id) || entity.id == self.player.id;
    });

    // Remove the entities that are no longer in the group
    this.pruneEntities();

    // Ask for information about each entity that has not been seen
    if(_.size(notSeen) > 0){
      this.askWhoAre(notSeen);
    }
  }

  receiveMove(message){
    var entity = this.entities[message.id];

    if(!entity){
      return;
    }

    if(message.time < entity.lastMove){
      return;
    }

    entity.setPos(message.x, message.y);
    entity.setDirection(message.dir);
    entity.lastMove = message.time;
  }

  /**
   * Receive and handle the SPAWN message from the server
   * @param  {Object} message The SPAWN message sent by the server
   */
  receiveSpawn(message){
    // If the entity has been seen before
    if(this.entities[message.id] &&
    message.time > this.entities[message.id].lastSpawn){
      this.updateEntity(message);
      return;
    }

    // What type of entity to create
    if(Types.isCharacter(message.species)) this.spawnCharacter(message);
  }

  /**
   * Updates an entity using the SPAWN message received
   * @param  {Object} data The SPAWN message containing this entity's updated data
   */
  updateEntity(data){
    // Grab the entity from the global list
    var entity = this.entities[data.id];

    // Update each of the entity's state parameters
    entity.x = data.x;
    entity.y = data.y;
    entity.lastMove = data.time;

    // Check if the entity is a Character
    // Change the character's stats
    if(Types.isCharacter(data.species)){
      entity.setStats(data.stats);
    }
  }

  /**
   * Spawn a new character that has not been seen before
   * @param  {Object} message The SPAWN message containing the character's state
   */
  spawnCharacter(message){
    // Create the character, adding it to the global list
    this.entities[message.id] = new Character(message.id, message.name,
      message.species, message.x, message.y, message.w, message.h);
    var entity = this.entities[message.id];

    // Set the character's stats
    entity.setStats(message.stats);

    // Set the direction it is facing
    entity.setDirection(message.direction);

    // Handle the entity's graphics
    var sprite = new Sprite(Types.speciesAsString(entity.species));

    sprite.image.on("mouseover", function(){
      entity.drawName = true;
    });

    sprite.image.on("mouseout", function(){
      entity.drawName = false;
    });

    entity.setSprite(sprite);

    // Set the entity's animation
    entity.idle();

    // Stamp the update
    entity.lastSpawn = message.time;
  }

  receiveDespawn(message){
    if(message.id != this.player.id)
      delete this.entities[message.id];
  }

  receiveChat(chat, sender){
    var entity = this.entities[sender];
    if(!entity) return;

    entity.onChat();

    this.renderer.addChat(chat);
  }

  receiveNotification(message){
    this.renderer.addNotification(message);
  }

  isFrozen(){
    return this.freeze;
  }

  setFrozen(state){
    this.freeze = state;
  }

  /**
   * Ask for the states of each entity in the list of entity IDs
   * @param  {Object} list List of entity IDs
   */
  askWhoAre(list){
    var message = new Message(Types.Messages.WHO, list);
    message.send();
  }

  switchMap(message){
    if(message.map && message.map != this.currentMap.name){
      this.setFrozen(true);
      this.renderer.fadeTo(500, 'black', function(){
        this.currentMap = new Map(message.map);
        this.player.unfreeze();
        this.player.setPos(message.x, message.y);
        this.renderer.setMap(this.currentMap);
        this.renderer.fadeFrom(200, 'black');
        this.setFrozen(false);
      }.bind(this));
    }
  }

  enableChat(){
    document.getElementById('chatinput').focus();
  }

  onSubmitChat(message){
    var message = sanitize(message);

    if(message.charAt(0) == '/'){
      new Message(Types.Messages.COMMAND, message).send();
    }else{
      var chat = this.player.name+": " + message
      new Message(Types.Messages.CHAT, chat).send();
    }
  }

  abilityActivated(ability){

  }

  changeAbility(index, ability){
    this.renderer.setAbility(index, ability);
  }

  requestAllUpdates(){
    new Message(Types.Messages.ALLUPDATE).send();
  }

  screenToGameCoords(coords){
    var x = coords.x,
        y = coords.y;

    return [x+this.renderer.camera.x, y+this.renderer.camera.y]
  }
}
