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
    this.collisionData = this.collisionLayer.data;
    this.tileWidth = json.tilewidth;
    this.tileHeight = json.tileheight;
    this.width = this.tileWidth*json.width;
    this.height = this.tileHeight*json.height;

    this.isLoaded = true;
  }

  findLayerByName(name){
    for(var i in this.json.layers){
      if(this.json.layers[i].name == name){
        return this.json.layers[i];
      }
    }
  }

  worldPosToTileIndex(x, y){
    var tileX = Math.floor(x/this.tileWidth);
    var tileY = Math.floor(y/this.tileHeight);

    return tileX + tileY * (this.height/this.tileHeight);
  }

  isColliding(x, y){
    var index = this.worldPosToTileIndex(x, y);
    if(this.collisionData){
      return this.collisionData[index] > 0;
    }

    return false;
  }

  nearestTiles(entity){
    var index = 0;

    var x = entity.x;
    var y = entity.y;
    var rangeX = entity.width;
    var rangeY = entity.height;

    var nearestTiles = [];
    for(var i=x;i<x+rangeX;i+=this.tileWidth){
      for(var j=y+rangeY/2;j<y+rangeY;j+=this.tileHeight){
        nearestTiles[index] = [i, j];
        index++;
      }
    }

    return nearestTiles;
  }
}
