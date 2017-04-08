var cls = require('./lib/class');

var Messages = {};

module.exports = Messages;

var Message = cls.Class.extend({});

Messages.Move = Message.extend({
  init: function(entity){
    this.entity = entity;
  },

  serialize: function(){
    var message = {
      type: Types.Messages.MOVE,
      id: this.entity.id,
      x: this.entity.x,
      y: this.entity.y
    }
    if(this.entity.genus == 'player') message.lastProcessedInput = this.entity.lastProcessedInput;

    return message;
  }
})
