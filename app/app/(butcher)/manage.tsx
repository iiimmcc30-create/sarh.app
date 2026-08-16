import { AppIcon } from '@/components/ui/FlaticonIcon';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { Image } from '@/components/ui/AppImage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { confirmDestructive } from '@/lib/actionSheet';
import { safePush } from '@/lib/safeNavigate';
import { API_BASE } from '@/services/api';
import { CATEGORY_LABELS, Country } from '@/services/butcherData';
import { ButcherLocationPicker } from '@/components/feature/ButcherLocationPicker';
import { LocationMapPreview } from '@/components/feature/LocationMapPreview';
import { hasValidCoords } from '@/lib/butcherLocation';
import { formatLocationLabel } from '@/lib/formatAddress';
import type { ResolvedAddress } from '@/lib/formatAddress';
import { storyTimeLeftLabel } from '@/constants/stories';
import { connectSocket } from '@/lib/socket';
import { AddOfferForm, AddProductForm } from '@/components/butcher/ops/ButcherManageForms';
import { OpsOrderCard } from '@/components/butcher/ops/OpsOrderCard';
import {
  OPS_MANAGE_TABS,
  OPS_PRIMARY_TABS,
  OPS_ORDER_FILTERS,
  groupOrdersByHour,
  isSameLocalDay,
  matchesOpsFilter,
  orderCustomerName,
  orderShortId,
  productStock,
  summarizeOrders,
  type OpsManageTab,
  type OpsOrderFilter,
} from '@/lib/butcherOps';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { getRtlRow } from '@/lib/rtl';

const CANCEL_REASONS = [
  'المنتج غير متوفر',
  'الكمية غير كافية',
  'تعذر التواصل مع العميل',
  'طلب خارج نطاق الخدمة',
] as const;

function parseManageTab(value: string | undefined): OpsManageTab | null {
  return OPS_MANAGE_TABS.some((t) => t.id === value) ? (value as OpsManageTab) : null;
}

