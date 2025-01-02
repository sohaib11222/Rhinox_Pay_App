import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SCALE = 1;

const ClaimRewardScreen = () => {
  const navigation = useNavigation();

  const handleClaimGift = () => {
    // TODO: Implement claim gift API call
    console.log('Claiming gift...');
  };

  const handleShareOnSocials = () => {
    // TODO: Implement social sharing
    console.log('Sharing on socials...');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={require('../../../assets/claim_background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Main Content Card */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Top Icon - claim_top.png */}
            <View style={styles.topIconContainer}>
              <Image
                source={require('../../../assets/claim_top.png')}
                style={styles.topIcon}
                resizeMode="contain"
              />
            </View>

            {/* FREE DATA Label */}
            <View style={styles.freeDataLabel}>
              <ThemedText style={styles.freeDataText}>FREE DATA</ThemedText>
            </View>

            {/* Data Amount */}
            <ThemedText style={styles.dataAmount}>1GB</ThemedText>

            {/* Claim Gift Button */}
            <TouchableOpacity
              style={styles.claimGiftButton}
              onPress={handleClaimGift}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#A9EF45', '#8FD83A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.claimGiftGradient}
              >
                <MaterialCommunityIcons 
                  name="gift" 
                  size={20} 
                  color="#FFFFFF" 
                  style={styles.buttonIcon}
                />
                <ThemedText style={styles.claimGiftText}>Claim Gift</ThemedText>
              </LinearGradient>
            </TouchableOpacity>

            {/* Share on Socials Button */}
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareOnSocials}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons 
                name="share-variant" 
                size={20} 
                color="#000000" 
                style={styles.buttonIcon}
              />
              <ThemedText style={styles.shareText}>Share on Socials</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
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
    top: 50,
    left: 20,
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.08,
  },
  card: {
    width: '100%',
    backgroundColor: '#0A1520',
    borderRadius: 30 * SCALE,
    borderWidth: 2,
    borderColor: '#A9EF45',
    paddingVertical: 40 * SCALE,
    paddingHorizontal: 30 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: SCREEN_HEIGHT * 0.65,
  },
  topIconContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  topIcon: {
    width: 120 * SCALE,
    height: 80 * SCALE,
  },
  freeDataLabel: {
    backgroundColor: 'rgba(26, 45, 80, 0.95)',
    borderWidth: 1.5,
    borderColor: '#A9EF45',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 8 * SCALE,
    marginBottom: 30 * SCALE,
    alignSelf: 'center',
  },
  freeDataText: {
    fontSize: 12 * SCALE,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  dataAmount: {
    fontSize: 80 * SCALE,
    fontWeight: '700',
    color: '#A9EF45',
    marginBottom: 60 * SCALE,
    letterSpacing: 3,
    textAlign: 'center',
  },
  claimGiftButton: {
    width: '90%',
    marginBottom: 16 * SCALE,
    borderRadius: 25 * SCALE,
    overflow: 'hidden',
  },
  claimGiftGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18 * SCALE,
    paddingHorizontal: 20 * SCALE,
  },
  shareButton: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#A9EF45',
    borderRadius: 25 * SCALE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18 * SCALE,
    paddingHorizontal: 20 * SCALE,
  },
  buttonIcon: {
    marginRight: 10 * SCALE,
  },
  claimGiftText: {
    fontSize: 16 * SCALE,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shareText: {
    fontSize: 16 * SCALE,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default ClaimRewardScreen;
