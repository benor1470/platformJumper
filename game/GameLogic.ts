import React, { Component } from "react";
import Canvas from 'react-native-canvas';
import Values from "../constants/Values";

class GameLogic {
    public boards: Board[] = [];
    public player: Player = new Player(0, 0);
    private ySpeed: number = 0;
    generate(boards: number, width: number, height: number) {
        this.player = new Player(width / 2, height / 2);
        this.boards = [];
        for (var i: number = 0; i < boards; ++i) {
            this.boards.push(new Board(width, height));
        }
        Values.score++;
    }

    move(stageWidth: number, stageHeight: number, xSpeed: number) {
        this.player.x += xSpeed;
        this.ySpeed--;
        this.player.y += this.ySpeed;
        let hit = false;
        if (this.player.y < 0) {
            this.player.x=stageWidth / 2;
            this.player.y=stageHeight / 2;
            this.ySpeed=10;
            Values.score=0;
            return;

        }
        let minX:number=1000;
        let minY:number=1000;
        this.boards.forEach(b => {
            b.x += b.speedX;

            if (b.x < 0) {
                b.speedX *= -1;
                b.x = 2
            } else if (b.x > stageWidth) {
                b.speedX *= -1;
                b.x = stageWidth - 2
            }

            b.y += b.speedY;
            if (b.y < 0) {
                b.speedY *= -1;
                b.y = 2
            } else if (b.y > stageHeight) {
                b.speedY *= -1;
                b.y = stageHeight - 2
            }

            let xDelta=this.player.x-b.x;
            minX=Math.min(minX,Math.abs(xDelta));
            let yDelta=this.player.y-b.y;
            minY=Math.min(minY,Math.abs(yDelta));

            if (Math.abs(xDelta)< Values.boardWidth) {
                if (yDelta<0 && yDelta>this.ySpeed) {
                    this.player.y += b.y+Values.playerSize/2;
                                       hit = true;
                }
            }
        })
        console.log("min_x",minX,"minY",minY);
        if (hit) {
            this.ySpeed = Values.jumpHeight/Values.gravity;
       //     stageHeight=10*t^2
        }
    }
}
class Player {
    public x: number;
    public y: number;
    public scale: number = 1;
    public tag: any;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}
class Board {
    public x: number;
    public y: number;
    public tag: any;
    public speedX: number;
    public speedY: number;
    private r: number = 0;
    constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.speedX = (Math.random() * 10) - 5;
        this.speedY = (Math.random() * 10) - 5;
    }


}
export default GameLogic