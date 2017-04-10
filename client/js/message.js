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
