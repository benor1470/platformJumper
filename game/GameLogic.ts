import { Vector3 } from 'three';
import { GameViewState } from './GameView';
import Values from "../constants/Values";
import { Body, Vector } from "matter-js";
import GameLogicBoard from './GameLogicBoard';
class GameLogic {
    public boards: Board[] = [];
    public player: Player = new Player(0, 0);
    private ySpeed: number = 0;
    private gameLogicBoard: GameLogicBoard;
    generate() {
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

    move(stageWidth: number, stageHeight: number) {
        if (this.player.body == null) {
            return;
        }
        this.player.x = this.player.body.position.x;
        this.player.y = this.player.body.position.y;

        if (this.player.y < 0) {
            Body.setPosition(this.player.body, { x: stageWidth / 2, y: stageHeight / 2 });
            Body.setVelocity(this.player.body, { x: 0, y: Values.gravity });
            this.player.y = stageHeight / 2;
    		Values.maxScore=Math.max(Values.score,Values.maxScore);

            Values.score = 0;
            return;

        }
        this.boards.forEach(b => {
            let body: Body = b.body;
            let pos:Vector=body.position;
          
            let newX = pos.x + b.speedX;
            let newY = pos.y + b.speedY;
            if (pos.x < 0) {
                b.speedX *= -1;
                newX = 2
            } else if (pos.x > stageWidth) {
                b.speedX *= -1;
                newX = stageWidth - 2
            }

            if (pos.y < 0) {
                b.speedY *= -1;
                newY = 2
            } else if (pos.y > stageHeight) {
                b.speedY *= -1;
                newY = stageHeight - 2
            }
            b.rotation+=b.rotationSpeed;
            Body.setPosition(b.body, { x: newX, y: newY });

        })

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
        this.speedX = (Math.random() * 10) - 5;
        this.speedY = (Math.random() * 10) - 5;
        this.rotationSpeed =Math.random() * 0.1-0.05;//2000;//-Math.PI/100;
        console.log("r", this.rotationSpeed + "," + this.rotationSpeed / Math.PI + "pi");
    }


}
export default GameLogic