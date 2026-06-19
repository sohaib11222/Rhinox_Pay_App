import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { defaultTabBarStyle } from '../../../navigation/tabBarConfig';
import { useGetRewardsHistory } from '../../../queries/rewards.queries';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface RewardHistoryItem {
  id: string;
  title: string;
  tier: string;
  status: 'Successful' | 'Pending' | 'Failed';
  value: string;
  expiryDate: string | null;
  date: string;
}

const RewardsHistory = () => {
  const navigation = useNavigation();
  const { data: historyResponse, isLoading, isError, error, refetch } = useGetRewardsHistory();
  const historyData = historyResponse?.data || [];

  // Hide bottom tab bar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: defaultTabBarStyle,
          });
        }
      };
    }, [navigation])
  );

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    await refetch();
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 500,
  });

  const getStatusColor = (status: RewardHistoryItem['status']) => {
    if (status === 'Successful') return '#4CAF50';
    if (status === 'Pending') return '#FFA500';
    return '#FF0000';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A9EF45"
            colors={['#A9EF45']}
            progressBackgroundColor="#020c19"
          />
        }
      >
        {/* Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>Rewards History</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* History Content */}
        <View style={styles.historyContent}>
          {isLoading ? (
            <ActivityIndicator size="large" color="#A9EF45" style={{ marginTop: 40 }} />
          ) : isError ? (
            <ThemedText style={styles.emptyText}>
              {error?.message || 'Failed to load rewards history'}
            </ThemedText>
          ) : historyData.length === 0 ? (
            <ThemedText style={styles.emptyText}>No reward claims yet.</ThemedText>
          ) : (
            historyData.map((group, groupIndex) => (
              <View key={`${group.date}-${groupIndex}`} style={styles.historyGroup}>
                <ThemedText style={styles.dateHeader}>{group.date}</ThemedText>
                {group.items.map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.historyIconContainer}>
                      <MaterialCommunityIcons name="gift" size={22} color="#4CAF50" />
                    </View>
                    <View style={styles.historyContentContainer}>
                      <ThemedText style={styles.historyTitle}>
                        {item.title} - {item.tier}
                      </ThemedText>
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: getStatusColor(item.status) },
                          ]}
                        />
                        <ThemedText
                          style={[styles.statusText, { color: getStatusColor(item.status) }]}
                        >
                          {item.status}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.historyValueContainer}>
                      <ThemedText style={styles.historyValue}>{item.value}</ThemedText>
                      {item.expiryDate ? (
                        <ThemedText style={styles.historyExpiry}>{item.expiryDate}</ThemedText>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  scrollContent: {
    paddingBottom: 100 * SCALE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 20 * SCALE,
    paddingBottom: 16 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40 * SCALE,
  },
  historyContent: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
  },
  historyGroup: {
    marginBottom: 24 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 12 * SCALE,
    padding: 15 * SCALE,
    borderWidth: 0.5,
    borderColor: '#FFFFFF33',
  },
  dateHeader: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12 * SCALE,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 12 * SCALE,
    padding: 12 * SCALE,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12 * SCALE,
  },
  historyIconContainer: {
    width: 50 * SCALE,
    height: 50 * SCALE,
    alignItems: 'center',
    backgroundColor: '#A7FF281A',
    borderRadius: 100 * SCALE,
    justifyContent: 'center',
    marginRight: 14 * SCALE,
  },
  historyContentContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 10 * SCALE,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * SCALE,
  },
  statusDot: {
    width: 8 * SCALE,
    height: 8 * SCALE,
    borderRadius: 4 * SCALE,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 8 * 1,
    fontWeight: '500',
    color: '#4CAF50',
  },
  historyValueContainer: {
    alignItems: 'flex-end',
  },
  historyValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 6 * SCALE,
  },
  historyExpiry: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 40 * SCALE,
    fontSize: 14 * SCALE,
  },
  bottomSpacer: {
    height: 40 * SCALE,
  },
});

export default RewardsHistory;

