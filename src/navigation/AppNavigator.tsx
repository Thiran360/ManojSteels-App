import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import MainTabNavigator from './MainTabNavigator';
import ProductListScreen from '../screens/ProductListScreen';
import ProductDetailsScreen from '../screens/ProductDetailsScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import AdminDashboard from '../screens/AdminDashboard';
import CementScreen from '../screens/CementScreen';
import TMTBarsScreen from '../screens/TMTBarsScreen';
import KadapaSlabsScreen from '../screens/KadapaSlabsScreen';
import BuildingBlocksScreen from '../screens/BuildingBlocksScreen';
import TarpaulinScreen from '../screens/TarpaulinScreen';
import CementProductsScreen from '../screens/CementProductsScreen';
import WaterTanksScreen from '../screens/WaterTanksScreen';
import LaundryStoneScreen from '../screens/LaundryStoneScreen';
import BlueMetalScreen from '../screens/BlueMetalScreen';
import TokensScreen from '../screens/TokensScreen';
import NewArrivalsScreen from '../screens/NewArrivalsScreen';
import PartySelectionScreen from '../screens/PartySelectionScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
        <Stack.Screen name="ProductList" component={ProductListScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Admin" component={AdminDashboard} />
        <Stack.Screen name="Cement" component={CementScreen} />
        <Stack.Screen name="TMT Bars" component={TMTBarsScreen} />
        <Stack.Screen name="Kadapa Slabs" component={KadapaSlabsScreen} />
        <Stack.Screen name="Building Blocks" component={BuildingBlocksScreen} />
        <Stack.Screen name="Tarpaulin" component={TarpaulinScreen} />
        <Stack.Screen name="Cement Products" component={CementProductsScreen} />
        <Stack.Screen name="Water Tanks" component={WaterTanksScreen} />
        <Stack.Screen name="Laundry Stone" component={LaundryStoneScreen} />
        <Stack.Screen name="Blue Metal" component={BlueMetalScreen} />
        <Stack.Screen name="Tokens" component={TokensScreen} />
        <Stack.Screen name="NewArrivals" component={NewArrivalsScreen} />
        <Stack.Screen 
          name="PartySelection" 
          component={PartySelectionScreen} 
          options={{ presentation: 'transparentModal', animation: 'fade' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
