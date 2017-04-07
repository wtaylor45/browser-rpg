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

module.exports = Message = class Message{
  constructor(type, data){
    this.message = {
      type: type,
      data: data
    }
  }

  send(){
    Message.socket.emit('message', this.message);
  }
}
