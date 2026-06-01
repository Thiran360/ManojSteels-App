import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, FlatList, RefreshControl } from 'react-native';
import { Package, MapPin, Calendar, Truck, Check, XCircle, User, Phone, CreditCard, Edit2, Printer, PenLine } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { cartService } from '../services/CartService';

interface ActiveTokensListProps {
  bulkOrderList: any[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const ActiveTokensList: React.FC<ActiveTokensListProps> = ({ bulkOrderList, onRefresh, refreshing = false }) => {
  const [editingToken, setEditingToken] = useState<any>(null);

  const handleAction = async (id: number | string, action: string) => {
    try {
      const numericId = Number(String(id).replace(/\D/g, ''));
      if (action === 'cancel') {
        await fetch('https://api.codingboss.in/inventory/cancel-bulk-order/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ id: numericId })
        });
        cartService.updateBulkOrder(id.toString(), { status: 'cancelled' });
      } else if (action === 'complete') {
        await fetch('https://api.codingboss.in/inventory/complete-bulk-order/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ id: numericId })
        });
        cartService.updateBulkOrder(id.toString(), { status: 'completed' });
      } else {
        await fetch('https://api.codingboss.in/inventory/bulk-order-works/', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ id: numericId, action })
        });
        cartService.updateBulkOrder(id.toString(), { status: action });
      }
      if (onRefresh) await onRefresh();
    } catch (e) {
      console.log('Update action error', e);
    }
  };

  const saveEdit = async () => {
    if (editingToken) {
      try {
        await fetch('https://api.codingboss.in/inventory/edit-bulk-order/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            id: Number(String(editingToken.id).replace(/\D/g, '')),
            number_of_bags: Number(editingToken.bags),
            delivery_address: editingToken.location,
            customer_name: editingToken.name,
            customer_phone: editingToken.phone,
            category_name: editingToken.brand,
            delivery_date: editingToken.deliveryDate,
            payment_type: editingToken.paymentType,
            truck_number: editingToken.truckNo
          })
        });
      } catch (e) {
        console.log('Edit API error', e);
      }

      cartService.updateBulkOrder(editingToken.id, {
        name: editingToken.name,
        phone: editingToken.phone,
        brand: editingToken.brand,
        bags: editingToken.bags,
        location: editingToken.location,
        deliveryDate: editingToken.deliveryDate,
        paymentType: editingToken.paymentType,
        truckNo: editingToken.truckNo
      });
      if (onRefresh) await onRefresh();
      setEditingToken(null);
    }
  };

  const handlePrint = (order: any) => {
    Alert.alert('Print Order', `Printing functionality for order ${order.id} will be connected to your printer.`);
  };

  const sortedList = bulkOrderList ? [...bulkOrderList].sort((a, b) => {
    const numA = Number(String(a.id).replace(/\D/g, '')) || 0;
    const numB = Number(String(b.id).replace(/\D/g, '')) || 0;
    return numB - numA;
  }) : [];

  const renderItem = ({ item: order }: { item: any }) => (
    <View style={{
      backgroundColor: Colors.white, 
      padding: 20, 
      borderRadius: 28, 
      marginBottom: 16, 
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.03)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 20,
      elevation: 4,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary }} />
            <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.primary, letterSpacing: 0.5 }}>{order.id}</Text>
          </View>
          <Text style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' }}>{order.date || order.created_at}</Text>
        </View>
        <View style={[
          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
          order.status === 'completed' ? { backgroundColor: Colors.success + '15', borderColor: Colors.success } :
          order.status === 'cancelled' ? { backgroundColor: Colors.error + '15', borderColor: Colors.error } :
          { backgroundColor: 'rgba(255, 152, 0, 0.1)', borderColor: '#FF9800' }
        ]}>
          <Text style={[
            { fontWeight: 'bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
            order.status === 'completed' ? { color: Colors.success } :
            order.status === 'cancelled' ? { color: Colors.error } :
            { color: '#FF9800' }
          ]}>{order.status}</Text>
        </View>
      </View>
      
      <View style={{
        backgroundColor: '#F9FAFB', 
        padding: 16, 
        borderRadius: 18, 
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <User size={14} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>{order.name || order.customer_name || 'Customer'}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Phone size={14} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>{order.phone || order.customer_phone || 'N/A'}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Package size={14} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '600' }}>
            {order.brand || order.category_name} • <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{order.bags || order.number_of_bags} Bags</Text>
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 }}>
            <MapPin size={14} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 13, color: '#4B5563', flex: 1, lineHeight: 18 }} numberOfLines={2}>{order.location || order.delivery_address}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Calendar size={14} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>Delivery: {order.deliveryDate || order.delivery_date}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <CreditCard size={14} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 13, color: '#374151', fontWeight: '500' }}>{order.paymentType || order.payment_type || 'Cash on Delivery'}</Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Truck size={14} color={Colors.primary} />
          </View>
          <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: 'bold' }}>
            Truck No: {order.truckNo || order.truck_number || 'Assigning...'}
          </Text>
        </View>
      </View>

      {order.status !== 'completed' && order.status !== 'cancelled' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                minWidth: '45%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 24,
                gap: 6,
                backgroundColor: 'rgba(24, 119, 242, 0.08)'
              }} 
              onPress={() => setEditingToken({ 
                ...order,
                name: order.name || order.customer_name || 'Customer',
                phone: order.phone || order.customer_phone || 'N/A',
                brand: order.brand || order.category_name,
                bags: order.bags || order.number_of_bags,
                location: order.location || order.delivery_address,
                deliveryDate: order.deliveryDate || order.delivery_date,
                paymentType: order.paymentType || order.payment_type || 'Cash on Delivery',
                truckNo: order.truckNo || order.truck_number || ''
              })}>
              <PenLine size={14} color={Colors.primary} />
              <Text style={{ color: Colors.primary, fontWeight: 'bold', fontSize: 12 }}>Edit</Text>
            </TouchableOpacity>
  
            <TouchableOpacity 
              style={{
                flex: 1,
                minWidth: '45%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 24,
                gap: 6,
                backgroundColor: '#F3F4F6'
              }} 
              onPress={() => handlePrint(order)}>
              <Printer size={14} color={Colors.textSecondary} />
              <Text style={{ color: Colors.textSecondary, fontWeight: 'bold', fontSize: 12 }}>Print</Text>
            </TouchableOpacity>
 
            <TouchableOpacity 
              style={{
                flex: 1,
                minWidth: '45%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 24,
                gap: 6,
                backgroundColor: Colors.success,
                shadowColor: Colors.success,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3
              }} 
              onPress={() => handleAction(order.id, 'complete')}>
              <Check size={14} color={Colors.white} />
              <Text style={{ color: Colors.white, fontWeight: 'bold', fontSize: 12 }}>Complete</Text>
            </TouchableOpacity>
  
            <TouchableOpacity 
              style={{
                flex: 1,
                minWidth: '45%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 10,
                borderRadius: 24,
                gap: 6,
                backgroundColor: 'rgba(244, 67, 54, 0.08)'
              }} 
              onPress={() => handleAction(order.id, 'cancel')}>
              <XCircle size={14} color={Colors.error} />
              <Text style={{ color: Colors.error, fontWeight: 'bold', fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.tokensContainer}>
      <FlatList
        data={sortedList}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Truck size={48} color={Colors.border} />
            <Text style={styles.emptyText}>No active bulk tokens</Text>
            <Text style={styles.emptySubtext}>Orders placed here skip the shop queue and include free site delivery.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />

      <Modal visible={!!editingToken} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={Typography.h3}>Edit Token</Text>
              <TouchableOpacity onPress={() => setEditingToken(null)}>
                <XCircle size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              style={{ maxHeight: 400 }}
              showsVerticalScrollIndicator={false}
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={
                <>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput style={styles.input} value={editingToken?.name} onChangeText={t => setEditingToken({ ...editingToken, name: t })} />
                  
                  <Text style={styles.inputLabel}>Phone</Text>
                  <TextInput style={styles.input} value={editingToken?.phone} onChangeText={t => setEditingToken({ ...editingToken, phone: t })} />
                  
                  <Text style={styles.inputLabel}>Brand</Text>
                  <TextInput style={styles.input} value={editingToken?.brand} onChangeText={t => setEditingToken({ ...editingToken, brand: t })} />
                  
                  <Text style={styles.inputLabel}>Bags</Text>
                  <TextInput style={styles.input} value={String(editingToken?.bags || '')} onChangeText={t => setEditingToken({ ...editingToken, bags: t })} keyboardType="numeric" />
                  
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput style={styles.input} value={editingToken?.location} onChangeText={t => setEditingToken({ ...editingToken, location: t })} />
                  
                  <Text style={styles.inputLabel}>Delivery Date</Text>
                  <TextInput style={styles.input} value={editingToken?.deliveryDate} onChangeText={t => setEditingToken({ ...editingToken, deliveryDate: t })} />
                  
                  <Text style={styles.inputLabel}>Payment Option</Text>
                  <TextInput style={styles.input} value={editingToken?.paymentType} onChangeText={t => setEditingToken({ ...editingToken, paymentType: t })} />
                  
                  <Text style={styles.inputLabel}>Truck Number</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 15 }}>
                    {['TN 36 P 0123', 'TN 36 V 1270', 'TN 22 BJ 2799', 'TN 42 E 1408', 'Others'].map(truck => {
                      const presets = ['TN 36 P 0123', 'TN 36 V 1270', 'TN 22 BJ 2799', 'TN 42 E 1408'];
                      const isOthers = !presets.includes(editingToken?.truckNo) && editingToken?.truckNo !== undefined && editingToken?.truckNo !== '';
                      const isSelected = editingToken?.truckNo === truck || (truck === 'Others' && isOthers);
                      
                      return (
                        <TouchableOpacity 
                          key={truck}
                          style={{
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: isSelected ? Colors.primary : Colors.border,
                            backgroundColor: isSelected ? Colors.primary : 'transparent'
                          }}
                          onPress={() => {
                            if (truck !== 'Others') {
                              setEditingToken({ ...editingToken, truckNo: truck });
                            } else {
                              setEditingToken({ ...editingToken, truckNo: ' ' }); // Use a space to trigger "Others"
                            }
                          }}
                        >
                          <Text style={{ color: isSelected ? Colors.white : Colors.text }}>
                            {truck}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {editingToken?.truckNo !== undefined && !['TN 36 P 0123', 'TN 36 V 1270', 'TN 22 BJ 2799', 'TN 42 E 1408'].includes(editingToken?.truckNo) && (
                    <TextInput 
                      style={styles.input} 
                      placeholder="Enter custom truck number" 
                      value={editingToken?.truckNo.trim()} 
                      onChangeText={t => setEditingToken({ ...editingToken, truckNo: t })} 
                    />
                  )}
                </>
              }
            />
            
            <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  emptyState: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.h3, marginTop: 15, marginBottom: 5 },
  emptySubtext: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  tokensContainer: { marginTop: 10 },
  tokenCard: { 
    backgroundColor: Colors.white, 
    padding: 24, 
    borderRadius: 24, 
    marginBottom: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  tokenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tokenNum: { fontSize: 20, fontWeight: '800', color: Colors.primary, letterSpacing: 0.5 },
  tokenTime: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
  statusBadge: { backgroundColor: 'rgba(255, 152, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusBadgeCompleted: { backgroundColor: 'rgba(76, 175, 80, 0.1)' },
  statusBadgeCancelled: { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
  statusText: { fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  tokenDetails: { 
    backgroundColor: '#F8F9FA', 
    padding: 16, 
    borderRadius: 12, 
    gap: 14,
    borderWidth: 1,
    borderColor: '#EFEFEF'
  },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailText: { marginLeft: 10, ...Typography.body, flex: 1, color: '#333', lineHeight: 20 },
  adminActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 24, justifyContent: 'space-between' },
  actionBtn: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 16, gap: 8 },
  actionBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: Colors.white, padding: 24, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderRadius: 12, padding: 16, marginBottom: 16, backgroundColor: '#F0F2F5', fontSize: 15 },
  saveBtn: { backgroundColor: Colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 }
});
