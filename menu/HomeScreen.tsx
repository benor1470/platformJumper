import React, { RefObject } from 'react';
import {
  View,Text
} from 'react-native';
import { Render } from 'matter-js';
import GameView from '../game/GameView';

export interface HomeScreenState {
	playing: boolean
}
export default class HomeScreen extends React.Component<any,HomeScreenState> {
  state: Readonly<HomeScreenState> = {playing:false};
	private outputRef: RefObject<Text> = React.createRef<Text>();

  render(){
    if(!this.state.playing){
    return (
      <View>
        <Text ref={this.outputRef} style={{top:50}} onPress={(e)=>this.setState({playing:true})} >press to start</Text>
      </View>
    );
    }else{
      return (
          <GameView/>
       
      );
    }
  }
}

