module.exports = Npc = class Npc extends Character {
    constructor(id, species, x, y, width, height, name){
        super(id, name, species, x, y, 32, 48);

        this.wanderer = true;
        this.moving = false;
    }

    update(dt){
        if(this.wanderer && !this.moving){
            if(Math.random()*1000 < 5){
                this.moving = true;
                this.chooseWanderPoint();
            }
        }

        if(this.moving){
            this.wander(dt);
        }
    }

    wander(dt){
        if(this.path.length == 0){
            this.moving = false;
            return;
        }

        var vector = this.getVectorToPoint(this.path[0][0], this.path[0][1]);

        var x = this.x+vector[0]*this.currentSpeed*dt;
        if(Math.abs(x - this.path[0][0]) < 1) x = this.path[0][0];
        var y = this.y+vector[1]*this.currentSpeed*dt;
        if(Math.abs(y - this.path[0][1]) < 1) y = this.path[0][1];
        this.moveTo(x, y);

        if(this.x == this.path[0][0] && this.y == this.path[0][1]){
            this.path.splice(0,1);
            if(this.path.length == 0) this.moving =  false;
        }
    }

    chooseWanderPoint(){
        if(Math.random()<.5){
            this.wanderX = Math.floor(Math.random()*500 + 200);
            this.wanderY = this.y;
        }else{
            this.wanderY = Math.floor(Math.random()*500 + 200);
            this.wanderX = this.x;
        }

        this.path = [];
    }
}
