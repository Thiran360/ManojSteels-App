import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { ChevronLeft, Search, Filter, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react-native';
import { cartService } from '../services/CartService';

// Static products removed in favor of backend data

const ProductListScreen = ({ navigation, route }: any) => {
  const { category, categoryId } = route.params || { category: 'All Products' };
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(cartService.getCartItems().length);
  const [dynamicProducts, setDynamicProducts] = useState(cartService.getProducts());

  useEffect(() => {
    // Fetch products dynamically when screen loads
    if (categoryId) {
      cartService.apiFetchProducts(categoryId).catch(e => console.log(e));
    } else {
      cartService.apiFetchProducts().catch(e => console.log(e));
    }

    const update = () => {
      setCartCount(cartService.getCartItems().length);
      setDynamicProducts(cartService.getProducts());
    };
    cartService.on('change', update);
    return () => cartService.off('change', update);
  }, []);

  const ProductCard = ({ item }: { item: any }) => {
    const [qty, setQty] = useState(1);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <Image 
          source={typeof item.image === 'number' ? item.image : { uri: item.image }} 
          style={styles.productImage} 
        />
        <View style={styles.productInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodySmall, styles.brand]}>{item.brand}</Text>
              <Text style={[Typography.bodyMedium, styles.name]}>{item.name}</Text>
              <Text style={[Typography.bodySmall, { color: Colors.textSecondary, marginTop: 2 }]}>
                Stock: <Text style={{ color: item.qty > 0 ? Colors.success : Colors.error, fontWeight: 'bold' }}>{item.qty || 0} units</Text>
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteBtn}
              onPress={() => {
                Alert.alert(
                  'Delete Product',
                  'Are you sure you want to remove this product?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        cartService.deleteProduct(item.id);
                      }
                    }
                  ]
                );
              }}
            >
              <Trash2 size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionRow}>
            <View style={styles.qtySelector}>
              <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}>
                <Minus size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity onPress={() => setQty(qty + 1)} style={styles.qtyBtn}>
                <Plus size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => cartService.addItem(item, qty)}
            >
              <ShoppingCart size={18} color={Colors.white} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const allAvailableProducts = [...dynamicProducts];

  const filteredProducts = allAvailableProducts.filter(p => 
    (category === 'All Products' || p.category === category) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>{category}</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart size={24} color={Colors.white} />
          {cartCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <Filter size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: Colors.primary,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: Colors.white,
  },
  cartBtn: {
    padding: 5,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: Colors.accent,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.text,
    ...Typography.bodySmall,
  },
  filterBtn: {
    backgroundColor: Colors.accent,
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 20,
    flexDirection: 'row',
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: Colors.white,
    resizeMode: 'contain',
  },
  productInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  brand: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
  name: {
    color: Colors.text,
    marginVertical: 4,
  },
  price: {
    color: Colors.primary,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 4,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyText: {
    color: Colors.text,
    marginHorizontal: 12,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 12,
  },
  deleteBtn: {
    padding: 5,
  },
});

export default ProductListScreen;
