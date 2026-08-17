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
  ScrollView,
  Alert,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { ChevronLeft, Search, Filter, ShoppingCart, Plus, Minus, X, Trash2 } from 'lucide-react-native';
import { cartService } from '../services/CartService';

const NewArrivalsScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
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

  // Get unique brands from current products
  const brands = ['All', ...new Set(dynamicProducts.map(p => p.brand).filter(b => b))];

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
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodySmall, styles.brandText]}>{item.brand}</Text>
                <Text style={[Typography.bodyMedium, styles.name]} numberOfLines={2}>{item.name}</Text>
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
                <Trash2 size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.stockInfo}>
              <Text style={styles.stockLabel}>Stock:</Text>
              <Text style={[styles.stockValue, { color: item.qty < 50 ? Colors.error : Colors.success }]}>
                {item.qty} Qty
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <View style={styles.qtySelector}>
              <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}>
                <Minus size={14} color={Colors.text} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{qty}</Text>
              <TouchableOpacity onPress={() => setQty(qty + 1)} style={styles.qtyBtn}>
                <Plus size={14} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.addBtn}
              onPress={() => cartService.addItem(item, qty)}
            >
              <ShoppingCart size={16} color={Colors.white} />
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredProducts = dynamicProducts.filter(p => 
    (selectedBrand === 'All' || p.brand === selectedBrand) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h3, styles.headerTitle]}>New Arrivals</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
          <ShoppingCart size={24} color={Colors.white} />
          {cartCount > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{cartCount}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search arrivals..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.brandFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandScroll}>
          {brands.map(brand => (
            <TouchableOpacity 
              key={brand} 
              style={[styles.brandChip, selectedBrand === brand && styles.activeBrandChip]}
              onPress={() => setSelectedBrand(brand)}
            >
              <Text style={[styles.brandChipText, selectedBrand === brand && styles.activeBrandChipText]}>
                {brand}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => <ProductCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found for this brand.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 45, paddingHorizontal: 20, paddingBottom: 15,
    backgroundColor: Colors.primary, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  backBtn: { padding: 5 },
  headerTitle: { color: Colors.white },
  cartBtn: { padding: 5, position: 'relative' },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: Colors.accent, width: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
  searchSection: { paddingHorizontal: 20, paddingTop: 15 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 12, paddingHorizontal: 15, height: 45,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, marginLeft: 10, color: Colors.text, ...Typography.bodySmall },
  brandFilterContainer: { marginTop: 10, marginBottom: 5 },
  brandScroll: { paddingHorizontal: 20, paddingBottom: 10 },
  brandChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, marginRight: 10, borderWidth: 1, borderColor: Colors.border,
  },
  activeBrandChip: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  brandChipText: { color: Colors.text, fontSize: 12, fontWeight: '500' },
  activeBrandChipText: { color: Colors.white },
  listContent: { padding: 20 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 15,
    flexDirection: 'row', padding: 12, borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  productImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: Colors.background, resizeMode: 'contain' },
  productInfo: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  brandText: { color: Colors.accent, fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase' },
  name: { color: Colors.text, marginVertical: 2, fontWeight: '600' },
  stockInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  stockLabel: { fontSize: 10, color: Colors.textSecondary, marginRight: 4 },
  stockValue: { fontSize: 10, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qtySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 6, padding: 2 },
  qtyBtn: { padding: 4 },
  qtyText: { color: Colors.text, marginHorizontal: 8, fontWeight: 'bold', fontSize: 12 },
  addBtn: { backgroundColor: Colors.accent, flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  addBtnText: { color: Colors.white, fontWeight: 'bold', marginLeft: 4, fontSize: 11 },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  deleteBtn: {
    padding: 5,
  },
});

export default NewArrivalsScreen;
