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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  Trash2,
  Truck
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const bannerWidth = width - 40;
const bannerHeight = 160; // Increased from a small aspect ratio based calculation

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
  { id: '11', name: 'Others', image: require('../assets/others.png'), color: '#9E9E9E' },
];



const banners = [
  { id: '1', route: 'Cement', title: 'Premium Cement', subtitle: 'Build strong foundations', image: require('../assets/banner_cement.png') },
  { id: '2', route: 'TMT Bars', title: 'High-Grade TMT Bars', subtitle: 'Maximum tensile strength', image: require('../assets/banner_tmt.png') },
  { id: '3', route: 'Kadapa Slabs', title: 'Kadapa Stone Slabs', subtitle: 'Elegant & durable flooring', image: require('../assets/banner_kadapa.png') },
  { id: '4', route: 'Blue Metal', title: 'Crushed Blue Metal', subtitle: 'Perfect for concrete mixing', image: require('../assets/banner_blue_metal.png') },
  { id: '5', route: 'Building Blocks', title: 'Solid Building Blocks', subtitle: 'Reliable construction materials', image: require('../assets/building_blocks.png') },
];

const HomeScreen = ({ navigation }: any) => {
  const [dynamicProducts, setDynamicProducts] = React.useState(cartService.getProducts());
  const [loading, setLoading] = React.useState(false);
  const [categories, setCategories] = React.useState(cartService.getCategories());
  const [cartCount, setCartCount] = React.useState(cartService.getCartItems().length);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = React.useState(false);
  const scrollViewRef = React.useRef<any>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = currentBannerIndex + 1;
      if (nextIndex >= banners.length) {
        nextIndex = 0;
      }
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: nextIndex * (width - 20), animated: true });
      }
      setCurrentBannerIndex(nextIndex);
    }, 3000);

    return () => clearInterval(timer);
  }, [currentBannerIndex]);

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
        await cartService.apiFetchCategories();
        setCategories(cartService.getCategories());
      } catch (e) {
        console.error("Home Data Fetch Error:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRealProducts();

    const update = () => {
      setDynamicProducts([...cartService.getProducts()]);
      setCartCount(cartService.getCartItems().length);
      setCategories(cartService.getCategories());
    };
    cartService.on('change', update);
    return () => cartService.off('change', update);
  }, []);

  const floatingAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  React.useEffect(() => {
    floatingAnim.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, [floatingAnim, pulseAnim]);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingAnim.value }]
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }]
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
            } else if (DEFAULT_CATEGORIES.some(cat => cat.name === item.name && cat.name !== 'Others')) {
              navigation.navigate(item.name);
            } else {
              navigation.navigate('ProductList', { category: item.name, categoryId: item.id });
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
              <Image source={typeof item.image === 'string' ? { uri: item.image } : item.image} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            ) : (
              <Text style={{ fontSize: 28 }}>{item.icon || '📦'}</Text>
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
      <Animated.View entering={FadeInDown.duration(800)} style={[styles.header, { paddingTop: Math.max(insets.top, 20), paddingBottom: 15 }]}>
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
          <TouchableOpacity style={styles.headerButton} onPress={() => navigation.navigate('Cart')}>
            <ShoppingCart size={24} color={Colors.primary} />
            {cartCount > 0 && (
              <Animated.View entering={ZoomIn.delay(500)} style={[styles.badge, pulseStyle]}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </Animated.View>
            )}
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
          ref={scrollViewRef}
          horizontal
          pagingEnabled={false}
          snapToInterval={bannerWidth + 20}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          style={styles.bannerContainer}
          entering={FadeIn.delay(400)}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / (bannerWidth + 20));
            setCurrentBannerIndex(index);
          }}
        >
          {banners.map((banner, index) => (
            <Animated.View entering={FadeInRight.delay(600 + index * 200).springify()} key={banner.id}>
              <TouchableOpacity 
                activeOpacity={0.9} 
                style={styles.bannerImageContainer}
                onPress={() => navigation.navigate(banner.route)}
              >
                <Image 
                  source={banner.image} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.bannerTextContainer}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                  </View>
                  <View style={styles.shopButton}>
                    <Text style={styles.shopButtonText}>Shop Now</Text>
                  </View>
                </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.ScrollView>
          
          {/* Pagination Dots */}
          <View style={styles.paginationContainer}>
            {banners.map((_, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.paginationDot, 
                  currentBannerIndex === index ? styles.paginationDotActive : null
                ]} 
              />
            ))}
          </View>

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
    paddingHorizontal: 24,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    zIndex: 10,
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
    backgroundColor: Colors.white,
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 52,
    marginTop: 20,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  searchText: {
    color: Colors.textSecondary,
    marginLeft: 12,
    ...Typography.bodySmall,
  },
  bannerContainer: {
    marginBottom: 30,
  },
  bannerImageContainer: {
    width: bannerWidth,
    height: bannerHeight,
    borderRadius: 24,
    marginRight: 20,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bannerTextContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerTitle: {
    color: Colors.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  bannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  shopButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  shopButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 13,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -15,
    marginBottom: 25,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CED0D4',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  spriteImage: {
    width: '100%',
    height: bannerHeight * 5, 
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
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 30,
  },
  categoryCard: {
    width: (width - 65) / 3,
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: Colors.white,
    paddingVertical: 18,
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
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
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
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
    width: 170,
    backgroundColor: Colors.white,
    borderRadius: 24,
    marginRight: 16,
    padding: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  trendingImage: {
    width: '100%',
    height: 120,
    borderRadius: 18,
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
