

module.exports = Camera = class Camera{
  constructor(renderer){
    this.renderer = renderer;
    this.x = 0;
    this.y = 0;
    this.viewportWidth = renderer.stage.canvas.width/renderer.renderScale;
    this.viewportHeight = renderer.stage.canvas.height/renderer.renderScale;
    this.xDeadZone = 0;
    this.yDeadZone = 0;
  }

  follow(entity){
    this.entity = entity;
    this.xDeadZone = this.viewportWidth/2;
    this.yDeadZone = this.viewportHeight/2;
  }

  moveTo(x, y){
    this.x = x;
    this.y = y;
  }

  lookAt(entity){
    if(entity){
      this.x = entity.x;
      this.y = entity.y;
    }
  }

  isVisible(x, y){
    return (Math.abs(this.y - y) <= this.viewportHeight/this.renderer.renderScale
    && Math.abs(this.x - x) <= this.viewportWidth/this.renderer.renderScale)
  }

  setViewportSize(width, height){
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.xDeadZone = this.viewportWidth/2;
    this.yDeadZone = this.viewportHeight/2;
  }

  update(){
    if(this.entity){
      if(this.entity.x - this.x  + this.xDeadZone > this.viewportWidth){
			  this.x = this.entity.x - (this.viewportWidth - this.xDeadZone);
      }
			else if(this.entity.x  - this.xDeadZone < this.x){
			   this.x = this.entity.x  - this.xDeadZone;
       }

      if(this.entity.y - this.y + this.yDeadZone > this.viewportHeight)
        this.y = this.entity.y - (this.viewportHeight - this.yDeadZone);
      else if(this.entity.y - this.yDeadZone < this.y)
        this.y = this.entity.y - this.yDeadZone;
    }

    if(this.x < 0) this.x = 0;
    if(this.y < 0) this.y = 0;
    if(this.y+this.viewportHeight > this.renderer.map.height)
      this.y = this.renderer.map.height-this.viewportHeight;
    if(this.x+this.viewportWidth > this.renderer.map.width)
      this.x = this.renderer.map.width-this.viewportWidth;
  }
}
