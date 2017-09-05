var _ = require('underscore'),
    Camera = require('./camera'),
    App = require('./app'),
    UIElement = require('./ui-element');

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
    this.nameFont = "Open Sans";

    this.createCamera();

    this.transitions = []

    this.options = {
      SHOW_FPS: false,
      DRAW_BOUNDING_BOX: true,
      MOUSEOVER: true,
    }

    this.stage.enableMouseOver();

    window.onresize = _.debounce(function(){
      this.resizeCanvas();
    }.bind(this), 100);

    this.initUI();
    this.resizeCanvas();
  }

  initUI(){
    this.bottomLeft = new UIElement.BottomLeft();
    this.bottomRight = new UIElement.BottomRight();
    this.chat = new UIElement.Chat('chat-container', this.game.onSubmitChat.bind(this.game));
    /*
    this.abilityBar = new UIElement.AbilityBar('ability-container', 48, this.renderScale);
    for(var i in this.game.player.abilities){
      var ability = this.game.player.abilities[i];
      this.setAbility(i, ability);
    }
    */
  }

  resizeCanvas(){
    this.stage.canvas.width = $('#game-content').width();
    this.stage.canvas.height = $('#game-content').height();

    this.setRenderScale(2);

    this.camera.setViewportSize(this.getWidth()/this.renderScale,
      this.getHeight()/this.renderScale);

    var ctx = this.stage.canvas.getContext('2d');
    ctx.mozImageSmoothingEnabled = false;	//better graphics for pixel art
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    _.each(UIElement.LIST, function(element){
      element.onResize();
    });
  }

  setRenderScale(scale){
    this.renderScale = scale;
    this.scaleX = this.scaleY = scale;
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

  drawText(text, x, y, font, centered, color, strokeColor, strokeSize){
    var stage = this.stage;

    if(text && x && y){
      var textToDraw = new createjs.Text(text);
      var font = font || "10px " + this.font;

      textToDraw.font = font;

      if(centered){
        textToDraw.textAlign = 'center';
      }
      textToDraw.x = x;
      textToDraw.y = y;
      textToDraw.color = color || "#fff";

      if(strokeColor){
        textToDraw.shadow = new createjs.Shadow(strokeColor, 1, 1, 3)
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

    this.drawText("FPS: " + this.realFPS, 10, 10, '10px', false, "#ff0", "#000", 3);
  }

  drawEntity(entity){
    var sprite = entity.sprite,
        anim = entity.currentAnimation,
        stage = this.stage;

    entity.realX = entity.x - this.camera.x;
    entity.realY = entity.y - this.camera.y;

    if(sprite){
      var width = sprite.width,
          height = sprite.height;

      if(anim){
        var frame = anim.currentFrame || 0,
            x = frame.x || 0,
            y = frame.y || 0;

        sprite.image.sourceRect = new createjs.Rectangle(x, y, width, height);
      }

      sprite.image.x = entity.x - this.camera.x;
      sprite.image.y = entity.y - this.camera.y;
      sprite.image.scaleX = Math.min(sprite.width/entity.width, entity.width/sprite.width);
      sprite.image.scaleY = Math.min(sprite.height/entity.height, entity.height/sprite.height);
      stage.addChild(sprite.image);
      
      if(Date.now()-entity.lastDamaged <= 6000){
        this.drawHealthBar(entity);
      }
      var name = entity.name || Types.speciesAsString(entity.species);
      this.drawText(name, entity.x+entity.width/2-this.camera.x, entity.y-this.camera.y-3,
      '6px '+this.nameFont, true, '#fff', '#000', 1);

      if(entity.chat){
        this.drawImage(new createjs.Bitmap('client/assets/img/chat.png'),
          entity.x+(entity.width-entity.width/4)-this.camera.x,
          entity.y-this.camera.y);
      }

      if(entity == this.game.player && this.options.DRAW_BOUNDING_BOX){
        var dotX = entity.clientX - entity.x
        var dotY = - (entity.clientY-entity.y)
        var graphics = new createjs.Graphics()
          .beginStroke("#ffff00")
          .drawRect(dotX, dotY,
            5, 5);
        var shape = new createjs.Shape(graphics);
        this.stage.addChild(shape)
      }
    }
  }

  drawImage(bitmap, x, y){
    bitmap.x = x;
    bitmap.y = y;
    this.stage.addChild(bitmap);
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

  drawHealthBar(entity){
    var x = (entity.x+entity.width/4)-this.camera.x;
    var y = entity.y-this.camera.y-7;
    var greenWidth = entity.currentHealth/entity.maxHealth * entity.width/2;

    // Draw the lower red bar first
    var graphics = new createjs.Graphics()
      .beginFill('#ff1111')
      .drawRect(x, y, entity.width/2, 3);
    var shape = new createjs.Shape(graphics);
    this.stage.addChild(shape);

    // Draw the green current health
    var graphics = new createjs.Graphics()
      .beginFill('#11ff11')
      .drawRect(x, y, greenWidth, 3);
    var shape = new createjs.Shape(graphics);
    this.stage.addChild(shape);
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
      if(entity.id != self.game.player.id)
        self.drawEntity(entity);
    });
  }

  updateTransition(){
    if(!this.isTransitioning()) return;
    var effect = this.transitions[0];
    effect.tick();
    if(effect.isDone){
      this.transitions.shift();
    }
    this.stage.addChild(effect.shape);
  }

  isTransitioning(){
    return this.transitions.length > 0;
  }

  render(){
    this.stage.removeAllChildren();
    this.drawMapLow();
    this.drawEntities();
    this.drawEntity(this.game.player);
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

  addChat(chat){
    this.chat.addMessage(chat);
  }

  addNotification(message){
    this.chat.addNotification(message);
  }

  drawAbilities(){
    var icons = this.abilityBar.getAbilityIcons();
    for(var i in icons){
      icons[i].x = (this.getWidth() - ((3-i)*this.abilityBar.iconSize))/this.renderScale;
      if(i>0) icons[i].x += this.abilityBar.offset/2;
      icons[i].y = (this.getHeight() - (this.abilityBar.iconSize + this.abilityBar.offset/2))/this.renderScale;
      this.stage.addChild(icons[i]);
    }
  }

  setAbility(index, ability){
    this.abilityBar.setAbility(index, Types.abilityToIcon(ability));
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
  }

  tick(){
    if(!this.started){
      this.started = true;
      this.lastTime = Date.now();
    }
    var now = Date.now();
    var dt = now - this.lastTime;
    this.lastTime = now;

    if(this.current >= this.dur){
      this.isDone = true;
      if(this.callback) this.callback();
      return;
    }

    this.shape.alpha += this.rate * dt;

    this.current += dt;
  }
}
