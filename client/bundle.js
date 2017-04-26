(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){


module.exports = Animation = class Animation{
  constructor(name, length, row, width, height){
    this.name = name;
    this.row = row;
    this.width = width;
    this.height = height;
    this.rowOffset = 0;
    this.frames = length;
    this.currentFrame = null;
    this.currentTime = 0;
    this.reset();
  }

  tick(){
    var i = this.currentFrame.index;

    i = (i < this.frames-1) ? i + 1 : 0;

    if(this.iterations > 0){
      if(i == 0){
        this.iterations--;
        if(this.iterations == 0){
          this.onEnd();
          this.reset();
          return;
        }
      }
    }

    this.currentFrame.x = this.width * i;
    this.currentFrame.y = (this.row+this.rowOffset)*this.height;
    this.currentFrame.index = i;
  }

  reset(){
    this.currentTime = 0;
    this.currentFrame = {index: 0, x: 0, y: (this.row+this.rowOffset)*this.height}
  }

  isAnimationTick(){
    return this.currentTime > this.speed;
  }

  update(dt){
    this.currentTime += dt;

    if(this.isAnimationTick()){
      this.currentTime = 0;
      this.tick();
    }
  }

  setSpeed(speed){
    this.speed = speed;
  }

  setIterations(iters, onEnd){
    this.iterations = iters;
    this.onEnd = onEnd;
  }
}

},{}],2:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

 var Game = require('./game'),
     Player = require('./player'),
     Socket = require('./socket');

 var game;

