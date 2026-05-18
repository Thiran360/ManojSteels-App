import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './AuthService';

class CartService {
  private cartItems: any[] = [];
  private orders: any[] = [];
  private products: any[] = [];
  private bulkOrders: any[] = []; // Dedicated list for Bulk Orders
  private tokenCounter: number = 101; // Starting token for bulk
  private loyaltyTokens: number = 2800;
  private brands: string[] = ['UltraTech Cement', 'Ambuja Cement', 'Ramco Cement', 'Chettinad Cement'];
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private async init() {
    await this.loadData();
  }

  private async loadData() {
    try {
      const savedBrands = await AsyncStorage.getItem('cement_brands');
      const savedProducts = await AsyncStorage.getItem('@ms_products');
      const savedOrders = await AsyncStorage.getItem('@ms_orders');
      const savedBulkOrders = await AsyncStorage.getItem('@ms_bulk_orders');
      const savedTokens = await AsyncStorage.getItem('@ms_tokens');
      const savedCounter = await AsyncStorage.getItem('@ms_counter');

      if (savedBrands) this.brands = JSON.parse(savedBrands);
      if (savedProducts) this.products = JSON.parse(savedProducts);
      if (savedTokens) this.loyaltyTokens = parseInt(savedTokens);
      if (savedCounter) this.tokenCounter = parseInt(savedCounter);
      
      const savedCart = await AsyncStorage.getItem('@ms_cart');
      if (savedCart) this.cartItems = JSON.parse(savedCart);
      
      if (savedOrders) this.orders = JSON.parse(savedOrders);
      
      if (savedBulkOrders) this.bulkOrders = JSON.parse(savedBulkOrders);

      this.notify();
    } catch (e) {
      console.log('Failed to load data:', e);
    }
  }

  private async saveData() {
    try {
      await AsyncStorage.setItem('cement_brands', JSON.stringify(this.brands));
      await AsyncStorage.setItem('@ms_products', JSON.stringify(this.products));
      await AsyncStorage.setItem('@ms_tokens', this.loyaltyTokens.toString());
      await AsyncStorage.setItem('@ms_counter', this.tokenCounter.toString());
      await AsyncStorage.setItem('@ms_cart', JSON.stringify(this.cartItems));
      await AsyncStorage.setItem('@ms_orders', JSON.stringify(this.orders));
      await AsyncStorage.setItem('@ms_bulk_orders', JSON.stringify(this.bulkOrders));
    } catch (e) {
      console.log('Failed to save data:', e);
    }
  }

  getCartItems() { return this.cartItems; }
  getOrders() { return this.orders; }
  getProducts() { return this.products; }
  getLoyaltyTokens() { return this.loyaltyTokens; }
  getBulkOrders() { return this.bulkOrders; }
  getBrands() { return this.brands; }

  async clearOrders() {
    this.orders = [];
    await this.saveData();
    this.notify();
  }

  async deleteOrder(id: string) {
    this.orders = this.orders.filter(o => o.id !== id);
    await this.saveData();
    this.notify();
  }

  addBrand(brand: string) {
    if (!this.brands.includes(brand)) {
      this.brands = [...this.brands, brand];
      this.notify();
    }
  }

  removeBrand(brand: string) {
    this.brands = this.brands.filter(b => b !== brand);
    this.notify();
  }

  async apiFetchProducts(categoryId?: string) {
    try {
      let url = 'https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/products/';

      if (categoryId) {
        url = `https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/categories/${categoryId}/products/`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const result = await response.json();

      console.log('Products API Response:', result);

      const mappedProducts = result.map((item: any) => ({
        id: String(item.id),

        name: item.product_name || '',
        brand: item.brand_name || '',

        price: item.price || (item.category === 1 ? 450 : item.category === 2 ? 3200 : 1500),

        qty: item.stock_quantity || 0,

        image: item.product_image || '',

        category: item.category_name || 'Others',
        categoryId: item.category || 1,
      }));

      this.products = mappedProducts;

      this.notify();

      return mappedProducts;

    } catch (e) {

      console.log('API Fetch Products Error:', e);

      return this.products;
    }
  }

  async apiAddProduct(productData: any) {
    try {
      const formData = new FormData();
      formData.append('product_name', productData.name);
      formData.append('brand_name', productData.brand || 'Generic');
      formData.append('price', String(productData.price));
      formData.append('stock_quantity', String(productData.qty));
      
      // If category is a name, try to fetch or resolve to ID, or let backend handle if it supports name
      formData.append('category', String(productData.category));

      if (productData.image && (productData.image.startsWith('file://') || productData.image.startsWith('content://'))) {
        const uri = productData.image;
        const filename = uri.split('/').pop() || `product_${Date.now()}.jpg`;

        formData.append('product_image', {
          uri: uri,
          name: filename,
          type: 'image/jpeg',
        } as any);
      }

      const response = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/products/', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          // Note: Do NOT set Content-Type header when sending FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add product: ${errorText}`);
      }

      const result = await response.json();
      this.addProduct({ ...productData, id: result.id || productData.id });
      return result;
    } catch (e) {
      console.log('API Add Product Error:', e);
      throw e;
    }
  }

