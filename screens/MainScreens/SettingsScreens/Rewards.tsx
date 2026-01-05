import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
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

interface RewardItem {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const Rewards = () => {
  const navigation = useNavigation();

  // Mock user data - Replace with API call
  const userData = {
    name: 'Qamardeen Abdul Malik',
    avatar: require('../../../assets/login/memoji.png'),
    isVerified: true,
  };

  // Mock tier data - Replace with API call
  const tierData = {
    currentTier: 'BRONZE',
    progressToNext: 0.6, // 60% progress
    criteria: [
      {
        id: 'transactions',
        label: 'Complete 10 transactions to upgrade',
        current: 9,
        target: 10,
      },
      {
        id: 'balance',
        label: 'Hold a minimum of $1,000/Month',
        current: 800,
        target: 1000,
      },
    ],
  };

  // Mock rewards data - Replace with API call
  const rewards: RewardItem[] = [
    {
      id: '1',
      title: 'Birthday Gift',
      description: 'Get a special gift on your birthday',
      icon: require('../../../assets/shield-tick.png'), // Using shield as placeholder for gift icon
    },
    {
      id: '2',
      title: 'Birthday Gift',
      description: 'Get a special gift on your birthday',
      icon: require('../../../assets/shield-tick.png'),
    },
    {
      id: '3',
      title: 'Birthday Gift',
      description: 'Get a special gift on your birthday',
      icon: require('../../../assets/shield-tick.png'),
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

  const handleHistoryPress = () => {
    (navigation as any).navigate('Settings', {
      screen: 'RewardsHistory',
    });
  };

  const handleClaimPress = (rewardId: string) => {
    // Navigate to Claim Reward screen
    (navigation as any).navigate('Settings', {
      screen: 'ClaimReward',
    });
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    // TODO: Replace with actual API calls
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log('Refreshing rewards data...');
        resolve();
      }, 1000);
    });
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  const calculateProgress = (current: number, target: number) => {
    return Math.min(current / target, 1);
  };