export default function ButcherManageScreen() {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(({ colors, scheme }) => createMainStyles(colors, scheme));
  const { tab, action } = useLocalSearchParams<{ tab?: string; action?: string }>();
  const { accessToken, user } = useAuth();
  const initialTab = parseManageTab(tab) ?? 'home';
  const [activeTab, setActiveTab] = useState<OpsManageTab>(initialTab);
  const [orderFilter, setOrderFilter] = useState<OpsOrderFilter>('all');
  const [orderQuery, setOrderQuery] = useState('');
  const [showProductForm, setShowProductForm] = useState(action === 'add' && initialTab === 'products');
  const [showOfferForm, setShowOfferForm] = useState(action === 'add' && initialTab === 'offers');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [offerScope, setOfferScope] = useState<'active' | 'expired'>('active');

  const [showLocationEditor, setShowLocationEditor] = useState(false);
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<ResolvedAddress | null>(null);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingOpen, setSavingOpen] = useState(false);

  const [butcher, setButcher] = useState<any>(null);
  const [butcherStories, setButcherStories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [cancelReasonPreset, setCancelReasonPreset] = useState<string>(CANCEL_REASONS[0]);
  const [cancelReasonCustom, setCancelReasonCustom] = useState('');

  const loadOrdersOnly = async () => {
    if (!accessToken) return;
    try {
      const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` };
      const resOrders = await fetch(`${API_BASE}/api/butchers/orders`, { headers });
      if (resOrders.ok) {
        const json = await resOrders.json();
        if (json.success && json.data) setOrders(json.data);
      }
    } catch (err) {
      console.warn('[ButcherManage] Reload orders failed:', err);
    }
  };

  const loadData = async () => {
    try {
      const headers: HeadersInit = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const [resButcher, resOrders, resStories] = await Promise.all([
        fetch(`${API_BASE}/api/butchers/me`, { headers }),
        fetch(`${API_BASE}/api/butchers/orders`, { headers }),
        fetch(`${API_BASE}/api/butchers/stories`, { headers }),
      ]);

      let butcherId: string | null = null;
      if (resButcher.ok) {
        const json = await resButcher.json();
        if (json.success && json.data) {
          butcherId = json.data.id;
          setButcher(json.data);
        }
      }
      if (resOrders.ok) {
        const json = await resOrders.json();
        if (json.success && json.data) setOrders(json.data);
      }
      if (resStories.ok && butcherId) {
        const json = await resStories.json();
        if (json.success && Array.isArray(json.data)) {
          setButcherStories(json.data.filter((s: any) => s.butcherId === butcherId));
        }
      }
    } catch (err) {
      console.warn('[ButcherManage] Load data failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) loadData();
    else setLoading(false);
  }, [accessToken, refreshTrigger]);

  useEffect(() => {
    const nextTab = parseManageTab(tab);
    if (nextTab) setActiveTab(nextTab);
    if (action === 'add') {
      if (nextTab === 'products') setShowProductForm(true);
      if (nextTab === 'offers') setShowOfferForm(true);
    }
  }, [tab, action]);

  useEffect(() => {
    if (butcher && hasValidCoords(butcher.lat, butcher.lng)) {
      setLocationLat(butcher.lat);
      setLocationLng(butcher.lng);
      setLocationAddress({
        cityAr: butcher.cityAr ?? '',
        addressAr: butcher.addressAr ?? butcher.address ?? '',
      });
    }
  }, [butcher?.id, butcher?.lat, butcher?.lng, butcher?.cityAr, butcher?.addressAr]);

  const saveLocation = async () => {
    if (!accessToken || !hasValidCoords(locationLat, locationLng)) {
      Alert.alert('الموقع مطلوب', 'حدّد موقع الملحمة على الخريطة');
      return;
    }
    setSavingLocation(true);
    try {
      const res = await fetch(`${API_BASE}/api/butchers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          lat: locationLat,
          lng: locationLng,
          ...(locationAddress?.cityAr ? { cityAr: locationAddress.cityAr } : {}),
          ...(locationAddress?.addressAr ? { addressAr: locationAddress.addressAr } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setButcher((prev: any) =>
          prev
            ? {
                ...prev,
                lat: locationLat,
                lng: locationLng,
                ...(locationAddress?.cityAr ? { cityAr: locationAddress.cityAr } : {}),
                ...(locationAddress?.addressAr ? { addressAr: locationAddress.addressAr } : {}),
              }
            : prev,
        );
        setShowLocationEditor(false);
        Alert.alert('تم الحفظ', 'تم تحديث موقع الملحمة');
      } else {
        Alert.alert('خطأ', json.messageAr || json.message || 'فشل حفظ الموقع');
      }
    } catch {
      Alert.alert('خطأ', 'تعذّر الاتصال بالخادم');
    } finally {
      setSavingLocation(false);
    }
  };

  const setShopOpen = async (isOpen: boolean) => {
    if (!accessToken) return;
    if (!isOpen) {
      const ok = await confirmDestructive(
        'إيقاف استقبال الطلبات',
        'لن تظهر الملحمة كمتاحة لاستقبال طلبات جديدة. يمكنك إعادة الفتح في أي وقت.',
        'إيقاف الاستقبال',
      );
      if (!ok) return;
    }
    setSavingOpen(true);
    try {
      const res = await fetch(`${API_BASE}/api/butchers/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ isOpen }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setButcher((prev: any) => (prev ? { ...prev, isOpen } : prev));
      } else {
        Alert.alert('خطأ', json.messageAr || json.message || 'فشل تحديث حالة الملحمة');
      }
    } catch {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    } finally {
      setSavingOpen(false);
    }
  };

  const transitionOrder = async (orderId: string, nextStatus: string, cancellationReason?: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/butchers/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: nextStatus,
          ...(cancellationReason ? { cancellationReason } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, ...json.data, status: nextStatus } : o)),
        );
      } else {
        Alert.alert('خطأ', json.messageAr || json.message || 'فشل تحديث حالة الطلب');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancelOrderId) return;
    const reason =
      cancelReasonPreset === '__custom__' ? cancelReasonCustom.trim() : cancelReasonPreset;
    if (!reason) {
      Alert.alert('خطأ', 'يرجى تحديد سبب الإلغاء');
      return;
    }
    await transitionOrder(cancelOrderId, 'cancelled', reason);
    setCancelOrderId(null);
  };

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);
    const onOrderChanged = () => {
      void loadOrdersOnly();
    };
    socket.on('order.created', onOrderChanged);
    socket.on('order.updated', onOrderChanged);
    socket.on('order.cancelled', onOrderChanged);
    socket.on('order.timeline.updated', onOrderChanged);
    socket.on('inventory.updated', onOrderChanged);
    return () => {
      socket.off('order.created', onOrderChanged);
      socket.off('order.updated', onOrderChanged);
      socket.off('order.cancelled', onOrderChanged);
      socket.off('order.timeline.updated', onOrderChanged);
      socket.off('inventory.updated', onOrderChanged);
      socket.disconnect();
    };
  }, [accessToken]);

  const deleteOffer = async (offerId: string) => {
    const confirmed = await confirmDestructive('حذف العرض', 'هل تريد حذف هذا العرض؟', 'حذف العرض');
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/api/butchers/offers/${offerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) setRefreshTrigger((prev) => prev + 1);
      else Alert.alert('خطأ', json.messageAr || json.message || 'فشل حذف العرض');
    } catch {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
  };

  const pauseOffer = async (offer: any) => {
    const confirmed = await confirmDestructive('إيقاف العرض', 'سيتم إنهاء صلاحية هذا العرض الآن.', 'إيقاف العرض');
    if (!confirmed || !accessToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/butchers/offers/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ validUntil: new Date().toISOString() }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) setRefreshTrigger((prev) => prev + 1);
      else Alert.alert('خطأ', json.messageAr || json.message || 'فشل إيقاف العرض');
    } catch {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
  };

  const deleteProduct = async (productId: string) => {
    const confirmed = await confirmDestructive('حذف المنتج', 'هل تريد حذف هذا المنتج؟', 'حذف المنتج');
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/api/butchers/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) setRefreshTrigger((prev) => prev + 1);
      else Alert.alert('خطأ', json.messageAr || json.message || 'فشل حذف المنتج');
    } catch {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
  };

  const openProductForm = (product?: any) => {
    setEditingProduct(product ?? null);
    setShowProductForm(true);
  };
  const closeProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };
  const openOfferForm = (offer?: any) => {
    setEditingOffer(offer ?? null);
    setShowOfferForm(true);
  };
  const closeOfferForm = () => {
    setShowOfferForm(false);
    setEditingOffer(null);
  };

  const deleteStory = async (storyId: string) => {
    const confirmed = await confirmDestructive('حذف القصة', 'هل تريد حذف هذه القصة؟', 'حذف القصة');
    if (!confirmed) return;
    try {
      const res = await fetch(`${API_BASE}/api/butchers/stories/${storyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) setButcherStories((prev) => prev.filter((s) => s.id !== storyId));
      else Alert.alert('خطأ', json.messageAr || json.message || 'فشل حذف القصة');
    } catch {
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    }
  };

  const openChat = (order: any) => {
    const customerId = order.customer?.id;
    if (!customerId) {
      Alert.alert('خطأ', 'لا يمكن فتح المحادثة لعدم توفر بيانات العميل');
      return;
    }
    router.push({
      pathname: '/butchers/chat',
      params: {
        receiverId: customerId,
        receiverName: orderCustomerName(order),
        receiverAvatar: order.customer?.avatar || '',
        threadType: 'BUTCHER',
        ...(butcher?.id ? { butcherId: butcher.id } : {}),
      },
    });
  };

  const summary = useMemo(() => summarizeOrders(orders), [orders]);
  const products = butcher?.products || [];
  const offers = butcher?.offers || [];
  const accountName = user?.arabicName || user?.displayName || '';
  const butcherAddress = [butcher?.addressAr, butcher?.cityAr]
    .map((p: unknown) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean)
    .join('، ');

  const filteredOrders = useMemo(() => {
    const q = orderQuery.trim();
    return orders.filter((order) => {
      if (!matchesOpsFilter(order, orderFilter)) return false;
      if (!q) return true;
      const hay = `${orderShortId(order)} ${orderCustomerName(order)}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [orders, orderFilter, orderQuery]);

  const actionOrders = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed');
  const todayActive = orders.filter(
    (o) => isSameLocalDay(o.createdAt) && o.status !== 'cancelled' && o.status !== 'delivered',
  );
  const hourGroups = groupOrdersByHour(todayActive);
  const lowStock = products.filter((p: any) => {
    const s = productStock(p);
    return s.kind === 'low' || s.kind === 'out';
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.electric} />
          <Text style={styles.mutedCenter}>جاري تحميل التشغيل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!butcher) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.centered}>
          <AppIcon name="storefront-outline" size={42} color={colors.electric} />
          <Text style={styles.emptyTitle}>سجّل ملحمتك في سرح</Text>
          <Text style={styles.emptySub}>ابدأ بعرض منتجاتك واستقبال الطلبات من العملاء.</Text>
          <Pressable style={styles.primaryBtn} onPress={() => router.push('/butchers/apply')}>
            <Text style={styles.primaryBtnText}>سجل ملحمتك الآن</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const goOrders = (filter: OpsOrderFilter) => {
    setOrderFilter(filter);
    setActiveTab('orders');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={[styles.header, getRtlRow()]}>
        <Pressable onPress={() => router.push('/butchers/edit')} hitSlop={12} style={styles.iconBtn}>
          <AppIcon name="create-outline" size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerBrand} numberOfLines={1}>
            سرح
          </Text>
          {accountName ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {accountName}
            </Text>
          ) : butcher.nameAr ? (
            <Text style={styles.headerSub} numberOfLines={1}>
              {butcher.nameAr}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => safePush('/butcher-sidebar', undefined, router)}
          hitSlop={12}
          style={styles.iconBtn}
        >
          <AppIcon name="menu" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={[styles.statusBar, getRtlRow()]}>
        <View style={[styles.statusLeft, getRtlRow()]}>
          <View
            style={[
              styles.liveDot,
              { backgroundColor: butcher.isOpen ? colors.electricBright : colors.textMuted },
            ]}
          />
          <Text style={[styles.statusLabel, butcher.isOpen && styles.statusLabelOn]}>
            {butcher.isOpen ? 'مفتوح الآن' : 'متوقف عن استقبال الطلبات'}
          </Text>
        </View>
        <Pressable
          disabled={savingOpen}
          onPress={() => void setShopOpen(!butcher.isOpen)}
          style={[styles.openToggle, butcher.isOpen ? styles.openToggleIdle : styles.openToggleOff]}
          accessibilityRole="button"
          accessibilityLabel={butcher.isOpen ? 'إيقاف' : 'فتح الملحمة'}
        >
          {savingOpen ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <View style={[styles.openToggleInner, getRtlRow()]}>
              {butcher.isOpen ? (
                <AppIcon name="pause" size={14} color={colors.textPrimary} />
              ) : null}
              <Text style={[styles.openToggleText, !butcher.isOpen && styles.openToggleTextOn]}>
                {butcher.isOpen ? 'إيقاف' : 'فتح'}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.navRow, getRtlRow()]}
      >
        {OPS_PRIMARY_TABS.map((item) => {
          const active = activeTab === item.id;
          const count = item.id === 'orders' ? summary.newCount : undefined;
          return (
            <Pressable
              key={item.id}
              onPress={() => setActiveTab(item.id)}
              style={[styles.navChip, active && styles.navChipOn]}
            >
              {!!count && count > 0 ? (
                <View style={[styles.navBadge, active && styles.navBadgeOn]}>
                  <Text style={[styles.navBadgeText, active && styles.navBadgeTextOn]}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.navChipText, active && styles.navChipTextOn]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {activeTab === 'home' && (
          <View>
            <View style={styles.statsGrid}>
              {[
                {
                  label: 'جديدة',
                  value: String(summary.newCount),
                  accent: true,
                  onPress: () => goOrders('pending'),
                },
                {
                  label: 'قيد التوصيل',
                  value: String(summary.delivering),
                  accent: true,
                  onPress: () => goOrders('delivering'),
                },
                {
                  label: 'قيد التجهيز',
                  value: String(summary.preparing),
                  accent: true,
                  onPress: () => goOrders('preparing'),
                },
                {
                  label: 'جاهزة',
                  value: String(summary.readyPickup),
                  accent: true,
                  onPress: () => goOrders('ready'),
                },
                {
                  label: 'مخزون منخفض',
                  value: String(lowStock.length),
                  accent: false,
                  onPress: () => setActiveTab('products'),
                },
                {
                  label: 'توصيل يحتاج خروج',
                  value: String(summary.deliveryNow),
                  accent: false,
                  onPress: () => goOrders('delivering'),
                },
                {
                  label: 'مبيعات اليوم',
                  value: `${summary.salesToday.toLocaleString('en-US')} ر.س`,
                  accent: false,
                },
                {
                  label: 'مكتملة اليوم',
                  value: String(summary.completedToday),
                  accent: false,
                  onPress: () => goOrders('delivered'),
                },
              ].map((stat) => (
                <Pressable
                  key={stat.label}
                  onPress={stat.onPress}
                  disabled={!stat.onPress}
                  style={styles.statCard}
                >
                  <Text style={[styles.statValue, stat.accent && styles.statValueAccent]}>
                    {stat.value}
                  </Text>
                  <Text style={styles.statLabel} numberOfLines={2}>
                    {stat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.actionCard}>
              <Text style={styles.actionCardTitle}>الطلبات التي تحتاج إجراء</Text>
              {actionOrders.length === 0 ? (
                <Text style={styles.actionCardEmpty}>لا توجد طلبات بانتظار إجرائك</Text>
              ) : (
                <View style={styles.actionList}>
                  {actionOrders.map((order) => (
                    <OpsOrderCard
                      key={order.id}
                      order={order}
                      butcherAddress={butcherAddress}
                      onOpen={() =>
                        router.push({
                          pathname: '/butchers/manage-order/[id]',
                          params: { id: order.id },
                        })
                      }
                      onAdvance={(next) => void transitionOrder(order.id, next)}
                      onCancel={() => setCancelOrderId(order.id)}
                      onChat={() => openChat(order)}
                    />
                  ))}
                </View>
              )}
            </View>

            {hourGroups.length > 0 ? (
              <>
                <RtlTextShell>
                  <RtlText style={styles.sectionTitle}>طلبات اليوم حسب الوقت</RtlText>
                </RtlTextShell>
                {hourGroups.map((g) => (
                  <Pressable key={g.key} onPress={() => goOrders('all')} style={styles.slotRow}>
                    <Text style={styles.slotCount}>{g.count}</Text>
                    <RtlTextShell flex>
                      <RtlText style={styles.slotLabel}>{g.label}</RtlText>
                      <RtlText style={styles.slotSub}>{g.count} طلبات</RtlText>
                    </RtlTextShell>
                  </Pressable>
                ))}
              </>
            ) : null}

            {lowStock.length > 0 ? (
              <>
                <RtlTextShell>
                  <RtlText style={styles.sectionTitle}>منتجات تحتاج متابعة</RtlText>
                </RtlTextShell>
                {lowStock.slice(0, 4).map((p: any) => {
                  const stock = productStock(p);
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setActiveTab('products');
                      }}
                      style={styles.stockRow}
                    >
                      <Text style={styles.stockLabel}>{stock.label}</Text>
                      <RtlTextShell flex>
                        <RtlText style={styles.stockName} numberOfLines={1}>
                          {p.nameAr}
                        </RtlText>
                      </RtlTextShell>
                      <View
                        style={[
                          styles.stockDot,
                          stock.kind === 'out' ? styles.stockOut : styles.stockLow,
                        ]}
                      />
                    </Pressable>
                  );
                })}
              </>
            ) : null}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            <RtlTextShell>
              <RtlText style={styles.pageTitle}>الطلبات</RtlText>
            </RtlTextShell>
            <TextInput
              style={styles.search}
              placeholder="بحث برقم الطلب أو اسم العميل"
              placeholderTextColor={colors.textSubtle}
              value={orderQuery}
              onChangeText={setOrderQuery}
              textAlign="right"
            />
            <FilterChipRow contentPaddingHorizontal={0} style={styles.filterRowWrap}>
              {[...OPS_ORDER_FILTERS].reverse().map((f) => (
                <FilterChip
                  key={f.id}
                  label={f.label}
                  selected={orderFilter === f.id}
                  onPress={() => setOrderFilter(f.id)}
                />
              ))}
            </FilterChipRow>
            {filteredOrders.map((order) => (
              <OpsOrderCard
                key={order.id}
                order={order}
                compact
                butcherAddress={butcherAddress}
                onOpen={() => router.push({ pathname: '/butchers/manage-order/[id]', params: { id: order.id } })}
                onAdvance={(next) => void transitionOrder(order.id, next)}
                onCancel={() => setCancelOrderId(order.id)}
                onChat={() => openChat(order)}
              />
            ))}
            {filteredOrders.length === 0 ? (
              <View style={styles.emptyBox}>
                <AppIcon name="clipboard-outline" size={28} color={colors.textMuted} />
                <RtlTextShell>
                  <RtlText style={styles.emptyTitle}>لا توجد طلبات</RtlText>
                </RtlTextShell>
              </View>
            ) : null}
          </View>
        )}

        {activeTab === 'products' && (
          <View>
            <View style={styles.tabHeader}>
              <Pressable style={styles.addBtn} onPress={() => openProductForm()}>
                <Text style={styles.addBtnText}>إضافة منتج</Text>
                <AppIcon name="add" size={16} color="#fff" />
              </Pressable>
              <RtlTextShell flex>
                <RtlText style={styles.pageTitle}>المنتجات</RtlText>
              </RtlTextShell>
            </View>
            {products.map((p: any) => {
              const stock = productStock(p);
              const price = p.pricePerKg ? `${p.pricePerKg} ر.س/كغ` : `${p.priceFixed?.toLocaleString() ?? '—'} ر.س`;
              return (
                <View key={p.id} style={styles.productCard}>
                  {p.images?.[0] ? (
                    <Image source={{ uri: p.images[0] }} style={styles.productImg} contentFit="cover" />
                  ) : (
                    <View style={[styles.productImg, styles.productImgEmpty]}>
                      <AppIcon name="image-outline" size={20} color={colors.textMuted} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.productName}>{p.nameAr}</Text>
                    <Text style={styles.productMeta}>
                      {CATEGORY_LABELS[p.category as keyof typeof CATEGORY_LABELS]?.ar || p.category}
                      {p.availableQuantity != null ? ` · ${p.availableQuantity} كغ` : ''}
                    </Text>
                    <View style={styles.productFooter}>
                      <Text style={styles.productPrice}>{price}</Text>
                      <View style={[styles.stockPill, stock.kind === 'ok' ? styles.stockOkBg : stock.kind === 'low' ? styles.stockLowBg : styles.stockOutBg]}>
                        <Text style={styles.stockPillText}>{stock.label}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.rowActions}>
                    <Pressable style={styles.iconBtn} onPress={() => openProductForm(p)}>
                      <AppIcon name="pencil-outline" size={16} color={colors.electric} />
                    </Pressable>
                    <Pressable style={styles.iconBtn} onPress={() => void deleteProduct(p.id)}>
                      <AppIcon name="trash-outline" size={16} color={colors.danger} />
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {products.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>لا توجد منتجات بعد</Text>
              </View>
            ) : null}
          </View>
        )}

        {activeTab === 'offers' && (
          <View>
            <View style={styles.tabHeader}>
              <Pressable style={styles.addBtn} onPress={() => openOfferForm()}>
                <Text style={styles.addBtnText}>إنشاء عرض</Text>
                <AppIcon name="add" size={16} color="#fff" />
              </Pressable>
              <RtlTextShell flex>
                <RtlText style={styles.pageTitle}>العروض</RtlText>
              </RtlTextShell>
            </View>
            <FilterChipRow contentPaddingHorizontal={0} style={styles.filterRowWrap}>
              {(['active', 'expired'] as const).map((scope) => (
                <FilterChip
                  key={scope}
                  label={scope === 'active' ? 'النشطة' : 'المنتهية'}
                  selected={offerScope === scope}
                  onPress={() => setOfferScope(scope)}
                />
              ))}
            </FilterChipRow>
            {offers
              .filter((offer: any) => {
                const expired = offer.validUntil && new Date(offer.validUntil).getTime() < Date.now();
                return offerScope === 'expired' ? expired : !expired;
              })
              .map((offer: any) => {
                const expired = offer.validUntil && new Date(offer.validUntil).getTime() < Date.now();
                return (
                  <View key={offer.id} style={styles.productCard}>
                    <Image source={{ uri: offer.image }} style={styles.productImg} contentFit="cover" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.productName}>{offer.titleAr}</Text>
                      <Text style={styles.productMeta} numberOfLines={1}>{offer.descriptionAr}</Text>
                      <Text style={styles.productPrice}>
                        {offer.offerPrice?.toLocaleString()} ر.س
                        {offer.discountPercent ? ` · خصم ${offer.discountPercent}%` : ''}
                      </Text>
                      <Text style={styles.productMeta}>
                        حتى {offer.validUntil ? new Date(offer.validUntil).toLocaleDateString('ar-SA') : '—'}
                        {expired ? ' · منتهٍ' : ' · نشط'}
                      </Text>
                    </View>
                    <View style={styles.rowActions}>
                      <Pressable style={styles.iconBtn} onPress={() => openOfferForm(offer)}>
                        <AppIcon name="pencil-outline" size={16} color={colors.electric} />
                      </Pressable>
                      {!expired ? (
                        <Pressable style={styles.iconBtn} onPress={() => void pauseOffer(offer)}>
                          <AppIcon name="close-circle-outline" size={16} color={colors.amber} />
                        </Pressable>
                      ) : null}
                      <Pressable style={styles.iconBtn} onPress={() => void deleteOffer(offer.id)}>
                        <AppIcon name="trash-outline" size={16} color={colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {activeTab === 'stories' && (
          <View>
            <View style={styles.tabHeader}>
              <Pressable
                style={styles.addBtn}
                onPress={() => router.push({ pathname: '/create/story', params: { mode: 'butcher' } })}
              >
                <Text style={styles.addBtnText}>نشر قصة</Text>
                <AppIcon name="add" size={16} color="#fff" />
              </Pressable>
              <RtlTextShell flex>
                <RtlText style={styles.pageTitle}>القصص</RtlText>
              </RtlTextShell>
            </View>
            {butcherStories.map((story: any) => (
              <View key={story.id} style={styles.productCard}>
                <Pressable style={styles.iconBtn} onPress={() => void deleteStory(story.id)}>
                  <AppIcon name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
                <RtlTextShell flex>
                  <RtlText style={styles.productName} numberOfLines={1}>{story.captionAr || story.caption || 'قصة'}</RtlText>
                  <RtlText style={styles.productMeta}>{storyTimeLeftLabel(story.expiresAt)}</RtlText>
                </RtlTextShell>
                <Image source={{ uri: story.thumbnail }} style={styles.productImg} contentFit="cover" />
              </View>
            ))}
            {[
              { type: 'daily_slaughter', label: 'ذبح يومي', icon: 'restaurant' },
              { type: 'new_stock', label: 'مخزون جديد', icon: 'cube-outline' },
              { type: 'offer', label: 'عرض اليوم', icon: 'pricetag-outline' },
              { type: 'update', label: 'تحديث عام', icon: 'megaphone-outline' },
            ].map((st) => (
              <Pressable
                key={st.type}
                style={styles.storyType}
                onPress={() =>
                  router.push({ pathname: '/create/story', params: { mode: 'butcher', type: st.type } })
                }
              >
                <AppIcon name="add" size={16} color={colors.textMuted} />
                <RtlTextShell flex>
                  <RtlText style={styles.storyTypeLabel}>{st.label}</RtlText>
                </RtlTextShell>
                <AppIcon name={st.icon} size={18} color={colors.electric} />
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === 'shop' && (
          <View>
            <RtlTextShell>
              <RtlText style={styles.pageTitle}>معلومات الملحمة</RtlText>
            </RtlTextShell>
            <View style={styles.infoCard}>
              <RtlTextShell>
                <RtlText style={styles.infoName}>{butcher.nameAr}</RtlText>
                {butcher.bioAr ? <RtlText style={styles.infoBio}>{butcher.bioAr}</RtlText> : null}
                <RtlText style={styles.infoRow}>
                  العنوان: {formatLocationLabel(butcher.cityAr, butcher.addressAr ?? butcher.address, butcher.lat, butcher.lng) || 'غير محدد'}
                </RtlText>
                <RtlText style={styles.infoRow}>
                  ساعات العمل: {butcher.openTime || '06:00'} – {butcher.closeTime || '22:00'}
                </RtlText>
                <RtlText style={styles.infoRow}>الهاتف: {butcher.phone || '—'}</RtlText>
                <RtlText style={styles.infoRow}>التوصيل: الملحمة تتولى التوصيل بنفسها — لا يوجد مندوب سرح</RtlText>
                <RtlText style={styles.infoRow}>الاستلام من الملحمة متاح مع التوصيل حسب طلب العميل</RtlText>
              </RtlTextShell>
            </View>
            {hasValidCoords(butcher.lat, butcher.lng) && !showLocationEditor ? (
              <LocationMapPreview
                country={(butcher.country as Country) ?? 'SA'}
                lat={butcher.lat}
                lng={butcher.lng}
                cityLabel={butcher.cityAr}
                height={140}
              />
            ) : null}
            <Pressable style={styles.secondaryBtn} onPress={() => setShowLocationEditor((v) => !v)}>
              <Text style={styles.secondaryBtnText}>{showLocationEditor ? 'إخفاء الخريطة' : 'تعديل الموقع'}</Text>
            </Pressable>
            {showLocationEditor ? (
              <View style={{ gap: spacing.md, marginTop: spacing.md }}>
                <ButcherLocationPicker
                  country={(butcher.country as Country) ?? 'SA'}
                  lat={locationLat}
                  lng={locationLng}
                  cityLabel={butcher.cityAr}
                  addressLabel={butcher.addressAr ?? butcher.address}
                  onChange={({ lat, lng }) => {
                    setLocationLat(lat);
                    setLocationLng(lng);
                  }}
                  onAddressResolved={setLocationAddress}
                  height={200}
                />
                <Pressable style={styles.primaryBtn} onPress={() => void saveLocation()} disabled={savingLocation}>
                  {savingLocation ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>حفظ الموقع</Text>}
                </Pressable>
              </View>
            ) : null}
            <Pressable style={[styles.secondaryBtn, { marginTop: spacing.md }]} onPress={() => router.push('/butchers/edit')}>
              <Text style={styles.secondaryBtnText}>تعديل بيانات الملحمة</Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 88 }} />
      </ScrollView>

      <Modal visible={showProductForm} animationType="slide" transparent>
        <View style={styles.sheetBackdrop}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
            <AddProductForm
              product={editingProduct ?? undefined}
              onClose={closeProductForm}
              onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
              butcherCountry={butcher.country || 'SA'}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={showOfferForm} animationType="slide" transparent>
        <View style={styles.sheetBackdrop}>
          <ScrollView style={styles.sheet} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
            <AddOfferForm
              offer={editingOffer}
              onClose={closeOfferForm}
              onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
              butcherCountry={butcher.country || 'SA'}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!cancelOrderId} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <RtlTextShell>
              <RtlText style={styles.modalTitle}>إلغاء الطلب</RtlText>
              <RtlText style={styles.modalSub}>اختر سبب الإلغاء</RtlText>
            </RtlTextShell>
            {CANCEL_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={[styles.reasonChip, cancelReasonPreset === reason && styles.reasonChipOn]}
                onPress={() => setCancelReasonPreset(reason)}
              >
                <Text style={[styles.reasonText, cancelReasonPreset === reason && styles.reasonTextOn]}>{reason}</Text>
              </Pressable>
            ))}
            <Pressable
              style={[styles.reasonChip, cancelReasonPreset === '__custom__' && styles.reasonChipOn]}
              onPress={() => setCancelReasonPreset('__custom__')}
            >
              <Text style={[styles.reasonText, cancelReasonPreset === '__custom__' && styles.reasonTextOn]}>سبب آخر</Text>
            </Pressable>
            {cancelReasonPreset === '__custom__' && (
              <TextInput
                style={styles.search}
                placeholder="اكتب سبب الإلغاء"
                placeholderTextColor={colors.textSubtle}
                value={cancelReasonCustom}
                onChangeText={setCancelReasonCustom}
                textAlign="right"
              />
            )}
            <View style={styles.modalActions}>
              <Pressable style={[styles.secondaryBtn, { flex: 1 }]} onPress={() => setCancelOrderId(null)}>
                <Text style={styles.secondaryBtnText}>تراجع</Text>
              </Pressable>
              <Pressable style={styles.dangerBtn} onPress={() => void confirmCancelOrder()}>
                <Text style={styles.primaryBtnText}>تأكيد الإلغاء</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function createMainStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const cardBg = scheme === 'light' ? '#FFFFFF' : colors.bgElevated;
  const pageBg = scheme === 'light' ? '#F2F4F6' : colors.screenRoot;
  const softBg = scheme === 'light' ? '#FFFFFF' : colors.bgSurface;
  const border = colors.borderSoft;
  const accentSoft = `${colors.electricBright}18`;

  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: pageBg },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl, gap: spacing.md },
    mutedCenter: { ...typography.body, fontFamily: OFFICIAL_APP_FONT, color: colors.textMuted, marginTop: spacing.md },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: 10,
    },
    headerText: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
    headerBrand: {
      ...typography.h3,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    headerSub: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      marginTop: 2,
      textAlign: 'right',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: cardBg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    statusBar: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: cardBg,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    statusLeft: {
      flex: 1,
      alignItems: 'center',
      gap: 8,
      minWidth: 0,
    },
    liveDot: { width: 8, height: 8, borderRadius: 4 },
    statusLabel: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    statusLabelOn: { color: colors.electricBright },
    openToggle: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      flexShrink: 0,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      backgroundColor: softBg,
    },
    openToggleIdle: {
      backgroundColor: scheme === 'light' ? '#F7F8FA' : colors.bgSurface,
    },
    openToggleOff: {
      backgroundColor: colors.electricBright,
      borderColor: colors.electricBright,
    },
    openToggleInner: {
      alignItems: 'center',
      gap: 6,
    },
    openToggleText: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    openToggleTextOn: { color: '#fff' },
    navRow: {
      paddingHorizontal: spacing.lg,
      gap: 8,
      paddingBottom: spacing.sm,
      alignItems: 'center',
    },
    navChip: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      backgroundColor: cardBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      minHeight: 40,
    },
    navChipOn: {
      backgroundColor: accentSoft,
      borderColor: `${colors.electricBright}55`,
    },
    navChipText: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    navChipTextOn: { color: colors.electricBright },
    navBadge: {
      position: 'absolute',
      top: -4,
      left: -4,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    navBadgeOn: { backgroundColor: colors.electricBright },
    navBadgeText: { ...typography.badge, fontFamily: OFFICIAL_APP_FONT, color: '#fff' },
    navBadgeTextOn: { color: '#fff' },
    scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xxxl },
    statsGrid: {
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: spacing.md,
    },
    statCard: {
      width: '23.5%',
      flexGrow: 0,
      flexShrink: 0,
      backgroundColor: cardBg,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 78,
    },
    statValue: {
      ...typography.valueLarge,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: 18,
      lineHeight: 24,
      color: colors.textPrimary,
      textAlign: 'center',
      includeFontPadding: false,
    },
    statValueAccent: {
      color: colors.electricBright,
    },
    statLabel: {
      ...typography.micro,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      marginTop: 4,
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    actionCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      marginBottom: spacing.lg,
      alignItems: 'center',
    },
    actionCardTitle: {
      ...typography.bodyStrong,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
      marginBottom: spacing.sm,
    },
    actionCardEmpty: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    actionList: {
      width: '100%',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    sectionTitle: {
      ...typography.bodyStrong,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    pageTitle: {
      ...typography.h3,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    emptyInline: {
      ...typography.caption,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      marginBottom: spacing.lg,
    },
    emptyTitle: {
      ...typography.h3,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
    },
    emptySub: {
      ...typography.body,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
    },
    emptyBox: { alignItems: 'center', paddingVertical: 48, gap: 8 },
    slotRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 12,
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    slotCount: { ...typography.value, color: colors.electric, width: 36, textAlign: 'center' },
    slotLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    slotSub: {
      ...typography.micro,
      color: colors.textMuted,
    },
    stockRow: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
    },
    stockDot: { width: 8, height: 8, borderRadius: 4 },
    stockLow: { backgroundColor: colors.amber },
    stockOut: { backgroundColor: colors.danger },
    stockName: {
      ...typography.caption,
      color: colors.textPrimary,
    },
    stockLabel: {
      ...typography.micro,
      color: colors.textMuted,
      writingDirection: 'rtl',
    },
    search: {
      backgroundColor: softBg,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      writingDirection: 'rtl',
    },
    filterRowWrap: {
      marginBottom: spacing.md,
    },
    tabHeader: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    addBtn: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.electric,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      flexShrink: 0,
    },
    addBtnText: {
      ...typography.micro,
      color: '#fff',
      fontWeight: '600',
      writingDirection: 'rtl',
    },
    productCard: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    productImg: { width: 56, height: 56, borderRadius: 10, backgroundColor: softBg },
    productImgEmpty: { alignItems: 'center', justifyContent: 'center' },
    productName: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '600',
    },
    productMeta: {
      ...typography.micro,
      color: colors.textMuted,
      marginTop: 2,
    },
    productFooter: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 8,
      marginTop: 6,
      justifyContent: 'flex-end',
    },
    productPrice: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
    stockPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
    stockOkBg: { backgroundColor: `${colors.electric}22` },
    stockLowBg: { backgroundColor: `${colors.amber}22` },
    stockOutBg: { backgroundColor: `${colors.danger}22` },
    stockPillText: { ...typography.micro, color: colors.textPrimary, fontWeight: '600' },
    rowActions: { gap: 6 },
    storyType: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: 10,
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: spacing.md,
      marginBottom: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    storyTypeLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    infoCard: {
      backgroundColor: cardBg,
      borderRadius: 14,
      padding: spacing.lg,
      marginBottom: spacing.md,
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    infoName: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    infoBio: {
      ...typography.body,
      color: colors.textSecondary,
    },
    infoRow: {
      ...typography.caption,
      color: colors.textMuted,
    },
    primaryBtn: {
      backgroundColor: colors.electric,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    primaryBtnText: { ...typography.bodyStrong, color: '#fff', textAlign: 'center' },
    secondaryBtn: {
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: border,
      backgroundColor: cardBg,
    },
    secondaryBtnText: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '600',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    dangerBtn: {
      flex: 1,
      backgroundColor: colors.danger,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    sheetBackdrop: {
      flex: 1,
      backgroundColor: scheme === 'light' ? 'rgba(245,247,249,0.72)' : 'rgba(11,22,34,0.72)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '92%',
      backgroundColor: cardBg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: spacing.lg },
    modalCard: {
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: spacing.lg,
      gap: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    modalTitle: {
      ...typography.h3,
      color: colors.textPrimary,
    },
    modalSub: {
      ...typography.caption,
      color: colors.textMuted,
      marginBottom: 8,
    },
    reasonChip: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: softBg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
    },
    reasonChipOn: { borderColor: colors.danger, backgroundColor: `${colors.danger}14` },
    reasonText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    reasonTextOn: { color: colors.danger, fontWeight: '600' },
    modalActions: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 8,
    },
  });
}
