import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import AppButton from '../../../components/common/AppButton';

export default function KantinDashboardView({
  onNavigateToProfile,
  onNavigateToCanteen,
  onNavigateToWallet,
}) {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [carouselPage, setCarouselPage] = useState(0);
  const carouselRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const SLIDE_WIDTH = SCREEN_WIDTH - 32;

  const scrollToSlide = (index) => {
    carouselRef.current?.scrollTo({ x: index * SLIDE_WIDTH, animated: true });
    setCarouselPage(index);
  };

  const [heroHeight, setHeroHeight] = useState(150);
  const [kpiHeight, setKpiHeight] = useState(196);

  const carouselHeight = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH],
    outputRange: [heroHeight + 6, kpiHeight + 20],
    extrapolate: 'clamp',
  });

  // Interpolations for fluid animated pagination dots
  const dot0Width = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [7, 24, 7],
    extrapolate: 'clamp',
  });
  const dot0Opacity = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [0.35, 1, 0.35],
    extrapolate: 'clamp',
  });
  const dot0Bg = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
      '#10B981',
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
    ],
    extrapolate: 'clamp',
  });

  const dot1Width = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [7, 24, 7],
    extrapolate: 'clamp',
  });
  const dot1Opacity = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [0.35, 1, 0.35],
    extrapolate: 'clamp',
  });
  const dot1Bg = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
      '#10B981',
      isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)',
    ],
    extrapolate: 'clamp',
  });

  // Scale depth effect for slides
  const slide0Scale = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [0.94, 1, 0.94],
    extrapolate: 'clamp',
  });
  const slide0Opacity = scrollX.interpolate({
    inputRange: [-SLIDE_WIDTH, 0, SLIDE_WIDTH],
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });

  const slide1Scale = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [0.94, 1, 0.94],
    extrapolate: 'clamp',
  });
  const slide1Opacity = scrollX.interpolate({
    inputRange: [0, SLIDE_WIDTH, SLIDE_WIDTH * 2],
    outputRange: [0.7, 1, 0.7],
    extrapolate: 'clamp',
  });

  const [showPosModal, setShowPosModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  const canteenStats = [
    { label: 'OMZET HARI INI', value: 'Rp 485K', sub: '↑ 12% Kemarin', icon: 'cash', color: '#10B981', lightTint: 'rgba(16, 185, 129, 0.07)', borderColor: 'rgba(16, 185, 129, 0.25)' },
    { label: 'PESANAN BERHASIL', value: '38', sub: 'Transaksi', icon: 'receipt', color: '#4F46E5', lightTint: 'rgba(79, 70, 229, 0.07)', borderColor: 'rgba(79, 70, 229, 0.25)' },
    { label: 'PORSI TERJUAL', value: '64', sub: 'Item Makanan', icon: 'restaurant', color: '#F59E0B', lightTint: 'rgba(245, 158, 11, 0.07)', borderColor: 'rgba(245, 158, 11, 0.25)' },
    { label: 'ANTREAN MENUNGGU', value: '3', sub: 'Perlu Dimasak', icon: 'hourglass', color: '#EF4444', lightTint: 'rgba(239, 68, 68, 0.07)', borderColor: 'rgba(239, 68, 68, 0.25)' },
  ];

  const liveOrders = [
    {
      id: 'ORD-089',
      customer: 'Ahmad Siswa',
      items: 'Nasi Goreng Telur (1x), Es Teh (1x)',
      total: 19000,
      status: 'Sedang Dimasak',
      time: '09:40 WIB',
      statusColor: '#F59E0B',
    },
    {
      id: 'ORD-088',
      customer: 'Citra Wijaya',
      items: 'Dimsum Ayam Mentai (1x)',
      total: 16000,
      status: 'Siap Diambil',
      time: '09:35 WIB',
      statusColor: '#10B981',
    },
    {
      id: 'ORD-087',
      customer: 'Budi Santoso',
      items: 'Roti Bakar Keju (1x)',
      total: 10000,
      status: 'Selesai',
      time: '09:20 WIB',
      statusColor: theme.textMuted,
    },
  ];

  const bestSellers = [
    { name: 'Nasi Goreng Telur Spesial', count: 24, total: 'Rp 360.000' },
    { name: 'Es Teh Manis Jasmine', count: 32, total: 'Rp 128.000' },
    { name: 'Dimsum Ayam Mentai', count: 12, total: 'Rp 192.000' },
  ];

  return (
    <View style={styles.container}>
      {/* CAROUSEL: HERO + KPI SLIDES */}
      <View style={styles.carouselWrapper}>
        <Animated.View style={{ height: carouselHeight, overflow: 'hidden' }}>
          <Animated.ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            bounces={false}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselScrollContent}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(e) => {
              const page = Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH);
              setCarouselPage(page);
            }}
          >
            {/* SLIDE 1: HERO CANTEEN BANNER */}
            <Animated.View
              style={[
                styles.carouselSlide,
                {
                  width: SLIDE_WIDTH,
                  transform: [{ scale: slide0Scale }],
                  opacity: slide0Opacity,
                },
              ]}
              onLayout={(e) => {
                const h = Math.round(e.nativeEvent.layout.height);
                if (h > 0 && Math.abs(h - heroHeight) > 2) {
                  setHeroHeight(h);
                }
              }}
            >
              <View style={styles.heroCardContainer}>
                <LinearGradient
                  colors={['#1C2E5A', '#14532D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroGradient}
                >
                  <View style={styles.heroDecorCircle1} />
                  <View style={styles.heroDecorCircle2} />

                  <View style={styles.heroContent}>
                    <View style={styles.heroTopRow}>
                      <View style={styles.heroTextCol}>
                        <View style={styles.roleChipHero}>
                          <View style={styles.pulseDotGreen} />
                          <Text style={styles.roleChipHeroText}>STAN 03 • KANTIN MBOK DARMI</Text>
                        </View>
                        <Text style={styles.heroGreeting}>Selamat Berjualan, {user?.name || 'Mitra Kantin'}</Text>
                        <Text style={styles.heroSub}>
                          Outlet Buka & Siap melayani transaksi nontunai siswa.
                        </Text>
                      </View>

                      {onNavigateToProfile && (
                        <TouchableOpacity
                          style={styles.heroAvatarWrap}
                          onPress={onNavigateToProfile}
                          activeOpacity={0.8}
                        >
                          <View style={styles.heroAvatar}>
                            <Ionicons name="storefront" size={18} color="#FFFFFF" />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Quick Action Buttons */}
                    <View style={styles.heroButtonsRow}>
                      <TouchableOpacity
                        style={styles.heroEmeraldBtn}
                        onPress={() => setShowPosModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="scan" size={16} color="#FFFFFF" />
                        <Text style={styles.heroEmeraldBtnText}>Buka Kasir POS</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.heroOutlineBtn}
                        onPress={() => setShowMenuModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="fast-food-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.heroOutlineBtnText}>Kelola Menu</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </Animated.View>

            {/* SLIDE 2: STATS 4-GRID (CANTEEN METRICS) */}
            <Animated.View
              style={[
                styles.carouselSlide,
                {
                  width: SLIDE_WIDTH,
                  transform: [{ scale: slide1Scale }],
                  opacity: slide1Opacity,
                },
              ]}
              onLayout={(e) => {
                const h = Math.round(e.nativeEvent.layout.height);
                if (h > 0 && Math.abs(h - kpiHeight) > 2) {
                  setKpiHeight(h);
                }
              }}
            >
              <View style={styles.statsGrid}>
                {canteenStats.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.statCardContainer,
                      {
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : item.borderColor,
                        backgroundColor: theme.surface,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? [theme.surface, theme.surface, 'rgba(30, 41, 59, 0.6)']
                          : ['#FFFFFF', '#FFFFFF', item.lightTint]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.statCardGradient}
                    >
                      {/* Circular Gradient Glow */}
                      <LinearGradient
                        colors={[item.color, 'transparent']}
                        start={{ x: 1, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={styles.statGradientCircle}
                      />

                      {/* Watermark Giant Vector Icon Rotated -12deg */}
                      <View style={styles.statWatermarkWrap}>
                        <Ionicons
                          name={item.icon}
                          size={66}
                          color={item.color}
                        />
                      </View>

                      {/* Card Content */}
                      <View style={styles.statCardContent}>
                        <Text style={[styles.statLabelText, { color: theme.textMuted }]}>
                          {item.label}
                        </Text>

                        <View style={styles.statNumberBadgeRow}>
                          <Text style={[styles.statBigNumber, { color: theme.textPrimary }]}>
                            {item.value}
                          </Text>
                          <View
                            style={[
                              styles.statBadgePill,
                              {
                                backgroundColor: isDark
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : item.lightTint,
                                borderColor: item.borderColor,
                              },
                            ]}
                          >
                            <Text style={[styles.statBadgePillText, { color: item.color }]}>
                              {item.sub}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </Animated.View>
          </Animated.ScrollView>
        </Animated.View>

        {/* Fluid Animated Pagination Dots */}
        <View style={styles.carouselDotsRow}>
          <TouchableOpacity
            onPress={() => scrollToSlide(0)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Animated.View
              style={[
                styles.carouselDot,
                {
                  width: dot0Width,
                  opacity: dot0Opacity,
                  backgroundColor: dot0Bg,
                },
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => scrollToSlide(1)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Animated.View
              style={[
                styles.carouselDot,
                {
                  width: dot1Width,
                  opacity: dot1Opacity,
                  backgroundColor: dot1Bg,
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. BIG POS SHORTCUT CARD */}
      <TouchableOpacity
        style={[
          styles.posBannerCard,
          { backgroundColor: theme.surface, borderColor: '#10B981', borderWidth: 1.5 },
        ]}
        onPress={() => setShowPosModal(true)}
        activeOpacity={0.8}
      >
        <View style={styles.posBannerLeft}>
          <View style={[styles.posIconBig, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
            <Ionicons name="barcode-outline" size={28} color="#10B981" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.posBannerTitle, { color: theme.textPrimary }]}>
              Kasir POS E-Kantin (Scan QRIS / RFID)
            </Text>
            <Text style={[styles.posBannerDesc, { color: theme.textMuted }]}>
              Tap kartu siswa atau scan QRIS untuk pembayaran jajan seketika tanpa uang kembalian.
            </Text>
          </View>
        </View>
        <View style={styles.posActionRow}>
          <View style={[styles.posStartBtn, { backgroundColor: '#10B981' }]}>
            <Text style={styles.posStartBtnText}>Luncurkan Kasir</Text>
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* 4. ANTREAN PESANAN MASUK (LIVE QUEUE) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
          ANTREAN PESANAN MASUK
        </Text>
        <TouchableOpacity
          onPress={() => Alert.alert('Antrean Pesanan', 'Membuka seluruh riwayat transaksi stan...')}
        >
          <Text style={[styles.seeAllLink, { color: theme.primary }]}>
            Lihat Semua →
          </Text>
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.ordersCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {liveOrders.map((ord, idx) => (
          <View key={ord.id}>
            <View style={styles.orderItemRow}>
              <View style={styles.orderLeftCol}>
                <View style={styles.orderIdRow}>
                  <Text style={[styles.orderIdText, { color: theme.primary }]}>
                    #{ord.id}
                  </Text>
                  <Text style={[styles.orderTimeText, { color: theme.textMuted }]}>
                    • {ord.time}
                  </Text>
                </View>
                <Text style={[styles.orderCustomer, { color: theme.textPrimary }]}>
                  {ord.customer}
                </Text>
                <Text style={[styles.orderItems, { color: theme.textMuted }]} numberOfLines={1}>
                  {ord.items}
                </Text>
              </View>

              <View style={styles.orderRightCol}>
                <Text style={[styles.orderTotal, { color: theme.textPrimary }]}>
                  Rp {ord.total.toLocaleString('id-ID')}
                </Text>
                <View
                  style={[
                    styles.orderStatusChip,
                    { backgroundColor: theme.surfaceMuted },
                  ]}
                >
                  <Text style={[styles.orderStatusText, { color: ord.statusColor }]}>
                    {ord.status}
                  </Text>
                </View>
              </View>
            </View>
            {idx < liveOrders.length - 1 && (
              <View style={[styles.orderDivider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </View>

      {/* 5. MENU TERLARIS */}
      <Text style={[styles.sectionHeading, { color: theme.textMuted }]}>
        PRODUK TERLARIS HARI INI
      </Text>

      <View
        style={[
          styles.bestSellerCard,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        {bestSellers.map((item, idx) => (
          <View key={idx}>
            <View style={styles.bestSellerRow}>
              <View style={[styles.rankCircle, { backgroundColor: idx === 0 ? '#D4A017' : theme.surfaceMuted }]}>
                <Text style={[styles.rankText, { color: idx === 0 ? '#FFFFFF' : theme.textPrimary }]}>
                  {idx + 1}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bestSellerName, { color: theme.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[styles.bestSellerCount, { color: theme.textMuted }]}>
                  {item.count} porsi terjual
                </Text>
              </View>
              <Text style={[styles.bestSellerTotal, { color: theme.textPrimary }]}>
                {item.total}
              </Text>
            </View>
            {idx < bestSellers.length - 1 && (
              <View style={[styles.orderDivider, { backgroundColor: theme.border }]} />
            )}
          </View>
        ))}
      </View>

      {/* MODAL: POS CASHIER SIMULATOR */}
      <Modal
        visible={showPosModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPosModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="point-of-sale" size={20} color="#10B981" />
                <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                  Kasir POS E-Kantin
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowPosModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescText, { color: theme.textSecondary }]}>
              Siap memindai kartu pintar siswa atau kode QRIS jajan untuk pembayaran stan kantin.
            </Text>

            <View style={[styles.posScanFrame, { borderColor: theme.border, backgroundColor: theme.surfaceMuted }]}>
              <Ionicons name="scan-circle-outline" size={60} color="#10B981" />
              <Text style={[styles.posScanHint, { color: theme.textPrimary }]}>
                Dekatkan Smart Card Siswa ke NFC HP
              </Text>
              <Text style={[styles.posScanSubHint, { color: theme.textMuted }]}>
                Atau masukkan nomor kartu secara manual
              </Text>
            </View>

            <AppButton
              title="Simulasi Transaksi Berhasil (Rp 15.000)"
              icon="checkmark-circle-outline"
              onPress={() => {
                setShowPosModal(false);
                Alert.alert('Transaksi Sukses!', 'Pembayaran Rp 15.000 dari kartu siswa berhasil dipotong.');
              }}
              style={{ marginTop: 12, marginBottom: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* MODAL: KELOLA MENU */}
      <Modal
        visible={showMenuModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMenuModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
            <View style={styles.modalSheetHeader}>
              <Text style={[styles.modalSheetTitle, { color: theme.textPrimary }]}>
                Katalog Menu Stan 03
              </Text>
              <TouchableOpacity
                style={[styles.closeIconWrap, { backgroundColor: theme.surfaceMuted }]}
                onPress={() => setShowMenuModal(false)}
              >
                <Ionicons name="close" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescText, { color: theme.textSecondary }]}>
              8 menu aktif terdaftar di E-Kantin. Status ketersediaan dapat diubah secara instan.
            </Text>

            <AppButton
              title="Tutup Menu"
              variant="outline"
              onPress={() => setShowMenuModal(false)}
              style={{ marginTop: 12, marginBottom: 20 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  carouselWrapper: {
    marginBottom: 16,
  },
  carouselScrollContent: {
    alignItems: 'flex-start',
  },
  carouselSlide: {
    paddingHorizontal: 1,
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 4,
    gap: 6,
    marginTop: 10,
  },
  carouselDot: {
    height: 6,
    borderRadius: 3,
  },
  heroCardContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 0,
    shadowColor: '#1C2E5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  heroGradient: {
    padding: 18,
    position: 'relative',
  },
  heroDecorCircle1: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  heroDecorCircle2: {
    position: 'absolute',
    right: 50,
    bottom: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    opacity: 0.05,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroTextCol: {
    flex: 1,
  },
  roleChipHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  pulseDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  roleChipHeroText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroGreeting: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 17,
  },
  heroAvatarWrap: {
    marginLeft: 12,
  },
  heroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroEmeraldBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  heroEmeraldBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroOutlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  heroOutlineBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 4,
    paddingBottom: 16,
    paddingHorizontal: 2,
    marginBottom: 0,
  },
  statCardContainer: {
    width: '48.3%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statCardGradient: {
    padding: 14,
    minHeight: 92,
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statGradientCircle: {
    position: 'absolute',
    right: -16,
    bottom: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    opacity: 0.25,
  },
  statWatermarkWrap: {
    position: 'absolute',
    right: -6,
    bottom: -8,
    transform: [{ rotate: '-12deg' }],
    opacity: 0.16,
  },
  statCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  statLabelText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statNumberBadgeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  statBigNumber: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  statBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    transform: [{ translateY: -2 }],
  },
  statBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  posBannerCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  posBannerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  posIconBig: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  posBannerDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  posActionRow: {
    alignItems: 'flex-end',
  },
  posStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  posStartBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    marginLeft: 4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  seeAllLink: {
    fontSize: 12,
    fontWeight: '700',
  },
  ordersCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  orderLeftCol: {
    flex: 1,
    marginRight: 10,
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  orderIdText: {
    fontSize: 12,
    fontWeight: '800',
  },
  orderTimeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderCustomer: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  orderItems: {
    fontSize: 11,
    fontWeight: '500',
  },
  orderRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  orderTotal: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  orderStatusChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orderDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  bestSellerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  bestSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  rankCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bestSellerName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  bestSellerCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  bestSellerTotal: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDescText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  posScanFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  posScanHint: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  posScanSubHint: {
    fontSize: 11,
    fontWeight: '500',
  },
});
