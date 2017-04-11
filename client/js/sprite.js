var sprites = require('./sprites');

module.exports = Sprite = class Sprite{
  constructor(name){
    this.name = name;
    this.loadJSON(sprites[name]);
  }

  loadJSON(name){
    console.log(sprites);
  }
}
