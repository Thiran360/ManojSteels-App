import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Package, ChevronLeft, MapPin, Calendar, CheckCircle2, Clock, Loader } from 'lucide-react-native';
import { cartService } from '../services/CartService';

const { width } = Dimensions.get('window');

const TABS = ['Recent', 'Today', 'Pending', 'Completed'];

const OrderTrackingScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Recent');

  const fetchOrders = async () => {
    try {
      const myOrders = await cartService.apiFetchMyOrders();
      const sortedOrders = [...myOrders].sort((a: any, b: any) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        // If dates are identical, fallback to sorting by ID descending (assuming numeric IDs)
        if (dateA === dateB) {
          const idA = parseInt(a.id, 10) || 0;
          const idB = parseInt(b.id, 10) || 0;
          return idB - idA;
        }
        return dateB - dateA;
      });
      setOrders(sortedOrders);
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

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const status = (order.status || '').toLowerCase();
      
      if (activeTab === 'Pending') return status.includes('pending') || status.includes('processing');
      if (activeTab === 'Completed') return status.includes('completed') || status.includes('delivered');
      if (activeTab === 'Today') {
        const today = new Date();
        const orderDate = new Date(order.date || 0);
        return orderDate.toDateString() === today.toDateString();
      }
      
      // Default to 'Recent' (all orders)
      return true;
    });
  }, [orders, activeTab]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h2, styles.headerTitle]}>My Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ alignItems: 'center', marginVertical: 12, paddingHorizontal: 10 }}>
        <View style={{ 
          backgroundColor: '#FFFFFF', 
          borderRadius: 40, 
          paddingVertical: 8,
          paddingHorizontal: 12,
          shadowColor: '#000', 
          shadowOffset: { width: 0, height: 6 }, 
          shadowOpacity: 0.08, 
          shadowRadius: 10, 
          elevation: 6,
          width: '100%'
        }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingHorizontal: 10, alignItems: 'center' }}>
            {[
              { id: 'Recent', icon: Clock },
              { id: 'Today', icon: Calendar },
              { id: 'Pending', icon: Loader },
              { id: 'Completed', icon: CheckCircle2 }
            ].map((t) => (
              <TouchableOpacity 
                key={t.id} 
                onPress={() => setActiveTab(t.id)}
                style={{ alignItems: 'center', justifyContent: 'center' }}
                activeOpacity={0.7}
              >
                <View style={{ 
                  backgroundColor: activeTab === t.id ? Colors.primary : 'transparent', 
                  width: 42, 
                  height: 42, 
                  borderRadius: 50, overflow: 'hidden', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginBottom: 4
                }}>
                  <t.icon size={20} color={activeTab === t.id ? Colors.white : '#4F5E7B'} />
                </View>
                <Text style={{ 
                  fontSize: 11, 
                  fontWeight: activeTab === t.id ? '700' : '500', 
                  color: activeTab === t.id ? Colors.primary : '#4F5E7B' 
                }}>
                  {t.id}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 50, color: Colors.textSecondary }}>Loading orders...</Text>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color={Colors.border} />
            <Text style={styles.emptyStateText}>No {activeTab.toLowerCase()} orders found.</Text>
          </View>
        ) : (
          filteredOrders.map((order: any, index: number) => {
            const isCompleted = (order.status || '').toLowerCase().includes('completed') || (order.status || '').toLowerCase().includes('delivered');
            return (
              <View key={index} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderIdLabel}>Order ID: #{order.id}</Text>
                    <View style={styles.dateRow}>
                      <Calendar size={12} color={Colors.textSecondary} style={{marginRight: 4}} />
                      <Text style={styles.orderDate}>{new Date(order.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}</Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
                    {isCompleted ? (
                      <CheckCircle2 size={12} color={Colors.success} style={{marginRight: 4}} />
                    ) : (
                      <Clock size={12} color={Colors.accent} style={{marginRight: 4}} />
                    )}
                    <Text style={[styles.statusText, isCompleted && styles.statusTextCompleted]}>
                      {order.status || 'Pending'}
                    </Text>
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
            );
          })
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
  tabsContainer: {
    backgroundColor: Colors.primary,
    paddingBottom: 15,
  },
  tabsScroll: {
    paddingHorizontal: 15,
    gap: 10,
  },
  tabBadge: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 10,
  },
  tabBadgeActive: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
  },
  tabBadgeText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  tabBadgeTextActive: {
    color: Colors.primary,
    opacity: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    marginTop: 15,
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  orderDate: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  statusText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusTextCompleted: {
    color: Colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
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
    marginLeft: 8,
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemText: {
    marginLeft: 24,
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
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  totalValue: {
    color: Colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderTrackingScreen;
