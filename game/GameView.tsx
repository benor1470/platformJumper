import React, { RefObject } from "react";
import GameLogic from "./GameLogic";

import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { View, Text, GestureResponderEvent, NativeTouchEvent, Dimensions } from "react-native";
import { Scene, PerspectiveCamera, Color, LineBasicMaterial, Vector3, BufferGeometry, Line, CircleGeometry, Mesh, TextureLoader, MeshBasicMaterial, Texture, Material } from "three";
import ExpoTHREE, { Renderer } from "expo-three"
import Values from "../constants/Values";


export interface GameViewState {
	score: number
	outputDebug: string;
}
class GameView extends React.Component<any, GameViewState> {
	state: Readonly<GameViewState> = { score: 0, outputDebug: "" }
	private logic: GameLogic = new GameLogic();
	public scene: Scene = new Scene();
	private renderer: ExpoTHREE.Renderer;
	private camera: PerspectiveCamera;
	private outputRef: RefObject<Text> = React.createRef<Text>();
	private glView: RefObject<GLView> = React.createRef<GLView>();;
	//	private canvasForDebug: RefObject<HTMLCanvasElement> = React.createRef<HTMLCanvasElement>();;
	private readonly cameraPos: Vector3 = new Vector3(0, 0, 1500);
	private readonly cameraPos: Vector3 = new Vector3(0, 0, 1500);

	constructor(props) {
		super(props)
		addEventListener("keydown", (e) => {
			if (e.keyCode == 39) {
				Values.currentPlayerSpeed = Values.playerSpeed;
			} if (e.keyCode == 37) {
				Values.currentPlayerSpeed = -Values.playerSpeed;
			}
		});
		addEventListener("keyup", () => {
			Values.currentPlayerSpeed = 0;
		});
	}
	componentDidMount() {
		window.addEventListener('resize', this.onWindowResize);
		ExpoTHREE.loadAsync(require('../assets/images/player.png'));//adds the image to cache, hopefully
	}
	onWindowResize = () => {
		// this.camera.aspect = window.innerWidth / window.innerHeight;
		//this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		Values.maxScore = Math.max(Values.score, Values.maxScore);
		Values.score = 0;
	}

