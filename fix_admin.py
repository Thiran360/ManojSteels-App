import os

path = r"C:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Tabs Array
old_tabs = "['Orders', 'Tokens', 'Inventory', 'Receipt Options', 'Customers', 'Employees', 'Settings']"
new_tabs = "['Orders', 'Tokens', 'Inventory', 'Receipt Options', 'Categories', 'Accounts']"
content = content.replace(old_tabs, new_tabs)

# 2. Add Imports (Users icon)
if "Users," not in content:
    content = content.replace("Trash2,", "Trash2,\n  Users,")

# 3. Add Accounts and Categories State
old_state = "const [newProduct, setNewProduct] = useState({"
new_state = """const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Accounts State
  const [accName, setAccName] = useState('');
  const [accPhone, setAccPhone] = useState('');
  const [accPassword, setAccPassword] = useState('');
  const [accRole, setAccRole] = useState('employee');
  const [accountsList, setAccountsList] = useState<any[]>([]);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    if (activeTab === 'Accounts') {
      fetchAccounts();
    }
  }, [activeTab]);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('https://api.codingboss.in/inventory/get-users/');
      const data = await response.json();
      setAccountsList(data);
    } catch(e) {
      console.log('Error fetching accounts', e);
    }
  };

  const handleCreateAccount = async () => {
    if (!accName.trim() || !accPhone.trim() || !accPassword.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setIsCreatingAccount(true);
    try {
      await authService.apiCreateEmployee({
        name: accName,
        phone: accPhone,
        password: accPassword,
        role: accRole
      });
      Alert.alert('Success', 'Account created successfully');
      setAccName(''); setAccPhone(''); setAccPassword('');
      fetchAccounts();
    } catch(e: any) {
      Alert.alert('Error', e.message || 'Failed to create account');
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const [newCategoryName, setNewCategoryName] = useState('');

  const [newProduct, setNewProduct] = useState({"""
content = content.replace(old_state, new_state)

# 4. Modify handleAddProduct
old_handle_add = """  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      Alert.alert('Error', 'Please fill in the Product Name and Category');
      return;
    }
    
    setLoading(true);
    try {
      const product = {
        id: `PROD-${Date.now()}`,
        name: newProduct.name,
        brand: newProduct.brand || 'Manoj Steels',
        image: newProduct.image || 'https://via.placeholder.com/150',
        price: parseFloat(newProduct.price) || 0,
        qty: parseInt(newProduct.qty) || 0,
        category: newProduct.category
      };
      
      // Call API
      await cartService.apiAddProduct(product);
      
      // Refresh list from server to get correct IDs etc.
      await cartService.apiFetchProducts();
      
      setShowAddProduct(false);
      setNewProduct({ name: '', brand: '', price: '', qty: '', image: '', category: 'Cement' });
      Alert.alert('Success', 'Product added successfully!');
    } catch (e: any) {
      console.error('Add Product Error:', e);
      Alert.alert('Network Error', 'Failed to connect to the server. Please check if your API is running and try again.');
    } finally {
      setLoading(false);
    }
  };"""

new_handle_add = """  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      Alert.alert('Error', 'Please fill in the Product Name and Category');
      return;
    }
    
    setLoading(true);
    try {
      const productData = {
        name: newProduct.name,
        brand: newProduct.brand || 'Manoj Steels',
        image: newProduct.image || 'https://via.placeholder.com/150',
        price: parseFloat(newProduct.price) || 0,
        qty: parseInt(newProduct.qty) || 0,
        category: newProduct.category
      };
      
      if (isEditingProduct && editingProductId) {
        await cartService.apiUpdateProduct(editingProductId, productData);
        Alert.alert('Success', 'Product updated successfully!');
      } else {
        const product = {
          ...productData,
          id: `PROD-${Date.now()}`,
        };
        await cartService.apiAddProduct(product);
        Alert.alert('Success', 'Product added successfully!');
      }
      
      await cartService.apiFetchProducts();
      
      setShowAddProduct(false);
      setNewProduct({ name: '', brand: '', price: '', qty: '', image: '', category: 'Cement' });
      setIsEditingProduct(false);
      setEditingProductId(null);
    } catch (e: any) {
      console.error('Add/Update Product Error:', e);
      Alert.alert('Network Error', 'Failed to connect to the server. Please check if your API is running and try again.');
    } finally {
      setLoading(false);
    }
  };"""
content = content.replace(old_handle_add, new_handle_add)

# 8. Reset edit state on Add Product (+ Add Item Button)
# Do this BEFORE step 5 so we don't accidentally replace the one we add in step 5.
old_add_item = """                <TouchableOpacity 
                  style={styles.addItemBtn}
                  onPress={() => {
                    console.log('Opening Add Product Modal');
                    setShowAddProduct(true);
                  }}
                >
                  <Text style={styles.addItemBtnText}>+ Add Item</Text>"""

