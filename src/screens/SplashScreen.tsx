import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors, Gradients } from '../theme/colors';
import { Typography } from '../theme/typography';
import { authService } from '../services/AuthService';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.9);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();


    const timer = setTimeout(async () => {
      const user = authService.getCurrentUser();
      if (user) {
        navigation.replace('Main');
      } else {
        navigation.replace('Login');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
          resizeMode="contain" 
        />
        <Text style={[Typography.h3, styles.tagline]}>
          Build your Dream Home With us
        </Text>
        
        <View style={styles.loaderContainer}>
          <View style={styles.loaderLine} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logo: {
    width: width * 0.7,
    height: 180,
    marginBottom: 10,
  },
  logoText: {
    color: Colors.white,
    fontSize: 50,
    fontWeight: 'bold',
  },
  title: {
    color: Colors.primary,
    marginTop: 10,
    fontWeight: 'bold',
  },
  tagline: {
    color: Colors.text,
    marginTop: 0,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loaderContainer: {
    width: 200,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginTop: 40,
    overflow: 'hidden',
  },
  loaderLine: {
    width: '40%',
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  }
});

export default SplashScreen;
