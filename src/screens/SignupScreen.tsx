import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { LinearGradient } from 'react-native-linear-gradient';
import { User, Phone, Lock, MapPin, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { authService } from '../services/AuthService';
import { Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import AnimatedBackground from '../components/AnimatedBackground';

const { width, height } = Dimensions.get('window');

const InputField = ({ icon, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default', index, isPassword = false, onToggleVisibility, showPassword }: any) => (
  <Animated.View 
    entering={FadeInDown.delay(400 + index * 100).duration(600)}
    style={styles.inputContainer}
  >
    <View style={styles.iconContainer}>
      {icon}
    </View>
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      placeholderTextColor={Colors.textSecondary}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={isPassword ? !showPassword : secureTextEntry}
      keyboardType={keyboardType}
    />
    {isPassword && (
      <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeIcon}>
        {showPassword ? <EyeOff size={20} color={Colors.textSecondary} /> : <Eye size={20} color={Colors.textSecondary} />}
      </TouchableOpacity>
    )}
  </Animated.View>
);

const SignupScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupType, setSignupType] = useState('customer');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    address: '',
  });

  const handleSignup = async () => {
    if (!formData.name || !formData.phone || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await authService.signup({ ...formData, role: signupType });
      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('Main');
    } catch (e: any) {
      Alert.alert('Signup Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AnimatedBackground />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={Colors.primary} />
        </TouchableOpacity>

        <Animated.View 
          entering={FadeInDown.delay(200).duration(800)}
          style={styles.header}
        >
          <Text style={[Typography.h1, styles.title]}>Create Account</Text>
          <Text style={[Typography.bodyMedium, styles.subtitle]}>Join Manoj Steels today</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.roleTabSwitch}>
          <TouchableOpacity 
            style={[styles.roleTab, signupType === 'customer' && styles.roleTabActive]}
            onPress={() => setSignupType('customer')}
          >
            <Text style={[styles.roleTabText, signupType === 'customer' && styles.roleTabTextActive]}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleTab, signupType === 'employee' && styles.roleTabActive]}
            onPress={() => setSignupType('employee')}
          >
            <Text style={[styles.roleTabText, signupType === 'employee' && styles.roleTabTextActive]}>Employee</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleTab, signupType === 'admin' && styles.roleTabActive]}
            onPress={() => setSignupType('admin')}
          >
            <Text style={[styles.roleTabText, signupType === 'admin' && styles.roleTabTextActive]}>Admin</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.form}>
          <InputField
            index={0}
            icon={<User size={20} color={Colors.accent} />}
            placeholder="Fullname"
            value={formData.name}
            onChangeText={(t: string) => setFormData({ ...formData, name: t })}
          />

          <InputField
            index={1}
            icon={<Phone size={20} color={Colors.accent} />}
            placeholder="Mobile Number"
            value={formData.phone}
            onChangeText={(t: string) => setFormData({ ...formData, phone: t })}
            keyboardType="phone-pad"
          />

          <InputField
            index={2}
            icon={<MapPin size={20} color={Colors.accent} />}
            placeholder="Business Address"
            value={formData.address}
            onChangeText={(t: string) => setFormData({ ...formData, address: t })}
          />

          <InputField
            index={3}
            icon={<Lock size={20} color={Colors.accent} />}
            placeholder="Password"
            value={formData.password}
            onChangeText={(t: string) => setFormData({ ...formData, password: t })}
            isPassword={true}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword(!showPassword)}
          />


          <Animated.View entering={FadeInUp.delay(900).springify()}>
            <TouchableOpacity 
              style={[styles.signupButton, loading && styles.disabledButton]} 
              onPress={handleSignup}
              disabled={loading}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={[Typography.button, styles.signupButtonText]}>SIGN UP</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Animated.View 
          entering={FadeIn.delay(1100)}
          style={styles.footer}
        >
          <Text style={[Typography.bodySmall, styles.alreadyAccountText]}>
            Already have an account?
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[Typography.bodySmall, styles.loginText]}>Login</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  backBtn: {
    marginTop: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginTop: 30,
    marginBottom: 40,
  },
  title: {
    color: Colors.white,
    fontSize: 32,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  roleTabSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  roleTabActive: {
    backgroundColor: Colors.white,
  },
  roleTabText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
    fontSize: 14,
  },
  roleTabTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: Colors.text,
    ...Typography.bodyMedium,
  },
  signupButton: {
    height: 56,
    borderRadius: 12,
    marginTop: 10,
    overflow: 'hidden',
  },
  disabledButton: {
    opacity: 0.7,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    color: Colors.white,
    letterSpacing: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 8,
  },
  alreadyAccountText: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loginText: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
  eyeIcon: {
    padding: 8,
  },
});

export default SignupScreen;