  addProduct(product: any) {
    this.products = [product, ...this.products];
    this.notify();
  }

  async deleteProduct(id: string) {
    try {
      const response = await fetch(`https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/products/${id}/`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete product from server');
      }

      this.products = this.products.filter(p => p.id !== id);
      this.notify();
      return true;
    } catch (e) {
      console.log('API Delete Product Error:', e);
      throw e;
    }
  }

  clearProducts() {
    this.products = [];
    this.notify();
  }

  on(event: string, callback: () => void) {
    if (event === 'change') this.listeners.push(callback);
  }

  off(event: string, callback: () => void) {
    if (event === 'change') this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notify() {
    this.listeners.forEach(l => l());
    this.saveData();
  }

  async apiFetchBulkOrders() {
    try {
      const response = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/bulk-orders/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bulk orders');
      }

      const result = await response.json();
      this.bulkOrders = result.map((item: any) => ({
        id: item.token_number || `BT-${item.id}`,
        brand: item.category_name || item.cement_brand || 'Cement',
        bags: item.number_of_bags,
        location: item.delivery_address,
        deliveryDate: item.delivery_date || item.preferred_delivery_date,
        paymentType: item.payment_type,
        status: item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Pending',
        truckNo: item.truck_number,
        date: new Date(item.created_at).toLocaleDateString(),
        time: new Date(item.created_at).toLocaleTimeString(),
      }));
      this.notify();
      return this.bulkOrders;
    } catch (e) {
      console.log('API Fetch Bulk Orders Error:', e);
      return this.bulkOrders;
    }
  }

