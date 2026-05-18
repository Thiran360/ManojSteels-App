import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { cartService } from '../services/CartService';
import { ChevronLeft, ShoppingCart, Share2, MessageSquare, Truck, ShieldCheck, Star, Trash2 } from 'lucide-react-native';
import Animated, { FadeInDown, FadeInRight, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const ProductDetailsScreen = ({ navigation, route }: any) => {
  const { product } = route.params || { 
    product: {
      id: 'd1', // Added default ID to prevent sync errors
      name: 'UltraTech Cement',
      brand: 'UltraTech',
      price: 450,
      image: 'https://5.imimg.com/data5/SELLER/Default/2021/3/XW/QD/YH/12188612/ultratech-cement-500x500.jpg',
      category: 'Cement',
    }
  };

  const relatedProducts = [
    { id: 'r1', name: 'Ambuja Cement', price: 370, image: 'https://5.imimg.com/data5/ANDROID/Default/2021/3/XN/ZZ/ZW/12188612/ambuja-cement-500x500.jpg', brand: 'Ambuja' },
    { id: 'r2', name: 'Ramco Super', price: 285, image: 'https://5.imimg.com/data5/SELLER/Default/2021/3/XN/ZZ/ZW/12188612/ramco-cement-500x500.jpg', brand: 'Ramco' },
    { id: 'r3', name: 'ACC Gold', price: 395, image: 'https://5.imimg.com/data5/SELLER/Default/2021/3/XN/ZZ/ZW/12188612/acc-cement-500x500.jpg', brand: 'ACC' },
  ];


  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Section */}
        <Animated.View entering={FadeIn.duration(1000)} style={styles.imageContainer}>
          <Image 
            source={typeof product.image === 'number' ? product.image : { uri: product.image }} 
            style={styles.mainImage} 
            resizeMode="contain" 
          />
          <View style={styles.headerOverlay}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
              <ChevronLeft size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Share2 size={24} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.iconBtn, { backgroundColor: 'rgba(211, 47, 47, 0.8)' }]}
              onPress={() => {
                Alert.alert(
                  'Delete Product',
                  'Remove this product from catalog?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Delete', 
                      style: 'destructive',
                      onPress: () => {
                        cartService.deleteProduct(product.id);
                        navigation.goBack();
                      }
                    }
                  ]
                );
              }}
            >
              <Trash2 size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(300).duration(800)}
          style={styles.detailsContainer}
        >
          <View style={styles.brandRow}>
            <Text style={[Typography.bodyMedium, styles.brand]}>{product.brand}</Text>
            <View style={styles.ratingBox}>
              <Star size={16} color={Colors.accent} fill={Colors.accent} />
              <Text style={styles.ratingText}>4.8 (120 reviews)</Text>
            </View>
          </View>

          <Text style={[Typography.h1, styles.name]}>{product.name}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Truck size={24} color={Colors.accent} />
              <Text style={styles.infoLabel}>Delivery</Text>
              <Text style={styles.infoValue}>2-3 Days</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <ShieldCheck size={24} color={Colors.accent} />
              <Text style={styles.infoLabel}>Warranty</Text>
              <Text style={styles.infoValue}>Quality Assured</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoItem}>
              <MessageSquare size={24} color={Colors.accent} />
              <Text style={styles.infoLabel}>Stock</Text>
              <Text style={styles.infoValue}>{product.qty ? `${product.qty} Units` : 'Out of Stock'}</Text>
            </View>
          </View>

          <Text style={[Typography.h3, styles.sectionTitle]}>Specifications</Text>
          <View style={styles.specTable}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Weight</Text>
              <Text style={styles.specValue}>50 kg</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Grade</Text>
              <Text style={styles.specValue}>OPC 53 Grade</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Packaging</Text>
              <Text style={styles.specValue}>HDPE Bag</Text>
            </View>
          </View>

          <Text style={[Typography.h3, styles.sectionTitle]}>Description</Text>
          <Text style={[Typography.bodySmall, styles.description]}>
            High-quality building material designed for durability and strength. Ideal for all types of construction projects, providing excellent bonding and long-lasting results.
          </Text>

          {/* Related Products */}
          <Text style={[Typography.h3, styles.sectionTitle, { marginTop: 30 }]}>Related Products</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relatedList}>
            {relatedProducts.map((item, index) => (
              <AnimatedTouchableOpacity 
                entering={FadeInRight.delay(500 + index * 100)}
                key={item.id} 
                style={styles.relatedCard}
                onPress={() => navigation.push('ProductDetails', { product: item })}
              >
                <Image source={{ uri: item.image }} style={styles.relatedImage} />
                <Text style={styles.relatedName} numberOfLines={1}>{item.name}</Text>
              </AnimatedTouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => {
            cartService.addItem(product, 1);
            navigation.navigate('Cart');
          }}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.secondary]}
            style={styles.buyGradient}
          >
            <ShoppingCart size={20} color={Colors.white} />
            <Text style={styles.buyText}>Request Quote</Text>
          </LinearGradient>
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
  imageContainer: {
    width: width,
    height: 350,
    backgroundColor: Colors.white,
    position: 'relative',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 24,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brand: {
    color: Colors.accent,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginLeft: 4,
  },
  name: {
    color: Colors.text,
    marginBottom: 12,
  },
  price: {
    color: Colors.primary,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: 10,
    marginTop: 8,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    color: Colors.text,
    marginBottom: 16,
  },
  specTable: {
    marginBottom: 30,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  specLabel: {
    color: Colors.textSecondary,
    ...Typography.bodySmall,
  },
  specValue: {
    color: Colors.text,
    ...Typography.bodySmall,
    fontWeight: 'bold',
  },
  description: {
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  whatsappBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 54,
    backgroundColor: '#25D366',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  whatsappText: {
    color: Colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  addBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
  relatedList: {
    marginTop: 10,
    marginBottom: 20,
  },
  relatedCard: {
    width: 140,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 10,
    marginRight: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  relatedImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: Colors.white,
    marginBottom: 8,
  },
  relatedName: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
});

export default ProductDetailsScreen;
