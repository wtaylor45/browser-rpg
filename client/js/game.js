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
    Map = require('./map'),
    Input = require('./input'),
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

    document.getElementById('chatform').onsubmit = function(e){
      e.preventDefault();

      var chatinput = document.getElementById('chatinput');
      if(chatinput.value != ""){
        var message = sanitize(chatinput.value);
        var chat = self.player.name+": " + chatinput.value;
        self.receiveChat(chat, self.player.id);

        new Message(Types.Messages.CHAT, chat).send();
      }
      chatinput.blur();
      chatinput.value = "";
    }

    document.getElementById('chatinput').onfocus = function(){
      Input.setListening(false);
      Input.reset();
    }

    document.getElementById('chatinput').onblur = function(){
      Input.setListening(true);
    }
  }

  /**
   * Start the game and its loop
   */
  start(){
    // Make sure there is a player
    if(!this.player) return false;

    this.started = true;
    this.running = true;
    this.setFrozen(false);

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
      else if(message.type == Types.Messages.CHAT){
        this.receiveChat(message.chat, message.sender);
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

    this.entities[message.id] = new Character(message.id, message.name,
      message.species, message.x, message.y, message.w, message.h);
    var entity = this.entities[message.id];

    entity.setDirection(message.direction);
    var sprite = new Sprite(Types.speciesAsString(entity.species));

    sprite.image.on("mouseover", function(){
      entity.drawName = true;
    });

    sprite.image.on("mouseout", function(){
      entity.drawName = false;
    });

    entity.setSprite(sprite);
    entity.idle();
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

  isFrozen(){
    return this.freeze;
  }

  setFrozen(state){
    this.freeze = state;
  }

  /**
   * The logic to run every loop
   *
   * @param {number} dt Delta time, time since last loop
   */
  tick(){
    if(!this.isFrozen()) this.updater.update();
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
}
