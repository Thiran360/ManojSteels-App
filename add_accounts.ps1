$path = "C:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
$content = Get-Content -Raw $path

if ($content -notmatch "Users,") {
    $content = $content -replace "Trash2,", "Trash2,`n  Users,"
}

$content = $content -replace "'Fuel', 'Categories'", "'Fuel', 'Categories', 'Accounts'"

$stateLogic = @"
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
"@

$content = $content -replace "const \[newCategoryName, setNewCategoryName\] = useState\(''\);", $stateLogic

$uiLogic = @"
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
                  <View style={{flex: 1}}>
                    <Text style={styles.customerName}>{acc.name || acc.phone}</Text>
                    <Text style={{color: Colors.textSecondary}}>{acc.phone}</Text>
                    <Text style={{color: Colors.primary, fontSize: 12, marginTop: 4, fontWeight: 'bold'}}>{(acc.role || 'user').toUpperCase()}</Text>
                  </View>
                </View>
              ))
            )}
            <View style={{height: 100}} />
          </ScrollView>
        ) : activeTab === 'Categories' ? (
"@

$content = $content -replace "\) : activeTab === 'Categories' \? \(", $uiLogic

$chipStyles = @"
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
});
"@
$content = $content -replace "\}\);\s*export default AdminDashboard;", "$chipStyles`r`nexport default AdminDashboard;"

Set-Content -Path $path -Value $content -NoNewline
Write-Host "Accounts section added"
