var Input = require('./input.js');

module.exports = UIElement = class UIElement {
  constructor(section){
    this.html = "";
    this.parent = "#"+section;

    LIST.push(this);
  }
}

var LIST = UIElement.LIST = [];

UIElement.BottomLeft = class BottomLeft extends UIElement {
  constructor(){
    super('game-content');

    this.html = '<div id="bottomLeft" class="section" style="position:absolute;bottom:0"></div>';
    $(this.parent).append(this.html);

    this.element = $('#bottomLeft');

    this.onResize();
  }

  onResize(){
    this.element.css({
      'width': $('#canvas').width()/2,
      'height': $('#canvas').height()/2
    });
  }
}

UIElement.BottomRight = class BottomRight extends UIElement {
  constructor(){
    super('game-content');

    this.html = '<div id="bottomRight" class="section" style="position:absolute;bottom:0"></div>';
    $(this.parent).append(this.html);

    this.element = $('#bottomRight');

    this.onResize();
  }

  onResize(){
    this.element.css({
      'width': $('#canvas').width()/2,
      'height': $('#canvas').height()/2,
      'right': 0
    });
  }
}

UIElement.Chat = class Chat extends UIElement {
  constructor(id, onsend){
    super('bottomLeft');

    this.id = id;

    $(this.parent).append(this.html);

    this.element = document.createElement('div');
    this.element.setAttribute('id', id)

    this.chatTextHTML = '<div id="chat-text" style="overflow-y:scroll;"> \
                    </div>';
    this.chatInputHTML = '<form id="chatform" class ="clearfix" action="none" accept-charset="utf-8"> \
                      <input autocomplete="off" id="chatinput" \
                      class="gp" type="text" maxlength="100" style="width:100%"> \
                      </form>';

    this.element.innerHTML += this.chatTextHTML + this.chatInputHTML;

    $(this.parent).append(this.element);

    this.chatText = $('#chat-text');
    this.chatInput = $('#chatinput');

    this.onResize();

    this.chatInput.focus(function(){
      Input.setListening(false);
      Input.reset();
    });

    this.chatInput.blur(function(){
      Input.setListening(true);
    });

    var self = this;
    $('#chatform').submit(function(e){
      e.preventDefault();

      var message = self.chatInput.val();
      if(message != "") onsend(message);

      self.chatInput.blur();
      self.chatInput.val("");
    });

    this.broadcast('Welcome to browser-rpg!');
  }

  onResize(){
    var parent = $(this.parent);
    var element = $('#'+this.id);

    element.css({
      'width': (parent.width()-parent.width()/6)+"px"
      });
  }

  broadcast(message){
    this.chatText.append('<b><i style="color:aqua;">'+message+'</i></b>');
  }

  addMessage(chat){
    var chatText = this.chatText;
    var isScrolledToBottom = chatText.scrollHeight - chatText.clientHeight <= chatText.scrollTop + 1;

    var div = document.createElement("div");
    div.innerHTML = chat;
    chatText.append(div);

    if(isScrolledToBottom)
      chatText.scrollTop = chatText.scrollHeight - chatText.clientHeight;
  }

  addNotification(message){
    var text = '<i style="color:yellow">'+message+'</i>';
    this.addMessage(text);
  }
}

// UIElement.AbilityBar = class AbilityBar extends UIElement
