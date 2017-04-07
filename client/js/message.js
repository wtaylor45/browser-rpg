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
  constructor(type, data){
    this.message = {
      type: type,
      data: data
    }
  }

  send(){
    Socket.emit('message', this.message);
  }
}
