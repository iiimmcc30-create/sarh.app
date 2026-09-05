// Powered by OnSpace.AI
// SAFAT — Butcher Chat Screen (محادثة مع الجزار)
import { AppIcon } from '@/components/ui/FlaticonIcon';

import { Image, uriSource } from '@/components/ui/AppImage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { sarhListingShareUrl } from '@/constants/sarhOfficial';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlBackIcon } from '@/lib/rtl';
import { UserProfileLink } from '@/components/feature/UserProfileLink';
import { StoryVideoPlayer } from '@/components/feature/StoryVideoPlayer';
import { ChatMessage, ButcherProfile } from '@/services/butcherData';
import { API_BASE } from '@/services/api';
import { resolveMediaUrl } from '@/services/media';
import { uploadMediaFromUri } from '@/services/upload';
import { useEffect } from 'react';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { fetchButcherChatAccess } from '@/services/butcherChat';
import { fetchUserProfile } from '@/services/users';
import { applyChatSocketEvent, mergeChatMessages } from '@/lib/chatRealtime';
import { useChatThreadSocket } from '@/hooks/useChatThreadSocket';
import {
  formatListingPrice,
  getMessageListingContext,
  saveMessageListingContext,
} from '@/lib/messageListingContext';
import {
  formatOfferMessage,
  parseOfferMessage,
} from '@/lib/messageOffers';
import * as Location from 'expo-location';

function mapApiMessage(m: {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  isRead?: boolean;
}): ChatMessage {
  return {
    id: m.id,
    senderId: m.senderId,
    receiverId: m.receiverId,
    text: m.text ?? undefined,
    image: resolveMediaUrl(m.imageUrl) ?? undefined,
    video: resolveMediaUrl(m.videoUrl) ?? undefined,
    createdAt: m.createdAt,
    read: !!m.isRead,
  };
}

const QUICK_REPLIES_BUTCHER = [
  'هل متوفر الخروف الكامل؟',
  'ما هو السعر لكيلو الضأن؟',
  'متى تفتحون غداً؟',
  'هل تتوفر لحوم طازجة اليوم؟',
  'أريد طلب ذبيحة كاملة',
];

const QUICK_REPLIES_LIVESTOCK = [
  'هل الحيوان ما زال متاحاً؟',
  'ما هو السعر النهائي؟',
  'هل يمكن المعاينة قبل الشراء؟',
  'أين موقع الاستلام؟',
  'هل تقبل التفاوض على السعر؟',
];

type PeerAccountType = 'USER' | 'BUTCHER' | 'LIVESTOCK_TRADER';
type ChatUiKind = 'direct' | 'butcher' | 'livestock';

function resolveChatUiKind(params: {
  threadType?: string;
  butcherId?: string | null;
  accountType?: string;
}): ChatUiKind {
  if (
    params.threadType === 'BUTCHER' ||
    params.butcherId ||
    params.accountType === 'BUTCHER'
  ) {
    return 'butcher';
  }
  if (params.accountType === 'LIVESTOCK_TRADER') {
    return 'livestock';
  }
  return 'direct';
}

