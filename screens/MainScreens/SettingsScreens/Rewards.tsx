import React, { useMemo } from 'react';

import {

  View,

  StyleSheet,

  ScrollView,

  TouchableOpacity,

  Image,

  Dimensions,

  StatusBar,

  RefreshControl,

  ActivityIndicator,

} from 'react-native';

import { useNavigation, useFocusEffect } from '@react-navigation/native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { LinearGradient } from 'expo-linear-gradient';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '../../../components';

import { usePullToRefresh } from '../../../hooks/usePullToRefresh';

import { defaultTabBarStyle } from '../../../navigation/tabBarConfig';

import { useGetRewardsDashboard, type RewardListItem } from '../../../queries/rewards.queries';

import { showErrorAlert } from '../../../utils/customAlert';

import { resolveUploadUri } from '../../../utils/walletFlags';



const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SCALE = 0.9;



const TIER_GRADIENTS: Record<string, [string, string, string]> = {

  bronze: ['#F2D4A0', '#D4A574', '#9A7344'],

  silver: ['#EEF2F6', '#C5CED8', '#95A3B3'],

  gold: ['#F5E6A8', '#E2C05A', '#B8892E'],

};



const TIER_ACCENT: Record<string, string> = {

  bronze: '#5C3D12',

  silver: '#3D4A57',

  gold: '#6B4E0F',

};



const getRewardIconName = (icon: string) => {

  switch (icon) {

    case 'cashback':

      return 'cash-refund';

    case 'airtime':

      return 'cellphone';

    case 'data':

      return 'wifi';

    default:

      return 'gift';

  }

};



