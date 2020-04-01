import React, { Component, RefObject } from "react";
import GameLogic from "./GameLogic";

import { GLView, ExpoWebGLRenderingContext } from 'expo-gl';
import { View, Text, GestureResponderEvent, NativeTouchEvent, Dimensions } from "react-native";
import THREE, { Scene, PerspectiveCamera, TetrahedronBufferGeometry, MeshBasicMaterial, Mesh, Color, BoxGeometry, LineBasicMaterial, Vector3, BufferGeometry, Line, Vector4, OrthographicCamera, TextGeometry, FontLoader, Camera } from "three";
import ExpoTHREE, { Renderer } from "expo-three"
import { Buttons } from "./Buttons";
import Values from "../constants/Values";

export interface GameViewState {
	score: number
	outputDebug: string;
}
class GameView extends React.Component<any, GameViewState> {
	state: Readonly<GameViewState> = { score: 0, outputDebug: "" }
	private logic: GameLogic = new GameLogic();
	//	private time: number = 0;
	private scene: Scene = new Scene();
	private renderer: ExpoTHREE.Renderer;
	private xSpeed: number = 0;
	private camera: PerspectiveCamera;
	private outputRef: RefObject<Text> = React.createRef<Text>();
	private glView: RefObject<GLView> = React.createRef<GLView>();;
	private readonly cameraPos: Vector3 = new Vector3(0, 0, 1500);//
	constructor(props) {
		super(props)
		addEventListener("keydown", (e) => {
			if (e.keyCode == 39) {
				this.xSpeed = Values.playerSpeed;
			} if (e.keyCode == 37) {
				this.xSpeed = -Values.playerSpeed;
			}
		});
		addEventListener("keyup", (e) => {
			this.xSpeed = 0;
		});
	}
	componentDidMount() {
		window.addEventListener('resize', this.onWindowResize);
	}

	onKeyDown() {

	}
	onContextCreate = (gl: ExpoWebGLRenderingContext) => {
		this.logic.generate(Values.boardsCount, Values.worldSpaceWidth, Values.worldSpaceHeight);
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

		// 3. Renderer

		const material = new MeshBasicMaterial({ color: 0x00ff00, opacity: 1 })

		this.camera.updateMatrixWorld();

		let loopFunc = () => {
			requestAnimationFrame(loopFunc);
			this.logic.boards.forEach(b => {
				//let b = this.logic.boards[0];
				if (b.tag === undefined) {
					var points = [];
					let unit: number = Values.boardWidth / 2;
					points.push(new Vector3(-unit, 0, 0));
					points.push(new Vector3(+unit, 0, 0));
					var lineGeometry = new BufferGeometry().setFromPoints(points);
					b.tag = new Line(lineGeometry, new LineBasicMaterial({ color: 0xff0000, linewidth: 50 }));
					this.scene.add(b.tag);
				}
				let line: Line = b.tag;
				line.position.x = b.x - Values.worldSpaceWidth / 2;
				line.position.y = b.y - Values.worldSpaceHeight / 2;
			});
			if (this.logic.player.tag === undefined) {
				var points = [];
				let unit: number = Values.playerSize / 2;
				points.push(new Vector3(-unit, -unit, 0));
				points.push(new Vector3(+unit, +unit, 0));
				points.push(new Vector3(0, 0, 0));
				points.push(new Vector3(+unit, -unit, 0));
				points.push(new Vector3(-unit, +unit, 0));
				var playerGeometry = new BufferGeometry().setFromPoints(points);


				this.logic.player.tag = new Line(playerGeometry, new LineBasicMaterial({ color: 0xffffff, linewidth: 50 }));
				this.scene.add(this.logic.player.tag);
			}

			let player: Line = this.logic.player.tag;
			player.position.x = this.logic.player.x - Values.worldSpaceWidth / 2;
			player.position.y = this.logic.player.y - Values.worldSpaceHeight / 2;
			Values.score++;
			this.setState({ score: Values.score })
			this.renderer.render(this.scene, this.camera);
			this.logic.move(Values.worldSpaceWidth, Values.worldSpaceHeight, this.xSpeed);
			gl.endFrameEXP();

		};
		loopFunc();
	}
	onTouchStart = (e: GestureResponderEvent) => {
		if (e.nativeEvent.touches !== null && e.nativeEvent.touches.length > 0) {
			let touch: NativeTouchEvent = e.nativeEvent.touches[0];
			this.xSpeed = Values.playerSpeed;
			if (touch.locationX < Math.round(Dimensions.get('window').width) / 2) {
				this.xSpeed *= -1;
			}
		} else {
			this.xSpeed = 0;
		}
	}

	onWindowResize = () => {
		// this.camera.aspect = window.innerWidth / window.innerHeight;
		//this.camera.updateProjectionMatrix();
		//this.renderer.setSize(window.innerWidth, window.innerHeight);
		Values.score = 0;
	}

	render() {
		return (
			<View style={{ flex: 1 }} k>
				<Text ref={this.outputRef} style={{ width: 100, height: 100, position: 'absolute', backgroundColor: 0x000000, top: 20, left: 50, zIndex: 1 }}>score: {Values.score}
					{this.state.outputDebug}</Text>
				<GLView ref={this.glView}
					onContextCreate={this.onContextCreate}
					style={{ flex: 1 }}
					onTouchStart={this.onTouchStart} onTouchEnd={this.onTouchStart} onTouchMove={this.onTouchStart} onTouchEndCapture={this.onTouchStart} onTouchCancel={this.onTouchStart} />
			</View>
		)
	}
}
export default GameView