module.exports = App = class App{
  /**
   * Create the app that contains the game
   */
  constructor(){
    this.game = false;
    this.ready = false;

    this.setGame(new Game());

    Socket.on('connected', this.onConnected.bind(this));
  }

  /**
   * Set this app's game
   */
  setGame(game){
    this.game = game;
    this.ready = true;
  }

  /**
   * Start the game
   */
  start(){
    if(this.ready && this.game.player){
      this.game.start();
    }
  }

  /**
   * When the server confirms the connection
   */
  onConnected(message){
    if(this.game){
      this.game.setPlayer(new Player(message.id, 0, message.x, message.y, message.width, message.height));
      this.start();
    }
  }
}

},{"./game":6,"./player":10,"./socket":12}],3:[function(require,module,exports){


module.exports = Camera = class Camera{
  constructor(renderer){
    this.renderer = renderer;
    this.x = 0;
    this.y = 0;
    this.viewportWidth = renderer.stage.canvas.width/renderer.renderScale;
    this.viewportHeight = renderer.stage.canvas.height/renderer.renderScale;
    this.xDeadZone = 0;
    this.yDeadZone = 0;
  }

  follow(entity){
    this.entity = entity;
    this.xDeadZone = this.viewportWidth/2;
    this.yDeadZone = this.viewportHeight/2;
  }

  moveTo(x, y){
    this.x = x;
    this.y = y;
  }

  lookAt(entity){
    if(entity){
      this.x = entity.x;
      this.y = entity.y;
    }
  }

  isVisible(x, y){
    return (Math.abs(this.y - y) <= this.viewportHeight/this.renderer.renderScale
    && Math.abs(this.x - x) <= this.viewportWidth/this.renderer.renderScale)
  }

  setViewportSize(width, height){
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  update(){
    if(this.entity){
      if(this.entity.x - this.x  + this.xDeadZone > this.viewportWidth){
			  this.x = this.entity.x - (this.viewportWidth - this.xDeadZone);
      }
			else if(this.entity.x  - this.xDeadZone < this.x){
			   this.x = this.entity.x  - this.xDeadZone;
       }

      if(this.entity.y - this.y + this.yDeadZone > this.viewportHeight)
        this.y = this.entity.y - (this.viewportHeight - this.yDeadZone);
      else if(this.entity.y - this.yDeadZone < this.y)
        this.y = this.entity.y - this.yDeadZone;
    }

    if(this.x < 0) this.x = 0;
    if(this.y < 0) this.y = 0;
    if(this.y+this.viewportHeight > this.renderer.map.height)
      this.y = this.renderer.map.height-this.viewportHeight;
    if(this.x+this.viewportWidth > this.renderer.map.width)
      this.x = this.renderer.map.width-this.viewportWidth;
  }
}

},{}],4:[function(require,module,exports){
var Entity = require('./entity'),
    Types = require('../../shared/js/types');

module.exports = Character = class Character extends Entity{
  constructor(id, species, x,y, w, h){
    super(id, species, x, y, w, h);

    var self = this;

    this.direction = Types.Directions.DOWN;
    this.atkSpeed = 50;
    this.walkSpeed = 100;
    this.idleSpeed = 450;

    this.health = 0;
    this.maxHealth = 0;

    this.isDead = false;
  }

  animate(animation, speed, count, onEnd){
    if(this.currentAnimation && this.currentAnimation.name == "die"){
      return;
    }
    this.setAnimation(animation, speed, count, onEnd);
  }

  setDirection(dir){
    this.direction = dir;
  }

  updateMovement(){
    var lastPos = this.lastPos;

    if(lastPos[1] < this.y){
      this.walk(Types.Directions.DOWN);
      return;
    }
    if(lastPos[1] > this.y){
      this.walk(Types.Directions.UP);
      return;
    }
    if(lastPos[0] < this.x){
      this.walk(Types.Directions.RIGHT);
      return;
    }
    if(lastPos[0] > this.x){
      this.walk(Types.Directions.LEFT);
      return;
    }
    this.idle();
  }

  idle(){
    this.animate('idle', this.idleSpeed);
  }

  walk(direction){
    this.setDirection(direction);

    var self = this;
    this.animate('walk', this.walkSpeed, 0);
  }
}

},{"../../shared/js/types":20,"./entity":5}],5:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/9/17
 */

var Types = require('../../shared/js/types'),
    _ = require('underscore'),
    Sprite = require('./sprite'),
    Game = require('./game');

module.exports = Entity = class Entity{
  constructor(id, species, x, y, width, height){
    this.id = id;
    this.species = species;

    this.x = x || 0;
    this.y = y || 0;

    this.direction = Types.Directions.DOWN;

    this.width = width;
    this.height = height;

    this.lastPos = [this.x, this.y];

    this.sprite = null;
    this.animations = null;
    this.currentAnimation = null;

    this.canMove = true;
  }

  setPos(x, y){
    if(!this.canMove) return;
    this.lastPos = [this.x, this.y];
    this.x = x;
    this.y = y;
  }

  getDirectionFromVector(vector){
    if(vector.y == 1) return Types.Directions.DOWN;
    if(vector.y == -1) return Types.Directions.UP;
    if(vector.x == 1) return Types.Directions.RIGHT;
    if(vector.x == -1) return Types.Directions.LEFT;
  }

  setDirection(direction){
    this.direction =  direction;
    console.log(this.direction)
  }

  setSprite(sprite){
    if(!sprite){
      console.log('Missing a sprite.');
      return;
    }

    // This sprite is already the sprite
    if(this.sprite && this.sprite.name == sprite.name){
      return;
    }

    this.sprite = sprite;
    this.animations = sprite.createAnimations();

    var self = this;
  }

  getSprite(){
    return this.sprite;
  }

  getAnimationByName(name){
    return this.animations[name];
  }

  setAnimation(name, speed, count, endCount){
    var self = this;
    var directionBased = ["walk", "idle"];
    var rowOffset = 0;

    if(_.indexOf(directionBased, name) >= 0){
      name += '_' + this.direction;
    }

    if(this.currentAnimation && this.currentAnimation.name === name){
      return;
    }

    var anim = this.getAnimationByName(name);
    if(anim){
      anim.row = anim.row;
      anim.rowOffset = rowOffset;
      this.currentAnimation = anim;
      this.currentAnimation.setSpeed(speed);
      this.currentAnimation.setIterations(count ? count : 0, endCount || function(){
        self.idle();
      })
    }
  }

  freeze(){
    this.canMove = false;
  }

  unfreeze(){
    this.canMove = true;
  }
}

},{"../../shared/js/types":20,"./game":6,"./sprite":13,"underscore":19}],6:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Input = require('./input'),
    Renderer = require('./renderer'),
    Updater = require('./updater'),
    Types = require('../../shared/js/types'),
    Socket = require('./socket'),
    _ = require('underscore'),
    Map = require('./map');

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
   * Start the game and its loop
   */
  start(){
    // Make sure there is a player
    if(!this.player) return false;

    this.started = true;
    this.running = true;
    this.renderer = new Renderer(this, "canvas");
    this.currentMap = new Map('septoria');
    this.renderer.setMap(this.currentMap);
    this.updater = new Updater(this);
    Input.init();

    // Update every loop
    this.tick();
  }

  /**
   * Set this games player (the client's player)
   *
   * @param {Object} player The player object that belongs to this client
   */
  setPlayer(player){
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
        }else{
          // Other entity
          this.receiveMove(message);
        }
      }
      else if(message.type == Types.Messages.LIST){
        this.receiveEntityList(message.list);
      }
      else if(message.type == Types.Messages.SPAWN){
        if(message.id != this.player.id)
          this.receiveSpawn(message);
      }
      else if(message.type == Types.Messages.DESPAWN){
        this.receiveDespawn(message);
      }
      else if(message.type == Types.Messages.TRANSITION){
        this.switchMap(message);
      }
      this.mailbox.splice(i,1);
    }
  }

  receiveEntityList(list){
    var entityIds = _.pluck(this.entities, 'id');
    var alreadySeen = _.intersection(this.entityIds, list);
    var notSeen = _.difference(list, alreadySeen);
    var self = this;

    this.entitiesToPrune = _.reject(this.entities, function(entity){
      return _.contains(this.alreadySeen, entity) || entity.id == self.player.id;
    });

    this.pruneEntities();

    if(_.size(notSeen) > 0){
      this.askWhoAre(notSeen);
    }
  }

  receiveMove(message){
    var entity = this.entities[message.id];

    if(!entity){
      return;
    }

    entity.setPos(message.x, message.y);
  }

  receiveSpawn(message){
    if(this.entities[message.id]){
      return;
    }
    this.entities[message.id] = new Character(message.id, message.species, message.x, message.y, message.w, message.h);
    var entity = this.entities[message.id];

    entity.setDirection(message.direction);
    var sprite = new Sprite(Types.speciesAsString(entity.species));

    sprite.image.on("mouseover", function(){
      sprite.image.shadow = new createjs.Shadow("#555555", 0,0,10)
    });

    sprite.image.on("mouseout", function(){
      sprite.image.shadow = null;
    });

    entity.setSprite(sprite);
    entity.idle();
  }

  receiveDespawn(message){
    if(message.id != this.player.id)
      delete this.entities[message.id];
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  tick(){
    this.updater.update();
    this.renderer.render();

    if(this.running)
      window.requestAnimationFrame(this.tick.bind(this));
  }

  askWhoAre(list){
    var message = new Message(Types.Messages.WHO, list);
    message.send();
  }

  switchMap(message){
    if(message.map && message.map != this.currentMap.name){
      this.player.freeze();
      this.renderer.fadeTo(500, 'black', function(){
        this.currentMap = new Map(message.map);
        this.player.unfreeze();
        this.player.setPos(message.x, message.y);
        this.renderer.setMap(this.currentMap);
        this.renderer.fadeFrom(200, 'black');
      }.bind(this));
    }
  }
}

},{"../../shared/js/types":20,"./input":7,"./map":8,"./renderer":11,"./socket":12,"./updater":15,"underscore":19}],7:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

