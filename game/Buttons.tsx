import React from "react";
import { TouchableOpacity } from "react-native-gesture-handler";
import { View } from "react-native";
class Button extends React.PureComponent {
	render() {
		const size = 50 - 4
		// const {style, onPress, id, onPressOut} = this.props
		return (
			<TouchableOpacity style={{ padding: 2 }} onPressOut={_ => onPressOut(id)} onPressIn={_ => { onPress(id) }}>
				<View style={{ width: 500, height:500, backgroundColor: 'rgba(200, 200, 200, 0.7)', borderRadius: 3 }}>
				</View>
			</TouchableOpacity>
		)
	}
}

export class Buttons extends React.Component {
	render() {
		return (

			<View pointerEvents={'box-none'} style={{ flexDirection: 'row' }}>
				<Button />
				<Button />
			</View>
		)
	}
}