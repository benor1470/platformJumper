import React, { Component } from "react";
import Canvas from 'react-native-canvas';
import Values from "../constants/Values";
import GameLogic from "./GameLogic";
import { Render, Engine, World, Runner, Bodies, Body, Events } from "matter-js";

export default class GameLogicBoard {
    private engine: Engine;
    private runner:Runner;
    private render:Render;
    constructor(gameLogic: GameLogic) {
        this.engine = Engine.create();
        
        this.runner = Runner.create();
        let world:World = this.engine.world;
        world.gravity.y = Values.gravity;

        // create runner

        gameLogic.boards.forEach(b => {
            b.body = Bodies.rectangle(Math.random() *Values.worldSpaceWidth, 
            Math.random() *Values.worldSpaceHeight, Values.boardWidth, Values.boardHeight, { isStatic: true });
        });
        World.add(world, gameLogic.boards.map(b => b.body));

        let player: Body = Bodies.circle(Values.worldSpaceWidth / 2, Values.worldSpaceHeight / 2, Values.playerSize);
        player.restitution=1.2;
        gameLogic.player.body = player;
        World.add(world, player);

        // World.add(world, [
        //     // walls
        //     Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
        //     Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
        //     Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
        //     Bodies.rectangle(0, 300, 50, 600, { isStatic: true })
        // ]);


        Events.on(this.engine, 'beforeUpdate', function (event) {
            gameLogic.boards.forEach(b => {
                //Body.setPosition(b.body, { x: b.x, y: b.y });
                Body.setVelocity(b.body, { x: b.speedX, y: b.speedY });
                Body.setAngle(b.body,b.rotation);
            });
            Body.setVelocity(player,{y:player.velocity.y,x:Values.currentPlayerSpeed});
        });
        /*Events.on(this.engine, 'collisionStart', function(event) {
            // We know there was a collision so fetch involved elements ...
            event.pairs.forEach(p=>{
                if(p.bodyA===player || p.bodyB===player){
                    Body.setVelocity(player, { x: player.velocity.x, y: 30 });
                }
            })
            // Now do something with the event and elements ... your task ;-)
        });*/

        Runner.run(this.runner, this.engine);
        
        if (Values.DEBUG) {
            this.render = Render.create({
                canvas:Values.canvasView,
                engine: this.engine,
                options: {
                    width: Values.worldSpaceWidth,
                    height: Values.worldSpaceHeight,
                    //showAxes: true,
                    //showCollisions: true,
                    //showConvexHulls: true
                }
            });
           // Render.run(this.render);
        }
    }
}