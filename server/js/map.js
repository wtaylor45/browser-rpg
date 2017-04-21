var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    Types = require('../../shared/js/types');

module.exports = Map = class Map{
  constructor(name, collisionLayer, doorID){
    this.isLoaded = false;
    this.name = name;
    this.collisionID = collisionLayer || 'collision';

    this.entities = {};

    this.doorID = doorID || 665;

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

    this.doors = this.loadDoors();
  }

  loadDoors(){
    var doorLayer = this.getLayerByName("doors").objects;

    var doors = [];

    for(var i in doorLayer){
      doors[i] = {
        map: doorLayer[i].name,
        x1: doorLayer[i].x,
        y1: doorLayer[i].y,
        x2: doorLayer[i].x + doorLayer[i].width,
        y2: doorLayer[i].y + doorLayer[i].height,
      }
    }

    return doors
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

  isDoor(id){
    return id >= this.doorID;
  }

  isColliding(coords){
    var self = this;

    var collision = this.checkCollisions(coords[0], coords[1]);
    if(collision >= 0) return collision;
    collision = this.checkCollisions(coords[0], coords[2]);
    if(collision >= 0) return collision;
    collision = this.checkCollisions(coords[1], coords[3])
    if(collision >= 0) return collision;
    collision = this.checkCollisions(coords[2], coords[3])
    if(collision >= 0) return collision;

    return -1;
  }

  checkCollisions(pos1, pos2){
    var x1 = pos1[0],
        x2 = pos2[0],
        y1 = pos1[1],
        y2 = pos2[1];

    while(x1 < x2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0){
        if(this.isDoor(this.collisionData[index])){
          return Types.Collisions.DOOR;
        }
        return Types.Collisions.WALL;
      }
      x1 += this.tileWidth;
    }

    while(y1 <= y2){
      var index = this.worldPosToTileIndex(x1, y1);
      if(this.collisionData[index] > 0){
        if(this.isDoor(this.collisionData[index])){
          return Types.Collisions.DOOR;
        }
        return Types.Collisions.WALL;
      }
      y1 += this.tileWidth;
    }

    return -1;
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

  whichDoor(x, y){
    for(var i in this.doors){
      var dLeftX = this.doors[i].x1,
          dTopY = this.doors[i].y1,
          dRightX = this.doors[i].x2,
          dBottomY = this.doors[i].y2;

      if(x >= dLeftX && x <= dRightX){
        if(y >= dTopY && y <= dBottomY){
          return this.doors[i].map;
        }
      }
    }
  }
}

Map.mapData = {
  septoria: require('../../shared/maps/septoria.json'),
  map0: require('../../shared/maps/map0.json')
}