var Types = require('../../shared/js/types')

module.exports = Input = {};

var STATE = null;
var DOWN = true;
var UP = false;

/**
 * Update the state of the given key to the given value (UP/DOWN)
 * @param  {number} keyCode The keycode of the key that triggered the event
 * @param  {boolean} val    Wether the key is up or down (false/true)
 */
Input.onKeyEvent = function(keyCode, val){
  var state = Input.getState();

  switch(keyCode){
    case 87:  // up
      state.up = val;
      break;
    case 83: // down
      state.down = val;
      break;
    case 65: // left
      state.left = val;
      break;
    case 68: // right
      state.right = val;
      break;
  }
}

/**
 * Get the movement vector based on the current state of input
 * @return {Object}   The movement vector
 */
Input.getMovementVector = function(){
  state = Input.getState();
  vector = {x: 0, y: 0};

  if(state.up) vector.y = -1;
  else if(state.down) vector.y = 1;
  if(state.left) vector.x = -1;
  else if(state.right) vector.x = 1;

  return vector;
}

/**
 * The default way that the input state starts
 * @return {[type]} [description]
 */
Input.baseState = function(){
  return {
    up: false,
    down: false,
    left: false,
    right: false
  }
}

/**
 * Get the current input state
 * @return {Object} the current input state
 */
Input.getState = function(){
  return STATE;
}

/**
 * Reset the current input state
 */
Input.reset = function(){
  STATE = Input.baseState();
}

/**
 * Initialize the input state, start listening for key events
 */
