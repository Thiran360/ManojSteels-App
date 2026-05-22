import AsyncStorage from '@react-native-async-storage/async-storage';

class AuthService {
  private static instance: AuthService;
  private currentUser: any = null;
  private listeners: (() => void)[] = [];
  private adminCredentials = { mobile: '0000', password: 'admin' };
  private employees: any[] = [];
  private receiptSettings = {
    businessName: 'MANOJ STEELS',
    tagline: 'B2B Building Materials Platform',
    phone: '9876543210',
    address: '123 Main Bazaar Road, Steel City',
    gstin: '33AAAAA1111A1Z1',
    terms: 'Goods once sold cannot be returned.',
    footerBranding: '~ Manoj Steels ~',
    showGstin: true,
    showPaymentMethod: true,
    accentColor: '#1877F2',
    balanceDueDate: '',
    whatsappNumber: '',
  };

  private constructor() {
    this.loadAdminCredentials();
    this.loadEmployeeCredentials();
    this.loadUserData();
    this.loadReceiptSettings();
  }

  private async loadUserData() {
    try {
      const saved = await AsyncStorage.getItem('user_data');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentUser = {
          id: data.id,
          full_name: data.full_name || data.name,
          mobile_number: data.mobile_number || data.phone,
          business_address: data.business_address || data.address
        };
        this.notify();
      }
    } catch (e) {
      console.log('Failed to load user data:', e);
    }
  }

  private async loadAdminCredentials() {
    try {
      const saved = await AsyncStorage.getItem('admin_creds');
      if (saved) {
        this.adminCredentials = JSON.parse(saved);
      }
    } catch (e) {
      console.log('Failed to load admin creds:', e);
    }
  }

  private async loadEmployeeCredentials() {
    try {
      const saved = await AsyncStorage.getItem('employee_creds');
      if (saved) {
        this.employees = JSON.parse(saved);
      }
    } catch (e) {
      console.log('Failed to load employee creds:', e);
    }
  }

  private async loadReceiptSettings() {
    try {
      const saved = await AsyncStorage.getItem('receipt_settings');
      if (saved) {
        this.receiptSettings = { ...this.receiptSettings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.log('Failed to load receipt settings:', e);
    }
  }

  public getReceiptSettings() {
    return this.receiptSettings;
  }

  public async updateReceiptSettings(updated: any) {
    try {
      this.receiptSettings = { ...this.receiptSettings, ...updated };
      await AsyncStorage.setItem('receipt_settings', JSON.stringify(this.receiptSettings));
      this.notify();
      return true;
    } catch (e) {
      console.log('Failed to save receipt settings:', e);
      return false;
    }
  }

  public async updateAdminCredentials(mobile: string, password: string) {
    try {
      this.adminCredentials = { mobile, password };
      await AsyncStorage.setItem('admin_creds', JSON.stringify(this.adminCredentials));
      this.notify();
      return true;
    } catch (e) {
      console.log('Failed to save admin creds:', e);
      return false;
    }
  }

  public getAdminCredentials() {
    return this.adminCredentials;
  }

  public getEmployeeCredentials() {
    return this.employees;
  }

  public async addEmployee(employeeData: any) {
    try {
      this.employees.push({ ...employeeData, id: Date.now().toString() });
      await AsyncStorage.setItem('employee_creds', JSON.stringify(this.employees));
      this.notify();
      return true;
    } catch (e) {
      console.log('Failed to add employee:', e);
      return false;
    }
  }

  public async updateEmployee(id: string, updatedData: any) {
    try {
      this.employees = this.employees.map((emp: any) => 
        emp.id === id ? { ...emp, ...updatedData } : emp
      );
      await AsyncStorage.setItem('employee_creds', JSON.stringify(this.employees));
      this.notify();
      return true;
    } catch (e) {
      console.log('Failed to update employee:', e);
      return false;
    }
  }
  
  public async deleteEmployee(id: string) {
    try {
      this.employees = this.employees.filter((emp: any) => emp.id !== id);
      await AsyncStorage.setItem('employee_creds', JSON.stringify(this.employees));
      this.notify();
      return true;
    } catch (e) {
      return false;
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  on(event: string, callback: () => void) {
    if (event === 'change') {
      this.listeners.push(callback);
    }
  }

  off(event: string, callback: () => void) {
    if (event === 'change') {
      this.listeners = this.listeners.filter(l => l !== callback);
    }
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  async signup(userData: any) {
    try {
      const response = await fetch(
        'https://api.codingboss.in/inventory/signup/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            name: userData.name,
            phone: userData.phone,
            password: userData.password,
            address: userData.address,
          }),
        }
      );

      let result;

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      console.log('API Response:', result);

      if (!response.ok) {
        throw new Error(
          result?.error ||
          result?.message ||
          result?.detail ||
          'Signup failed'
        );
      }

      // Success user data
      const backendUser = result.user || result;

      const newUser = {
        id: backendUser.id || backendUser.employee_id || backendUser.pk || backendUser.userid,
        full_name: backendUser.name || backendUser.full_name || backendUser.username,
        mobile_number: backendUser.phone || backendUser.mobile_number || backendUser.mobile,
        business_address: backendUser.address || backendUser.business_address || backendUser.location,
        message: result.message || 'Account created successfully!'
      };

      this.currentUser = newUser;
      await AsyncStorage.setItem('user_data', JSON.stringify(newUser));
      this.notify();

      return newUser;

    } catch (e) {
      console.log('API Signup Error:', e);

      // if (e.message === 'Network request failed') {
      //   throw new Error(
      //     'Could not connect to server. Please check your internet connection.'
      //   );
      // }

      // throw e;
    }
  }

  async adminCreateUser(userData: any) {
    try {
      const response = await fetch(
        'https://api.codingboss.in/inventory/signup/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify({
            name: userData.name,
            phone: userData.phone,
            password: userData.password,
            address: userData.address || '',
          }),
        }
      );

      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        throw new Error(result?.error || result?.message || result?.detail || 'User creation failed');
      }

      return result;
    } catch (e) {
      console.log('Admin Create User Error:', e);
      throw e;
    }
  }

  async login(phone: string, password: string) {
    try {
      const payload = {
        phone: phone,
        password: password,
      };

      console.log('Sending Login Payload:', payload);

      const response = await fetch(
        'https://api.codingboss.in/inventory/login/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(payload),
        }
      );

      let result;

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      console.log('Login API Response:', result);

      if (!response.ok || result?.error) {
        throw new Error(
          result?.error ||
          result?.message ||
          result?.detail ||
          'Invalid credentials'
        );
      }

      const backendUser = result.user || result;

      this.currentUser = {
        id: backendUser.id || backendUser.employee_id || backendUser.pk || backendUser.userid || backendUser.uid || backendUser.employee?.id,
        full_name: backendUser.name || backendUser.full_name || backendUser.username,
        mobile_number: backendUser.phone || backendUser.mobile_number || backendUser.mobile,
        business_address: backendUser.address || backendUser.business_address || backendUser.location,
      };

      await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
      this.notify();

      return this.currentUser;

    } catch (e: any) {

      console.log('API Login Error:', e);

      if (e.message === 'Network request failed') {
        throw new Error(
          'Could not connect to server. Please check your internet connection.'
        );
      }

      throw e;
    }
  }

  async logout() {
    try {
      await fetch('https://api.codingboss.in/inventory/logout/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });
    } catch (e) {
      console.log('Logout API Error:', e);
    }
    this.currentUser = null;
    await AsyncStorage.removeItem('user_data');
    this.notify();
  }

  async apiFetchProfile() {
    try {
      console.log('Fetching profile from signup endpoint...');
      const response = await fetch('https://api.codingboss.in/inventory/signup/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch from signup endpoint: ${response.status}`);
      }

      const result = await response.json();
      console.log('Signup GET Response:', result);

      let profileData: any = null;

      if (Array.isArray(result)) {
        // If the endpoint returns a list of signed-up users, find the matching one
        const currentMobile = this.currentUser?.mobile_number || this.currentUser?.phone;
        const currentId = this.currentUser?.id;

        profileData = result.find((u: any) =>
          (currentMobile && (u.phone === currentMobile || u.mobile_number === currentMobile || u.mobile === currentMobile)) ||
          (currentId && (String(u.id) === String(currentId) || String(u.employee_id) === String(currentId) || String(u.pk) === String(currentId)))
        );

        // If no matching user, use the last signed up user or fallback
        if (!profileData && result.length > 0) {
          profileData = result[result.length - 1];
        }
      } else {
        profileData = result.user || result;
      }

      if (profileData) {
        this.currentUser = {
          id: profileData.id || profileData.employee_id || profileData.pk || profileData.uid || profileData.employee?.id || this.currentUser?.id,
          full_name: profileData.name || profileData.full_name || profileData.username || this.currentUser?.full_name,
          mobile_number: profileData.phone || profileData.mobile_number || profileData.mobile || this.currentUser?.mobile_number,
          business_address: profileData.address || profileData.business_address || profileData.location || this.currentUser?.business_address,
          // Extra signup fields if any exist on the model
          email: profileData.email || this.currentUser?.email,
          role: profileData.role || profileData.employee_role || this.currentUser?.role,
          date_joined: profileData.created_at || profileData.date_joined || this.currentUser?.date_joined,
        };

        await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
        this.notify();
        return this.currentUser;
      } else {
        throw new Error('No profile data resolved from signup endpoint');
      }
    } catch (e) {
      console.log('Signup profile fetch error, falling back to profile endpoint:', e);
      // Fallback to /profile/ endpoint
      try {
        const response = await fetch('https://api.codingboss.in/inventory/profile/', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch profile endpoint');

        const result = await response.json();
        const profileData = result.user || result;

        this.currentUser = {
          ...this.currentUser,
          id: profileData.id || profileData.employee_id || profileData.pk || profileData.uid || profileData.employee?.id || this.currentUser?.id,
          full_name: profileData.name || profileData.full_name || profileData.username || this.currentUser?.full_name,
          mobile_number: profileData.phone || profileData.mobile_number || profileData.mobile || this.currentUser?.mobile_number,
          business_address: profileData.address || profileData.business_address || profileData.location || this.currentUser?.business_address,
          email: profileData.email || this.currentUser?.email,
          role: profileData.role || profileData.employee_role || this.currentUser?.role,
          date_joined: profileData.created_at || profileData.date_joined || this.currentUser?.date_joined,
        };

        await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
        this.notify();
        return this.currentUser;
      } catch (fallbackErr) {
        console.log('Fallback profile fetch error:', fallbackErr);
        // If both endpoints fail, return the locally persisted user
        return this.currentUser;
      }
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  async updateProfile(updatedData: any) {
    if (!this.currentUser) return;
    this.currentUser = { ...this.currentUser, ...updatedData };
    this.notify();
  }
}

export const authService = AuthService.getInstance();