  async apiFetchActiveTokens() {
    try {
      const response = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/orders/active-tokens/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch active tokens');
      }

      const result = await response.json();
      // Map API fields to UI fields
      const mappedTokens = result.map((item: any) => ({
        id: item.token_number || `TOKEN-${item.id}`,
        brand: item.cement_brand || 'Cement',
        bags: item.number_of_bags || 0,
        location: item.delivery_address || 'N/A',
        deliveryDate: item.preferred_delivery_date || 'N/A',
        paymentType: item.payment_type || 'N/A',
        status: item.status ? (item.status.charAt(0).toUpperCase() + item.status.slice(1)) : 'Pending',
        truckNo: item.truck_number || 'Assigning...',
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
        time: item.created_at ? new Date(item.created_at).toLocaleTimeString() : new Date().toLocaleTimeString(),
      }));

      this.bulkOrders = mappedTokens;
      this.notify();
      return mappedTokens;
    } catch (e) {
      console.log('API Fetch Active Tokens Error:', e);
      return this.bulkOrders;
    }
  }

  async apiPlaceBulkOrder(orderData: any) {
    try {
      // Map UI state to the required backend payload format
      const paymentMapping: Record<string, string> = {
        'Cash on Delivery': 'cash',
        'Online Payment': 'online',
        'Shop Credit': 'credit'
      };
      
      const payload = {
        category: orderData.categoryId || 1,
        customer_name: orderData.customerName || 'Customer',
        number_of_bags: orderData.bags || 50,
        delivery_address: orderData.location || 'Coimbatore',
        truck_number: orderData.truckNo || '',
        delivery_date: orderData.deliveryDate || new Date().toISOString().split('T')[0],
        payment_type: paymentMapping[orderData.paymentType] || 'cash',
      };

      const response = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/bulk-orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to place bulk order: ${errorText}`);
      }

      const result = await response.json();
      // After successfully placing on API, we might want to refresh the list
      await this.apiFetchBulkOrders();
      return result;
    } catch (e) {
      console.log('API Place Bulk Order Error:', e);
      throw e;
    }
  }

  async addItem(item: any, qty: number) {
    if (!item) return;
    
    try {
      const user = authService.getCurrentUser();
      const productIdStr = String(item.id || '');
      const productId = parseInt(productIdStr.split('-')[0]); // Handle TMT size IDs (e.g. "1-8" -> 1)
      
      if (!isNaN(productId)) {
        const payload = {
          employee: user?.id ? parseInt(user.id) : 1,
          product: productId,
          quantity: qty
        };

        const response = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/cart/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.warn('Backend cart sync failed, but adding locally. Status:', response.status);
        }
      } else {
        console.warn('Non-numeric product ID detected, adding locally only:', item.id);
      }
    } catch (e) {
      console.log('API Add To Cart Error:', e);
    }

    const itemId = item.id || `temp-${Date.now()}`;
    const existing = this.cartItems.find(i => String(i.id) === String(itemId));
    
    if (existing) {
      existing.qty += qty;
    } else {
      this.cartItems.push({ ...item, id: itemId, qty });
    }
    this.notify();
  }

  updateQty(id: string, qty: number) {
    const item = this.cartItems.find(i => i.id === id);
    if (item) {
      item.qty = qty;
      this.notify();
    }
  }

  removeItem(id: string) {
    this.cartItems = this.cartItems.filter(i => i.id !== id);
    this.notify();
  }

  // New method for Bulk Ordering System
  placeBulkOrder(details: {
    brand: string,
    bags: number,
    location: string,
    deliveryDate: string,
    paymentType: string,
    customerName: string,
    phone: string,
    truckNo?: string
  }) {
    const tokenNumber = `BT-${this.tokenCounter}`;
    const newBulkOrder = {
      id: tokenNumber,
      ...details,
      status: 'In Queue',
      truckNo: details.truckNo || 'Assigning...', // New field
      time: new Date().toLocaleTimeString(),
      date: new Date().toLocaleDateString(),
      earnedTokens: details.bags * 10 // Loyalty benefit
    };

    this.tokenCounter++;
    this.loyaltyTokens += newBulkOrder.earnedTokens;
    this.bulkOrders = [newBulkOrder, ...this.bulkOrders];
    this.notify();
    return newBulkOrder;
  }

  async apiFetchCart() {
    try {
      const user = authService.getCurrentUser();
      const employeeId = user?.id ? parseInt(user.id) : 1;

      const response = await fetch(`https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/cart/employee/${employeeId}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cart');
      }

      const result = await response.json();
      
      const cartArray = Array.isArray(result) ? result : (result.value || result.data || []);

      const mappedCart = cartArray.map((cartItem: any) => {
        const productDetails = this.products.find(p => p.id === String(cartItem.product));
        return {
          ...(productDetails || { price: 0, image: '', brand: 'Generic' }),
          id: String(cartItem.product),
          cartItemId: cartItem.id,
          name: cartItem.product_name || productDetails?.name || 'Unknown Product',
          qty: cartItem.quantity || 1,
          category: cartItem.category_name || productDetails?.category || 'Others',
          categoryId: productDetails?.categoryId || 1
        };
      });

      // Combine duplicate products in cart just in case backend has separate rows
      const combinedCart: any[] = [];
      mappedCart.forEach((item: any) => {
        const existing = combinedCart.find(c => c.id === item.id);
        if (existing) {
          existing.qty += item.qty;
        } else {
          combinedCart.push(item);
        }
      });
      this.cartItems = combinedCart;

      this.notify();
      return this.cartItems;
    } catch (e) {
      console.log('API Fetch Cart Error:', e);
      return this.cartItems;
    }
  }

  async globalRefresh() {
    try {
      console.log('Global Refresh Started...');

      // 1. Fetch Refresh Endpoint
      const refreshResponse = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/refresh/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      // 2. Fetch Products
      await this.apiFetchProducts();

      // 2.5 Fetch Cart for logged in employee
      await this.apiFetchCart();

      // 3. Fetch Bulk Orders / Active Tokens
      await this.apiFetchActiveTokens();

      // 4. Fetch Quotations for Admin
      await this.apiFetchQuotations();

      console.log('Global Refresh Completed.');
      return true;
    } catch (e) {
      console.log('Global Refresh Error:', e);
      return false;
    }
  }

  updateBulkOrder(id: string, updates: Partial<{ status: string, truckNo: string }>) {
    this.bulkOrders = this.bulkOrders.map(order =>
      order.id === id ? { ...order, ...updates } : order
    );
    this.notify();
  }

  async apiPlaceOrder(orderData: any) {
    try {
      const user = authService.getCurrentUser();
      console.log('Current User:', user);

      if (!user || !user.id) {
        throw new Error('Please login again');
      }

      const employeeId = Number(user.id);

      if (isNaN(employeeId)) {
        throw new Error('Invalid employee ID');
      }

      const payload = {
        employee: employeeId,
        customer_name: orderData.name,
        customer_phone: orderData.phone,
        delivery_address: orderData.address || 'Chennai',
        payment_type: orderData.payment_type || 'cash',
        items: orderData.items.map((item: any) => {
          // Try to find a real backend ID by name if the current ID is static (non-numeric)
          // Also handle IDs with suffixes like "1-8" -> 1
          const baseIdStr = String(item.id || '').split('-')[0];
          let realId = !isNaN(parseInt(baseIdStr)) ? parseInt(baseIdStr) : null;
          
          if (!realId) {
            const match = this.products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
            if (match) realId = parseInt(match.id);
          }

          return {
            product: realId,
            product_name: item.name,
            quantity: item.qty,
            fixed_unit_price: item.price || 0
          };
        })
      };

      const response = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to place order: ${errorText}`);
      }

      const result = await response.json();
      
      this.clearCart();
      return result; 
    } catch (e) {
      console.log('API Place Order Error:', e);
      throw e;
    }
  }

  async apiFetchMyOrders() {
    try {
      const user = authService.getCurrentUser();
      const employeeId = user?.id ? parseInt(user.id) : 1;

      const response = await fetch(`https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/orders/employee/${employeeId}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true', 
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch my orders');
      }

      const result = await response.json();
      const orderArray = Array.isArray(result) ? result : (result.value || result.data || []);
      
      const mappedOrders = orderArray.map((item: any) => ({
        id: item.id || item.order_id,
        name: item.customer_name,
        phone: item.customer_phone,
        status: item.order_status || item.status || 'Pending',
        date: item.created_at,
        total: item.total_price || item.total_amount || 0,
        items: (item.items || []).map((i: any) => ({
          id: i.product,
          name: i.product_name || `Product #${i.product}`,
          qty: i.quantity,
          price: i.price || 0
        }))
      }));

      return mappedOrders;
    } catch (e) {
      console.log('API Fetch My Orders Error:', e);
      return [];
    }
  }

  async apiFetchQuotations(status?: string) {
    try {
      let url = 'https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/orders/';
      if (status) url += `?status=${status}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch quotations');

      const result = await response.json();
      
      const ordersData = result.value || result || [];
      
      // Map API result to internal orders state
      this.orders = ordersData.map((item: any) => ({
        id: item.id,
        orderId: item.id ? `ORD-${item.id}` : 'N/A',
        name: item.customer_name || item.party_name || 'Unknown',
        phone: item.customer_phone || item.contact_number || '',
        status: item.order_status || item.status || 'Pending',
        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
        time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        total: item.total_price || item.total_amount || 0,
        address: item.delivery_address || 'Chennai',
        employee: item.employee_name || `Employee #${item.employee}`,
        items: (item.items || []).map((i: any) => {
          // Try to find name from local products or static registry if missing
          let resolvedName = i.product_name;
          const staticRegistry: {[key: string]: string} = {
            'c1': 'Ultratech Super Cement',
            'c2': 'Ambuja Cement',
            'c3': 'Ramco Super Grade Cement',
            'c4': 'Chettinad OPC 53 Grade Cement',
            'c5': 'Dr. Fixit LW+ Waterproofing',
            't1': 'TATA Tiscon Fe 550SD TMT Bars',
            'bb1': 'Ultratech Xtralite AAC Blocks',
            'bb2': 'Birla Aerocon AAC Blocks',
            'ks1': 'Kadapa Slab (Polished)',
            'ks2': 'Kadapa Slab (Raw)',
            'ls1': 'Laundry Stone (Small)',
            'ls2': 'Laundry Stone (Large)',
            'tp1': 'Tarpaulin (Heavy Duty)',
            'wt1': 'Sintex Titus Water Tank',
            'wt2': 'Supreme weatherShield Tank',
            'bm1': 'Crusher Jelly Aggregates',
            'bm2': '20mm Metal Crushed Stone',
            'bm3': '40mm Blue Metal Stone',
            'cp1': 'Dr. Fixit Pidicrete URP',
            'cp2': 'Cement Pillars'
          };

          if (!resolvedName && i.product) {
            // First check local products
            const localProd = this.products.find(p => String(p.id) === String(i.product));
            if (localProd) {
              resolvedName = localProd.name;
            } else {
              // Check static registry (handle potential size suffix like t1-8)
              const baseId = String(i.product).split('-')[0];
              const suffix = String(i.product).split('-')[1];
              
              if (staticRegistry[baseId]) {
                resolvedName = suffix ? `${staticRegistry[baseId]} (${suffix}MM)` : staticRegistry[baseId];
              }
            }
          }
          
          return {
            id: i.id, // Unique OrderItem ID
            productId: i.product || i.product_id,
            name: resolvedName || `Product #${i.product || i.id}`,
            qty: i.quantity || 1,
            price: i.price || i.fixed_unit_price || 0,
            category: i.category === 1 ? 'Cement' : 'Other'
          };
        })
      }));
      this.notify();
      return this.orders;
    } catch (e) {
      console.log('API Fetch Quotations Error:', e); // Changed from error to log to prevent Red Screen
      return this.orders;
    }
  }

  async apiFixPrice(id: string, updates: any[]) {
    try {
      console.log('Fixing prices for order:', id, 'Updates:', updates);
      const response = await fetch(`https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/orders/${id}/fix_price/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ items: updates }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Fix Price Server Error:', errorText);
        throw new Error(`Server Error: ${errorText}`);
      }

      const result = await response.json();
      await this.apiFetchQuotations(); // Refresh list
      return result;
    } catch (e) {
      console.log('API Fix Price Error:', e);
      throw e;
    }
  }

  async apiFetchBill(id: string) {
    try {
      const response = await fetch(`https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/orders/admin/orders/${id}/bill/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch bill');
      return await response.json();
    } catch (e) {
      console.log('API Fetch Bill Error:', e);
      throw e;
    }
  }

  placeOrder(customerDetails: any) {
    const orderToken = this.tokenCounter.toString().padStart(3, '0');
    let earnedTokens = 0;
    this.cartItems.forEach(item => {
      if (item.category === 'Cement') earnedTokens += (item.qty * 10);
    });

    const newOrder = {
      id: `MS-${orderToken}`,
      ...customerDetails,
      items: [...this.cartItems],
      total: this.cartItems.reduce((acc, item) => acc + (item.price * item.qty), 0),
      status: 'Pending Pickup',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toLocaleDateString(),
      createdAt: Date.now(),
      earnedTokens
    };

    this.tokenCounter++;
    this.loyaltyTokens += earnedTokens;
    this.orders = [newOrder, ...this.orders];
    this.cartItems = [];
    this.notify();
    return newOrder;
  }

  clearCart() {
    this.cartItems = [];
    this.notify();
  }

  async apiFetchEmployees() {
    try {
      const response = await fetch('https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/employees/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      });

      if (!response.ok) throw new Error('Failed to fetch employees');
      return await response.json();
    } catch (e) {
      console.log('API Fetch Employees Error:', e); // Changed from error to log to prevent Red Screen
      return []; // Return empty list on failure
    }
  }
  async apiFetchCategories() {
    try {

      const response = await fetch(
        'https://unlanded-isela-unmunificently.ngrok-free.dev/inventory/categories/',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
        }
      );

      const contentType = response.headers.get('content-type');

      let result;

      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const text = await response.text();
        throw new Error(
          `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
      }

      console.log('Categories API Response:', result);

      if (Array.isArray(result)) {
        return result;
      }

      if (result.value && Array.isArray(result.value)) {
        return result.value;
      }

      if (result.categories) {
        return result.categories;
      }

      return [];

    } catch (e) {
      console.log('Fetch Categories Error:', e);
      return [];
    }
  }
}


export const cartService = new CartService();