Input.init = function(){
  STATE = Input.baseState();

  document.onkeydown = function(event){
    Input.onKeyEvent(event.keyCode, DOWN);
  }

  document.onkeyup = function(event){
    Input.onKeyEvent(event.keyCode, UP);
  }
}

},{"../../shared/js/types":20}],8:[function(require,module,exports){
var _ = require('underscore'),
    Types = require('../../shared/js/types');

var maps = {
  septoria: {json: require('../../shared/maps/septoria.json'), lowImage: 'client/assets/maps/septoria.bmp', highImage: 'client/assets/maps/septoria-high.png'},
  map0: {json: require('../../shared/maps/map0.json'), lowImage: 'client/assets/maps/map0.png', highImage: 'client/assets/maps/map0-high.png'}
}

module.exports = Map = class Map{
  constructor(name){
    this.name = name;
    this.json = maps[name]['json'];
    this.isLoaded = false;

    this.loadJSON();
  }

  loadJSON(){
    if(!this.json){
      return;
    }

    var json = this.json;

    this.lowImage = new createjs.Bitmap(maps[this.name]['lowImage']);
    this.highImage = new createjs.Bitmap(maps[this.name]['highImage'])

    var collisionLayer = this.getLayerWithProperty('collision');
    var collisionTiles = this.getTilesetWithProp('properties');
    this.collisionData = collisionLayer ? collisionLayer.data : [];
    this.collisionId = collisionTiles ? this.getTileIdWithProperty('collision', collisionTiles) : -1;
    this.doorId = collisionTiles ? this.getTileIdWithProperty('door', collisionTiles) : -1;

    this.tileWidth = json.tilewidth;
    this.tileHeight = json.tileheight;
    this.width = this.tileWidth*json.width;
    this.height = this.tileHeight*json.height;

    this.isLoaded = true;
  }

  loadTilesets(){
    var tilesetsData = this.json.tilesets;
    var tilesets = {};
    _.each(tilesetsData, function(tileset){
      tilesets[tileset.name] = new createjs.Bitmap(tilesetsData.image);
    });

    return tilesets;
  }

  getTilesetData(name){
    for(var i in this.json.tilesets){
      var tileset = this.json.tilesets[i];
      if(tileset.name == name) return tileset;
    }
  }

  getTilesetImage(name){
    return this.tilesets[name];
  }

  findLayerByName(name){
    for(var i in this.json.layers){
      if(this.json.layers[i].name == name){
        return this.json.layers[i];
      }
    }
  }

  worldPosToTileIndex(x, y){
    var tileX = Math.floor(x/this.tileWidth);
    var tileY = Math.floor(y/this.tileHeight);

    return tileX + tileY * (this.height/this.tileHeight);
  }

  isColliding(coords){
    var self = this;

    if(this.checkCollisions(coords[0], coords[1])) return true;
    if(this.checkCollisions(coords[0], coords[2])) return true;
    if(this.checkCollisions(coords[1], coords[3])) return true;
    if(this.checkCollisions(coords[2], coords[3])) return true;

    return false;
  }

  checkCollisions(pos1, pos2){
    var x1 = pos1[0],
        x2 = pos2[0],
        y1 = pos1[1],
        y2 = pos2[1];

    while(x1 < x2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0){
        if(this.collisionData[index] == this.collisionId)
          return Types.Collisions.WALL;
        if(this.collisionData[index] == this.doorId)
          return Types.Collisions.DOOR;
      }
      x1 += this.tileWidth;
    }

    while(y1 <= y2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0){
        if(this.collisionData[index] == this.collisionId)
          return Types.Collisions.WALL;
      }
      y1 += this.tileWidth;
    }

    return false;
  }

  nearestTilePositions(entity){
    var index = 0;

    var leftX = entity.x;
    var topY = entity.y+entity.height/2;
    var rightX = entity.x + entity.width;
    var bottomY = entity.y + entity.height;

    var corners = [];
    corners[0] = [leftX, topY];
    corners[1] = [rightX, topY];
    corners[2] = [leftX, bottomY];
    corners[3] = [rightX, bottomY];

    return corners;
  }

  getLayerWithProperty(name){
    for(var i in this.json.layers){
      var layer = this.json.layers[i];
      if(!layer.properties) continue;
      if(layer.properties[name]) return layer;
    }
  }

  getTilesetWithProp(prop){
    for(var i in this.json.tilesets){
      var tileset = this.json.tilesets[i];
      if(!tileset.properties) continue;
      if(tileset.properties[prop]) return tileset;
    }
  }

  getTileIdWithProperty(prop, tileset){
    var properties = tileset.tileproperties;

    for(var i in properties){
      if(properties[i][prop]) return parseInt(i)+tileset.firstgid;
    }

    return false;
  }
}

},{"../../shared/js/types":20,"../../shared/maps/map0.json":21,"../../shared/maps/septoria.json":22,"underscore":19}],9:[function(require,module,exports){
/**
 * @author Will Taylor
 *
 * Message Format:
 * {
 *   'type': [type],
 *   'data': {
 *     [data]
 *   }
 * }
 */

var Socket = require('./socket');

module.exports = Message = class Message{
  /**
   * Create a new message
   * @param {number} type   The type of message this is
   * @param {Object} data   The message contents
   */
  constructor(type, data){
    this.message = {
      type: type,
      data: data
    }
  }

  /**
   * Send the message
   */
  send(){
    Socket.emit('message', this.message);
  }
}

},{"./socket":12}],10:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/2/17
 *
 * Client-side prediction based on Gabriel Gambetta's article on the matter
 * http://www.gabrielgambetta.com/fpm2.html
 */

var Character = require('./character'),
    Message = require('./message');

/**
 * Player class, keeps track of player position, movement, etc.
 */
