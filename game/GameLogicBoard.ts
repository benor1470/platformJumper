import React, { Component } from "react";
import Canvas from 'react-native-canvas';
import Values from "../constants/Values";
import GameLogic from "./GameLogic";
import { Render, Engine, World, Runner, Bodies, Body, Events } from "matter-js";
import Pickup from "./pickups/Pickup";

export default class GameLogicBoard {
    public engine: Engine;
    private runner: Runner;
    private render: Render;
    constructor(gameLogic: GameLogic) {
        this.engine = Engine.create();

        this.runner = Runner.create();
        let world: World = this.engine.world;
        world.gravity.y = Values.gravity;

        // create runner
        gameLogic.boards.forEach(b => {
            b.body = Bodies.rectangle(Math.random() * Values.worldSpaceWidth,
                Math.random() * Values.worldSpaceHeight, Values.boardWidth, Values.boardHeight, { isStatic: true });
        });
        World.add(world, gameLogic.boards.map(b => b.body));

        let player: Body = Bodies.circle(Values.worldSpaceWidth / 2, Values.worldSpaceHeight / 2, Values.playerSize);
        player.restitution = 1.2;
        gameLogic.player.body = player;
        World.add(world, player);

        Events.on(this.engine, 'collisionStart', function (event) {
            // We know there was a collision so fetch involved elements ...
            event.pairs.filter(p=>p.bodyA===player||p.bodyB===player).forEach(hitPair => {
                for (let i:number = 0; i < gameLogic.pickups.length; ++i) {
                    let pickup:Pickup=gameLogic.pickups[i];

                    if (hitPair.bodyA === pickup.body || hitPair.bodyB === pickup.body) {
                        gameLogic.pickups.splice(i, 1);
                        pickup.onPick();
                        Values.msgs.push({time:0,msg:pickup.getName()});
                        if(pickup.tag!=null){
                            pickup.tag.parent.remove(pickup.tag);
                        }
                    }
                }
                gameLogic.pickups.forEach(pickup => {
                   

                })
            })
            // Now do something with the event and elements ... your task ;-)
        });

        Runner.run(this.runner, this.engine);
        /*
                if (Values.DEBUG) {
                    while(Values.canvasView===null){
                        this.sleep(1000);
                    }
                    this.render = Render.create({
                        canvas: Values.canvasView,
                        engine: this.engine,
                        options: {
                            width: Values.worldSpaceWidth,
                            height: Values.worldSpaceHeight,
                            //showAxes: true,
                            //showCollisions: true,
                            //showConvexHulls: true
                        }
                    });
                     Render.run(this.render);
                }*/
    }

    private sleep(ms): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}