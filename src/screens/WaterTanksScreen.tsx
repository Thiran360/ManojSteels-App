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

const waterTankProducts: any[] = [];

const WaterTanksScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(cartService.getCartItems().length);
  const [dynamicProducts, setDynamicProducts] = useState(cartService.getProducts());

  const [refreshing, setRefreshing] = useState(false);
 
  useEffect(() => {
    const update = () => {
      setCartCount(cartService.getCartItems().length);
      setDynamicProducts([...cartService.getProducts()]);
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
              <Text style={[Typography.h3, styles.name]} numberOfLines={2}>{item.name}</Text>
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
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 4 }}>
            <Text style={{ fontSize: 10, color: Colors.textSecondary, marginRight: 4 }}>Stock:</Text>
            <Text style={{ fontSize: 10, fontWeight: 'bold', color: item.qty < 5 ? Colors.error : Colors.success }}>
              {item.qty} Units
            </Text>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.qtySelector}>
              <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}>
                <Minus size={16} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty} Unit</Text>
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

  const allProducts = [...waterTankProducts, ...dynamicProducts.filter(p => p.category === 'Water Tanks')];
  const filtered = allProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>Water Tanks</Text>
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
            placeholder="Search tanks..."
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
    paddingTop: 40, paddingHorizontal: 20, paddingBottom: 10,
    backgroundColor: Colors.primary, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { padding: 5 },
  headerTitle: { color: Colors.white },
  cartBtn: { padding: 5, position: 'relative' },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.success, borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row', padding: 20, alignItems: 'center',
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12,
    paddingHorizontal: 15, height: 50, marginRight: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, marginLeft: 10, color: Colors.text, ...Typography.bodySmall },
  filterBtn: {
    backgroundColor: Colors.primary, width: 50, height: 50,
    borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  listContent: { padding: 20 },
  card: {
    backgroundColor: Colors.white, borderRadius: 16,
    marginBottom: 20, flexDirection: 'row', padding: 12,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  productImage: {
    width: 100, height: 100, borderRadius: 12,
    backgroundColor: Colors.background, resizeMode: 'contain',
  },
  productInfo: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  brand: { color: Colors.primary, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2, fontSize: 10 },
  name: { color: Colors.text, marginBottom: 12, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  qtySelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 8, padding: 4,
  },
  qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  qtyText: { color: Colors.text, marginHorizontal: 8, fontWeight: 'bold', fontSize: 14 },
  addBtn: {
    backgroundColor: Colors.primary, flexDirection: 'row',
    alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  addBtnText: { color: Colors.white, fontWeight: 'bold', marginLeft: 6, fontSize: 12 },
  deleteBtn: {
    padding: 5,
  },
});

export default WaterTanksScreen;