module.exports = Player = class Player extends Character{
  /**
   * Create a new player
   * @param {String} path File path of the sprite to be drawn
   */
  constructor(id, sprite, x, y, width, height){
    super(id, Types.Entities.PLAYER, x, y, width, height)

    // Player movement variables
    this.speed = 10;

    // Variables for client-side prediction
    this.pending_inputs = []
    this.input_seq = 0;

    this.setSprite(new Sprite("player"));

    this.idle();
  }

  setGame(game){
    this.game = game;
  }

  /**
   * Apply the given input to the character
   *
   * @param {Object} input  The input to be applied
   */
  applyInput(input){
    if(!this.canMove) return;

    var map = this.game.currentMap;
    this.x += vector.x*input.pressTime*this.speed;
    var collision = map.isColliding(map.nearestTilePositions(this));
    if(collision){
      if(collision == Types.Collisions.WALL){
        this.x = this.lastPos[0];
      }else{
        this.handleCollision(collision);
      }
    }

    this.y += vector.y*input.pressTime*this.speed;
    var collision = map.isColliding(map.nearestTilePositions(this));
    if(collision == Types.Collisions.WALL){
      this.y = this.lastPos[1];
    }else{
      this.handleCollision(collision);
    }
  }

  handleCollision(collision){
    switch(collision){
    }
  }

  onMove(message){
    this.setPos(message.x, message.y);
    // Preform reconciliation
    var k = 0;
    while (k < this.pending_inputs.length){
      var input = this.pending_inputs[k];
      // Check if this input has already been processed client side
      if(input.seq <= message.lastProcessedInput){
        // This input has been processed by the server
        // Therefore there is no need to reapply it
        this.pending_inputs.splice(k,1);
      }
      else{
        // This input has not been processed by the server yet
        // Reapply it
        this.applyInput(input);
        k++;
      }
    }
  }

  /**
   * Update logic for the players
   *
   * @param {number} dt Delta time: time passed since last update
   */
  update(dt){
    // Check which commands were issued, package it
    var input;

    // The vector defining which direction we are moving in
    var movementVector = Input.getMovementVector();

    // The type of input
    var inputType;

    // If there is movement vector will not be [0,0]
    if(movementVector.x != 0 || movementVector.y != 0){
      input = {pressTime: dt/100, vector: movementVector}
    }

    if(input){
      // Send the input package to the server
      input.seq = this.input_seq++;

      var message = new Message(Types.Messages.MOVE, input);
      message.send();

      this.applyInput(input);

      // Save input to validated later
      this.pending_inputs.push(input);
    }
  }
}

},{"./character":4,"./message":9}],11:[function(require,module,exports){
var _ = require('underscore'),
    Camera = require('./camera'),
    App = require('./app');

module.exports = Renderer = class Renderer{
  constructor(game, canvas){
    this.game = game;
    this.stage = new createjs.Stage(canvas);
    this.map = null;

    this.FPS = 60;
    this.tileSize = 8;

    this.lastTime = new Date();
    this.frameCount = 0;
    this.MAX_FPS = this.FPS;
    this.realFPS = 0;
    this.renderScale = 2;

    this.stage.scaleX = this.stage.scaleY = this.renderScale;

    this.font = "Macondo";

    this.createCamera();

    this.transitions = []

    this.options = {
      SHOW_FPS: false,
      DRAW_BOUNDING_BOX: false,
      MOUSEOVER: true,
    }

    this.stage.enableMouseOver();
  }

  setOption(option, state){
    this.options[option] = state;

  }

  getWidth(){
    return this.stage.canvas.width;
  }

  getHeight(){
    return this.stage.canvas.height;
  }

  setMap(map){
    if(map)
      this.map = map;
  }

  createCamera(){
    this.camera = new Camera(this);
    this.camera.follow(this.game.player);
  }

  drawText(text, x, y, centered, color, strokeColor, fontSize){
    var stage = this.stage;

    if(text && x && y){
      var textToDraw = new createjs.Text(text);
      var font = (fontSize || "10px") + " " + this.font;
      textToDraw.font = font;
      textToDraw.x = x;
      textToDraw.y = y;
      textToDraw.color = color || "#fff";

      if(strokeColor){
        var stroke = textToDraw.clone();
        stroke.outline = 3;
        stroke.color = strokeColor;
        stage.addChild(stroke);
      }

      stage.addChild(textToDraw);
    }
  }

  drawFPS(){
    var curTime = new Date();
    var diff = curTime.getTime() - this.lastTime.getTime();

    if(diff >= 1000){
      this.realFPS = this.frameCount;
      this.frameCount = 0;
      this.lastTime = curTime;
    }

    this.frameCount++;

    this.drawText("FPS: " + this.realFPS, 10, 10, false, "#ff0", "#000");
  }

  drawEntity(entity){
    var sprite = entity.sprite,
        anim = entity.currentAnimation,
        stage = this.stage;

    if(anim && sprite){
      var frame = anim.currentFrame,
          x = frame.x,
          y = frame.y,
          width = sprite.width,
          height = sprite.height;

      sprite.image.sourceRect = new createjs.Rectangle(x, y, width, height);
      sprite.image.x = entity.x - this.camera.x;
      sprite.image.y = entity.y - this.camera.y;
      sprite.image.scaleX = Math.min(sprite.width/entity.width, entity.width/sprite.width);
      sprite.image.scaleY = Math.min(sprite.height/entity.height, entity.height/sprite.height);
      stage.addChild(sprite.image);

      if(entity == this.game.player && this.options.DRAW_BOUNDING_BOX)
        this.drawBoundingBox(entity);
    }
  }

  drawBoundingBox(entity){
    var self = this;
    var graphics = new createjs.Graphics()
      .beginStroke("#ffff00")
      .drawRect(entity.x+this.map.tileWidth/2, entity.y+entity.height/2,
        entity.width-this.map.tileWidth, entity.height/2);
    var shape = new createjs.Shape(graphics);
    self.stage.addChild(shape)
  }

  drawMapLow(){
    if(this.map && this.camera){
      var image = this.map.lowImage;
      image.sourceRect = new createjs.Rectangle(this.camera.x, this.camera.y,
        this.camera.viewportWidth, this.camera.viewportHeight)
      this.stage.addChild(image);
    }
  }

  drawMapHigh(){
    if(this.map && this.camera){
      var image = this.map.highImage;
      image.sourceRect = new createjs.Rectangle(this.camera.x, this.camera.y,
        this.camera.viewportWidth, this.camera.viewportHeight);
      this.stage.addChild(image);
    }
  }

  drawEntities(){
    var self = this;
    var entities = this.game.entities;

    _.each(entities, function(entity){
      self.drawEntity(entity);
    });
  }

  updateTransition(){
    if(this.transitions.length == 0) return;
    var effect = this.transitions[0];
    effect.tick();
    if(effect.isDone){
      this.transitions.shift();
    }
    this.stage.addChild(effect.shape);
  }

  render(){
    this.stage.removeAllChildren();
    this.drawMapLow();
    this.drawEntities();
    this.drawMapHigh();
    this.updateTransition();
    if(this.options.SHOW_FPS) this.drawFPS();
    this.stage.update();
  }

  fadeToFrom(duration, color, callback){
    var self = this;
    this.fadeTo(duration/2, color, function(){
      self.fadeFrom(duration/2, color, callback)
    });
  }

  fadeTo(duration, color, callback){
    var color = color || 'black';
    var duration = duration || 500;
    var graphics = new createjs.Graphics()
      .beginFill("#000")
      .drawRect(0,0,this.getWidth(),this.getHeight());
    var shape = new createjs.Shape(graphics);
    shape.alpha = 0;
    this.transitions.push(new Fade(shape, duration, callback));
  }

  fadeFrom(duration, color, callback){
    var color = color || 'black';
    var duration = duration || 500;
    var graphics = new createjs.Graphics()
      .beginFill("#000")
      .drawRect(0,0,this.getWidth(),this.getHeight());
    var shape = new createjs.Shape(graphics);
    shape.alpha = 1;
    this.transitions.push(new Fade(shape, duration, callback));
  }
}

class Fade {
  constructor(shape, duration, callback){
    this.dur = duration;
    this.current = 0;
    this.shape = shape;
    this.rate = shape.alpha>0 ? 1/this.dur * -1 : 1/this.dur;

    this.isDone = false;

    this.lastTime = Date.now();

    this.callback = callback;
    this.started = false;

    console.log('fade ready')
  }

  tick(){
    if(!this.started){
      this.started = true;
      console.log('fade started')
      this.lastTime = Date.now();
    }
    var now = Date.now();
    var dt = now - this.lastTime;
    this.lastTime = now;

    if(this.current >= this.dur){
      this.isDone = true;
      console.log('fade done')
      if(this.callback) this.callback();
      return;
    }

    this.shape.alpha += this.rate * dt;

    this.current += dt;
  }
}

},{"./app":2,"./camera":3,"underscore":19}],12:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/7/17
 */

