import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { LinearGradient } from 'expo-linear-gradient';
import { useClaimReward } from '../../../mutations/rewards.mutations';
import { ClaimRewardResponse } from '../../../mutations/rewards.mutations';
import { showErrorAlert, showSuccessAlert, showWarningAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

const navigateToRewardRedemption = (
  navigation: any,
  claim: ClaimRewardResponse
) => {
  const baseParams = {
    rewardClaimId: claim.id,
    rewardCode: claim.code,
    isRewardRedemption: true,
    rewardTitle: claim.title,
  };

  if (claim.fulfillmentType === 'bill_payment_airtime') {
    (navigation as any).navigate('Transactions', {
      screen: 'Airtime',
      params: {
        ...baseParams,
        rewardAmountNgn: claim.amountNgn,
      },
    });
    return;
  }

  if (claim.fulfillmentType === 'bill_payment_data') {
    (navigation as any).navigate('Transactions', {
      screen: 'DataRecharge',
      params: {
        ...baseParams,
        dataHint: claim.dataHint,
      },
    });
  }
};

const ClaimRewardScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const claimMutation = useClaimReward();

  const rewardCode = route.params?.rewardCode as string | undefined;
  const title = route.params?.title as string | undefined;
  const description = route.params?.description as string | undefined;
  const value = route.params?.value as string | undefined;
  const fulfillmentType = route.params?.fulfillmentType as string | undefined;
  const existingClaimId = route.params?.claimId as number | undefined;
  const amountNgn = route.params?.amountNgn as number | undefined;
  const dataHint = route.params?.dataHint as string | undefined;
  const categoryCode = route.params?.categoryCode as string | undefined;
  const icon = route.params?.icon as string | undefined;

  const displayLabel = useMemo(() => {
    if (!value) return 'Reward';
    if (value.toLowerCase().includes('data')) return 'FREE DATA';
    if (value.toLowerCase().includes('airtime')) return 'FREE AIRTIME';
    if (value.toLowerCase().includes('cashback')) return 'CASHBACK';
    return 'REWARD';
  }, [value]);

  const displayAmount = useMemo(() => {
    if (!value) return 'Reward';
    const match = value.match(/(\d+\s?(?:GB|MB|₦[\d,]+|\$[\d,]+|\d+%))/i);
    return match ? match[1] : value;
  }, [value]);

  const handleClaimSuccess = (claim: ClaimRewardResponse) => {
    if (claim.fulfillmentType === 'bill_payment_airtime' || claim.fulfillmentType === 'bill_payment_data') {
      navigateToRewardRedemption(navigation, claim);
      return;
    }

    if (claim.fulfillmentType === 'cashback') {
      showWarningAlert(
        'Cashback Reserved',
        'Your cashback reward is reserved. Bonus wallet redemption will be available in a future update.',
        () => navigation.goBack()
      );
      return;
    }

    showSuccessAlert('Success', `${title || 'Reward'} claimed successfully!`, () => {
      navigation.goBack();
    });
  };

  const handleContinueRedemption = () => {
    if (!existingClaimId || !rewardCode) {
      showErrorAlert('Error', 'Reward details are missing.');
      return;
    }

    navigateToRewardRedemption(navigation, {
      id: existingClaimId,
      code: rewardCode,
      title: title || '',
      description: description || '',
      value: value || '',
      tierCode: '',
      status: 'pending',
      fulfillmentType: fulfillmentType || '',
      amountNgn: amountNgn ?? null,
      categoryCode: categoryCode ?? null,
      dataHint: dataHint ?? null,
      icon: icon || 'gift',
      claimedAt: '',
      expiresAt: null,
    });
  };

  const handleClaimGift = () => {
    if (existingClaimId && fulfillmentType?.startsWith('bill_payment_')) {
      handleContinueRedemption();
      return;
    }

    if (!rewardCode) {
      showErrorAlert('Error', 'Reward details are missing.');
      return;
    }

    claimMutation.mutate(rewardCode, {
      onSuccess: (response) => {
        const claim = response.data;
        if (!claim) {
          showErrorAlert('Claim Failed', 'Invalid response from server.');
          return;
        }
        handleClaimSuccess(claim);
      },
      onError: (error) => {
        showErrorAlert('Claim Failed', error.message || 'Unable to claim this reward.');
      },
    });
  };

  const buttonLabel = existingClaimId && fulfillmentType?.startsWith('bill_payment_')
    ? 'Continue Redemption'
    : 'Claim Gift';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <LinearGradient
        colors={['#031428', '#020c19', '#05152b']}
        style={styles.background}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.topIconContainer}>
              <MaterialCommunityIcons name="gift" size={72} color="#B08D57" />
            </View>

            <View style={styles.freeDataLabel}>
              <ThemedText style={styles.freeDataText}>{displayLabel}</ThemedText>
            </View>

            <ThemedText style={styles.dataAmount}>{displayAmount}</ThemedText>
            {title ? <ThemedText style={styles.rewardTitle}>{title}</ThemedText> : null}
            {description ? (
              <ThemedText style={styles.rewardDescription}>{description}</ThemedText>
            ) : null}

            {(fulfillmentType === 'bill_payment_airtime' || fulfillmentType === 'bill_payment_data') && (
              <ThemedText style={styles.rewardHint}>
                You will choose your network and phone number next. Your wallet will not be charged.
              </ThemedText>
            )}

            <TouchableOpacity
              style={styles.claimGiftButton}
              onPress={handleClaimGift}
              activeOpacity={0.8}
              disabled={claimMutation.isPending}
            >
              <LinearGradient
                colors={['#A9EF45', '#8FD83A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.claimGiftGradient}
              >
                {claimMutation.isPending ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="gift"
                      size={20}
                      color="#000000"
                      style={styles.buttonIcon}
                    />
                    <ThemedText style={styles.claimGiftText}>{buttonLabel}</ThemedText>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50 * SCALE,
    left: 20 * SCALE,
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.08,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 24 * SCALE,
    padding: 28 * SCALE,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  topIconContainer: {
    marginBottom: 16 * SCALE,
  },
  freeDataLabel: {
    backgroundColor: 'rgba(176, 141, 87, 0.2)',
    borderRadius: 100,
    paddingHorizontal: 16 * SCALE,
    paddingVertical: 6 * SCALE,
    marginBottom: 12 * SCALE,
  },
  freeDataText: {
    fontSize: 12 * SCALE,
    fontWeight: '600',
    color: '#B08D57',
    letterSpacing: 1,
  },
  dataAmount: {
    fontSize: 42 * SCALE,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  rewardTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6 * SCALE,
    textAlign: 'center',
  },
  rewardDescription: {
    fontSize: 12 * SCALE,
    color: 'rgba(255, 255, 255, 0.65)',
    textAlign: 'center',
    marginBottom: 12 * SCALE,
  },
  rewardHint: {
    fontSize: 12 * SCALE,
    color: '#A9EF45',
    textAlign: 'center',
    marginBottom: 16 * SCALE,
    lineHeight: 18,
  },
  claimGiftButton: {
    width: '100%',
    marginTop: 8 * SCALE,
  },
  claimGiftGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    paddingVertical: 14 * SCALE,
    gap: 8 * SCALE,
  },
  buttonIcon: {
    marginRight: 4 * SCALE,
  },
  claimGiftText: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
});

export default ClaimRewardScreen;
