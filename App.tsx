import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from './src/screens/HomeScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StatsScreen } from './src/screens/StatsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Accueil') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Recherche') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Statistiques') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Paramètres') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else {
            iconName = 'circle';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4285F4',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e9ecef',
          paddingBottom: 15,
          paddingTop: 5,
          height: 60,
          marginBottom: -10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Recherche" component={SearchScreen} />
      <Tab.Screen name="Statistiques" component={StatsScreen} />
      <Tab.Screen name="Paramètres" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}