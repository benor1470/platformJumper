import Values from "./Values";

export class DValues {
	static isBoardRotating(): boolean {
		return Values.score > 15;
	}
	static getTileSpeedRatio() {
		if (Values.score < 30) {
			return 0.5;
		}else{
			return 1;
		}
	}
}