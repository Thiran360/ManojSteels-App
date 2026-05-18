import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { ChevronLeft, Search, Filter, ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react-native';
import { cartService } from '../services/CartService';

const cementProducts: any[] = [];

const CementScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(cartService.getCartItems().length);
  const [dynamicProducts, setDynamicProducts] = useState(cartService.getProducts());

  const [refreshing, setRefreshing] = useState(false);
 
  useEffect(() => {
    const update = () => {
      setCartCount(cartService.getCartItems().length);
      setDynamicProducts(cartService.getProducts());
    };
    cartService.on('change', update);
    return () => cartService.off('change', update);
  }, []);
 
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setRefreshing(false);
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
          
          <View style={styles.stockInfo}>
            <Text style={styles.stockLabel}>Available Stock:</Text>
            <Text style={[styles.stockValue, { color: item.qty < 50 ? Colors.error : Colors.success }]}>
              {item.qty} Bags
            </Text>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.qtySelector}>
              <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}>
                <Minus size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty} Bags</Text>
              <TouchableOpacity onPress={() => setQty(qty + 1)} style={styles.qtyBtn}>
                <Plus size={16} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => cartService.addItem(item, qty)}>
              <ShoppingCart size={18} color={Colors.white} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const allProducts = [...cementProducts, ...dynamicProducts.filter(p => p.category === 'Cement')];
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>Cement</Text>
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
            placeholder="Search cement..."
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
        data={filtered}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 45, paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: Colors.primary, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { padding: 5 },
  headerTitle: { color: Colors.white },
  cartBtn: { padding: 5, position: 'relative' },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.accent, borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12,
    paddingHorizontal: 15, height: 45, marginRight: 15,
  },
  searchInput: { flex: 1, marginLeft: 10, color: Colors.text, ...Typography.bodySmall },
  filterBtn: {
    backgroundColor: Colors.accent, width: 45, height: 45,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  listContent: { padding: 20 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    marginBottom: 20, flexDirection: 'row', padding: 12,
  },
  productImage: {
    width: 100, height: 100, borderRadius: 12,
    backgroundColor: Colors.white, resizeMode: 'contain',
  },
  productInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  brand: { color: Colors.accent, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  name: { color: Colors.text, marginBottom: 8 },
  price: { color: Colors.primary, marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtySelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.border, borderRadius: 8, padding: 4,
  },
  qtyBtn: { width: 28, height: 28, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: Colors.text, marginHorizontal: 10, fontWeight: 'bold' },
  addBtn: {
    backgroundColor: Colors.accent, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  addBtnText: { color: Colors.white, fontWeight: 'bold', marginLeft: 6, fontSize: 12 },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  stockLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  stockValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  deleteBtn: {
    padding: 5,
  },
});

export default CementScreen;
