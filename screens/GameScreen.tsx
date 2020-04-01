import React from 'react';
import {
	Platform,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { JSXElement } from '@babel/types';
import GameView from '../game/GameView';


export default function GameScreen() {
	let r: JSX.Element = (
		<View style={styles.container}>
			<GameView />

		</View>
	);
	return r;
}

GameScreen.navigationOptions = {
	header: null,
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	tabBarInfoText: {
		fontSize: 17,
		color: 'rgba(96,100,109, 1)',
		textAlign: 'center',
	},
});