	onContextCreate = (gl: ExpoWebGLRenderingContext) => {

		this.logic.generate(this);
		let _cameraPos: Vector3 = this.cameraPos;

		this.camera = new PerspectiveCamera(45, Values.ratio);
		this.camera.position.copy(_cameraPos);
		this.camera.lookAt(0, 0, 0)
		this.scene.background = new Color(0x0000ff);
		this.renderer = new Renderer({ gl });
		this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

		if (Values.DEBUG) {//show screen borders
			var points = [];
			points.push(new Vector3(-Values.worldSpaceWidth / 2, -Values.worldSpaceHeight / 2, 0));
			points.push(new Vector3(+Values.worldSpaceWidth / 2, -Values.worldSpaceHeight / 2, 0));
			points.push(new Vector3(+Values.worldSpaceWidth / 2, +Values.worldSpaceHeight / 2, 0));
			points.push(new Vector3(-Values.worldSpaceWidth / 2, +Values.worldSpaceHeight / 2, 0));
			points.push(new Vector3(-Values.worldSpaceWidth / 2, -Values.worldSpaceHeight / 2, 0));
			let lineGeometry = new BufferGeometry().setFromPoints(points);
			lineGeometry.lookAt(this.cameraPos);
			this.scene.add(new Line(lineGeometry, new LineBasicMaterial({ color: 0xff0000 })));
		}

		{//draw player
			ExpoTHREE.loadAsync(require('../assets/images/player.png')).then(texture => {
				console.log("loaded");
				let material: Material = new MeshBasicMaterial({ map: texture });

				let points = [];
				let unit: number = Values.playerSize / 2;
				points.push(new Vector3(-unit, -unit, 0));
				points.push(new Vector3(+unit, +unit, 0));
				points.push(new Vector3(0, 0, 0));
				points.push(new Vector3(+unit, -unit, 0));
				points.push(new Vector3(-unit, +unit, 0));
				let playerGeometry = new CircleGeometry(Values.playerSize, 50);

				this.logic.player.tag = new Mesh(playerGeometry, material);//, new LineBasicMaterial({ color: 0xffffff, linewidth: 50 }));
				this.scene.add(this.logic.player.tag);
				console.log("created player");

			}).catch(e => {
				console.log("can't load", e);
			})
		}

		this.camera.updateMatrixWorld();
		let lastTime: number = 0;
		let loopFunc = (time) => {
			this.logic.boards.forEach(b => {
				//let b = this.logic.boards[0];
				if (b.tag === undefined) {
					var points = [];
					let unit: number = Values.boardWidth / 2;
					points.push(new Vector3(-unit, Values.boardHeight / 2, 0));
					points.push(new Vector3(+unit, Values.boardHeight / 2, 0));
					points.push(new Vector3(+unit, -Values.boardHeight / 2, 0));
					points.push(new Vector3(-unit, -Values.boardHeight / 2, 0));
					points.push(new Vector3(-unit, Values.boardHeight / 2, 0));
					var lineGeometry = new BufferGeometry().setFromPoints(points);
					b.tag = new Line(lineGeometry, new LineBasicMaterial({ color: 0xff0000, linewidth: 5000 }));
					this.scene.add(b.tag);
				}
				let line: Line = b.tag;

				line.position.x = b.body.position.x - Values.worldSpaceWidth / 2;
				line.position.y = b.body.position.y - Values.worldSpaceHeight / 2;
				line.rotation.z = b.rotation;
			});

			let player: Line = this.logic.player.tag;

			if (player != null) {
				player.position.x = this.logic.player.x - Values.worldSpaceWidth / 2;
				player.position.y = this.logic.player.y - Values.worldSpaceHeight / 2;
			}
			let msg: string = "\n";
			Values.msgs = Values.msgs.filter(m => Date.now()-m.time < Values.timeForMessage).sort((a, b) => a - b);
			Values.msgs.forEach(m => {
				msg += m.msg + "\n";
			})
			this.setState({ score: Values.score, outputDebug: msg });
			this.renderer.render(this.scene, this.camera);
			gl.endFrameEXP();

			if (lastTime == 0) {
				lastTime = time;
			} else {
				let delta = time - lastTime;
				lastTime = time;
				this.logic.move(delta / 1000);
			}
			requestAnimationFrame(loopFunc);

		};
		requestAnimationFrame(loopFunc);
	}
	onTouchStart = (e: GestureResponderEvent) => {
		if (e.nativeEvent.touches !== null && e.nativeEvent.touches.length > 0) {
			let touch: NativeTouchEvent = e.nativeEvent.touches[0];
			Values.currentPlayerSpeed = Values.playerSpeed;
			if (touch.locationX < Math.round(Dimensions.get('window').width) / 2) {
				Values.currentPlayerSpeed *= -1;
			}
		} else {
			Values.currentPlayerSpeed = 0;
		}

	}



	render() {
		return (
			<View style={{ flex: 1 }} onTouchStart={this.onTouchStart} >
				<Text ref={this.outputRef} style={{ width: 300, height: 500, position: 'absolute', backgroundColor: 0x000000, top: 20, left: 50, zIndex: 2, userSelect: "none" }}>score: {Math.round(Values.score)}, max score {Math.round(Values.maxScore)}
					{this.state.outputDebug}</Text>
				{/* <Canvas ref={this.canvasForDebug}  style={{ flex: 1, position: 'absolute', top: 20, left: 50, zIndex: 1 }} /> */}
				<GLView ref={this.glView}
					onContextCreate={this.onContextCreate}
					style={{ flex: 1 }}
					onTouchEnd={this.onTouchStart} onTouchMove={this.onTouchStart} onTouchEndCapture={this.onTouchStart} onTouchCancel={this.onTouchStart} />
			</View>
		)
	}
}
export default GameView