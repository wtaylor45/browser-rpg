var sprites = require('./sprites').init(),
    Animation = require('./animation');

module.exports = Sprite = class Sprite{
  constructor(name){
    this.name = name;
    this.loadJSON(sprites[name]);

    console.log(name);
  }

  loadJSON(json){
    console.log(json)
    this.id = json.id;
    this.path = json.image;
    this.animations = json.animations;
    this.width = json.width;
    this.height = json.height;

    this.load();
  }

  load(){
    this.image = new createjs.Bitmap(this.path);
  }

  createAnimations(){
    var animations = {};

    for(var name in this.animations){
      var anim = this.animations[name];
      animations[name] = new Animation(name, anim.frames, anim.row, this.width, this.height);
    }

    return animations;
  }
}
