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
    defaultPaymentMethod: 'CASH / CREDIT',
    accentColor: '#1877F2',
    balanceDueDate: '',
    whatsappNumber: '',
  };

  private initPromise: Promise<void>;

  private constructor() {
    this.initPromise = this.init();
  }

  private async init() {
    await Promise.all([
      this.loadAdminCredentials(),
      this.loadEmployeeCredentials(),
      this.loadUserData(),
      this.loadReceiptSettings()
    ]);
  }

  public async waitForInit() {
    await this.initPromise;
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
          business_address: data.business_address || data.address,
          isEmployee: data.isEmployee || data.role === 'employee',
          role: data.role
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
            role: userData.role,
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
      const backendUser = result.user || result.employee || result.data || result;

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

  async apiCreateEmployee(userData: any) {
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
            role: userData.role || 'user',
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

  async apiFetchUsers() {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/get-users/?role=employee', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch employees: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result : [];
    } catch (e) {
      console.log('Fetch Employees Error:', e);
      return [];
    }
  }

  async apiFetchCustomers() {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/get-users/?role=customer', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }

      const result = await response.json();
      return Array.isArray(result) ? result.map((c: any) => ({
        ...c,
        name: c.customer_name || c.name,
        phone: c.customer_phone || c.phone,
      })) : [];
    } catch (e) {
      console.log('Fetch Customers Error:', e);
      return [];
    }
  }

  async apiCreatePartyCustomer(customerData: { customer_name: string; customer_phone: string; password?: string; customer_password?: string }) {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/party-customers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) {
        throw new Error('Failed to create party customer');
      }

      return await response.json();
    } catch (e) {
      console.log('Create Party Customer Error:', e);
      throw e;
    }
  }

  async apiDeleteUser(id: string) {
    try {
      const response = await fetch(`https://api.codingboss.in/inventory/signup/${id}/`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      return true;
    } catch (e) {
      console.log('Delete User Error:', e);
      throw e;
    }
  }

  async apiDeleteCustomer(id: string) {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/inventory/delete-customer/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ id: parseInt(id) })
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      return true;
    } catch (e) {
      console.log('Delete Customer Error:', e);
      throw e;
    }
  }

  async apiDeleteEmployee(id: string) {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/inventory/delete-employee/', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ id: parseInt(id) })
      });

      if (!response.ok) {
        throw new Error('Failed to delete employee');
      }

      return true;
    } catch (e) {
      console.log('Delete Employee Error:', e);
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
      
      const endpoint = 'https://api.codingboss.in/inventory/login/';

      const response = await fetch( 
        endpoint,
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

      const backendUser = result.customer || result.user || result.employee || result.data || result;
      let finalRole = backendUser.role;

      if (!finalRole) {
        // Only do fallback role fetch for non-customer logins
        try {
          const users = await this.apiFetchUsers();
          const matchedUser = users.find((u: any) => u.phone === phone || u.mobile_number === phone || String(u.phone) === String(phone));
          if (matchedUser && matchedUser.role) {
            finalRole = matchedUser.role;
          }
        } catch (err) {
          console.log('Failed to fetch fallback role:', err);
        }
      }

      this.currentUser = {
        id: backendUser.id || backendUser.customer_id || backendUser.employee_id || backendUser.pk || backendUser.userid || backendUser.uid || backendUser.employee?.id,
        full_name: backendUser.name || backendUser.customer_name || backendUser.full_name || backendUser.username,
        mobile_number: backendUser.phone || backendUser.customer_phone || backendUser.mobile_number || backendUser.mobile || phone,
        business_address: backendUser.address || backendUser.business_address || backendUser.location,
        password: backendUser.password || backendUser.customer_password || password,
        role: finalRole,
        isEmployee: finalRole === 'employee'
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

  async loginEmployee(employee: any) {
    this.currentUser = {
      id: employee.id || employee.mobile,
      full_name: employee.name || 'Employee',
      mobile_number: employee.mobile,
      business_address: 'Employee Portal',
      isEmployee: true,
      role: 'employee'
    };
    await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
    this.notify();
    return this.currentUser;
  }

  async loginAdmin(mobile: string, password?: string, isFallback: boolean = false) {
    if (isFallback) {
      this.currentUser = {
        id: '1',
        full_name: 'Master Admin',
        mobile_number: mobile,
        business_address: 'TN Palayam',
        role: 'admin',
        isEmployee: false
      };
      await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
      this.notify();
      return this.currentUser;
    }

    try {
      const response = await fetch('https://api.codingboss.in/inventory/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ phone: mobile, password }),
      });

      const result = await response.json();
      if (!response.ok || result?.error) {
        throw new Error(result?.error || result?.message || result?.detail || 'Invalid admin credentials');
      }

      const backendUser = result.customer || result.user || result.employee || result.data || result;
      // We will assume backend returns role or is_admin, fallback logic can check role
      if (backendUser.role !== 'admin' && !backendUser.is_superuser && !backendUser.is_staff) {
        // Just a basic check in case an employee tries to login as admin
        // If the backend restricts this, we're good. If not, we verify here.
        throw new Error('User does not have admin privileges');
      }

      this.currentUser = {
        id: backendUser.id || backendUser.pk || backendUser.uid || '1',
        full_name: backendUser.name || backendUser.full_name || backendUser.username || 'Admin',
        mobile_number: mobile,
        business_address: backendUser.address || backendUser.business_address || 'TN Palayam',
        role: 'admin',
        isEmployee: false
      };
      await AsyncStorage.setItem('user_data', JSON.stringify(this.currentUser));
      this.notify();
      return this.currentUser;
    } catch (e) {
      console.log('Admin login API Error:', e);
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
    if (this.currentUser?.role === 'admin') {
      return this.currentUser;
    }

    const isCustomer = this.currentUser?.role?.toLowerCase() === 'user' ||
                       this.currentUser?.role?.toLowerCase() === 'customer';

    // For customers: the login endpoint already returned all their details.
    // Don't re-fetch from the full list (risk of matching wrong customer).
    // Just return the current stored data directly.
    if (isCustomer) {
      return this.currentUser;
    }

    // For employees — fetch from get-users/?role=employee and find the match
    const profileEndpoint = 'https://api.codingboss.in/inventory/get-users/?role=employee';

    try {
      console.log('Fetching profile from:', profileEndpoint);
      const response = await fetch(profileEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const result = await response.json();
      console.log('Profile GET Response:', result);

      let profileData: any = null;

      if (Array.isArray(result)) {
        const currentMobile = this.currentUser?.mobile_number || this.currentUser?.phone;
        const currentId = this.currentUser?.id;

        profileData = result.find((u: any) =>
          (currentMobile && (
            u.phone === currentMobile || 
            u.mobile_number === currentMobile || 
            u.mobile === currentMobile ||
            u.customer_phone === currentMobile
          )) ||
          (currentId && (
            String(u.id) === String(currentId) || 
            String(u.employee_id) === String(currentId) || 
            String(u.pk) === String(currentId)
          ))
        );

        if (!profileData && result.length > 0) {
          profileData = result[result.length - 1];
        }
      } else {
        profileData = result.user || result.employee || result.customer || result.data || result;
      }

      if (profileData) {
        this.currentUser = {
          id: profileData.id || profileData.employee_id || profileData.pk || profileData.uid || profileData.employee?.id || this.currentUser?.id,
          full_name: profileData.name || profileData.customer_name || profileData.full_name || profileData.username || this.currentUser?.full_name,
          mobile_number: profileData.phone || profileData.customer_phone || profileData.mobile_number || profileData.mobile || this.currentUser?.mobile_number,
          business_address: profileData.address || profileData.business_address || profileData.location || this.currentUser?.business_address,
          // Extra signup fields if any exist on the model
          email: profileData.email || this.currentUser?.email,
          password: profileData.password || profileData.customer_password || this.currentUser?.password,
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
        const profileData = result.user || result.employee || result.data || result;

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
