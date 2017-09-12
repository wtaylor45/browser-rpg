var AStar = require('./lib/astar');

module.exports = Pathfinder = class Pathfinder {
    constructor(map, character){
        this.map = map;
        this.character = character;
        this.grid = map.layerToAStarGrid("collision");
    }

    findPath(endX, endY){
        var gridX = Math.floor(this.character.x/this.map.tileWidth);
        var gridY = Math.floor(this.character.y/this.map.tileHeight);
        var start = [gridX, gridY+1];
        var end = [Math.round(endX/this.map.tileWidth), Math.round(endY/this.map.tileHeight)];

        var dirX = start[0] > end[0] ? -1 : 1;
        var dirY = start[1] > end[1] ? -1 : 1;

        var currentX = gridX;
        var currentY = gridY;
        var path = [];

        while(currentX != end[0] || currentY != end[1]){
            var nextTile = [];
            var nextX = this.currentX;
            var nextY = this.currentY;

            var currentHitbox = this.simulateHitbox(currentX, currentY);

            if(currentX != end[0]){
                nextX = currentX+dirX;
                if(this.map.isColliding(this.map.nearestTilePositions(this.character.hitbox))){
                    if(this.grid[nextX][currentY] && this.grid[nextX+bufferX][currentY]){
                        nextTile[0] = nextX;
                    }
                }
            }

            if(currentY != end[1]){
                nextY = currentY+dirY;
                if(this.map.isColliding(this.map.nearestTilePositions(this.character.hitbox))){
                    if(this.grid[nextX][nextY] && this.grid[nextX][nextY+bufferY]){
                        nextTile[1] = nextY;
                    }
                }
            }

            if(!nextTile[0]) nextTile[0] = currentX;
            if(!nextTile[1]) nextTile[1] = currentY;
            if(nextTile[0] == currentX && nextTile[1] == currentY){
                break;
            }

            currentX = nextTile[0];
            currentY = nextTile[1];

            path.push(nextTile);
        }

        return this.pathToWorldCoords(path);
    }

    simulateHitbox(x, y){
      var hitbox = [];

      hitbox.push(x);
      hitbox.push(y+this.character.height/2);
      hitbox.push(x+this.character.width);
      hitbox.push(y+this.character.height);

      return hitbox;
    }

    pathToWorldCoords(path){
        var newPath = [];

        for(var i in path){
            var entry = [path[i][0]*this.map.tileWidth, path[i][1]*this.map.tileHeight];
            newPath.push(entry);
        }

        return newPath;
    }
}