const Rewards = () => {

  const navigation = useNavigation();

  const insets = useSafeAreaInsets();

  const {

    data: rewardsResponse,

    isLoading,

    isError,

    error,

    refetch,

  } = useGetRewardsDashboard();



  const dashboard = rewardsResponse?.data;



  useFocusEffect(

    React.useCallback(() => {

      const parent = navigation.getParent();

      if (parent) {

        parent.setOptions({ tabBarStyle: { display: 'none' } });

      }

      return () => {

        if (parent) {

          parent.setOptions({ tabBarStyle: defaultTabBarStyle });

        }

      };

    }, [navigation])

  );



  const tierCode = dashboard?.tier.currentCode || 'bronze';

  const tierGradient = useMemo(

    () => TIER_GRADIENTS[tierCode] || TIER_GRADIENTS.bronze,

    [tierCode]

  );

  const tierAccent = TIER_ACCENT[tierCode] || TIER_ACCENT.bronze;

  const avatarSource = useMemo(() => {
    const avatarUri = resolveUploadUri(dashboard?.user.profilePictureUrl);
    if (avatarUri) {
      return { uri: avatarUri };
    }
    return require('../../../assets/login/memoji.png');
  }, [dashboard?.user.profilePictureUrl]);

  const getClaimButtonLabel = (reward: RewardListItem) => {
    if (reward.isClaimed) return 'Claimed';
    if (reward.claimStatus === 'pending') return 'Continue';
    if (reward.claimStatus === 'failed') return 'Retry';
    return 'Claim Now';
  };



  const handleHistoryPress = () => {

    (navigation as any).navigate('Settings', { screen: 'RewardsHistory' });

  };



  const handleClaimPress = (reward: RewardListItem) => {

    if (!reward.canClaim) {

      showErrorAlert('Already Claimed', 'You have already claimed this reward.');

      return;

    }



    (navigation as any).navigate('Settings', {

      screen: 'ClaimReward',

      params: {

        rewardCode: reward.code,

        title: reward.title,

        description: reward.description,

        value: reward.value,

        fulfillmentType: reward.fulfillmentType,

        claimId: reward.claimId,

        amountNgn: reward.amountNgn,

        categoryCode: reward.categoryCode,

        dataHint: reward.dataHint,

        icon: reward.icon,

      },

    });

  };



  const handleRefresh = async () => {

    await refetch();

  };



  const { refreshing, onRefresh } = usePullToRefresh({

    onRefresh: handleRefresh,

    refreshDelay: 500,

  });



  const calculateProgress = (current: number, target: number) => {

    if (!target) return 1;

    return Math.min(current / target, 1);

  };



  return (

    <View style={styles.container}>

      <StatusBar barStyle="light-content" backgroundColor="#020c19" />

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 * SCALE + insets.bottom }]}

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

        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16 * SCALE) }]}>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>

            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />

          </TouchableOpacity>

          <ThemedText style={styles.headerTitle}>Rewards</ThemedText>

          <TouchableOpacity style={styles.historyHeaderButton} onPress={handleHistoryPress}>

            <ThemedText style={styles.historyHeaderText}>History</ThemedText>

          </TouchableOpacity>

        </View>



        {isLoading && !dashboard ? (

          <View style={styles.loadingContainer}>

            <ActivityIndicator size="large" color="#A9EF45" />

          </View>

        ) : isError ? (

          <View style={styles.loadingContainer}>

            <ThemedText style={styles.errorText}>

              {error?.message || 'Failed to load rewards'}

            </ThemedText>

            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>

              <ThemedText style={styles.retryButtonText}>Retry</ThemedText>

            </TouchableOpacity>

          </View>

        ) : dashboard ? (

          <>

            <View style={styles.profileSection}>

              <Image

                source={avatarSource}

                style={styles.avatar}

                resizeMode="cover"

              />

              <View style={styles.userInfo}>

                <View style={styles.userNameRow}>

                  <ThemedText style={styles.userName} numberOfLines={1}>

                    {dashboard.user.name}

                  </ThemedText>

                  {dashboard.user.isVerified && (

                    <Image

                      source={require('../../../assets/Vector (36).png')}

                      style={styles.verifiedIcon}

                      resizeMode="cover"

                    />

                  )}

                </View>

                <ThemedText style={styles.userTierLabel}>

                  {dashboard.tier.currentName} member

                </ThemedText>

              </View>

            </View>



            <View style={styles.tierCardContainer}>

              <LinearGradient

                colors={tierGradient}

                start={{ x: 0, y: 0 }}

                end={{ x: 1, y: 1 }}

                style={styles.tierCard}

              >

                <View style={styles.tierHeader}>

                  <View style={styles.tierTextContainer}>

                    <View style={styles.tierBadgeRow}>

                      <View style={[styles.tierBadge, { backgroundColor: `${tierAccent}22` }]}>

                        <ThemedText style={[styles.tierBadgeText, { color: tierAccent }]}>

                          CURRENT TIER

                        </ThemedText>

                      </View>

                    </View>

                    <ThemedText style={[styles.tierTitle, { color: tierAccent }]}>

                      {dashboard.tier.currentName}

                    </ThemedText>

                    <ThemedText style={[styles.tierSubtitle, { color: tierAccent }]}>

                      {dashboard.tier.progressLabel}

                    </ThemedText>

                    <View style={styles.progressMetaRow}>

                      <ThemedText style={[styles.progressMetaText, { color: tierAccent }]}>

                        Overall progress

                      </ThemedText>

                      <ThemedText style={[styles.progressMetaText, { color: tierAccent }]}>

                        {Math.round((dashboard.tier.progressToNext || 0) * 100)}%

                      </ThemedText>

                    </View>

                    <View style={styles.progressBarContainer}>

                      <View style={[styles.progressBarBackground, { backgroundColor: `${tierAccent}33` }]}>

                        <View

                          style={[

                            styles.progressBarFill,

                            {

                              width: `${Math.max((dashboard.tier.progressToNext || 0) * 100, 4)}%`,

                              backgroundColor: tierAccent,

                            },

                          ]}

                        />

                      </View>

                    </View>

                  </View>

                  <View style={[styles.shieldContainer, { backgroundColor: `${tierAccent}18` }]}>

                    <MaterialCommunityIcons name="shield-star" size={40 * SCALE} color={tierAccent} />

                  </View>

                </View>



                {dashboard.tier.criteria.length > 0 && (

                  <View style={[styles.criteriaContainer, { borderColor: `${tierAccent}33` }]}>

                    <ThemedText style={[styles.criteriaTitle, { color: tierAccent }]}>

                      Upgrade criteria

                    </ThemedText>

                    {dashboard.tier.criteria.map((criterion) => {

                      const progress = calculateProgress(criterion.current, criterion.target);

                      return (

                        <View key={criterion.id} style={styles.criterionItem}>

                          <View style={styles.criterionLabelRow}>

                            <ThemedText style={[styles.criterionLabel, { color: tierAccent }]}>

                              {criterion.label}

                            </ThemedText>

                            <View style={[styles.criterionProgressBadge, { borderColor: `${tierAccent}55` }]}>

                              <ThemedText style={[styles.criterionProgressText, { color: tierAccent }]}>

                                {criterion.progressText}

                              </ThemedText>

                            </View>

                          </View>

                          <View style={[styles.criterionProgressBarBackground, { backgroundColor: `${tierAccent}22` }]}>

                            <View

                              style={[

                                styles.criterionProgressBarFill,

                                {

                                  width: `${Math.max(progress * 100, progress > 0 ? 4 : 0)}%`,

                                  backgroundColor: tierAccent,

                                },

                              ]}

                            />

                          </View>

                        </View>

                      );

                    })}

                  </View>

                )}

              </LinearGradient>

            </View>



            <View style={styles.rewardsSection}>

              <ThemedText style={styles.rewardsSectionTitle}>

                {dashboard.tier.currentName} tier rewards

              </ThemedText>



              {dashboard.rewards.length > 0 ? (

                <View style={styles.rewardsList}>

                  {dashboard.rewards.map((reward) => (

                    <View key={reward.id} style={styles.rewardCard}>

                      <View style={styles.rewardTopRow}>

                        <View style={styles.rewardIconContainer}>

                          <MaterialCommunityIcons

                            name={getRewardIconName(reward.icon) as any}

                            size={22 * SCALE}

                            color="#A9EF45"

                          />

                        </View>

                        <View style={styles.rewardContent}>

                          <ThemedText style={styles.rewardTitle}>{reward.title}</ThemedText>

                          <ThemedText style={styles.rewardDescription}>{reward.description}</ThemedText>

                        </View>

                      </View>



                      <View style={styles.rewardBottomRow}>

                        <View style={styles.rewardValuePill}>

                          <ThemedText style={styles.rewardValue}>{reward.value}</ThemedText>

                        </View>

                        <TouchableOpacity

                          style={[

                            styles.claimButton,

                            !reward.canClaim && styles.claimButtonDisabled,

                          ]}

                          onPress={() => handleClaimPress(reward)}

                          disabled={!reward.canClaim}

                        >

                          <ThemedText style={styles.claimButtonText}>

                            {getClaimButtonLabel(reward)}

                          </ThemedText>

                        </TouchableOpacity>

                      </View>

                    </View>

                  ))}

                </View>

              ) : (

                <View style={styles.emptyRewardsContainer}>

                  <ThemedText style={styles.emptyRewardsText}>

                    No rewards available for your current tier yet.

                  </ThemedText>

                </View>

              )}

            </View>

          </>

        ) : null}

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

    paddingBottom: 24 * SCALE,

  },

  header: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    paddingHorizontal: SCREEN_WIDTH * 0.047,

    paddingBottom: 12 * SCALE,

  },

  backButton: {

    width: 40 * SCALE,

    height: 40 * SCALE,

    borderRadius: 20 * SCALE,

    backgroundColor: 'rgba(255, 255, 255, 0.08)',

    alignItems: 'center',

    justifyContent: 'center',

  },

  headerTitle: {

    fontSize: 16 * SCALE,

    fontWeight: '600',

    color: '#FFFFFF',

  },

  historyHeaderButton: {

    minWidth: 40 * SCALE,

    alignItems: 'flex-end',

  },

  historyHeaderText: {

    fontSize: 13 * SCALE,

    fontWeight: '500',

    color: '#A9EF45',

  },

  loadingContainer: {

    alignItems: 'center',

    justifyContent: 'center',

    paddingVertical: 60 * SCALE,

    gap: 16 * SCALE,

  },

  errorText: {

    color: 'rgba(255, 255, 255, 0.7)',

    fontSize: 14 * SCALE,

    textAlign: 'center',

    paddingHorizontal: 24 * SCALE,

  },

  retryButton: {

    backgroundColor: '#A9EF45',

    borderRadius: 10 * SCALE,

    paddingHorizontal: 20 * SCALE,

    paddingVertical: 10 * SCALE,

  },

  retryButtonText: {

    color: '#000000',

    fontWeight: '600',

  },

  profileSection: {

    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: SCREEN_WIDTH * 0.047,

    marginBottom: 16 * SCALE,

  },

  avatar: {

    width: 52 * SCALE,

    height: 52 * SCALE,

    borderRadius: 26 * SCALE,

    marginRight: 12 * SCALE,

    backgroundColor: '#031020',

    borderWidth: 1,

    borderColor: 'rgba(255, 255, 255, 0.12)',

  },

  userInfo: {

    flex: 1,

    minWidth: 0,

  },

  userNameRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 8 * SCALE,

  },

  userName: {

    fontSize: 15 * SCALE,

    fontWeight: '500',

    color: '#FFFFFF',

    flexShrink: 1,

  },

  userTierLabel: {

    marginTop: 4 * SCALE,

    fontSize: 12 * SCALE,

    color: 'rgba(255, 255, 255, 0.55)',

  },

  verifiedIcon: {

    width: 18 * SCALE,

    height: 18 * SCALE,

  },

  tierCardContainer: {

    paddingHorizontal: SCREEN_WIDTH * 0.047,

    marginBottom: 22 * SCALE,

  },

  tierCard: {

    borderRadius: 18 * SCALE,

    padding: 18 * SCALE,

    overflow: 'hidden',

  },

  tierHeader: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

    marginBottom: 14 * SCALE,

  },

  tierTextContainer: {

    flex: 1,

    marginRight: 10 * SCALE,

  },

  tierBadgeRow: {

    flexDirection: 'row',

    marginBottom: 8 * SCALE,

  },

  tierBadge: {

    borderRadius: 100,

    paddingHorizontal: 10 * SCALE,

    paddingVertical: 4 * SCALE,

  },

  tierBadgeText: {

    fontSize: 9 * SCALE,

    fontWeight: '700',

    letterSpacing: 0.8,

  },

  tierTitle: {

    fontSize: 28 * SCALE,

    fontWeight: '700',

    marginBottom: 4 * SCALE,

    textTransform: 'capitalize',

  },

  tierSubtitle: {

    fontSize: 12 * SCALE,

    fontWeight: '500',

    marginBottom: 10 * SCALE,

    opacity: 0.85,

  },

  progressMetaRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: 6 * SCALE,

  },

  progressMetaText: {

    fontSize: 10 * SCALE,

    fontWeight: '600',

    opacity: 0.8,

  },

  progressBarContainer: {

    width: '100%',

  },

  progressBarBackground: {

    height: 8 * SCALE,

    borderRadius: 100,

    overflow: 'hidden',

  },

  progressBarFill: {

    height: '100%',

    borderRadius: 100,

  },

  shieldContainer: {

    width: 64 * SCALE,

    height: 64 * SCALE,

    borderRadius: 32 * SCALE,

    alignItems: 'center',

    justifyContent: 'center',

  },

  criteriaContainer: {

    marginTop: 4 * SCALE,

    backgroundColor: 'rgba(255, 255, 255, 0.18)',

    borderRadius: 14 * SCALE,

    borderWidth: 1,

    paddingHorizontal: 14 * SCALE,

    paddingTop: 14 * SCALE,

    paddingBottom: 12 * SCALE,

    gap: 12 * SCALE,

  },

  criteriaTitle: {

    fontSize: 11 * SCALE,

    fontWeight: '700',

    letterSpacing: 0.4,

    textTransform: 'uppercase',

    marginBottom: 2 * SCALE,

  },

  criterionItem: {

    gap: 8 * SCALE,

  },

  criterionLabelRow: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    justifyContent: 'space-between',

    gap: 10 * SCALE,

  },

  criterionLabel: {

    flex: 1,

    fontSize: 11 * SCALE,

    fontWeight: '500',

    lineHeight: 16 * SCALE,

  },

  criterionProgressBarBackground: {

    height: 5 * SCALE,

    borderRadius: 100,

    overflow: 'hidden',

  },

  criterionProgressBarFill: {

    height: '100%',

    borderRadius: 100,

  },

  criterionProgressBadge: {

    borderWidth: 1,

    borderRadius: 100,

    paddingHorizontal: 8 * SCALE,

    paddingVertical: 3 * SCALE,

    backgroundColor: 'rgba(255, 255, 255, 0.25)',

  },

  criterionProgressText: {

    fontSize: 9 * SCALE,

    fontWeight: '700',

  },

  rewardsSection: {

    paddingHorizontal: SCREEN_WIDTH * 0.047,

  },

  rewardsSectionTitle: {

    fontSize: 15 * SCALE,

    fontWeight: '600',

    color: '#FFFFFF',

    marginBottom: 14 * SCALE,

    textTransform: 'capitalize',

  },

  rewardsList: {

    gap: 12 * SCALE,

  },

  rewardCard: {

    backgroundColor: 'rgba(255, 255, 255, 0.04)',

    borderRadius: 16 * SCALE,

    padding: 14 * SCALE,

    borderWidth: 1,

    borderColor: 'rgba(255, 255, 255, 0.08)',

    gap: 12 * SCALE,

  },

  rewardTopRow: {

    flexDirection: 'row',

    alignItems: 'flex-start',

  },

  rewardIconContainer: {

    width: 42 * SCALE,

    height: 42 * SCALE,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 12 * SCALE,

    backgroundColor: 'rgba(169, 239, 69, 0.1)',

    borderRadius: 21 * SCALE,

    borderWidth: 1,

    borderColor: 'rgba(169, 239, 69, 0.25)',

  },

  rewardContent: {

    flex: 1,

    minWidth: 0,

  },

  rewardTitle: {

    fontSize: 14 * SCALE,

    fontWeight: '600',

    color: '#FFFFFF',

    marginBottom: 4 * SCALE,

  },

  rewardDescription: {

    fontSize: 11 * SCALE,

    fontWeight: '400',

    color: 'rgba(255, 255, 255, 0.62)',

    lineHeight: 16 * SCALE,

  },

  rewardBottomRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    gap: 10 * SCALE,

  },

  rewardValuePill: {

    flex: 1,

    backgroundColor: 'rgba(169, 239, 69, 0.12)',

    borderRadius: 100,

    paddingHorizontal: 12 * SCALE,

    paddingVertical: 8 * SCALE,

    borderWidth: 1,

    borderColor: 'rgba(169, 239, 69, 0.22)',

  },

  rewardValue: {

    fontSize: 12 * SCALE,

    fontWeight: '600',

    color: '#A9EF45',

  },

  claimButton: {

    backgroundColor: '#A9EF45',

    borderRadius: 100,

    paddingHorizontal: 16 * SCALE,

    paddingVertical: 10 * SCALE,

    minWidth: 96 * SCALE,

    alignItems: 'center',

  },

  claimButtonDisabled: {

    backgroundColor: 'rgba(169, 239, 69, 0.25)',

  },

  claimButtonText: {

    fontSize: 11 * SCALE,

    fontWeight: '700',

    color: '#000000',

  },

  emptyRewardsContainer: {

    paddingVertical: 24 * SCALE,

    alignItems: 'center',

  },

  emptyRewardsText: {

    color: 'rgba(255, 255, 255, 0.6)',

    fontSize: 12 * SCALE,

    textAlign: 'center',

  },

});



export default Rewards;


