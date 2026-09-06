import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCanteen } from '../../hooks/useCanteen';
import { CANTEEN_CATEGORIES } from '../../constants/canteenData';
import CanteenCartModal from './CanteenCartModal';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';

export default function CanteenMenuScreen({ onNavigateToWallet }) {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 62;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 14) + 86;
  const {
    products,
    wallet,
    cart,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
  } = useCanteen();

  const [isCartVisible, setIsCartVisible] = useState(false);

  // Filter products by category & search query
  const filteredProducts = products.filter((prod) => {
    const matchesCat =
      selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.stall.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* TOP COMPACT BALANCE & SEARCH */}
      <View style={[styles.topSection, { paddingTop: dynamicPaddingTop }]}>
        {/* Compact Wallet Glance */}
        <View
          style={[
            styles.compactWalletBar,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.walletLeft}>
            <Ionicons name="wallet-outline" size={17} color={theme.primary} />
            <Text style={[styles.walletAmount, { color: theme.textPrimary }]}>
              Rp {wallet.balance.toLocaleString('id-ID')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.topUpPill,
              { backgroundColor: isDark ? '#1E2744' : '#EEF2FF' },
            ]}
            onPress={onNavigateToWallet}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={14} color={theme.primary} />
            <Text style={[styles.topUpPillText, { color: theme.primary }]}>
              Isi Saldo
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Search Filter Banner if searching */}
        {searchQuery.trim().length > 0 && (
          <View
            style={[
              styles.searchActiveBanner,
              {
                backgroundColor: isDark ? 'rgba(99,102,241,0.12)' : '#EEF2FF',
                borderColor: isDark ? 'rgba(99,102,241,0.3)' : '#C7D2FE',
              },
            ]}
          >
            <View style={styles.searchActiveLeft}>
              <Ionicons name="search" size={13} color={isDark ? '#818CF8' : '#4F46E5'} />
              <Text style={[styles.searchActiveText, { color: isDark ? '#C7D2FE' : '#3730A3' }]}>
                Hasil pencarian: <Text style={{ fontWeight: '800' }}>"{searchQuery}"</Text> ({filteredProducts.length} menu)
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#818CF8' : '#4F46E5'} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* HORIZONTAL CATEGORY CHIPS */}
      <View style={styles.categoryWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CANTEEN_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : isDark
                      ? '#141A2D'
                      : '#FFFFFF',
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryLabel,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* MOBILE-FIRST FOOD CATALOG LIST */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: dynamicPaddingBottom + (cartCount > 0 ? 56 : 16) },
        ]}
      >
        <View style={styles.menuHeaderRow}>
          <Text style={[styles.menuHeaderTitle, { color: theme.textPrimary }]}>
            Pilihan Menu
          </Text>
          <Text style={[styles.menuHeaderCount, { color: theme.textMuted }]}>
            {filteredProducts.length} menu
          </Text>
        </View>

        {filteredProducts.map((item) => {
          const cartItem = cart.find((c) => c.id === item.id);
          const inCartCount = cartItem?.quantity || 0;

          return (
            <View
              key={item.id}
              style={[
                styles.foodCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Left Column: Text & Price Info */}
              <View style={styles.cardInfoCol}>
                {/* Stall & Rating */}
                <View style={styles.stallRatingRow}>
                  <Text
                    style={[styles.stallName, { color: theme.textMuted }]}
                    numberOfLines={1}
                  >
                    {item.stall}
                  </Text>
                  <View style={styles.dotSeparator} />
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text
                      style={[styles.ratingVal, { color: theme.textSecondary }]}
                    >
                      {item.rating}
                    </Text>
                  </View>
                </View>

                {/* Food Name */}
                <Text
                  style={[styles.foodName, { color: theme.textPrimary }]}
                  numberOfLines={2}
                >
                  {item.name}
                </Text>

                {/* Brief description */}
                <Text
                  style={[styles.foodDesc, { color: theme.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>

                {/* Price & Prep time */}
                <View style={styles.priceRow}>
                  <Text style={[styles.priceText, { color: theme.primary }]}>
                    Rp {item.price.toLocaleString('id-ID')}
                  </Text>
                  <Text style={[styles.prepTime, { color: theme.textMuted }]}>
                    {item.prepTime}
                  </Text>
                </View>
              </View>

              {/* Right Column: Catalog Image & Add Button */}
              <View style={styles.cardImageCol}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.foodImage}
                  resizeMode="cover"
                />

                {item.badge && (
                  <View
                    style={[
                      styles.imageBadge,
                      { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text style={styles.imageBadgeText}>{item.badge}</Text>
                  </View>
                )}

                {/* Add / Stepper Button */}
                <View style={styles.actionBtnContainer}>
                  {inCartCount === 0 ? (
                    <TouchableOpacity
                      style={[
                        styles.addBtn,
                        {
                          backgroundColor: theme.surface,
                          borderColor: theme.primary,
                        },
                      ]}
                      onPress={() => addToCart(item)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add" size={16} color={theme.primary} />
                      <Text
                        style={[styles.addBtnText, { color: theme.primary }]}
                      >
                        Pesan
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.stepperBox,
                        {
                          backgroundColor: theme.primary,
                        },
                      ]}
                    >
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, -1)}
                        style={styles.stepTouch}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons
                          name={inCartCount === 1 ? 'trash-outline' : 'remove'}
                          size={13}
                          color="#FFFFFF"
                        />
                      </TouchableOpacity>

                      <Text style={styles.stepNum}>{inCartCount}</Text>

                      <TouchableOpacity
                        onPress={() => updateQuantity(item.id, 1)}
                        style={styles.stepTouch}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="add" size={13} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* FLOATING CART BAR */}
      {cartCount > 0 && (
        <View
          style={[
            styles.floatingBarWrapper,
            { bottom: dynamicPaddingBottom - 10 },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.floatingBar,
              {
                backgroundColor: theme.primary,
              },
            ]}
            onPress={() => setIsCartVisible(true)}
            activeOpacity={0.9}
          >
            <View style={styles.floatLeft}>
              <View style={styles.floatCountBadge}>
                <Text style={styles.floatCountText}>{cartCount}</Text>
              </View>
              <View>
                <Text style={styles.floatTitle}>Pesanan</Text>
                <Text style={styles.floatAmount}>
                  Rp {cartTotal.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <View style={styles.floatRight}>
              <Text style={styles.floatActionText}>Lihat Keranjang</Text>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* CART CHECKOUT BOTTOM SHEET */}
      <CanteenCartModal
        visible={isCartVisible}
        onClose={() => setIsCartVisible(false)}
        onOpenWallet={onNavigateToWallet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },
  compactWalletBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletAmount: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  topUpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
  },
  topUpPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  searchActiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  searchActiveText: {
    fontSize: 11,
    fontWeight: '600',
  },
  categoryWrap: {
    marginTop: 8,
    marginBottom: 4,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryLabel: {
    fontSize: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  menuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 2,
  },
  menuHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  menuHeaderCount: {
    fontSize: 11,
  },
  foodCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  cardInfoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stallRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  stallName: {
    fontSize: 11,
    fontWeight: '500',
    maxWidth: 120,
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#94A3B8',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  foodName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  foodDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  prepTime: {
    fontSize: 10,
  },
  cardImageCol: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  foodImage: {
    width: 100,
    height: 90,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  imageBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  imageBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  actionBtnContainer: {
    marginTop: -16,
    alignSelf: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTouch: {
    padding: 2,
  },
  stepNum: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    minWidth: 14,
    textAlign: 'center',
  },
  floatingBarWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  floatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatCountBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatCountText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '900',
  },
  floatTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '600',
  },
  floatAmount: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  floatRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  floatActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