  const getRemainingAmount = (current: number, target: number) => {
    const remaining = target - current;
    return remaining > 0 ? `$${remaining} more` : 'Completed';
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
          <ThemedText style={styles.headerTitle}>Rewards</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        {/* User Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={userData.avatar}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={styles.userInfo}>
            <View style={styles.userNameRow}>
              <ThemedText style={styles.userName}>{userData.name}</ThemedText>
              {userData.isVerified && (
                <Image
                  source={require('../../../assets/Vector (36).png')}
                  style={styles.verifiedIcon}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        </View>

        {/* Tier Card */}
        <View style={styles.tierCardContainer}>
          <ImageBackground
            source={require('../../../assets/bronze_reward.png')}
            style={styles.tierCard}
            resizeMode="cover"
            imageStyle={styles.tierCardImage}
          >
            <View style={styles.tierHeader}>
              <View style={styles.tierTextContainer}>
                <ThemedText style={styles.tierTitle}>{tierData.currentTier} Tier</ThemedText>
                <ThemedText style={styles.tierSubtitle}>Progress to silver tier</ThemedText>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${tierData.progressToNext * 100}%` },
                      ]}
                    />
                  </View>
                </View>
              </View>
             
            </View>

            <View style={styles.criteriaContainer}>
              <ThemedText style={styles.criteriaTitle}>Criteria</ThemedText>
              {tierData.criteria.map((criterion, index) => {
                const progress = calculateProgress(criterion.current, criterion.target);
                return (
                  <View key={criterion.id} style={styles.criterionItem}>
                    <ThemedText style={styles.criterionLabel}>{criterion.label}</ThemedText>
                    <View style={styles.criterionProgressContainer}>
                      <View style={styles.criterionProgressBarBackground}>
                        <View
                          style={[
                            styles.criterionProgressBarFill,
                            { width: `${progress * 100}%` },
                          ]}
                        />
                      </View>
                      <View style={styles.criterionProgressBadge}>
                        <ThemedText style={styles.criterionProgressText}>
                          {criterion.id === 'transactions'
                            ? `${criterion.current}/${criterion.target}`
                            : getRemainingAmount(criterion.current, criterion.target)}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </ImageBackground>
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <View style={styles.rewardsSectionHeader}>
            <ThemedText style={styles.rewardsSectionTitle}>Bronze Tier Rewards</ThemedText>
            <TouchableOpacity onPress={handleHistoryPress}>
              <ThemedText style={styles.historyLink}>History</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.rewardsList}>
            {rewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardIconContainer}>
                  <MaterialCommunityIcons name="gift" size={32} color="#B08D57" />
                </View>
                <View style={styles.rewardContent}>
                  <ThemedText style={styles.rewardTitle}>{reward.title}</ThemedText>
                  <ThemedText style={styles.rewardDescription}>{reward.description}</ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.claimButton}
                  onPress={() => handleClaimPress(reward.id)}
                >
                  <ThemedText style={styles.claimButtonText}>Claim Now</ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  avatar: {
    width: 56 * SCALE,
    height: 56 * SCALE,
    borderRadius: 28 * SCALE,
    marginRight: 12 * SCALE,
    backgroundColor: '#031020',
    borderWidth: 0.5,
    borderColor: '#353535',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  userName: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  verifiedIcon: {
    width: 21 * SCALE,
    height: 21 * SCALE,
  },
  tierCardContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.037,
    marginBottom: 24 * SCALE,
    marginLeft: 10,
    width: '107%',
  },
  tierCard: {
    // borderRadius: 30 * SCALE,
    padding: 20 * SCALE,
    paddingBottom: 25 * SCALE,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 365 / 203,
    justifyContent: 'space-between',
  },
  tierCardImage: {
    borderRadius: 20 * SCALE,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10 * SCALE,
  },
  tierTextContainer: {
    flex: 1,
    marginRight: 12 * SCALE,
  },
  tierTitle: {
    fontSize: 32 * SCALE,
    fontWeight: '700',
    color: '#1D1200',
    marginBottom: 6 * SCALE,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  tierSubtitle: {
    fontSize: 11 * SCALE,
    fontWeight: '400',
    color: '#1D1200',
    marginBottom: 8 * SCALE,
  },
  progressBarContainer: {
    marginTop: 4 * SCALE,
    width:'70%',
  },
  progressBarBackground: {
    height: 12 * 1,
    backgroundColor: '#A47E42',
    borderRadius: 100 * SCALE,
    overflow: 'hidden',
  
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1D1200',
    borderRadius: 3 * SCALE,

  },
  shieldContainer: {
    width: 75 * SCALE,
    height: 75 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criteriaContainer: {
    marginTop: 6 * SCALE,
  },
  criteriaTitle: {
    fontSize: 10 * SCALE,
    fontWeight: '500',
    color: '#1D1200',
    backgroundColor: '#A27D44',
    width: '12%',
    alignSelf: 'center',
    paddingVertical: 4 * SCALE,
    marginLeft:-40,
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8 * SCALE,
    textAlign: 'center',
  },
  criterionItem: {
    marginBottom: 6 * SCALE,
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-between',
  },
  criterionLabel: {
    fontSize: 9 * SCALE,
    fontWeight: '400',
    color: '#000',
    // flex: 1.3,
    textAlign: 'center',
    marginRight: 10 * SCALE,
  },
  criterionProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6 * SCALE,
    // flex: 1,
    maxWidth: '40%',
  },
  criterionProgressBarBackground: {
    flex: 1,
    height: 4 * 1,
    backgroundColor: '#F0B858',
    borderRadius: 2 * SCALE,
    overflow: 'hidden',
    minWidth: 40 * SCALE,
  },
  criterionProgressBarFill: {
    height: '100%',
    backgroundColor: '#1D1200',
    borderRadius: 2 * SCALE,
  },
  criterionProgressBadge: {
    backgroundColor: 'transparent',
    borderWidth: 0.3,
    borderColor: '#000000',
    borderRadius: 8 * SCALE,
    paddingHorizontal: 6 * SCALE,
    paddingVertical: 2 * SCALE,
    minWidth: 45 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  criterionProgressText: {
    fontSize: 8 * SCALE,
    fontWeight: '400',
    color: '#000000',
    textAlign: 'center',
  },
  rewardsSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
  },
  rewardsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16 * SCALE,
  },
  rewardsSectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  historyLink: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#B08D57',
  },
  rewardsList: {
    gap: 12 * SCALE,
  },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12 * SCALE,
    padding: 16 * SCALE,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12 * SCALE,
  },
  rewardIconContainer: {
    width: 48 * SCALE,
    height: 48 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 100 * SCALE,
    
  },
  rewardContent: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  rewardDescription: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  claimButton: {
    backgroundColor: '#B08D57',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 10 * SCALE,
    paddingVertical: 10 * SCALE,
  },
  claimButtonText: {
    fontSize: 10 * 1,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomSpacer: {
    height: 40 * SCALE,
  },
});

export default Rewards;

