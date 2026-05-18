import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Package, ChevronLeft, MapPin, Calendar, CheckCircle2 } from 'lucide-react-native';
import { cartService } from '../services/CartService';

const OrderTrackingScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const myOrders = await cartService.apiFetchMyOrders();
      setOrders(myOrders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h2, styles.headerTitle]}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: Colors.textSecondary }}>Loading orders...</Text>
        ) : orders.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Package size={48} color={Colors.border} />
            <Text style={{ color: Colors.textSecondary, marginTop: 15 }}>No orders found.</Text>
          </View>
        ) : (
          orders.map((order: any, index: number) => (
            <View key={index} style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderIdLabel}>Order ID: #{order.id}</Text>
                  <Text style={styles.orderDate}>{new Date(order.date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Package size={16} color={Colors.textSecondary} />
                  <Text style={styles.detailText}>{order.items?.length || 0} Items</Text>
                </View>
                {order.items && order.items.map((item: any, i: number) => (
                  <Text key={i} style={styles.itemText}>• {item.name} (x{item.qty})</Text>
                ))}
              </View>

              <View style={styles.divider} />

              <View style={styles.orderFooter}>
                <Text style={styles.totalLabel}>Total Estimate</Text>
                <Text style={styles.totalValue}>₹{order.total?.toLocaleString() || 'Pending'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    color: Colors.white,
  },
  scrollContent: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderIdLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderDate: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 15,
  },
  orderDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 10,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemText: {
    marginLeft: 26,
    color: Colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: Colors.text,
    fontSize: 14,
  },
  totalValue: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderTrackingScreen;
