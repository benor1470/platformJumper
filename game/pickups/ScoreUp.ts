import Values from '../../constants/Values';
import { Texture } from 'three';
import ExpoTHREE from 'expo-three';
import Pickup from './Pickup';
export class ScoreUp {//} extends Pickup{
    onPick(): void {
        Values.score += 2;
    }
    getName(): string {
        return "Score up by 2";
    }
    getImage(): Promise<Texture> {
        return ExpoTHREE.loadAsync(require('../../assets/images/scoreup.png'));
    }
}