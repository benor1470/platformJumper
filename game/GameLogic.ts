import Pickup, { selectPickup } from './pickups/Pickup';
import { Vector3, Material, MeshBasicMaterial, CircleGeometry, Mesh } from 'three';
import GameView, { GameViewState } from './GameView';
import Values from "../constants/Values";
import { Body, Vector, Bodies, World } from "matter-js";
import GameLogicBoard from './GameLogicBoard';
import { DValues } from '../constants/DValues';
class GameLogic {
    public boards: Board[] = [];
    public player: Player = new Player(0, 0);
    private gameLogicBoard: GameLogicBoard;
    private view:GameView;
    public pickups:Pickup[]=[];
    generate(view:GameView) {
        this.view=view;
        let boardsCount: number = Values.boardsCount;
        let width: number = Values.worldSpaceWidth;
        let height: number = Values.worldSpaceHeight;

        this.player = new Player(width / 2, height / 2);
        this.boards = [];
        for (var i: number = 0; i < boardsCount; ++i) {
            this.boards.push(new Board());
        }
        this.gameLogicBoard = new GameLogicBoard(this);
    }

    move(timePassed:number) {
        //player
        if (this.player.body == null) {
            return;
        }
        this.player.x = this.player.body.position.x;
        this.player.y = this.player.body.position.y;
        Body.setVelocity(this.player.body, { y: this.player.body.velocity.y, x: Values.currentPlayerSpeed });
        if (this.player.y < 0) {
            Body.setPosition(this.player.body, { x: Values.worldSpaceWidth / 2, y:  Values.worldSpaceHeight / 2 });
            Body.setVelocity(this.player.body, { x: 0, y: Values.gravity });
            this.player.y = Values.worldSpaceHeight / 2;
    		Values.maxScore=Math.max(Values.score,Values.maxScore);

            //Values.score = 0;
            return;
        }

        //boards
        this.boards.forEach(b => {
            let body: Body = b.body;
            let pos:Vector=body.position;
          
            let newX = pos.x + b.speedX*timePassed;
            let newY = pos.y + b.speedY*timePassed;
            if (pos.x < 0) {
                b.speedX *= -1;
                newX = 2
            } else if (pos.x > Values.worldSpaceWidth) {
                b.speedX *= -1;
                newX = Values.worldSpaceWidth - 2
            }

            if (pos.y < 0) {
                b.speedY *= -1;
                newY = 2
            } else if (pos.y > Values.worldSpaceHeight) {
                b.speedY *= -1;
                newY = Values.worldSpaceHeight - 2
            }
            Body.setPosition(b.body, { x: newX, y: newY });

            if(DValues.isBoardRotating()){
                b.rotation+=b.rotationSpeed*timePassed;
            }else{
                b.rotation=0;
            }
            Body.setAngle(b.body, b.rotation);
        });

        //pickups
        if(this.pickups.length<1){//2 && Math.random()>0.9){
            let p:Pickup=selectPickup();
           
            this.pickups.push(p);
            
            p.getImage().then(texture => {
                let locX=Math.random()*(Values.worldSpaceWidth-Values.pickupPopupBoarderX*2)+Values.pickupPopupBoarderX;
                let locY=Values.worldSpaceHeight/2;//Math.random()*(Values.worldSpaceHeight-Values.pickupPopupBoarderY*2)+Values.pickupPopupBoarderY;
                let pickupBody: Body =p.body= Bodies.circle(locX,locY, Values.pickupSize,{ isStatic: true });
                World.add(this.gameLogicBoard.engine.world, pickupBody);

                console.log("loaded");
                let material: Material = new MeshBasicMaterial({ map: texture });
                let playerGeometry = new CircleGeometry(Values.pickupSize, 50);
                p.tag = new Mesh(playerGeometry, material);//, new LineBasicMaterial({ color: 0xffffff, linewidth: 50 }));
                p.tag.position.set(locX-Values.worldSpaceWidth/2,locY-Values.worldSpaceHeight/2,0);//p.body.position.x-Values.worldSpaceHeight/2,p.body.position.y-Values.worldSpaceHeight/2,0);
                
                this.view.scene.add(p.tag);
                
                
                
                console.log("created pickup");


            }).catch(e => {
                console.log("can't load", e);
            })

        }

    }
}
class Player {
    public x: number;
    public y: number;
    public scale: number = 1;
    public tag: any;
    public body: Body;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}
class Board {
    public tag: any;
    public body: Body;
    public speedX: number;
    public speedY: number;
    public rotationSpeed: number = 0;
    public rotation:number=0;
    constructor() {
        this.speedX = (Math.random() * Values.boardSpeedRange) - Values.boardSpeedRange/2;
        this.speedY = (Math.random() * Values.boardSpeedRange) - Values.boardSpeedRange/2;
        this.rotationSpeed =0;//Math.random() * Values.boardRotateSpeedRange- Values.boardRotateSpeedRange/0.05;//2000;//-Math.PI/100;
        console.log("r", this.rotationSpeed + "," + this.rotationSpeed / Math.PI + "pi");
    }


}
export default GameLogic