export default function ButcherChatScreen() {
  const {
    butcherId,
    threadId: threadIdParam,
    receiverId,
    receiverName,
    receiverAvatar,
    threadType: threadTypeParam,
    accountType: accountTypeParam,
    draftMessage: draftMessageParam,
    orderId: orderIdParam,
    listingId: listingIdParam,
    listingTitle: listingTitleParam,
    listingPrice: listingPriceParam,
    listingCurrency: listingCurrencyParam,
    listingImage: listingImageParam,
    listingLocation: listingLocationParam,
  } = useLocalSearchParams<{
    butcherId?: string;
    threadId?: string;
    receiverId?: string;
    receiverName?: string;
    receiverAvatar?: string;
    threadType?: string;
    accountType?: string;
    draftMessage?: string;
    orderId?: string;
    listingId?: string;
    listingTitle?: string;
    listingPrice?: string;
    listingCurrency?: string;
    listingImage?: string;
    listingLocation?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const messageStyles = useThemedStyles(({ colors }) => createMessageStyles(colors));
  const { me } = useApp();
  const { accessToken } = useAuth();
  const MY_ID = me?.id || 'anonymous';
  const listRef = useRef<FlatList>(null);

  const isThreadMode = Boolean(threadIdParam && receiverId);
  /** User↔user DM (no shop context). */
  const isDirectMode = Boolean(
    receiverId && !butcherId && !threadIdParam && threadTypeParam !== 'BUTCHER',
  );
  /** Shop chat starting with known counterparty (customer or owner). */
  const isButcherPeerMode = Boolean(receiverId && (butcherId || threadTypeParam === 'BUTCHER') && !threadIdParam);

  const [butcher, setButcher] = useState<ButcherProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [threadId, setThreadId] = useState<string | null>(threadIdParam ?? null);
  const [resolvedButcherId, setResolvedButcherId] = useState<string | null>(
    butcherId ?? null,
  );
  const [peerAccountType, setPeerAccountType] = useState<PeerAccountType | null>(
    accountTypeParam === 'BUTCHER' ||
      accountTypeParam === 'LIVESTOCK_TRADER' ||
      accountTypeParam === 'USER'
      ? accountTypeParam
      : null,
  );
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatAccessChecked, setChatAccessChecked] = useState(false);
  const [resolvedOrderId, setResolvedOrderId] = useState<string | null>(
    orderIdParam ?? null,
  );
  const [attachOpen, setAttachOpen] = useState(false);
  const [listingContext, setListingContext] = useState<{
    listingId: string;
    title: string;
    price: number;
    currency: string;
    image?: string;
    location?: string;
  } | null>(
    listingIdParam && listingTitleParam
      ? {
          listingId: listingIdParam,
          title: listingTitleParam,
          price: Number(listingPriceParam) || 0,
          currency: listingCurrencyParam || 'SAR',
          image: listingImageParam || undefined,
          location: listingLocationParam || undefined,
        }
      : null,
  );

  useEffect(() => {
    if (typeof draftMessageParam === 'string' && draftMessageParam.trim()) {
      setInputText(draftMessageParam.trim());
    }
  }, [draftMessageParam]);

  useEffect(() => {
    if (listingContext || !receiverId) return;
    void getMessageListingContext(receiverId).then((cached) => {
      if (!cached) return;
      setListingContext({
        listingId: cached.listingId,
        title: cached.title,
        price: cached.price,
        currency: cached.currency || 'SAR',
        image: cached.image,
        location: cached.location,
      });
    });
  }, [listingContext, receiverId]);

  useEffect(() => {
    if (!listingContext || !receiverId) return;
    void saveMessageListingContext({
      ...listingContext,
      peerUserId: receiverId,
    });
  }, [listingContext, receiverId]);

  const receiverUserId = receiverId || butcher?.user?.id;
  const effectiveButcherId = butcherId || resolvedButcherId;
  const activeChatType: 'DIRECT' | 'BUTCHER' =
    threadTypeParam === 'BUTCHER' || Boolean(effectiveButcherId) ? 'BUTCHER' : 'DIRECT';
  const chatUiKind = resolveChatUiKind({
    threadType: threadTypeParam,
    butcherId: effectiveButcherId,
    accountType: peerAccountType ?? accountTypeParam,
  });
  const quickReplies =
    chatUiKind === 'butcher'
      ? QUICK_REPLIES_BUTCHER
      : chatUiKind === 'livestock'
        ? QUICK_REPLIES_LIVESTOCK
        : [];
  const headerName =
    isThreadMode || isDirectMode || isButcherPeerMode
      ? (receiverName || 'محادثة')
      : (butcher?.nameAr ?? 'الملحمة');
  const headerAvatar =
    isThreadMode || isDirectMode || isButcherPeerMode
      ? (receiverAvatar || undefined)
      : (butcher?.logo ?? undefined);

  useEffect(() => {
    if (!isThreadMode && !butcherId && !isDirectMode && !isButcherPeerMode) {
      Alert.alert('خطأ', 'لم يتم تحديد المحادثة المطلوبة.');
      router.back();
    }
  }, [isThreadMode, butcherId, isDirectMode, isButcherPeerMode, router]);

  // Resolve peer account type for role-based chat UI (user / butcher / livestock trader)
  useEffect(() => {
    if (threadTypeParam === 'BUTCHER' || butcherId) {
      setPeerAccountType('BUTCHER');
      return;
    }
    if (
      accountTypeParam === 'BUTCHER' ||
      accountTypeParam === 'LIVESTOCK_TRADER' ||
      accountTypeParam === 'USER'
    ) {
      setPeerAccountType(accountTypeParam);
      if (accountTypeParam !== 'USER') return;
    }
    if (!receiverId || activeChatType === 'BUTCHER') return;

    let cancelled = false;
    fetchUserProfile(receiverId).then((profile) => {
      if (cancelled || !profile) return;
      const next =
        profile.accountType ??
        (profile.role === 'BUTCHER'
          ? 'BUTCHER'
          : profile.listingsCount > 0
            ? 'LIVESTOCK_TRADER'
            : 'USER');
      setPeerAccountType(next);
    });
    return () => {
      cancelled = true;
    };
  }, [receiverId, threadTypeParam, butcherId, accountTypeParam, activeChatType]);

  useEffect(() => {
    if (isThreadMode || isDirectMode || isButcherPeerMode) {
      setChatAccessChecked(true);
      return;
    }
    if (!butcherId || !accessToken) return;

    let cancelled = false;
    void (async () => {
      try {
        const access = await fetchButcherChatAccess(butcherId, accessToken);
        if (cancelled) return;
        if (!access.allowed) {
          Alert.alert(
            'المحادثة غير متاحة',
            access.messageAr ??
              'المحادثة متاحة بعد تقديم الطلب وقبوله من الملحمة',
            [{ text: 'حسناً', onPress: () => router.back() }],
          );
          return;
        }
        if (access.orderId) setResolvedOrderId(access.orderId);
        setChatAccessChecked(true);
      } catch {
        if (!cancelled) {
          Alert.alert(
            'المحادثة غير متاحة',
            'تعذر التحقق من إمكانية المحادثة',
            [{ text: 'حسناً', onPress: () => router.back() }],
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    butcherId,
    accessToken,
    isThreadMode,
    isDirectMode,
    isButcherPeerMode,
    receiverId,
    router,
  ]);

  useEffect(() => {
    if (isThreadMode || isDirectMode || isButcherPeerMode) return;
    if (!butcherId) return;
    if (!chatAccessChecked) return;
    const fetchButcher = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/butchers/${butcherId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setButcher(json.data);
          }
        }
      } catch (err) {
        console.warn('[ButcherChatScreen] Failed to fetch butcher details:', err);
      }
    };
    fetchButcher();
  }, [butcherId, isThreadMode, isDirectMode, isButcherPeerMode, chatAccessChecked, router]);

  useEffect(() => {
    if (!accessToken) return;
    if (!chatAccessChecked && !isThreadMode && !isDirectMode && !isButcherPeerMode && butcherId) {
      return;
    }
    if (isThreadMode && threadIdParam) {
      const loadThreadMessages = async () => {
        setLoadingMessages(true);
        try {
          setThreadId(threadIdParam);
          const msgRes = await fetch(`${API_BASE}/api/messages/${threadIdParam}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (msgRes.ok) {
            const msgJson = await msgRes.json();
            if (msgJson.success && msgJson.data?.messages) {
              setMessages(msgJson.data.messages.map(mapApiMessage));
            }
            if (msgJson.data?.butcherId) {
              setResolvedButcherId(msgJson.data.butcherId);
            }
          }
        } catch (err) {
          console.warn('[ButcherChatScreen] Failed to load thread messages:', err);
        } finally {
          setLoadingMessages(false);
        }
      };
      loadThreadMessages();
      return;
    }

    if (isDirectMode && receiverId) {
      const loadDirectMessages = async () => {
        setLoadingMessages(true);
        try {
          const threadsRes = await fetch(`${API_BASE}/api/messages?type=DIRECT`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (threadsRes.ok) {
            const tJson = await threadsRes.json();
            if (tJson.success && Array.isArray(tJson.data)) {
              const existingThread = tJson.data.find(
                (t: any) => t.participant?.id === receiverId
              );
              if (existingThread) {
                setThreadId(existingThread.id);
                const msgRes = await fetch(`${API_BASE}/api/messages/${existingThread.id}`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (msgRes.ok) {
                  const msgJson = await msgRes.json();
                  if (msgJson.success && msgJson.data?.messages) {
                    setMessages(msgJson.data.messages.map(mapApiMessage));
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('[ButcherChatScreen] Failed to load direct messages:', err);
        } finally {
          setLoadingMessages(false);
        }
      };
      loadDirectMessages();
      return;
    }

    if (isButcherPeerMode && receiverId) {
      const loadButcherPeerMessages = async () => {
        setLoadingMessages(true);
        try {
          const threadsRes = await fetch(`${API_BASE}/api/messages?type=BUTCHER`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (threadsRes.ok) {
            const tJson = await threadsRes.json();
            if (tJson.success && Array.isArray(tJson.data)) {
              const existingThread = tJson.data.find(
                (t: any) =>
                  t.participant?.id === receiverId &&
                  (!butcherId || t.butcherId === butcherId),
              );
              if (existingThread) {
                setThreadId(existingThread.id);
                if (existingThread.butcherId) {
                  setResolvedButcherId(existingThread.butcherId);
                }
                const msgRes = await fetch(
                  `${API_BASE}/api/messages/${existingThread.id}`,
                  { headers: { Authorization: `Bearer ${accessToken}` } },
                );
                if (msgRes.ok) {
                  const msgJson = await msgRes.json();
                  if (msgJson.success && msgJson.data?.messages) {
                    setMessages(msgJson.data.messages.map(mapApiMessage));
                  }
                  if (msgJson.data?.butcherId) {
                    setResolvedButcherId(msgJson.data.butcherId);
                  }
                }
              }
            }
          }
        } catch (err) {
          console.warn('[ButcherChatScreen] Failed to load butcher peer messages:', err);
        } finally {
          setLoadingMessages(false);
        }
      };
      loadButcherPeerMessages();
      return;
    }

    if (!butcherId || !butcher?.user?.id) return;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        // Find or get existing butcher shop thread
        const threadsRes = await fetch(`${API_BASE}/api/messages?type=BUTCHER`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (threadsRes.ok) {
          const tJson = await threadsRes.json();
          if (tJson.success && Array.isArray(tJson.data)) {
            const existingThread = tJson.data.find(
              (t: any) =>
                t.butcherId === butcherId ||
                t.participant?.id === butcher.user?.id
            );
            if (existingThread) {
              setThreadId(existingThread.id);
              if (existingThread.butcherId) {
                setResolvedButcherId(existingThread.butcherId);
              }
              const msgRes = await fetch(`${API_BASE}/api/messages/${existingThread.id}`, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (msgRes.ok) {
                const msgJson = await msgRes.json();
                if (msgJson.success && msgJson.data?.messages) {
                  setMessages(msgJson.data.messages.map(mapApiMessage));
                }
                if (msgJson.data?.butcherId) {
                  setResolvedButcherId(msgJson.data.butcherId);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('[ButcherChatScreen] Failed to load messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    };
    loadMessages();
  }, [
    butcherId,
    butcher?.user?.id,
    accessToken,
    isThreadMode,
    isDirectMode,
    isButcherPeerMode,
    receiverId,
    threadIdParam,
    chatAccessChecked,
  ]);

  useChatThreadSocket(accessToken, threadId, (payload) => {
    if (!threadId) return;
    setMessages((prev) => applyChatSocketEvent(prev, payload, threadId));
  });

  const deliverMessage = async (
    text: string,
    media?: { imageUrl?: string; videoUrl?: string },
  ) => {
    const bodyText = text.trim();
    if ((!bodyText && !media?.imageUrl && !media?.videoUrl) || !receiverUserId) {
      return;
    }

    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      senderId: MY_ID,
      receiverId: receiverUserId,
      text: bodyText || undefined,
      image: media?.imageUrl,
      video: media?.videoUrl,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    if (bodyText) setInputText('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          receiverId: receiverUserId,
          type: activeChatType,
          ...(activeChatType === 'BUTCHER' && effectiveButcherId
            ? { butcherId: effectiveButcherId }
            : {}),
          ...(resolvedOrderId ? { orderId: resolvedOrderId } : {}),
          ...(bodyText ? { text: bodyText } : {}),
          ...(media?.imageUrl ? { imageUrl: media.imageUrl } : {}),
          ...(media?.videoUrl ? { videoUrl: media.videoUrl } : {}),
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.message) {
          const real = json.data.message;
          setMessages((prev) =>
            mergeChatMessages(
              prev.filter((m) => m.id !== optimisticMsg.id),
              mapApiMessage(real),
            ),
          );
          if (!threadId && json.data.threadId) setThreadId(json.data.threadId);
        }
      } else {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.messageAr || 'فشل إرسال الرسالة');
      }
    } catch (err) {
      console.warn('[ButcherChatScreen] Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      Alert.alert(
        'خطأ',
        err instanceof Error ? err.message : 'فشل إرسال الرسالة، يرجى المحاولة مجدداً.',
      );
    }
  };

  const sendMessage = async (
    text: string,
    media?: { imageUrl?: string; videoUrl?: string },
  ) => {
    if (chatUiKind === 'butcher') {
      Alert.alert('المحادثة', 'التواصل المباشر مع الملحمة غير متاح');
      return;
    }
    if (sending) return;
    setSending(true);
    try {
      await deliverMessage(text, media);
    } finally {
      setSending(false);
    }
  };

  const pickAndSendMedia = async (source: 'library' | 'camera' = 'library') => {
    if (!receiverUserId || !accessToken || sending) return;
    setAttachOpen(false);

    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('صلاحية مطلوبة', 'يجب السماح بالوصول للكاميرا.');
        return;
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('صلاحية مطلوبة', 'يجب السماح بالوصول للصور والفيديو لإرسال الوسائط.');
        return;
      }
    }

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.85,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            quality: 0.85,
            videoMaxDuration: 60,
          });
    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];
    const isVideo =
      asset.type === 'video' || (asset.mimeType?.startsWith('video/') ?? false);

    setSending(true);
    try {
      const url = await uploadMediaFromUri(
        accessToken,
        asset.uri,
        'messages',
        isVideo ? 'video' : 'image',
      );
      await deliverMessage('', isVideo ? { videoUrl: url } : { imageUrl: url });
    } catch (err) {
      console.warn('[ButcherChatScreen] Failed to upload media:', err);
      Alert.alert(
        'خطأ',
        err instanceof Error ? err.message : 'فشل رفع الملف، يرجى المحاولة مجدداً.',
      );
    } finally {
      setSending(false);
    }
  };

  const sendCurrentLocation = async () => {
    setAttachOpen(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('إذن الموقع', 'يرجى السماح بالوصول للموقع لمشاركته.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const lat = pos.coords.latitude.toFixed(5);
      const lng = pos.coords.longitude.toFixed(5);
      await sendMessage(`📍 موقعي: https://maps.google.com/?q=${lat},${lng}`);
    } catch {
      Alert.alert('خطأ', 'تعذّر الحصول على الموقع.');
    }
  };

  const sendPriceOffer = () => {
    setAttachOpen(false);
    if (Platform.OS === 'ios' && typeof Alert.prompt === 'function') {
      Alert.prompt(
        'إرسال عرض سعر',
        'أدخل المبلغ بالريال',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'إرسال',
            onPress: (value?: string) => {
              const amount = Number(String(value ?? '').replace(/[^\d.]/g, ''));
              if (!Number.isFinite(amount) || amount <= 0) {
                Alert.alert('تنبيه', 'أدخل مبلغاً صالحاً');
                return;
              }
              void sendMessage(formatOfferMessage(amount));
            },
          },
        ],
        'plain-text',
        '',
        'numeric',
      );
      return;
    }
    Alert.alert('إرسال عرض سعر', 'اختر مبلغاً سريعاً أو عدّل لاحقاً', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: '٢٬٠٠٠ ر.س',
        onPress: () => void sendMessage(formatOfferMessage(2000)),
      },
      {
        text: '٢٬٢٠٠ ر.س',
        onPress: () => void sendMessage(formatOfferMessage(2200)),
      },
      {
        text: '٢٬٥٠٠ ر.س',
        onPress: () => void sendMessage(formatOfferMessage(2500)),
      },
    ]);
  };

  const shareListingInChat = () => {
    setAttachOpen(false);
    if (!listingContext) {
      Alert.alert('مشاركة إعلان', 'لا يوجد إعلان مرتبط بهذه المحادثة.');
      return;
    }
    void sendMessage(
      `📦 إعلان: ${listingContext.title}\n${formatListingPrice(listingContext.price, listingContext.currency)}\n${sarhListingShareUrl(listingContext.listingId)}`,
    );
  };

  const respondToOffer = (accept: boolean) => {
    void sendMessage(accept ? 'أوافق على العرض' : 'أرفض العرض');
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === MY_ID;
    const offer = parseOfferMessage(item.text);
    const timeLabel = new Date(item.createdAt).toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    });

    if (offer) {
      return (
        <View
          style={[
            messageStyles.bubbleWrap,
            isMe ? messageStyles.bubbleWrapMe : messageStyles.bubbleWrapThem,
          ]}
        >
          <View style={[messageStyles.offerCard, isMe && messageStyles.offerCardMe]}>
            <Text style={messageStyles.offerLabel}>عرض سعر</Text>
            <Text style={messageStyles.offerAmount}>
              {offer.amount.toLocaleString('en-US')} {offer.currencyLabel}
            </Text>
            <Text style={messageStyles.offerStatus}>
              {isMe ? 'تم إرسال العرض' : 'عرض وارد'}
            </Text>
            {!isMe ? (
              <View style={messageStyles.offerActions}>
                <Pressable
                  style={messageStyles.offerAccept}
                  onPress={() => respondToOffer(true)}
                >
                  <Text style={messageStyles.offerAcceptText}>قبول</Text>
                </Pressable>
                <Pressable
                  style={messageStyles.offerReject}
                  onPress={() => respondToOffer(false)}
                >
                  <Text style={messageStyles.offerRejectText}>رفض</Text>
                </Pressable>
              </View>
            ) : null}
            <Text style={[messageStyles.timeText, messageStyles.timeTextThem]}>
              {timeLabel}
              {isMe ? (
                <Text style={{ color: item.read ? colors.electricBright : colors.textSubtle }}>
                  {' '}✓✓
                </Text>
              ) : null}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[messageStyles.bubbleWrap, isMe ? messageStyles.bubbleWrapMe : messageStyles.bubbleWrapThem]}>
        <View style={[messageStyles.bubble, isMe ? messageStyles.bubbleMe : messageStyles.bubbleThem]}>
          {item.text ? (
            <Text style={[messageStyles.bubbleText, isMe ? messageStyles.textMe : messageStyles.textThem]}>
              {item.text}
            </Text>
          ) : null}
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={messageStyles.bubbleImg}
              contentFit="cover"
            />
          ) : null}
          {item.video ? (
            <StoryVideoPlayer
              uri={item.video}
              style={messageStyles.bubbleVideo}
              muted={false}
              loop={false}
              autoPlay={false}
              nativeControls
            />
          ) : null}
          <Text style={[messageStyles.timeText, isMe ? messageStyles.timeTextMe : messageStyles.timeTextThem]}>
            {timeLabel}
            {isMe && (
              <Text style={{ color: item.read ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.55)' }}>
                {' '}✓✓
              </Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 12}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
          <UserProfileLink userId={receiverUserId} style={styles.headerCenter}>
            <Image source={uriSource(headerAvatar)} style={styles.headerAvatar} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerName} numberOfLines={1}>{headerName}</Text>
                {butcher?.subscriptionActive && (
                  <AppIcon name="shield-checkmark" size={14} color={colors.gold} />
                )}
              </View>
              <View style={styles.onlineRow}>
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor:
                        chatUiKind === 'butcher'
                          ? butcher?.workingHours?.isOpen
                            ? colors.success
                            : colors.textSubtle
                          : colors.success,
                    },
                  ]}
                />
                <Text style={styles.onlineText}>
                  {chatUiKind === 'butcher'
                    ? butcher?.workingHours?.isOpen
                      ? 'متصل الآن'
                      : 'غير متاح'
                    : 'متصل الآن'}
                </Text>
              </View>
            </View>
          </UserProfileLink>
          <Pressable style={styles.moreBtn} hitSlop={8}>
            <AppIcon name="ellipsis-vertical" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {listingContext ? (
          <View style={styles.listingCard}>
            <View style={styles.listingCardTop}>
              {listingContext.image ? (
                <Image
                  source={{ uri: listingContext.image }}
                  style={styles.listingCardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.listingCardImage, styles.listingCardImageFallback]}>
                  <AppIcon name="image-outline" size={18} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.listingCardMeta}>
                <Text style={styles.listingCardTitle} numberOfLines={1}>
                  {listingContext.title}
                </Text>
                <Text style={styles.listingCardPrice}>
                  {formatListingPrice(listingContext.price, listingContext.currency)}
                </Text>
                {listingContext.location ? (
                  <Text style={styles.listingCardLocation} numberOfLines={1}>
                    {listingContext.location}
                  </Text>
                ) : null}
              </View>
            </View>
            <Pressable
              style={styles.listingCardBtn}
              onPress={() =>
                router.push(`/listing/${listingContext.listingId}` as never)
              }
            >
              <Text style={styles.listingCardBtnText}>عرض الإعلان</Text>
              <AppIcon name={rtlBackIcon()} size={16} color={colors.electricBright} />
            </Pressable>
          </View>
        ) : chatUiKind === 'butcher' ? (
          <View style={styles.orderStrip}>
            <AppIcon name="clipboard-list-outline" size={16} color={colors.glow} />
            <Text style={styles.orderStripText}>
              التواصل المباشر مع الملحمة غير متاح
            </Text>
          </View>
        ) : null}

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            messages.length > 0 ? (
              <View style={styles.datePillWrap}>
                <Text style={styles.datePill}>اليوم</Text>
              </View>
            ) : null
          }
        />

        {chatUiKind !== 'butcher' && quickReplies.length > 0 && !attachOpen ? (
          <View style={styles.quickRepliesWrap}>
            <FlatList
              horizontal
              data={quickReplies}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => sendMessage(item)}
                  style={styles.quickReply}
                >
                  <Text style={styles.quickReplyText}>{item}</Text>
                </Pressable>
              )}
              contentContainerStyle={styles.quickRepliesRow}
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : null}

        {chatUiKind !== 'butcher' && attachOpen ? (
          <View style={styles.attachSheet}>
            {(
              [
                { key: 'image', label: 'صورة', icon: 'image-outline', onPress: () => void pickAndSendMedia('library') },
                { key: 'camera', label: 'كاميرا', icon: 'camera-outline', onPress: () => void pickAndSendMedia('camera') },
                { key: 'location', label: 'موقع', icon: 'location-outline', onPress: () => void sendCurrentLocation() },
                { key: 'offer', label: 'إرسال عرض', icon: 'pricetag-outline', onPress: sendPriceOffer },
                { key: 'share', label: 'مشاركة إعلان', icon: 'share-outline', onPress: shareListingInChat },
              ] as const
            ).map((action) => (
              <Pressable key={action.key} style={styles.attachAction} onPress={action.onPress}>
                <View style={styles.attachActionIcon}>
                  <AppIcon name={action.icon} size={20} color={colors.textPrimary} />
                </View>
                <Text style={styles.attachActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {chatUiKind === 'butcher' ? (
          <View
            style={[
              styles.inputBar,
              { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm },
            ]}
          >
            <Text style={{ flex: 1,  color: colors.textMuted }}>
              التواصل المباشر مع الملحمة غير متاح
            </Text>
          </View>
        ) : (
        <View
          style={[
            styles.inputBar,
            { paddingBottom: Math.max(insets.bottom, spacing.sm) + spacing.sm },
          ]}
        >
          <Pressable
            style={[styles.attachBtn, sending && { opacity: 0.4 }]}
            onPress={() => setAttachOpen((v) => !v)}
            disabled={sending}
          >
            <AppIcon
              name={attachOpen ? 'close' : 'add'}
              size={22}
              color={colors.textPrimary}
            />
          </Pressable>

          <TextInput
            style={styles.input}
            placeholder="اكتب رسالة..."
            placeholderTextColor={colors.textSubtle}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            textAlign="right"
            onFocus={() => setAttachOpen(false)}
          />

          <Pressable
            style={[
              styles.sendBtn,
              !inputText.trim() && !sending ? styles.sendBtnIdle : null,
            ]}
            onPress={() => {
              if (inputText.trim()) void sendMessage(inputText);
            }}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <AppIcon
                name={inputText.trim() ? 'paper-plane' : 'mic'}
                size={18}
                color="#fff"
              />
            )}
          </Pressable>
        </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.screenRoot },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
    gap: spacing.sm,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: colors.bgSurface,
    borderWidth: 1, borderColor: colors.borderSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: 0,
  },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.borderMid,
  },
  headerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  headerName: { ...butcherTypography.primary, color: colors.textPrimary, flexShrink: 1 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4 },
  onlineText: { ...butcherTypography.meta, color: colors.textMuted },
  moreBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  listingCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: spacing.sm,
  },
  listingCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  listingCardImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
  },
  listingCardImageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingCardMeta: { flex: 1, minWidth: 0 },
  listingCardTitle: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
      },
  listingCardPrice: {
    ...typography.caption,
    color: colors.electricBright,
    marginTop: 2,
        fontWeight: '600',
  },
  listingCardLocation: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: 2,
      },
  listingCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: 'rgba(32, 182, 111, 0.12)',
  },
  listingCardBtnText: {
    ...typography.caption,
    color: colors.electricBright,
    fontWeight: '600',
  },

  orderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
  },
  orderStripText: { ...butcherTypography.secondary, color: colors.textMuted, flex: 1,  },

  messagesList: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  datePillWrap: { alignItems: 'center', marginBottom: spacing.md },
  datePill: {
    ...typography.micro,
    color: colors.textMuted,
    backgroundColor: colors.bgSurface,
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },

  quickRepliesWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
  },
  quickRepliesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  quickReply: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderMid,
  },
  quickReplyText: { ...butcherTypography.secondary, color: colors.textBrand },

  attachSheet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.bgPrimary,
  },
  attachAction: {
    width: '18%',
    alignItems: 'center',
    gap: 6,
  },
  attachActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  attachActionLabel: {
    ...typography.micro,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.bgSurface,
  },
  attachBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    ...butcherTypography.body,
    color: colors.textPrimary,
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.electricBright,
  },
  sendBtnIdle: {
    backgroundColor: colors.emerald,
  },
  });
}

