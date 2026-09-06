import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useCanteen } from '../../hooks/useCanteen';
import AppButton from '../../components/common/AppButton';

export default function CanteenHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { transactions } = useCanteen();

  const androidStatusBar = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0;
  const safeTop = Math.max(insets.top || 0, androidStatusBar, Platform.OS === 'android' ? 36 : 44);
  const dynamicPaddingTop = safeTop + 62;
  const dynamicPaddingBottom = Math.max(insets.bottom || 0, 14) + 86;

  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'purchase' | 'topup'
  const [selectedTrx, setSelectedTrx] = useState(null);

  const filteredList = transactions.filter((trx) => {
    if (activeFilter === 'purchase') return trx.type === 'purchase';
    if (activeFilter === 'topup') return trx.type === 'topup';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* FILTER TABS */}
      <View style={[styles.filterRow, { paddingTop: dynamicPaddingTop }]}>
        {[
          { id: 'all', label: 'Semua' },
          { id: 'purchase', label: 'Jajan Kantin' },
          { id: 'topup', label: 'Top Up' },
        ].map((tab) => {
          const isSelected = activeFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveFilter(tab.id)}
              activeOpacity={0.8}
              style={[
                styles.filterTab,
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
                  styles.filterTabText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* TRANSACTION LIST */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: dynamicPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredList.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              Belum Ada Transaksi
            </Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
              Riwayat jajan dan top up saldo dompet akan dicatat di sini.
            </Text>
          </View>
        ) : (
          filteredList.map((trx) => {
            const isTopup = trx.type === 'topup';
            return (
              <TouchableOpacity
                key={trx.id}
                style={[
                  styles.trxCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => setSelectedTrx(trx)}
                activeOpacity={0.75}
              >
                <View style={styles.trxLeft}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isTopup
                          ? isDark
                            ? 'rgba(16, 185, 129, 0.2)'
                            : '#DCFCE7'
                          : isDark
                          ? 'rgba(99, 102, 241, 0.2)'
                          : '#EEF2FF',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isTopup ? 'add-circle-outline' : 'restaurant-outline'}
                      size={20}
                      color={isTopup ? '#10B981' : theme.primary}
                    />
                  </View>

                  <View style={styles.trxInfo}>
                    <Text
                      style={[styles.stallName, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {trx.stall}
                    </Text>
                    <Text
                      style={[styles.itemSummary, { color: theme.textSecondary }]}
                      numberOfLines={1}
                    >
                      {trx.items}
                    </Text>
                    <Text style={[styles.dateText, { color: theme.textMuted }]}>
                      {trx.date} • {trx.orderNumber}
                    </Text>
                  </View>
                </View>

                <View style={styles.trxRight}>
                  <Text
                    style={[
                      styles.amountText,
                      { color: isTopup ? '#10B981' : theme.textPrimary },
                    ]}
                  >
                    {isTopup ? '+' : '-'}Rp {trx.amount.toLocaleString('id-ID')}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(16, 185, 129, 0.2)'
                          : '#DCFCE7',
                      },
                    ]}
                  >
                    <Text style={styles.statusBadgeText}>{trx.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* E-RECEIPT MODAL */}
      <Modal
        visible={!!selectedTrx}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedTrx(null)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.receiptCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.receiptHeader}>
              <Ionicons
                name="checkmark-circle"
                size={40}
                color={theme.accentEmerald}
              />
              <Text style={[styles.receiptTitle, { color: theme.textPrimary }]}>
                Bukti Transaksi E-Kantin
              </Text>
              <Text style={[styles.receiptId, { color: theme.textMuted }]}>
                {selectedTrx?.id}
              </Text>
            </View>

            <View
              style={[
                styles.receiptBody,
                {
                  backgroundColor: isDark ? '#141A2D' : '#F8FAFC',
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.receiptRow}>
                <Text style={[styles.rLabel, { color: theme.textSecondary }]}>
                  Merchant / Stan:
                </Text>
                <Text style={[styles.rValue, { color: theme.textPrimary }]}>
                  {selectedTrx?.stall}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.rLabel, { color: theme.textSecondary }]}>
                  Menu Dipesan:
                </Text>
                <Text
                  style={[
                    styles.rValue,
                    { color: theme.textPrimary, flex: 1, textAlign: 'right' },
                  ]}
                >
                  {selectedTrx?.items}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.rLabel, { color: theme.textSecondary }]}>
                  Nomor Antrean:
                </Text>
                <Text style={[styles.rValueHighlight, { color: theme.primary }]}>
                  {selectedTrx?.orderNumber}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.rLabel, { color: theme.textSecondary }]}>
                  Waktu Transaksi:
                </Text>
                <Text style={[styles.rValue, { color: theme.textPrimary }]}>
                  {selectedTrx?.date}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.rLabel, { color: theme.textSecondary }]}>
                  Status:
                </Text>
                <Text style={{ color: '#10B981', fontWeight: '800' }}>
                  {selectedTrx?.status}
                </Text>
              </View>

              <View
                style={[
                  styles.receiptDivider,
                  { borderTopColor: theme.border },
                ]}
              />

              <View style={styles.receiptRow}>
                <Text
                  style={[styles.rTotalLabel, { color: theme.textPrimary }]}
                >
                  Total Dibayar:
                </Text>
                <Text
                  style={[styles.rTotalValue, { color: theme.textPrimary }]}
                >
                  Rp {selectedTrx?.amount.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            <AppButton
              title="Tutup Bukti Transaksi"
              variant="secondary"
              onPress={() => setSelectedTrx(null)}
              style={{ width: '100%', marginTop: 16 }}
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 10,
  },
  emptyWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  trxCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  trxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trxInfo: {
    flex: 1,
  },
  stallName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemSummary: {
    fontSize: 11,
    marginBottom: 3,
  },
  dateText: {
    fontSize: 10,
  },
  trxRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  receiptCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  receiptId: {
    fontSize: 11,
    marginTop: 2,
  },
  receiptBody: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rLabel: {
    fontSize: 11,
  },
  rValue: {
    fontSize: 11,
    fontWeight: '600',
  },
  rValueHighlight: {
    fontSize: 12,
    fontWeight: '800',
  },
  receiptDivider: {
    borderTopWidth: 1,
    marginVertical: 4,
  },
  rTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  rTotalValue: {
    fontSize: 16,
    fontWeight: '900',
  },
});
