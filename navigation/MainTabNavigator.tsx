import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, NavigationStackConfig, NavigationStackProp } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import GameScreen from '../screens/GameScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {NavigationRouteConfigMap, NavigationNavigator,NavigationProp,NavigationState, NavigationRoute, NavigationRouteConfig } from 'react-navigation';
import { NavigationStackOptions } from '../node_modules/react-navigation-stack/lib/typescript/types';
import { Options } from 'istanbul-reports';

type TabBarIconProps = { focused?: boolean };

const config: NavigationStackConfig = Platform.select({
  web: { headerMode: 'screen' },
  default: {}
});

let a:NavigationRouteConfig<Options,NavigationStackProp<NavigationRoute, any>>=HomeScreen;//HomeScreen
let map:NavigationRouteConfigMap<NavigationStackOptions, NavigationStackProp<NavigationRoute, any>>={
  Home:HomeScreen
};
const HomeStack = createStackNavigator(map,config);
//NavigationRouteConfigMap<NavigationStackOptions, NavigationStackProp<NavigationRoute, any>>

HomeStack.navigationOptions = {
  tabBarLabel: 'Home',
  tabBarIcon: ({ focused }: TabBarIconProps) => (
    <TabBarIcon
      focused={focused}
      name={
        "md-information-circle"
        //  ? `ios-information-circle${focused ? '' : '-outline'}`
          // 'md-information-circle'
      }
    />
  )
};

HomeStack.path = '';

const gameStack = createStackNavigator(
  {
    game: GameScreen
  },
  config
);

gameStack.navigationOptions = {
  tabBarLabel: 'Game',
  header:null,
  tabBarIcon: ({ focused }: TabBarIconProps) => (
    <TabBarIcon focused={focused} name={Platform.OS === 'ios' ? 'ios-link' : 'md-link'} />
  )
};

gameStack.path = '';

const SettingsStack = createStackNavigator(
  {
    Settings: SettingsScreen
  },
  config
);

SettingsStack.navigationOptions = {
  tabBarLabel: 'Settings',
  tabBarIcon: ({ focused }: TabBarIconProps) => (
    <TabBarIcon focused={focused} name={Platform.OS === 'ios' ? 'ios-options' : 'md-options'} />
  )
};

SettingsStack.path = '';

const tabNavigator: NavigationNavigator<any, NavigationProp<NavigationState>> = createBottomTabNavigator({
  HomeStack,
  gameStack,
  SettingsStack
});

//tabNavigator.navigationOptions.path = '';

export default tabNavigator;
