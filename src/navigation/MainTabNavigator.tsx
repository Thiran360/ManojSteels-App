import React, { useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, ShoppingCart, User, Coins, FileText, Fuel, Receipt } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TokensScreen from '../screens/TokensScreen';
import EmployeeAttendanceScreen from '../screens/EmployeeAttendanceScreen';
import FuelScreen from '../screens/FuelScreen';
import AdminDashboard from '../screens/AdminDashboard';
import { Colors } from '../theme/colors';
import { authService } from '../services/AuthService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, IconComponent, label }: any) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', minWidth: 65 }}>
      <View style={{ 
        backgroundColor: focused ? Colors.primary : 'transparent', 
        width: 36, 
        height: 36, 
        borderRadius: 18, 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: 2
      }}>
        <IconComponent size={18} color={focused ? Colors.white : '#8F9BB3'} />
      </View>
      <Text 
        numberOfLines={1}
        style={{ 
          fontSize: 10, 
          fontWeight: focused ? '700' : '500', 
          color: focused ? Colors.primary : '#8F9BB3',
          textAlign: 'center'
        }}
      >
        {label}
      </Text>
    </View>
  );
};

const MainTabNavigator = () => {
  const user = authService.getCurrentUser();
  const isEmployee = user?.role === 'employee' || user?.role?.toLowerCase() === 'employee' || user?.role?.toLowerCase() === 'staff';
  const isSudhakar = (user?.mobile_number === '7904343214' || user?.full_name?.toUpperCase() === 'SUDHAKAR');
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 65 + Math.max(insets.bottom, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingTop: 10,
          elevation: 10,
          shadowColor: Colors.black,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={Home} label="Home" />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={ShoppingCart} label="Cart" />
          ),
        }}
      />
      <Tab.Screen
        name="TokensTab"
        component={TokensScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={Coins} label="Tokens" />
          ),
        }}
      />
      {isEmployee && (
        <Tab.Screen
          name="Attendance"
          component={EmployeeAttendanceScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} IconComponent={FileText} label="Attendance" />
            ),
          }}
        />
      )}
      {isEmployee && (
        <Tab.Screen
          name="Fuel"
          component={FuelScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} IconComponent={Fuel} label="Fuel" />
            ),
          }}
        />
      )}
      {isEmployee && (
        <Tab.Screen
          name="Receipts"
          component={AdminDashboard}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon focused={focused} IconComponent={Receipt} label="Voucher" />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} IconComponent={User} label="Profile" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