module.exports = Socket = class Socket{};
var socket = io();

Socket.emit = function(type, data){
  socket.emit(type, data);
}

Socket.on = function(evnt, callback){
  socket.on(evnt, function(data){
    callback(data);
  });
}

},{}],13:[function(require,module,exports){
var sprites = require('./sprites').init(),
    Animation = require('./animation');

module.exports = Sprite = class Sprite{
  constructor(name){
    this.name = name;
    this.loadJSON(sprites[name]);
  }

  loadJSON(json){
    this.id = json.id;
    this.path = json.image;
    this.animations = json.animations;
    this.width = json.width;
    this.height = json.height;

    this.load();
  }

  load(){
    this.image = new createjs.Bitmap(this.path);
  }

  createAnimations(){
    var animations = {};

    for(var name in this.animations){
      var anim = this.animations[name];
      animations[name] = new Animation(name, anim.frames, anim.row, this.width, this.height);
    }

    return animations;
  }
}

},{"./animation":1,"./sprites":14}],14:[function(require,module,exports){
var _ = require('underscore'),
    paths = [
      require("../sprites/player.json"),
      require("../sprites/ogre.json")
    ]

module.exports = Sprites = {
  init: function(){
    var sprites = {};

    _.each(paths, function(json){
      sprites[json.id] = json;
    });

    return sprites;
  }
};

},{"../sprites/ogre.json":17,"../sprites/player.json":18,"underscore":19}],15:[function(require,module,exports){
var _ = require('underscore')

module.exports = Updater = class Updater{
  constructor(game){
    this.game = game;
    this.lastTime = new Date().getTime();
  }

  update(){
    var currentTime = new Date().getTime();
    var dt = currentTime - this.lastTime;
    this.lastTime = currentTime;

    this.game.readServerMessages();
    this.updateEntities(dt);
    if(this.game.renderer.camera)
      this.game.renderer.camera.update();
  }

  updatePlayer(dt){
    var player = this.game.player;
    player.update(dt);
  }

  updateEntities(dt){
    var self = this;
    _.each(this.game.entities, function(entity){
      if(entity instanceof Character) self.updateCharacter(entity, dt);
      self.updateAnimation(entity, dt);
    });
  }

  updateCharacter(entity, dt){
    if(entity == this.game.player) this.updatePlayer(dt);
    entity.updateMovement();
    entity.lastPos = [entity.x, entity.y];
  }

  updateAnimation(entity, dt){
    var anim = entity.currentAnimation;

    if(anim){
      anim.update(dt);
    }
  }
}

},{"underscore":19}],16:[function(require,module,exports){
"use strict"

var App = require('./js/app');

$(document).ready(function(){
  var app = new App();
});

},{"./js/app":2}],17:[function(require,module,exports){
module.exports={
  "id": "ogre",
  "width": 32,
  "height": 64,
  "animations": {
    "walk": {
      "frames": 4,
      "row": 0
    },

    "atk": {
      "frames": 4,
      "row": 4
    }
  }
}

},{}],18:[function(require,module,exports){
module.exports={
  "id": "player",
  "width": 48,
  "height": 64,
  "image": "client/assets/players/sprite_000c.png",
  "animations": {
    "idle_0": {
      "frames": 1,
      "row": 0
    },
    "idle_1": {
      "frames": 1,
      "row": 1
    },
    "idle_2": {
      "frames": 1,
      "row": 2
    },
    "idle_3": {
      "frames": 1,
      "row": 3
    },
    "walk_0": {
      "frames": 4,
      "row": 0
    },
    "walk_1": {
      "frames": 4,
      "row": 1
    },
    "walk_2": {
      "frames": 4,
      "row": 2
    },
    "walk_3": {
      "frames": 4,
      "row": 3
    },
    "atk": {
      "frames": 4,
      "row": 4
    }
  }
}

},{}],19:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],20:[function(require,module,exports){
/**
 * @author Will Taylor
 * Created on: 4/6/17
 *
 * Heavily based on Mozilla's BrowserQuest
 */

/**
 * Enumeration of enumerations.
 * Contains details such as message types, directions, etc.
 * @type {Object}
 */
Types = {
  Messages: {
    LOGIN: 0,
    LOGOUT: 1,
    MOVE: 2,
    SPAWN: 3,
    ATTACK: 4,
    LIST: 5,
    WHO: 6,
    DESPAWN: 7,
    TRANSITION: 8
  },

  Entities: {
    PLAYER: 0
  },

  Directions: {
    UP: 1,
    DOWN: 0,
    LEFT: 3,
    RIGHT: 2
  },

  Collisions: {
    DOOR: 0,
    WALL: 1
  }
}

var speciesList = {
  player: [Types.Entities.PLAYER, "player"],

  getGenus: function(species){
    return speciesList[species][1];
  }
}

Types.speciesAsString = function(species){
  for(var s in speciesList) {
    if(speciesList[s][0] === species) {
        return s;
    }
}
}

Types.isPlayer = function(species){
  return speciesList.getGenus[species] == "player";
}

Types.isCharacter = function(species){
  return Types.isPlayer(species);
}

if(!(typeof exports === 'undefined')){
  module.exports = Types;
}

},{}],21:[function(require,module,exports){
module.exports={ "height":50,
 "layers":[
        {
         "data":[3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011, 3011],
         "height":50,
         "name":"Tile Layer 1",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        },
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3963, 3964, 3965, 3966, 3967, 3968, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4027, 4028, 4029, 4030, 4031, 4032, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4091, 4092, 4093, 4094, 4095, 4096, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":50,
         "name":"Tile Layer 2",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        },
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3643, 3644, 3645, 3646, 3647, 3648, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3707, 3708, 3709, 3710, 3711, 3712, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3771, 3772, 3773, 3774, 3775, 3776, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3835, 3836, 3837, 3838, 3839, 3840, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3899, 3900, 3901, 3902, 3903, 3904, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3963, 3964, 3965, 3966, 3967, 3968, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":50,
         "name":"high",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        },
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4097, 4097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":50,
         "name":"collision",
         "opacity":0.490000009536743,
         "properties":
            {
             "collision":true
            },
         "propertytypes":
            {
             "collision":"bool"
            },
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        },
        {
         "draworder":"topdown",
         "height":0,
         "name":"entrances",
         "objects":[
                {
                 "height":16,
                 "id":1,
                 "name":"0",
                 "rotation":0,
                 "type":"",
                 "visible":true,
                 "width":16,
                 "x":240,
                 "y":80
                }],
         "opacity":1,
         "type":"objectgroup",
         "visible":true,
         "width":0,
         "x":0,
         "y":0
        }],
 "nextobjectid":2,
 "orientation":"orthogonal",
 "renderorder":"left-down",
 "tileheight":16,
 "tilesets":[
        {
         "columns":64,
         "firstgid":1,
         "image":"..\/..\/client\/assets\/tilesets\/terrain_atlas.png",
         "imageheight":1024,
         "imagewidth":1024,
         "margin":0,
         "name":"terrain_atlas",
         "spacing":0,
         "tilecount":4096,
         "tileheight":16,
         "tilewidth":16
        },
        {
         "columns":2,
         "firstgid":4097,
         "image":"..\/..\/client\/assets\/tilesets\/collision.png",
         "imageheight":16,
         "imagewidth":32,
         "margin":0,
         "name":"collision",
         "properties":
            {
             "properties":true
            },
         "propertytypes":
            {
             "properties":"bool"
            },
         "spacing":0,
         "tilecount":2,
         "tileheight":16,
         "tileproperties":
            {
             "0":
                {
                 "collision":true
                },
             "1":
                {
                 "door":true
                }
            },
         "tilepropertytypes":
            {
             "0":
                {
                 "collision":"bool"
                },
             "1":
                {
                 "door":"bool"
                }
            },
         "tilewidth":16
        }],
 "tilewidth":16,
 "version":1,
 "width":50
}

},{}],22:[function(require,module,exports){
module.exports={ "height":50,
 "layers":[
        {
         "data":[806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 1088, 1089, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 1087, 1152, 1153, 1090, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 1152, 1153, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 1152, 1153, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 806, 807, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871, 870, 871],
         "height":50,
         "name":"0",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        }, 
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1088, 0, 0, 1088, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1086, 0, 0, 0, 0, 1091, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2092, 2093, 2094, 2095, 2096, 2097, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2156, 2157, 2158, 2159, 2160, 2161, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2220, 2221, 2222, 2223, 2224, 2225, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2284, 2285, 2286, 2287, 2288, 2289, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2348, 2349, 2350, 2351, 2352, 2353, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2412, 2413, 2414, 2415, 2416, 2417, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":50,
         "name":"Tile Layer 4",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        }, 
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 666, 667, 668, 669, 670, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 732, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 732, 733, 732, 733, 732, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 732, 733, 732, 733, 732, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 733, 732, 733, 732, 796, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 796, 797, 796, 797, 796, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 796, 797, 796, 797, 796, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 797, 796, 797, 796, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 861, 860, 861, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 860, 861, 860, 860, 860, 860, 860, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 925, 924, 925, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 924, 925, 924, 924, 924, 924, 924, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 1372, 1373, 1374, 1375, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 988, 989, 988, 988, 988, 988, 988, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1436, 1437, 1438, 1439, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1052, 1053, 1052, 1052, 1052, 1052, 1052, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1500, 1501, 1502, 1503, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1116, 1117, 1116, 1116, 1116, 1116, 1116, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1564, 1565, 1566, 1567, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1180, 1181, 1180, 1180, 1180, 1180, 1180, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1086, 1087, 1088, 1089, 1090, 1091, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1150, 1151, 1152, 1153, 1154, 1155, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 1214, 1215, 1216, 1217, 1218, 1219, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 1278, 1279, 1280, 1281, 1282, 1283, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1756, 1757, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":50,
         "name":"Tile Layer 3",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        }, 
        {
         "data":[664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 665, 665, 665, 665, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 0, 0, 0, 0, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 664, 664, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 664, 664, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":50,
         "name":"collision",
         "opacity":0.5,
         "properties":
            {
             "collision":true
            },
         "propertytypes":
            {
             "collision":"bool"
            },
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        }, 
        {
         "data":[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1692, 1693, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
         "height":50,
         "name":"high",
         "opacity":1,
         "type":"tilelayer",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        }, 
        {
         "draworder":"topdown",
         "height":50,
         "name":"doors",
         "objects":[
                {
                 "height":16,
                 "id":1,
                 "name":"map0_0",
                 "properties":
                    {
                     "entrance_id":0,
                     "map":"map0"
                    },
                 "propertytypes":
                    {
                     "entrance_id":"int",
                     "map":"string"
                    },
                 "rotation":0,
                 "type":"Door",
                 "visible":true,
                 "width":64,
                 "x":224,
                 "y":160
                }],
         "opacity":1,
         "type":"objectgroup",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        }, 
        {
         "draworder":"topdown",
         "height":50,
         "name":"entrances",
         "objects":[
                {
                 "height":16,
                 "id":5,
                 "name":"0",
                 "properties":
                    {
                     "id":0
                    },
                 "propertytypes":
                    {
                     "id":"int"
                    },
                 "rotation":0,
                 "type":"Entrance",
                 "visible":true,
                 "width":16,
                 "x":240,
                 "y":192
                }],
         "opacity":1,
         "type":"objectgroup",
         "visible":true,
         "width":50,
         "x":0,
         "y":0
        }],
 "nextobjectid":32,
 "orientation":"orthogonal",
 "renderorder":"left-down",
 "tileheight":16,
 "tilesets":[
        {
         "columns":51,
         "firstgid":1,
         "image":"..\/..\/client\/assets\/tilesets\/tiles.png",
         "imageheight":208,
         "imagewidth":816,
         "margin":0,
         "name":"tiles",
         "spacing":0,
         "tilecount":663,
         "tileheight":16,
         "tiles":
            {
             "225":
                {
                 "objectgroup":
                    {
                     "draworder":"index",
                     "height":0,
                     "name":"",
                     "objects":[],
                     "opacity":1,
                     "properties":
                        {
                         "collision":"1"
                        },
                     "propertytypes":
                        {
                         "collision":"string"
                        },
                     "type":"objectgroup",
                     "visible":true,
                     "width":0,
                     "x":0,
                     "y":0
                    }
                }
            },
         "tilewidth":16
        }, 
        {
         "columns":2,
         "firstgid":664,
         "image":"..\/..\/client\/assets\/tilesets\/collision.png",
         "imageheight":16,
         "imagewidth":32,
         "margin":0,
         "name":"collision",
         "properties":
            {
             "properties":true
            },
         "propertytypes":
            {
             "properties":"bool"
            },
         "spacing":0,
         "tilecount":2,
         "tileheight":16,
         "tileproperties":
            {
             "0":
                {
                 "collision":true,
                 "door":false
                },
             "1":
                {
                 "door":true
                }
            },
         "tilepropertytypes":
            {
             "0":
                {
                 "collision":"bool",
                 "door":"bool"
                },
             "1":
                {
                 "door":"bool"
                }
            },
         "tilewidth":16
        }, 
        {
         "columns":64,
         "firstgid":666,
         "image":"..\/..\/client\/assets\/tilesets\/terrain_atlas.png",
         "imageheight":1024,
         "imagewidth":1024,
         "margin":0,
         "name":"terrain_atlas",
         "spacing":0,
         "tilecount":4096,
         "tileheight":16,
         "tilewidth":16
        }],
 "tilewidth":16,
 "version":1,
 "width":50
}
},{}]},{},[16]);
