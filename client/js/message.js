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

class Message{
  this.message;

  constructor(type, data){
    this.message = {
      'type': type,
      'data': data
    }
  }

  send(){
    socket.emit('message', this.message);
  }
}

Message.MessageType = {
  LOGIN: 1,
  LOGOUT: 0,
  MOVE: 3
}
