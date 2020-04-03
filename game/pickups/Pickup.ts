import { Body } from 'matter-js';
import { ScoreUp } from './ScoreUp';
import { Texture, Object3D } from 'three';
export default abstract class Pickup {
    constructor(){

    }
    public body: Body;
    public tag: Object3D;
    abstract onPick(): void;
    abstract getName(): string;
    abstract getImage(): Promise<Texture>;
}

export function selectPickup(): Pickup {
    let result: Pickup= new ScoreUp();


    return result;
}