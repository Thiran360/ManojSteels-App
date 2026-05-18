import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

const Bubble = ({ delay, size, startX, startY }: any) => {
  const moveY = useSharedValue(0);
  const moveX = useSharedValue(0);
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    moveY.value = withRepeat(
      withSequence(
        withTiming(-height, { duration: 8000 + Math.random() * 4000 }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );

    moveX.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 2000 }),
        withTiming(-20, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: moveY.value },
      { translateX: moveX.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        styles.bubble, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          left: startX,
          top: startY,
        },
        animatedStyle
      ]} 
    />
  );
};

const AnimatedBackground = () => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0F172A', '#1E293B']}
        style={StyleSheet.absoluteFill}
      />
      
      <Bubble size={100} startX={width * 0.1} startY={height * 0.9} />
      <Bubble size={150} startX={width * 0.6} startY={height * 0.8} />
      <Bubble size={80} startX={width * 0.4} startY={height * 0.7} />
      <Bubble size={120} startX={width * 0.8} startY={height * 0.6} />
      <Bubble size={60} startX={width * 0.2} startY={height * 0.4} />
      <Bubble size={200} startX={width * 0.3} startY={height * 0.2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    zIndex: -1,
  },
  bubble: {
    position: 'absolute',
    backgroundColor: Colors.accent,
  },
});

export default AnimatedBackground;
