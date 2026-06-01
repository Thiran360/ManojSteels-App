$path = "C:\E-Com\Cart_App\src\screens\AdminDashboard.tsx"
$content = Get-Content -Raw $path

# 1. Add state variables for editing product right after `const [brandList, setBrandList]`
$oldState = "const [brandList, setBrandList] = useState(cartService.getBrands());"
$newState = "const [isEditingProduct, setIsEditingProduct] = useState(false);`r`n  const [editingProductId, setEditingProductId] = useState<string | null>(null);`r`n  const [brandList, setBrandList] = useState(cartService.getBrands());"
$content = $content.Replace($oldState, $newState)

# 2. Modify handleAddProduct to support editing
$oldHandleAdd = @"
  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.category) {
      Alert.alert('Error', 'Please fill in the Product Name and Category');
      return;
    }
    
    setLoading(true);
    try {
      const product = {
        id: ``PROD-`${Date.now()}``,
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
  };
"@

$newHandleAdd = @"
  const handleAddProduct = async () => {
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
          id: ``PROD-`${Date.now()}``,
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
  };
"@

$content = $content.Replace($oldHandleAdd, $newHandleAdd)

# 3. Add Edit Button in renderProduct
$oldProductActions = @"
      <View style={styles.productActions}>
        <TouchableOpacity 
          style={styles.deleteBtn}
"@

$newProductActions = @"
      <View style={styles.productActions}>
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
          style={styles.deleteBtn}
"@

$content = $content.Replace($oldProductActions, $newProductActions)

# 4. Modify "+ Add Item" button to reset isEditingProduct
$oldAddProductClick = "setShowAddProduct(true);"
$newAddProductClick = "setIsEditingProduct(false);`r`n                    setEditingProductId(null);`r`n                    setNewProduct({ name: '', brand: '', price: '', qty: '', image: '', category: 'Cement' });`r`n                    setShowAddProduct(true);"

$content = $content.Replace("setShowAddProduct(true);", $newAddProductClick)

# 5. Modify Modal Title
$content = $content.Replace("Add New Product</Text>", "{isEditingProduct ? 'Edit Product' : 'Add New Product'}</Text>")

# 6. Replace Add Product button text
$content = $content.Replace(">Save Product</Text>", ">{isEditingProduct ? 'Save Changes' : 'Save Product'}</Text>")

Set-Content -Path $path -Value $content -NoNewline
