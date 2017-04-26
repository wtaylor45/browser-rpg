var _ = require('underscore'),
    Camera = require('./camera'),
    App = require('./app');

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

    this.createCamera();

    this.transitions = []

    this.options = {
      SHOW_FPS: false,
      DRAW_BOUNDING_BOX: false,
      MOUSEOVER: true,
    }

    this.stage.enableMouseOver();
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

  drawText(text, x, y, centered, color, strokeColor, fontSize){
    var stage = this.stage;

    if(text && x && y){
      var textToDraw = new createjs.Text(text);
      var font = (fontSize || "10px") + " " + this.font;
      textToDraw.font = font;
      textToDraw.x = x;
      textToDraw.y = y;
      textToDraw.color = color || "#fff";

      if(strokeColor){
        var stroke = textToDraw.clone();
        stroke.outline = 3;
        stroke.color = strokeColor;
        stage.addChild(stroke);
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

    this.drawText("FPS: " + this.realFPS, 10, 10, false, "#ff0", "#000");
  }

  drawEntity(entity){
    var sprite = entity.sprite,
        anim = entity.currentAnimation,
        stage = this.stage;

    if(anim && sprite){
      var frame = anim.currentFrame,
          x = frame.x,
          y = frame.y,
          width = sprite.width,
          height = sprite.height;

      sprite.image.sourceRect = new createjs.Rectangle(x, y, width, height);
      sprite.image.x = entity.x - this.camera.x;
      sprite.image.y = entity.y - this.camera.y;
      sprite.image.scaleX = Math.min(sprite.width/entity.width, entity.width/sprite.width);
      sprite.image.scaleY = Math.min(sprite.height/entity.height, entity.height/sprite.height);
      stage.addChild(sprite.image);

      if(entity == this.game.player && this.options.DRAW_BOUNDING_BOX)
        this.drawBoundingBox(entity);
    }
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
      self.drawEntity(entity);
    });
  }

  updateTransition(){
    if(this.transitions.length == 0) return;
    var effect = this.transitions[0];
    effect.tick();
    if(effect.isDone){
      this.transitions.shift();
    }
    this.stage.addChild(effect.shape);
  }

  render(){
    this.stage.removeAllChildren();
    this.drawMapLow();
    this.drawEntities();
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

    console.log('fade ready')
  }

  tick(){
    if(!this.started){
      this.started = true;
      console.log('fade started')
      this.lastTime = Date.now();
    }
    var now = Date.now();
    var dt = now - this.lastTime;
    this.lastTime = now;

    if(this.current >= this.dur){
      this.isDone = true;
      console.log('fade done')
      if(this.callback) this.callback();
      return;
    }

    this.shape.alpha += this.rate * dt;

    this.current += dt;
  }
}
