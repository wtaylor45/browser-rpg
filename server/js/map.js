var path = require('path'),
    fs = require('fs'),
    _ = require('underscore');

module.exports = Map = class Map{
  constructor(name, collisionLayer){
    this.isLoaded = false;
    this.name = name;
    this.collisionID = collisionLayer || 'collision';

    this.entities = {};

    this.loadMap(Map.mapData[name]);
  }

  loadMap(map){
    this.json = map;
    if(!this.json) return;
    this.collisionLayer = this.getLayerByName(this.collisionID);
    this.collisionData = this.collisionLayer.data;
    this.tileWidth = map.tilewidth;
    this.tileHeight = map.tileheight;
    this.width = this.tileWidth*map.width;
    this.height = this.tileHeight*map.height;
  }

  addEntity(entity){
    this.entities[entity.id] = entity;
    entity.map = this.name;
  }

  getLayerByName(name){
    if(!this.json) return;
    for(var i in this.json.layers){
      if(this.json.layers[i].name == name){
        return this.json.layers[i];
      }
    }
    console.log('Layer', name, 'not found');
    return false;
  }

  worldPosToTileIndex(x, y){
    var tileX = Math.floor(x/this.tileWidth);
    var tileY = Math.floor(y/this.tileHeight);

    return tileX + tileY * (this.height/this.tileHeight);
  }

  isColliding(coords){
    var self = this;
    var collisions = false;
    for(var i in coords){
      var pos = coords[i];
      var x = pos[0];
      var y = pos[1];
      var index = self.worldPosToTileIndex(x, y);
      if(self.collisionData[index] > 0) return true;
    }

    return collisions;
  }

  nearestTilePositions(entity){
    var index = 0;

    var leftX = entity.x;
    var topY = entity.y+entity.height/2;
    var rightX = entity.x + entity.width;
    var bottomY = entity.y + entity.height;

    var corners = [];
    corners[0] = [leftX, topY];
    corners[1] = [rightX, topY];
    corners[2] = [leftX, bottomY];
    corners[3] = [rightX, bottomY];

    return corners;
  }
}

Map.mapData = {
  septoria: require('../../shared/maps/septoria.json')
}