new_add_item = """                <TouchableOpacity 
                  style={styles.addItemBtn}
                  onPress={() => {
                    console.log('Opening Add Product Modal');
                    setIsEditingProduct(false);
                    setEditingProductId(null);
                    setNewProduct({ name: '', brand: '', price: '', qty: '', image: '', category: 'Cement' });
                    setShowAddProduct(true);
                  }}
                >
                  <Text style={styles.addItemBtnText}>+ Add Item</Text>"""
content = content.replace(old_add_item, new_add_item)

# 5. Add Edit Button
old_actions = """      <View style={styles.productActions}>
        <TouchableOpacity 
          style={styles.deleteBtn}"""

new_actions = """      <View style={styles.productActions}>
        <TouchableOpacity 
          style={[styles.deleteBtn, { backgroundColor: Colors.primary, marginRight: 10 }]}
          onPress={() => {
            setNewProduct({
              name: item.name || '',
              brand: item.brand || '',
              price: item.price?.toString() || '',
              qty: item.qty?.toString() || '',
              image: item.image || '',
              category: item.category || 'Cement'
            });
            setIsEditingProduct(true);
            setEditingProductId(item.id);
            setShowAddProduct(true);
          }}
        >
          <Text style={styles.deleteBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteBtn}"""
content = content.replace(old_actions, new_actions)

# 6. Replace UI Blocks (Customers, Employees, Settings -> Categories, Accounts)
start_str = ") : activeTab === 'Customers' ? ("
end_str = "Logout from Admin Panel</Text>\n              </TouchableOpacity>\n          </View>\n        ) : ("

if start_str in content and end_str in content:
    start_idx = content.find(start_str)
    end_idx = content.find(end_str) + len(end_str)

    new_ui = """) : activeTab === 'Categories' ? (
          <ScrollView style={styles.sectionContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Manage Categories</Text>
              </View>
            </View>
            <View style={styles.addCategoryCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Category Name</Text>
                <TextInput 
                  style={styles.input} 
                  value={newCategoryName} 
                  onChangeText={setNewCategoryName} 
                  placeholder="Enter Category" 
                />
              </View>
              <TouchableOpacity style={styles.addCategoryBtn} onPress={() => {}}>
                <Text style={styles.addCategoryBtnText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : activeTab === 'Accounts' ? (
          <ScrollView style={styles.sectionContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Users size={24} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Create Account</Text>
              </View>
            </View>
            
            <View style={styles.addCategoryCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput style={styles.input} value={accName} onChangeText={setAccName} placeholder="Enter Name" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput style={styles.input} value={accPhone} onChangeText={setAccPhone} placeholder="Enter Phone" keyboardType="phone-pad" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput style={styles.input} value={accPassword} onChangeText={setAccPassword} placeholder="Enter Password" />
              </View>
              
              <Text style={styles.inputLabel}>Role</Text>
              <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
                {['employee', 'customer', 'admin'].map(role => (
                  <TouchableOpacity 
                    key={role} 
                    style={[styles.roleChip, accRole === role && styles.roleChipActive]}
                    onPress={() => setAccRole(role)}
                  >
                    <Text style={[styles.roleChipText, accRole === role && styles.roleChipTextActive]}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.addCategoryBtn} onPress={handleCreateAccount} disabled={isCreatingAccount}>
                {isCreatingAccount ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.addCategoryBtnText}>Create Account</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Registered Accounts</Text>
            </View>
            
            {accountsList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No accounts found.</Text>
              </View>
            ) : (
              accountsList.map(acc => (
                <View key={acc.id} style={styles.customerCard}>
                  <View style={styles.customerInfo}>
                    <Text style={styles.customerName}>{acc.name || acc.phone}</Text>
                    <Text style={styles.customerPhone}>{acc.phone}</Text>
                    <Text style={{color: Colors.primary, fontSize: 12, marginTop: 4, fontWeight: 'bold'}}>{(acc.role || 'user').toUpperCase()}</Text>
                  </View>
                </View>
              ))
            )}
            <View style={{height: 100}} />
          </ScrollView>
        ) : ("""
    
    content = content[:start_idx] + new_ui + content[end_idx:]
else:
    print("Could not find start or end strings for UI block!")

# 7. Add Styles
new_styles = """
  sectionContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionHeader: {
    marginVertical: 15,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addCategoryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  addCategoryBtn: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addCategoryBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  roleChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  roleChipTextActive: {
    color: Colors.white,
  },
  tabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  tabContent: {
    flex: 1,
    padding: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  customerCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  customerPhone: {
    color: '#666',
    marginTop: 4,
  },
});
"""
content = content.replace("});\nexport default AdminDashboard;", new_styles + "export default AdminDashboard;")
content = content.replace("});\r\nexport default AdminDashboard;", new_styles + "export default AdminDashboard;")

# 9. Modify Modal Title
content = content.replace("Add New Product</Text>", "{isEditingProduct ? 'Edit Product' : 'Add New Product'}</Text>")

# 10. Replace Add Product button text
content = content.replace(">Save Product</Text>", ">{isEditingProduct ? 'Save Changes' : 'Save Product'}</Text>")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Python script executed successfully!")
