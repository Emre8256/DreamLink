import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EdgeToEdgeLayout } from '../components/EdgeToEdgeLayout';
import {
  formatRelativeTime,
  getNotifications,
  markAllNotificationsRead,
  NotificationResponse,
  NotificationType,
} from '../services/api';

const TYPE_TO_ICON: Record<NotificationType, React.ComponentProps<typeof Ionicons>['name']> = {
  LIKE: 'heart-outline',
  COMMENT: 'chatbubble-outline',
  MATCH_FOUND: 'sparkles-outline',
  SYSTEM: 'information-circle-outline',
  FOLLOW: 'person-add-outline',
};

const TYPE_TO_COLOR: Record<NotificationType, string> = {
  LIKE: '#FF6B6B',
  COMMENT: '#7E6BFF',
  MATCH_FOUND: '#7E6BFF',
  SYSTEM: '#8A8CA8',
  FOLLOW: '#4BB543',
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await getNotifications();
      setItems(data);
    } catch (err) {
      console.error('Notifications load error:', err);
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkAllRead = async () => {
    try {
      setError(null);
      await markAllNotificationsRead();
      setItems(prev => prev.map(item => ({ ...item, isRead: true })));
    } catch (err) {
      console.error('Mark all read error:', err);
      setError('Failed to mark all as read.');
    }
  };

  if (loading) {
    return (
      <EdgeToEdgeLayout backgroundColor="#F9FAFF" statusBarStyle="dark-content" statusBarBg="#F9FAFF">
        <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#7E6BFF" />
        </View>
      </EdgeToEdgeLayout>
    );
  }

  return (
    <EdgeToEdgeLayout backgroundColor="#F9FAFF" statusBarStyle="dark-content" statusBarBg="#F9FAFF">
      <View style={styles.root}> 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color="#2D2D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleMarkAllRead} style={styles.headerButton}>
          <Ionicons name="checkmark-done-outline" size={22} color="#7E6BFF" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, item.isRead && styles.cardRead]}>
            <View style={[styles.iconWrap, { backgroundColor: `${TYPE_TO_COLOR[item.type]}18` }]}>
              <Ionicons
                name={TYPE_TO_ICON[item.type]}
                size={18}
                color={TYPE_TO_COLOR[item.type]}
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardMessage, item.isRead && styles.cardMessageRead]}>{item.message}</Text>
              <Text style={styles.cardTime}>{formatRelativeTime(item.createdAt)}</Text>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={40} color="#C1C8FF" />
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>New notifications will appear here.</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor="#7E6BFF"
          />
        }
      />
      </View>
    </EdgeToEdgeLayout>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F9FAFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEF0FF',
    shadowColor: '#7E6BFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardRead: {
    backgroundColor: '#F8F9FF',
    borderColor: '#F0F1FA',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7E6BFF',
    marginLeft: 8,
    alignSelf: 'center',
    flexShrink: 0,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardMessage: {
    fontSize: 14,
    color: '#2D2D3A',
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMessageRead: {
    color: '#6B6E85',
    fontWeight: '500',
  },
  cardTime: {
    fontSize: 12,
    color: '#8A8CA8',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D3A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#8A8CA8',
    marginTop: 6,
  },
  errorBanner: {
    backgroundColor: '#FFECEC',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#B00020',
    fontSize: 13,
    marginBottom: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#7E6BFF',
    fontWeight: '700',
    fontSize: 12,
  },
});
