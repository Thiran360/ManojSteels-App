import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Trash2, Plus, Minus, ArrowRight, ChevronLeft } from 'lucide-react-native';
import { cartService } from '../services/CartService';

const { width } = Dimensions.get('window');

const CartScreen = ({ navigation }: any) => {
  const [items, setItems] = useState(cartService.getCartItems());

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const update = () => {
      setItems([...cartService.getCartItems()]);
    };
    cartService.on('change', update);
    
    // Initial fetch for items removed or unnecessary if service handles it
    // cartService.apiFetchQuotations();
    
    return () => {
      cartService.off('change', update);
    };
  }, []);

  const updateQty = (id: string, delta: number) => {
    const item = items.find(i => i.id === id);
    if (item) {
      cartService.updateQty(id, Math.max(1, item.qty + delta));
    }
  };

  const removeItem = (id: string) => {
    cartService.removeItem(id);
  };

  const totalItems = items.reduce((acc, item) => acc + item.qty, 0);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <Image 
        source={typeof item.image === 'number' ? item.image : { uri: item.image }} 
        style={styles.itemImage} 
      />
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={[Typography.bodyMedium, styles.itemName]}>{item.name}</Text>
          <TouchableOpacity onPress={() => removeItem(item.id)}>
            <Trash2 size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={[Typography.bodySmall, styles.itemBrand]}>{item.brand}</Text>
        <View style={styles.itemFooter}>
          <View style={{ flex: 1 }} />
          <View style={styles.qtyContainer}>
            <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
              <Minus size={16} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.qty}</Text>
            <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
              <Plus size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={[Typography.h1, styles.headerTitle]}>My Cart</Text>
        </View>
        <Text style={[Typography.bodySmall, styles.itemCount]}>{items.length} Items</Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
        ListFooterComponent={() => (
          <>
            <View style={styles.summaryContainer}>
              <Text style={[Typography.h3, styles.summaryTitle]}>Order Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Items</Text>
                <Text style={styles.summaryValue}>{totalItems}</Text>
              </View>
            </View>


            <View style={{ height: 100 }} />
          </>
        )}
      />

      <View style={styles.checkoutContainer}>
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
        >
          <Text style={[Typography.button, styles.checkoutText]}>Request Quotation</Text>
          <ArrowRight size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 10,
    padding: 5,
  },
  headerTitle: {
    color: Colors.white,
  },
  itemCount: {
    color: Colors.accent,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  itemDetails: {
    flex: 1,
    marginLeft: 15,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    color: Colors.text,
    flex: 1,
    marginRight: 10,
  },
  itemBrand: {
    color: Colors.text,
    opacity: 0.8,
    fontWeight: '600',
    marginVertical: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  itemPrice: {
    color: Colors.primary,
  },
  qtyContainer: {
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
  summaryContainer: {
    marginTop: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTitle: {
    color: Colors.text,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: Colors.textSecondary,
    ...Typography.bodyMedium,
  },
  summaryValue: {
    color: Colors.text,
    ...Typography.bodyMedium,
    fontWeight: 'bold',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  checkoutBtn: {
    backgroundColor: Colors.accent,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutText: {
    color: Colors.white,
    ...Typography.button,
    marginRight: 10,
  },
  quotesSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  quoteCard: {
    backgroundColor: Colors.surface,
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  quoteId: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  quoteDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  viewBillBtn: {
    marginTop: 12,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderWidth: 1,
    borderColor: '#2196F3',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewBillText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default CartScreen;
