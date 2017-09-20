var Npc = require('./npc'),
    Types = require('../../shared/js/types');

module.exports = Npcs = {
  man: class Man extends Npc {
    constructor(x, y){
      super('0'+x+y, Types.Entities.MAN, x, y, 32, 48, "Man");
      this.currentSpeed = this.maxSpeed = 7;
      this.sizeType = Types.Sizes.TWOBYTWO;
    }
  }
}
