import React, { Component } from "react";
import Canvas from 'react-native-canvas';
import Values from "../constants/Values";
import GameLogic from "./GameLogic";
import { Render, Engine, World, Runner, Bodies, Body, Events } from "matter-js";
import Pickup from "./pickups/Pickup";

export default class GameLogicBoard {
    public engine: Engine;
    private runner: Runner;
    //private render: Render;
    constructor(gameLogic: GameLogic) {
        this.engine = Engine.create();

        this.runner = Runner.create();
        let world: World = this.engine.world;
        world.gravity.y = Values.gravity;

        // boards
        gameLogic.boards.forEach(b => {
            b.body = Bodies.rectangle(Math.random() * Values.worldSpaceWidth,
                Math.random() * Values.worldSpaceHeight, Values.boardWidth, Values.boardHeight, { isStatic: true });
        });
        World.add(world, gameLogic.boards.map(b => b.body));

        // player
        let player: Body = Bodies.circle(Values.worldSpaceWidth / 2, Values.worldSpaceHeight / 2, Values.playerSize);
        player.restitution = 1.2;
        gameLogic.player.body = player;
        World.add(world, player);
        let eng=this.engine;
        Events.on(this.engine, 'collisionStart', function (event) {
            // We know there was a collision so fetch involved elements ...
            event.pairs.filter(p=>p.bodyA===player||p.bodyB===player).forEach(hitPair => {
                for (let i:number = 0; i < gameLogic.pickups.length; ++i) {
                    let pickup:Pickup=gameLogic.pickups[i];

                    if (hitPair.bodyA === pickup.body || hitPair.bodyB === pickup.body) {
                        gameLogic.pickups.splice(i, 1);
                        //do action
                        pickup.onPick();
                        
                        //remove logic
                        World.remove(eng.world, pickup.body);

                        //remove visual
                        if(pickup.tag!=null){
                            pickup.tag.parent.remove(pickup.tag);
                        }
                        //add msg
                        Values.msgs.push({time:Date.now(),msg:pickup.getName()});
                        
                    }
                }
            })
            // Now do something with the event and elements ... your task ;-)
        });

        Runner.run(this.runner, this.engine);
    }

    private sleep(ms): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}