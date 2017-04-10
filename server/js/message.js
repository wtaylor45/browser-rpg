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
      y: this.entity.y
    }
    if(this.entity.genus == 'player') message.lastProcessedInput = this.entity.lastProcessedInput;

    return message;
  }
})
