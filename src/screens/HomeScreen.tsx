import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { cartService } from '../services/CartService';
// import ActivePartyBanner from '../components/ActivePartyBanner';
import Animated, { 
  FadeInDown, 
  FadeInRight, 
  FadeIn, 
  Layout,
  ZoomIn,
  BounceIn,
  BounceInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated';

import { 
  Search, 
  Bell, 
  ShoppingCart, 
  Package, 
  Layers, 
  Square, 
  Grid, 
  Tent, 
  Wrench, 
  Waves, 
  Hexagon, 
  Droplet,
  MoreHorizontal,
  Trash2
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Cement', image: require('../assets/cement_bags.png'), color: '#1877F2' },
  { id: '2', name: 'TMT Bars', image: require('../assets/tmt_bars.png'), color: '#FF6B00' },
  { id: '3', name: 'Kadapa Slabs', image: require('../assets/kadapa_slabs.png'), color: '#4CAF50' },
  { id: '4', name: 'Building Blocks', image: require('../assets/building_blocks.png'), color: '#795548' },
  { id: '5', name: 'Tarpaulin', image: require('../assets/tarpaulin.png'), color: '#E91E63' },
  { id: '6', name: 'Cement Products', image: require('../assets/cement_products.png'), color: '#607D8B' },
  { id: '7', name: 'Laundry Stone', image: require('../assets/laundry_stone.png'), color: '#00BCD4' },
  { id: '8', name: 'Blue Metal', image: require('../assets/blue_metal.png'), color: '#673AB7' },
  { id: '9', name: 'Water Tanks', image: require('../assets/water_tanks.png'), color: '#03A9F4' },
  { id: '10', name: 'Others', image: require('../assets/others.png'), color: '#9E9E9E' },
];



const banners = [
  { id: '1', title: 'Cement Offers', discount: 'UP TO 20% OFF', color: '#1A1A1A' },
  { id: '2', title: 'TMT Discount', discount: 'FLAT ₹5000 OFF', color: '#2C3E50' },
  { id: '3', title: 'Water Tanks', discount: 'FREE DELIVERY', color: '#FF6B00' },
];

const HomeScreen = ({ navigation }: any) => {
  const [dynamicProducts, setDynamicProducts] = React.useState(cartService.getProducts());
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState(DEFAULT_CATEGORIES);

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await cartService.globalRefresh();
    setRefreshing(false);
  }, []);

  React.useEffect(() => {
    const fetchRealProducts = async () => {
      setLoading(true);
      try {
        await cartService.apiFetchProducts();
        // Fetch categories removed to use static categories instead
        setCategories(DEFAULT_CATEGORIES);
      } catch (e) {
        console.error("Home Data Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRealProducts();

    const update = () => setDynamicProducts(cartService.getProducts());
    cartService.on('change', update);
    return () => cartService.off('change', update);
  }, []);

  const floatingAnim = useSharedValue(0);
  React.useEffect(() => {
    floatingAnim.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [floatingAnim]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingAnim.value }]
  }));
  const renderCategory = ({ item, index }: { item: any; index: number }) => {
    const IconComponent = item.icon;
    return (
      <Animated.View 
        entering={BounceInDown.delay(index * 100).springify()}
        layout={Layout.springify()}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.categoryCard}
          onPress={() => {
            if (item.name === 'Others') {
              navigation.navigate('NewArrivals');
            } else {
              navigation.navigate(item.name);
            }
          }}
        >
          <Animated.View
            entering={ZoomIn.delay(index * 100 + 300).duration(600)}
            style={[
              styles.categoryIconContainer, 
              { backgroundColor: `${item.color}10`, overflow: 'hidden' },
              item.image ? { width: 85, height: 85, borderRadius: 24, marginBottom: 6 } : {}
            ]}
          >
            {item.image ? (
              <Image source={typeof item.image === 'number' ? item.image : { uri: item.image }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            ) : (
              <IconComponent size={28} color={item.color} strokeWidth={2.5} />
            )}
          </Animated.View>
          <Text style={[Typography.bodySmall, styles.categoryName]}>{item.name}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderTrendingProduct = ({ item, index }: { item: any; index: number }) => (
    <Animated.View 
      entering={FadeInRight.delay(index * 150 + 200).springify().damping(12)}
      style={styles.trendingCard}
    >
      <TouchableOpacity 
        onPress={() => navigation.navigate('ProductDetails', { product: item })}
      >
        <Image 
          source={typeof item.image === 'number' ? item.image : { uri: item.image }} 
          style={styles.trendingImage} 
        />
        <View style={styles.trendingInfo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={[Typography.bodySmall, styles.trendingBrand]}>{item.brand}</Text>
              <Text style={[Typography.bodyMedium, styles.trendingName]} numberOfLines={1}>{item.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteBtnMini}
              onPress={() => {
                Alert.alert(
                  'Delete Product',
                  'Are you sure?',
                  [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', style: 'destructive', onPress: () => cartService.deleteProduct(item.id) }
                  ]
                );
              }}
            >
              <Trash2 size={16} color={Colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <Animated.View entering={FadeInDown.duration(800)} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleContainer}>
            <Image 
              source={require('../assets/navbar_logo.png')} 
              style={styles.headerLogo} 
              resizeMode="contain" 
            />
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Bell size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Cart')}>
            <ShoppingCart size={24} color={Colors.primary} />
            <Animated.View entering={ZoomIn.delay(500)} style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      >
        {/* Search Bar */}
        <Animated.View entering={BounceIn.delay(300).duration(1000)}>
          <TouchableOpacity style={styles.searchBar}>
            <Search size={20} color={Colors.textSecondary} />
            <Text style={styles.searchText}>Search for cement, TMT, etc...</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Banner Slider */}
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.bannerContainer}
          entering={FadeIn.delay(400)}
        >
          {banners.map((banner, index) => (
            <Animated.View entering={FadeInRight.delay(600 + index * 200).springify()} key={banner.id}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                style={styles.banner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.bannerTextContainer}>
                  <Text style={[Typography.h2, styles.bannerTitle]}>{banner.title}</Text>
                  <Text style={[Typography.bodyMedium, styles.bannerDiscount]}>{banner.discount}</Text>
                  <TouchableOpacity style={styles.shopNowButton}>
                    <Text style={styles.shopNowText}>Shop Now</Text>
                  </TouchableOpacity>
                </View>
                <Animated.View style={[styles.bannerOverlayIcon, floatingStyle]}>
                  <Text style={{ fontSize: 80, opacity: 0.2 }}>🏗️</Text>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          ))}
        </Animated.ScrollView>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={[Typography.h3, styles.sectionTitle]}>Shop by Category</Text>
        </View>

        <View style={styles.categoriesContainer}>
          {categories.map((item, index) => (
            <React.Fragment key={item.id}>
              {renderCategory({ item, index })}
            </React.Fragment>
          ))}
        </View>



        {/* New Arrivals (Admin Added) */}
        {loading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: Colors.textSecondary }}>Loading Products...</Text>
          </View>
        ) : dynamicProducts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[Typography.h3, styles.sectionTitle]}>New Arrivals</Text>
              <TouchableOpacity onPress={() => navigation.navigate('NewArrivals')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={dynamicProducts}
              renderItem={renderTrendingProduct}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingList}
              keyExtractor={item => item.id}
            />
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[Typography.h3, styles.sectionTitle]}>Special Offers</Text>
        </View>



        <View style={{ height: 40 }} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
    height: 85,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginRight: 12,
  },
  welcomeBack: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  userName: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    marginLeft: 10,
  },
  headerLogo: {
    width: width * 0.55,
    height: 45,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchText: {
    color: Colors.textSecondary,
    marginLeft: 12,
    ...Typography.bodySmall,
  },
  bannerContainer: {
    marginBottom: 30,
  },
  banner: {
    width: width - 40,
    height: 160,
    borderRadius: 20,
    marginRight: 20,
    padding: 24,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  bannerTextContainer: {
    flex: 2,
    justifyContent: 'center',
  },
  bannerTitle: {
    color: Colors.white,
  },
  bannerDiscount: {
    color: Colors.accent,
    fontWeight: 'bold',
    marginTop: 4,
  },
  shopNowButton: {
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  shopNowText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerOverlayIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: Colors.text,
  },
  seeAll: {
    color: Colors.accent,
    ...Typography.bodySmall,
  },
  categoriesGrid: {
    marginBottom: 30,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  categoryCard: {
    width: (width - 60) / 3,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: Colors.surface,
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 0,
  },
  categoryIcon: {
    fontSize: 28,
  },
  categoryName: {
    color: Colors.text,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 12,
  },
  fullWidthBanner: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
  },
  fullWidthOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  fullWidthTitle: {
    color: Colors.white,
  },
  fullWidthSubtitle: {
    color: Colors.white,
    fontWeight: 'bold',
    opacity: 0.9,
  },
  trendingList: {
    paddingBottom: 20,
  },
  trendingCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    marginRight: 16,
    padding: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  trendingImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 10,
  },
  trendingInfo: {
    gap: 2,
  },
  trendingBrand: {
    color: Colors.accent,
    fontWeight: 'bold',
    fontSize: 10,
  },
  trendingName: {
    color: Colors.text,
    fontSize: 14,
  },
  trendingPrice: {
    color: Colors.primary,
    fontSize: 16,
  },
  deleteBtnMini: {
    padding: 4,
  },
});

export default HomeScreen;
