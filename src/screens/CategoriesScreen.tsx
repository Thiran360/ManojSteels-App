import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { Search, ChevronRight, ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Cement', icon: '🏢', count: '12 Items' },
  { id: '2', name: 'TMT Bars', icon: '🏗️', count: '8 Items' },
  { id: '3', name: 'Kadapa Slabs', icon: '🪨', count: '15 Items' },
  { id: '4', name: 'Building Blocks', icon: '🧱', count: '20 Items' },
  { id: '5', name: 'Tarpaulin', icon: '⛺', count: '5 Items' },
  { id: '6', name: 'Cement Products', icon: '🥣', count: '18 Items' },
  { id: '7', name: 'Laundry Stone', icon: '🧼', count: '6 Items' },
  { id: '8', name: 'Blue Metal', icon: '💎', count: '10 Items' },
  { id: '9', name: 'Water Tanks', icon: '💧', count: '14 Items' },
];

import { cartService } from '../services/CartService';

const CategoriesScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Dynamic fetch removed to use static categories
    setCategories(DEFAULT_CATEGORIES);
  }, []);

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => navigation.navigate(item.name)}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <View style={styles.categoryInfo}>
        <Text style={[Typography.h3, styles.categoryName]}>{item.name}</Text>
        <Text style={[Typography.bodySmall, styles.categoryCount]}>{item.count}</Text>
      </View>
      <ChevronRight size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={[Typography.h1, styles.headerTitle]}>Categories</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
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
    alignItems: 'center',
  },
  backBtn: {
    marginRight: 15,
    padding: 5,
  },
  headerTitle: {
    color: Colors.white,
  },
  searchContainer: {
    padding: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.white,
    ...Typography.bodySmall,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: Colors.white,
  },
  categoryCount: {
    color: Colors.accent,
    marginTop: 2,
  },
});

export default CategoriesScreen;
