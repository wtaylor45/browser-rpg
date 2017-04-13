

module.exports = Animation = class Animation{
  constructor(name, length, row, width, height){
    this.name = name;
    this.row = row;
    this.width = width;
    this.height = height;
    this.frames = length;
    this.currentFrame = null;
    this.currentTime = 0;
    this.reset();
  }

  tick(){
    var i = this.currentFrame.index;

    i = (i < this.frames - 1) ? i + 1 : 0;

    if(this.iterations > 0){
      if(i == 0){
        this.iterations--;
        if(this.iterations == 0){
          this.onEnd();
          return;
        }
      }
    }

    this.currentFrame.x = this.width * i;
    this.currentFrame.index = i;
  }

  reset(){
    this.currentTime = 0;
    this.currentFrame = {index: 0, x: 0, y: this.row*this.height}
  }

  isAnimationTick(){
    return this.currentTime > this.speed*100;
  }

  update(dt){
    this.currentTime += dt;

    if(this.isAnimationTick()){
      this.currentTime = 0;
      this.tick();
    }
  }

  setSpeed(speed){
    this.speed = speed;
  }

  setIterations(iters, onEnd){
    this.iterations = iters;
    this.onEnd = onEnd;
  }
}
