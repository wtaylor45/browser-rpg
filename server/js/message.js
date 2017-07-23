/**
* @author Will Taylor
* Created on: 4/7/17
*/

var cls = require('./lib/class');

var Messages = {};

module.exports = Messages;

var Message = cls.Class.extend({});

Messages.Move = Message.extend({
  /**
  * Create a new message
  * @param  {Object} entity The entity sending the message
  */
  init: function(entity){
    this.entity = entity;
  },

  /**
  * Save and get the message contents to be sent
  * @return {Object} The message contents
  */
  serialize: function(){
    var message = {
      type: Types.Messages.MOVE,
      id: this.entity.id,
      x: this.entity.x,
      y: this.entity.y,
      dir: this.entity.direction,
      time: Date.now()
    }
    if(this.entity.genus == 'player') message.lastProcessedInput = this.entity.lastProcessedInput;

    return message;
  }
})

Messages.List = Message.extend({
  init: function(ids){
    this.ids = ids;
  },

  serialize: function(){
    return {
      type: Types.Messages.LIST,
      list: this.ids
    }
  }
});

Messages.Spawn = Message.extend({
  init: function(entity){
    if(!entity) throw "No entity assined to Spawn message.";
    this.entity = entity;
  },

  serialize: function(){
    var message = {type: Types.Messages.SPAWN};
    var state = this.entity.getState();

    for(var i in state){
      message[i] = state[i];
    }

    message.time = Date.now();

    return message;
  }
});

Messages.Despawn = Message.extend({
  init: function(id){
    this.id = id;
  },

  serialize: function(){
    return {
      type: Types.Messages.DESPAWN,
      id: this.id
    }
  }
});

Messages.Transition = Message.extend({
  init: function(map, pos){
    this.map = map;
    this.pos = pos;
  },

  serialize: function(){
    return {
      type: Types.Messages.TRANSITION,
      map: this.map,
      x: this.pos[0],
      y: this.pos[1]
    }
  }
})

Messages.Chat = Message.extend({
  init: function(chat, sender){
    this.chat = chat;
    this.sender = sender;
  },

  serialize: function(){
    return {
      type: Types.Messages.CHAT,
      sender: this.sender,
      chat: this.chat
    }
  }
})

Messages.Notification = Message.extend({
  init: function(message){
    this.message = message;
  },

  serialize: function(){
    return {
      type: Types.Messages.NOTIFICATION,
      message: this.message
    }
  }
})

Messages.Damage = Message.extend({
  init: function(newHealth, damageDealt){
    this.newHealth = newHealth;
    this.damageDealt = damageDealt;
  },

  serialize: function(){
    return {
      type: Types.Messages.DAMAGE,
      newHealth: this.newHealth,
      damageDealt: this.damageDealt
    }
  }
})

Messages.Heal = Message.extend({
  init: function(target, newHealth, healthGiven){
    this.target = target;
    this.newHealth = newHealth;
    this.healthGiven = healthGiven;
  },

  serialize: function(){
    return {
      type: Types.Messages.HEAL,
      target: this.target,
      newHealth: this.newHealth,
      healthGiven: this.healthGiven
    }
  }
})
