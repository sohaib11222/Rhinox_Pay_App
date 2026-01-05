import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface RewardHistoryItem {
  id: string;
  title: string;
  tier: string;
  status: 'Successful' | 'Pending' | 'Failed';
  value: string;
  expiryDate: string;
  date: string;
}

interface RewardHistoryGroup {
  date: string;
  items: RewardHistoryItem[];
}

const RewardsHistory = () => {
  const navigation = useNavigation();

  // Mock history data - Replace with API call
  const historyData: RewardHistoryGroup[] = [
    {
      date: 'Today',
      items: [
        {
          id: '1',
          title: 'Birthday Gift',
          tier: 'Silver tier',
          status: 'Successful',
          value: '1GB Data',
          expiryDate: 'Oct 15, 2025',
          date: 'Today',
        },
      ],
    },
    {
      date: '11th Oct, 2024',
      items: [
        {
          id: '2',
          title: 'Birthday Gift',
          tier: 'Gold tier',
          status: 'Successful',
          value: 'N1,000 Airtime',
          expiryDate: 'Oct 15, 2025',
          date: '11th Oct, 2024',
        },
      ],
    },
  ];

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
        // Restore tab bar when leaving this screen
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderTopWidth: 0,
              height: 75 * 0.8,
              paddingBottom: 10,
              paddingTop: 0,
              position: 'absolute',
              bottom: 26 * 0.8,
              borderRadius: 100,
              overflow: 'hidden',
              elevation: 0,
              width: SCREEN_WIDTH * 0.86,
              marginLeft: 30,
              shadowOpacity: 0,
            },
          });
        }
      };
    }, [navigation])
  );

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    // TODO: Replace with actual API calls
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Refreshing rewards history...');
        resolve();
      }, 1000);
    });
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const formatDate = (dateString: string) => {
    // If it's "Today", return as is, otherwise format the date
    if (dateString === 'Today') {
      return 'Today';
    }
    return dateString;
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
          {historyData.map((group, groupIndex) => (
            <View key={groupIndex} style={styles.historyGroup}>
              <ThemedText style={styles.dateHeader}>{formatDate(group.date)}</ThemedText>
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
                      <View style={styles.statusDot} />
                      <ThemedText style={styles.statusText}>{item.status}</ThemedText>
                    </View>
                  </View>
                  <View style={styles.historyValueContainer}>
                    <ThemedText style={styles.historyValue}>{item.value}</ThemedText>
                    <ThemedText style={styles.historyExpiry}>{item.expiryDate}</ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ))}
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
  bottomSpacer: {
    height: 40 * SCALE,
  },
});

export default RewardsHistory;

