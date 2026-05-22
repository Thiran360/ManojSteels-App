import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Eye, EyeOff, Phone, Lock } from 'lucide-react-native';
import { authService } from '../services/AuthService';
import { Alert } from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, Layout, ZoomIn } from 'react-native-reanimated';
import AnimatedBackground from '../components/AnimatedBackground';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation, route }: any) => {
  const [loading, setLoading] = useState(false);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginType, setLoginType] = useState('User'); // 'User' or 'Admin'
  
  useEffect(() => {
    if (route.params?.phone) {
      setMobile(route.params.phone);
    }
    
    // Auto-navigate if already logged in
    const user = authService.getCurrentUser();
    if (user) {
      navigation.replace('Main');
    }
  }, [route.params?.phone]);

  const handleLogin = async () => {
    const cleanedMobile = (mobile || '').trim();
    const cleanedPassword = (password || '').trim();

    if (!cleanedMobile || !cleanedPassword) {
      Alert.alert('Error', 'Please enter both phone number and password');
      return;
    }

    setLoading(true);
    try {
      const adminCreds = authService.getAdminCredentials();
      const isMasterAdmin = cleanedMobile === '0000' && cleanedPassword === 'admin';
      const isConfiguredAdmin = adminCreds && cleanedMobile === adminCreds.mobile && cleanedPassword === adminCreds.password;

      // If either master admin or configured admin credentials are used, log in as Admin
      if (isMasterAdmin || isConfiguredAdmin) {
        navigation.replace('Admin');
      } else if (loginType === 'Admin') {
        // If they attempted admin login but credentials did not match
        Alert.alert('Admin Access Denied', 'Invalid Admin Credentials');
      } else if (loginType === 'Employee') {
        const employees = authService.getEmployeeCredentials();
        const validEmp = employees.find((e: any) => e.mobile === cleanedMobile && e.password === cleanedPassword);
        if (validEmp) {
          navigation.replace('Main');
        } else {
          Alert.alert('Employee Access Denied', 'Invalid Employee Credentials');
        }
      } else {
        // Regular user login path
        await authService.login(cleanedMobile, cleanedPassword);
        navigation.replace('Main');
      }
    } catch (e: any) {
      Alert.alert('Login Failed', e.message);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          entering={FadeInDown.duration(800).delay(200)}
          style={styles.header}
        >
          <Text style={[Typography.h1, styles.welcomeText]}>Welcome Back</Text>
          <Text style={[Typography.bodyMedium, styles.subtitle]}>
            Sign in to continue building your dreams
          </Text>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.duration(800).delay(400)}
          style={styles.formContainer}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
            style={styles.card}
          >
            <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.loginTabSwitch}>
              <TouchableOpacity 
                style={[styles.loginTab, loginType === 'User' && styles.loginTabActive]}
                onPress={() => setLoginType('User')}
              >
                <Text style={[styles.loginTabText, loginType === 'User' && styles.loginTabTextActive]}>User</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.loginTab, loginType === 'Employee' && styles.loginTabActive]}
                onPress={() => setLoginType('Employee')}
              >
                <Text style={[styles.loginTabText, loginType === 'Employee' && styles.loginTabTextActive]}>Employee</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.loginTab, loginType === 'Admin' && styles.loginTabActive]}
                onPress={() => setLoginType('Admin')}
              >
                <Text style={[styles.loginTabText, loginType === 'Admin' && styles.loginTabTextActive]}>Admin</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.Text entering={FadeInDown.delay(600).duration(600)} style={[Typography.h3, styles.formTitle]}>
              {loginType === 'User' ? 'Login' : loginType === 'Employee' ? 'Employee Portal' : 'Admin Portal'}
            </Animated.Text>

            <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.inputGroup}>
              <View style={styles.iconContainer}>
                <Phone size={20} color={Colors.accent} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Mobile Number"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(800).duration(600)} style={styles.inputGroup}>
              <View style={styles.iconContainer}>
                <Lock size={20} color={Colors.accent} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.textSecondary}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? (
                  <EyeOff size={20} color={Colors.textSecondary} />
                ) : (
                  <Eye size={20} color={Colors.textSecondary} />
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.rememberRow}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                  {rememberMe && <View style={styles.checkboxInner} />}
                </View>
                <Text style={[Typography.bodySmall, styles.rememberText]}>
                  Remember Me
                </Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={[Typography.bodySmall, styles.forgotText]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            <Animated.View entering={FadeInUp.delay(1000).springify()}>
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.secondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {loading ? (
                    <ActivityIndicator color={Colors.white} />
                  ) : (
                    <Text style={[Typography.button, styles.buttonText]}>
                      {loginType === 'User' ? 'USER LOGIN' : loginType === 'Employee' ? 'EMPLOYEE LOGIN' : 'ADMIN LOGIN'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

          </LinearGradient>
        </Animated.View>

        {loginType === 'User' && (
          <Animated.View entering={FadeIn.delay(1200)} style={styles.footer}>
            <Text style={[Typography.bodySmall, styles.noAccountText]}>
              Don't have an account?
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={[Typography.bodySmall, styles.signUpText]}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

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
  header: {
    marginTop: height * 0.1,
    marginBottom: 40,
  },
  welcomeText: {
    color: Colors.white,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 10,
  },
  formContainer: {
    width: '100%',
  },
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  loginTabSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(24, 119, 242, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loginTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  loginTabActive: {
    backgroundColor: Colors.accent,
  },
  loginTabText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  loginTabTextActive: {
    color: Colors.white,
  },
  formTitle: {
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    color: Colors.text,
    ...Typography.bodyMedium,
  },
  eyeIcon: {
    padding: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.accent,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.accent,
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  rememberText: {
    color: Colors.textSecondary,
  },
  forgotText: {
    color: Colors.accent,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.7,
  },
  adminLoginButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  adminLoginText: {
    color: Colors.white,
    letterSpacing: 1,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: Colors.white,
  },
  otpDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textSecondary,
    marginHorizontal: 16,
    fontSize: 12,
  },
  otpButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpButtonText: {
    color: Colors.accent,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  noAccountText: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 4,
  },
  signUpText: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