function createMessageStyles(colors: ThemeColors) {
  return StyleSheet.create({
  bubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
    gap: 8,
  },
  bubbleWrapMe: { justifyContent: 'flex-start' },
  bubbleWrapThem: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  bubbleMe: {
    backgroundColor: colors.electricBright,
    borderBottomLeftRadius: 6,
  },
  bubbleThem: {
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderBottomRightRadius: 6,
  },
  bubbleText: { ...butcherTypography.body, lineHeight: 22 },
  textMe: { color: '#fff' },
  textThem: { color: colors.textPrimary },
  bubbleImg: {
    width: 200, height: 150,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  bubbleVideo: {
    width: 220,
    height: 160,
    borderRadius: radius.md,
    marginBottom: 4,
    overflow: 'hidden',
  },
  timeText: { ...butcherTypography.meta, marginTop: 4 },
  timeTextMe: { color: 'rgba(255,255,255,0.7)', textAlign: 'left' },
  timeTextThem: { color: colors.textSubtle,  },
  offerCard: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: spacing.md,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    gap: 4,
  },
  offerCardMe: {
    borderColor: 'rgba(32, 182, 111, 0.35)',
  },
  offerLabel: {
    ...typography.caption,
    color: colors.textMuted,
      },
  offerAmount: {
    ...typography.h3,
    color: colors.electricBright,
      },
  offerStatus: {
    ...typography.micro,
    color: colors.textSecondary,
        marginBottom: 4,
  },
  offerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  offerAccept: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.electricBright,
  },
  offerAcceptText: { ...typography.caption, color: '#fff', fontWeight: '700' },
  offerReject: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  offerRejectText: { ...typography.caption, color: colors.textSecondary, fontWeight: '600' },
  });
}
