import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const Verification = () => {
  const navigation = useNavigation();

  const handleProceedToKYC = () => {
    navigation.navigate('KYC' as never);
  };

  const handleContinueLater = () => {
    // Navigate to home or dashboard
    console.log('Continue later');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backCircle}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Verification</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Shield Icon */}
        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/shield-tick.png')}
            style={styles.shieldIcon}
            resizeMode="contain"
          />
        </View>

        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Complete Registration</Text>
          <Text style={styles.subtitle}>
            Complete your registration to unlock full access
          </Text>
        </View>

        {/* General Registration Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>General Registration</Text>

          </View>
          <View style={styles.completedTag}>
            <View style={styles.completedIcon}>
              <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />
            </View>
            <Text style={styles.completedTagText}>Completed</Text>
          </View>

          {/* Progress Bars - Vertical Segments */}
          <View style={styles.progressBarsContainer}>
            <View style={styles.progressBarRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55].map((index) => (
                <View key={index} style={styles.progressBarSegmentComplete} />
              ))}
            </View>
            {/* <View style={styles.progressBarRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29].map((index) => (
                <View key={index} style={styles.progressBarSegmentComplete} />
              ))}
            </View> */}
          </View>

          {/* Progress Segments */}
          {/* <View style={styles.progressSegments}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
              <View key={index} style={styles.progressSegmentComplete} />
            ))}
          </View> */}

          {/* Status Row */}
          <View style={styles.statusRow}>
            <MaterialCommunityIcons name="check-circle" size={14} color="#A9EF45" />
            <Text style={styles.statusText}>Primary registration completed</Text>
          </View>
        </View>

        {/* KYC Registration Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.kycHeaderLeft}>
              <Text style={styles.sectionTitle}>KYC Registration</Text>
            </View>
            <TouchableOpacity style={styles.proceedButton} onPress={handleProceedToKYC}>
              <Text style={styles.proceedButtonText}>Proceed to KYC</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pendingTag}>
            <MaterialCommunityIcons name="timer-sand" size={12} color="#FFA500" />
            <Text style={styles.pendingTagText}>Pending</Text>
          </View>
          {/* Progress Bars - Vertical Segments (Incomplete) */}
          <View style={styles.progressBarsContainer}>
            <View style={styles.progressBarRow}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55].map((index) => (
                <View
                  key={index}
                  style={[
                    styles.progressBarSegmentIncomplete,
                    index < 2 && styles.progressBarSegmentPartial,
                  ]}
                />
              ))}
            </View>

          </View>

          {/* Progress Segments (Incomplete) */}


          {/* Status Rows */}
          <View style={styles.statusRow}>
            <View style={styles.greyDot} />
            <Text style={styles.statusText}>KYC Details registration</Text>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.greyDot} />
            <Text style={styles.statusText}>Selfie Registration</Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Later Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinueLater}>
          <Text style={styles.continueButtonText}>Continue Later</Text>
        </TouchableOpacity>
      </View>


    </View>
  );
};

export default Verification;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  backCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16, // 19 * 0.8
    fontWeight: '500',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  iconContainer: {
    position: 'absolute',
    right: 20,
    // top: -1,
    zIndex: 10,
  },
  shieldIcon: {
    width: 50,
    height: 50,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginTop: 0,
    marginBottom: 30,
  },
  title: {
    fontSize: 16, // 19 * 0.8
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10, // 12 * 0.8
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 14,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  kycHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12, // 14 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0080001A',
    borderWidth: 1,
    borderColor: '#008000',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    width: 70,
    marginBottom:20,
  },
  completedIcon: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4A8F4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedTagText: {
    fontSize: 8, // 12.5 * 0.8
    fontWeight: '400',
    color: '#008000',
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#FFA500',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    width: 70,
    marginBottom:20,
  },
  pendingTagText: {
    fontSize: 8, // 12.5 * 0.8
    fontWeight: '400',
    color: '#FFA500',
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  proceedButtonText: {
    fontSize: 8, // 10 * 0.8
    fontWeight: '400',
    color: '#000000',
  },
  progressBarsContainer: {
    marginBottom: 12,
    gap: 6,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 2,
    height: 18,
  },
  progressBarSegmentComplete: {
    width: 4,
    height: 18,
    backgroundColor: '#A9EF45',
    borderRadius: 1,
  },
  progressBarSegmentIncomplete: {
    width: 4,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 1,
  },
  progressBarSegmentPartial: {
    backgroundColor: '#102040',
  },
  progressSegments: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 4,
  },
  progressSegmentComplete: {
    flex: 1,
    height: 18,
    backgroundColor: '#A9EF45',
    borderRadius: 2,
  },
  progressSegmentIncomplete: {
    flex: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
  },
  progressSegmentPartial: {
    backgroundColor: '#102040',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  greyDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
  },
  statusText: {
    fontSize: 9.6, // 12 * 0.8
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  continueButton: {
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  continueButtonText: {
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '400',
    color: '#FFFFFF',
  },

});
