import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Switch,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1; // Reduced scale for big phone design

// Types for API integration
interface SettingsItem {
  id: string;
  title: string;
  icon: any; // Image source
  hasToggle?: boolean;
  hasBadge?: boolean;
  badgeText?: string;
  onPress?: () => void;
}

interface SettingsSection {
  id: string;
  title: string;
  items: SettingsItem[];
}

const Settings = () => {
  const navigation = useNavigation();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [agreements, setAgreements] = useState({
    loseAccess: true,
    cannotLogin: true,
    balancesDeleted: true,
  });

  // Mock user data - Replace with API call
  const userData = {
    name: 'Qamardeen Abdul Malik',
    avatar: require('../../../assets/login/memoji.png'),
    isVerified: true,
  };

  // Settings sections - Replace with API call
  // TODO: Replace image sources with actual images from Figma when available
  const settingsSections: SettingsSection[] = [
    {
      id: 'profile',
      title: 'Profile',
      items: [
        {
          id: 'edit-profile',
          title: 'Edit Profile',
          icon: require('../../../assets/user.png'), // TODO: Replace with user icon image
        },
        {
          id: 'account-verification',
          title: 'Account Verifcation',
          icon: require('../../../assets/bank.png'), // TODO: Replace with bank icon image
          hasBadge: true,
          badgeText: 'Verified',
        },
        {
          id: 'support',
          title: 'Support',
          icon: require('../../../assets/customer-support.png'), // TODO: Replace with support icon image
        },
        {
          id: 'p2p-profile',
          title: 'P2P Profile',
          icon: require('../../../assets/user-multiple.png'),
        },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      items: [
        {
          id: 'biometrics',
          title: 'Login with biometrics',
          icon: require('../../../assets/user.png'), // TODO: Replace with fingerprint icon image
          hasToggle: true,
        },
        {
          id: 'account-security',
          title: 'Account Security',
          icon: require('../../../assets/security-check.png'),
        },
      ],
    },
    {
      id: 'other',
      title: 'Other',
      items: [
        {
          id: 'notifications',
          title: 'Notifications Settings',
          icon: require('../../../assets/logout-square-01.png'), // TODO: Replace with notifications icon image
        },
        {
          id: 'terms',
          title: 'Terms of use',
          icon: require('../../../assets/logout-square-01.png'), // TODO: Replace with document icon image
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: require('../../../assets/logout-square-01.png'), // TODO: Replace with privacy icon image
        },
        {
          id: 'logout',
          title: 'Logout',
          icon: require('../../../assets/logout-square-01.png'), // TODO: Replace with logout icon image
        },
      ],
    },
  ];

  const handleItemPress = (item: SettingsItem) => {
    // TODO: Implement navigation or actions based on item.id
    if (item.id === 'edit-profile') {
      (navigation as any).navigate('Settings', {
        screen: 'EditProfile',
      });
    } else if (item.id === 'p2p-profile') {
      (navigation as any).navigate('Settings', {
        screen: 'P2PProfile',
      });
    } else if (item.id === 'account-security') {
      (navigation as any).navigate('Settings', {
        screen: 'AccountSecurity',
      });
    } else if (item.id === 'support') {
      (navigation as any).navigate('Settings', {
        screen: 'Support',
      });
    } else {
      console.log('Pressed:', item.id);
    }
  };

  const handleDeleteAccount = () => {
    setShowDeleteWarningModal(true);
  };

  const handleProceedWarning = () => {
    // Check if all agreements are accepted
    if (agreements.loseAccess && agreements.cannotLogin && agreements.balancesDeleted) {
      setShowDeleteWarningModal(false);
      setShowDeleteConfirmModal(true);
    }
  };

  const handleDeleteConfirm = () => {
    // TODO: Implement API call to delete account
    console.log('Account deletion confirmed');
    setShowDeleteConfirmModal(false);
    // After successful deletion, navigate to login or show success message
  };

  const toggleAgreement = (key: keyof typeof agreements) => {
    setAgreements((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardContent}>
            <View style={styles.avatarContainer}>
              <Image
                source={userData.avatar}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{userData.name}</Text>
              {userData.isVerified && (
                <Image
                  source={require('../../../assets/Vector (36).png')}
                  style={[{ marginBottom: -1, width: 21, height: 21 }]}
                  resizeMode="cover"
                />
              )}
            </View>
          </View>
        </View>

        {/* Settings Sections */}
        <View style={styles.sectionsContainer}>
          {settingsSections.map((section) => (
            <View key={section.id} style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionItems}>
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.settingsItem}
                    onPress={() => handleItemPress(item)}
                  >
                    <View style={styles.itemIconContainer}>
                      <Image
                        source={item.icon}
                        style={styles.itemIcon}
                        resizeMode="contain"
                      />
                    </View>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    {item.hasBadge && (
                      <View style={styles.itemBadge}>
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={10 * SCALE}
                          color="#008000"
                        />
                        <Text style={styles.itemBadgeText}>{item.badgeText}</Text>
                      </View>
                    )}
                    {item.hasToggle && (
                      <Switch
                        value={biometricEnabled}
                        onValueChange={setBiometricEnabled}
                        trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: '#A9EF45' }}
                        thumbColor={biometricEnabled ? '#FFFFFF' : '#FFFFFF'}
                        style={styles.toggle}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Delete Account Button */}
        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteAccountText}>Delete Account</Text>
        </TouchableOpacity>

        {/* App Version Info */}
        <View style={styles.versionContainer}>
          <Text style={styles.appName}>
            Rhinox <Text style={styles.appNameHighlight}>Pay</Text>
          </Text>
          <Text style={styles.versionText}>Version 1.00</Text>
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Delete Account Warning Modal (First Modal) */}
      <Modal
        visible={showDeleteWarningModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteWarningModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.warningModalContent}>
            {/* Warning Icon */}
            <View style={styles.warningIconContainer}>
              <View style={styles.warningIconCircle}>
                <Image
                  source={require('../../../assets/Warning.png')}
                  style={[{ marginBottom: -1, width: 40, height: 40 }]}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Warning Title */}
            <Text style={styles.warningTitle}>Warning</Text>

            {/* Agreement Text */}
            <Text style={styles.agreementText}>By proceeding with this action i agree that</Text>

            {/* Agreement Checkboxes */}
            <View style={styles.agreementsContainer}>
              <TouchableOpacity
                style={styles.agreementItem}
                onPress={() => toggleAgreement('loseAccess')}
              >
                <Text style={styles.agreementTextItem}>I will lose access to this account</Text>
                <View style={[
                  styles.checkbox,
                  agreements.loseAccess && styles.checkboxChecked
                ]}>
                  {agreements.loseAccess && (
                    <MaterialCommunityIcons name="check" size={16 * SCALE} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.agreementItem}
                onPress={() => toggleAgreement('cannotLogin')}
              >
                <Text style={styles.agreementTextItem}>I will not be able to login with my details</Text>
                <View style={[
                  styles.checkbox,
                  agreements.cannotLogin && styles.checkboxChecked
                ]}>
                  {agreements.cannotLogin && (
                    <MaterialCommunityIcons name="check" size={16 * SCALE} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.agreementItem}
                onPress={() => toggleAgreement('balancesDeleted')}
              >
                <Text style={styles.agreementTextItem}>Your balances will be deleted</Text>
                <View style={[
                  styles.checkbox,
                  agreements.balancesDeleted && styles.checkboxChecked
                ]}>
                  {agreements.balancesDeleted && (
                    <MaterialCommunityIcons name="check" size={16 * SCALE} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleProceedWarning}
                disabled={!agreements.loseAccess || !agreements.cannotLogin || !agreements.balancesDeleted}
              >
                <Text style={styles.proceedButtonText}>Proceed</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteWarningModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Confirmation Modal (Second Modal) */}
      <Modal
        visible={showDeleteConfirmModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            {/* Warning Icon */}
            <View style={styles.confirmWarningIconContainer}>
              <View style={styles.confirmWarningIconCircle}>
                <Image
                  source={require('../../../assets/Warning.png')}
                  style={[{ marginBottom: -1, width: 40, height: 40 }]}
                  resizeMode="cover"
                />
              </View>
            </View>

            {/* Warning Title */}
            <Text style={styles.confirmWarningTitle}>Warning</Text>

            {/* Confirmation Text */}
            <Text style={styles.confirmText}>Are you sure you want to delete your account</Text>

            {/* Action Buttons */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={styles.deleteAccountButtonModal}
                onPress={handleDeleteConfirm}
              >
                <Text style={styles.deleteAccountButtonText}>Delete Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  profileCard: {
    backgroundColor: '#0b1d32',
    borderWidth: 0.5,
    borderColor: '#A9EF45',
    borderRadius: 20 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
    paddingVertical: 21 * SCALE,
  },
  profileCardContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 111 * SCALE,
    height: 111 * SCALE,
    borderRadius: 55.5 * SCALE,
    overflow: 'hidden',
    marginBottom: 13 * SCALE,
    backgroundColor: '#020C19',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  userName: {
    fontSize: 16 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  sectionsContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 16 * SCALE,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
  },
  sectionTitle: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 25 * SCALE,
  },
  sectionItems: {
    gap: 10 * SCALE,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    paddingVertical: 8 * SCALE,
    paddingHorizontal: 8 * SCALE,
    minHeight: 60 * SCALE,
  },
  itemIconContainer: {
    width: 45 * SCALE,
    height: 44 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 5 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14 * SCALE,
  },
  itemIcon: {
    width: 24 * 1,
    height: 24 * 1,
  },
  itemTitle: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  itemBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 128, 0, 0.1)',
    borderWidth: 0.3,
    borderColor: '#008000',
    borderRadius: 100 * SCALE,
    paddingHorizontal: 5 * SCALE,
    paddingVertical: 4 * SCALE,
    gap: 3 * SCALE,
    marginRight: 8 * SCALE,
  },
  itemBadgeText: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: '#008000',
  },
  toggle: {
    marginRight: 8 * SCALE,
  },
  chevron: {
    marginRight: 8 * SCALE,
  },
  deleteAccountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 20 * SCALE,
    paddingVertical: 20 * SCALE,
    alignItems: 'center',
  },
  deleteAccountText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 20 * SCALE,
    gap: 6 * SCALE,
  },
  appName: {
    fontSize: 20 * SCALE,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appNameHighlight: {
    color: '#A9EF45',
  },
  versionText: {
    fontSize: 8 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 100 * SCALE,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
  },
  warningModalContent: {
    backgroundColor: '#020c19',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 30 * SCALE,
    width: '100%',
    maxWidth: 370 * SCALE,
    alignItems: 'center',
  },
  confirmModalContent: {
    backgroundColor: '#020C19',
    borderRadius: 20 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 30 * SCALE,
    width: '100%',
    maxWidth: 370 * SCALE,
    alignItems: 'center',
  },
  warningIconContainer: {
    marginBottom: 20 * SCALE,
  },
  warningIconCircle: {
    width: 80 * SCALE,
    height: 80 * SCALE,
    borderRadius: 40 * SCALE,
    backgroundColor: '#FFA500',
    borderWidth: 2,
    borderColor: '#FFA500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmWarningIconContainer: {
    marginBottom: 20 * SCALE,
  },
  confirmWarningIconCircle: {
    width: 80 * SCALE,
    height: 80 * SCALE,
    borderRadius: 40 * SCALE,
    backgroundColor: '#FF0000',
    borderWidth: 2,
    borderColor: '#FF0000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningTitle: {
    fontSize: 20 * 1,
    fontWeight: '600',
    color: '#FFA500',
    marginBottom: 10 * SCALE,
  },
  confirmWarningTitle: {
    fontSize: 20 * 1,
    fontWeight: '600',
    color: '#FF0000',
    marginBottom: 20 * SCALE,
  },
  agreementText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20 * SCALE,
    textAlign: 'center',
  },
  agreementsContainer: {
    width: '100%',
    marginBottom: 30 * SCALE,
  },
  agreementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * 1,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 15 * SCALE,
    marginBottom: 12 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  agreementTextItem: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 12 * SCALE,
  },
  checkbox: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 6 * SCALE,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#A9EF45',
    borderColor: '#A9EF45',
  },
  confirmText: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 30 * SCALE,
    textAlign: 'center',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 10 * SCALE,
  },
  proceedButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12 * SCALE,
    borderRightWidth: 0.3,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  proceedButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '500',
    color: '#A9EF45',
  },
  deleteAccountButtonModal: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12 * SCALE,
    borderRightWidth: 0.3,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteAccountButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '500',
    color: '#FF0000',
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12 * SCALE,
  },
  cancelButtonText: {
    fontSize: 10 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default Settings;

