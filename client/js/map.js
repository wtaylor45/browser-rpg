var maps = {
  septoria: {json: require('../assets/maps/septoria.json'), img: 'client/assets/maps/septoria.bmp'}
}

module.exports = Map = class Map{
  constructor(name, collisionLayer){
    this.name = name;
    this.json = maps[name]['json'];
    this.collisionName = collisionLayer || 'collision';

    this.isLoaded = false;

    this.loadJSON();
  }

  loadJSON(){
    if(!this.json){
      return;
    }

    var json = this.json;

    this.img = new createjs.Bitmap(maps[this.name]['img']);

    this.collisionLayer = this.findLayerByName(this.collisionName);
    this.tileWidth = json.tilewidth;
    this.tileHeight = json.tileheight;
    this.width = this.tileWidth*json.width;
    this.height = this.tileHeight*json.height;

    this.isLoaded = true;
  }

  findLayerByName(name){
    for(var i in this.json.layers){
      if(this.json.layers[i].name == name){
        return this.json.layers[i].name;
      }
    }
  }

}
