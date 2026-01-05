import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetCurrentUser } from '../../../queries/auth.queries';
import { useGetCountries } from '../../../queries/country.queries';
import { useUpdateProfile } from '../../../mutations/auth.mutations';
import { API_BASE_URL } from '../../../utils/apiConfig';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1; // Reduced scale for big phone design

// Types for API integration
interface UserProfile {
  country: string;
  countryCode: string;
  countryId: string | number | null;
  countryFlag: any;
  countryFlagUrl: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar: any;
}

const EditProfile = () => {
  const navigation = useNavigation();
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<string | number | null>(null);

  // Fetch current user profile
  const {
    data: userData,
    isLoading: isLoadingUser,
    refetch: refetchUser,
  } = useGetCurrentUser();

  // Fetch countries from API
  const {
    data: countriesData,
    isLoading: isLoadingCountries,
  } = useGetCountries();

  // Transform countries data
  const countries = useMemo(() => {
    if (!countriesData?.data || !Array.isArray(countriesData.data)) {
      // Fallback to default countries
      return [
        { id: 1, name: 'Nigeria', code: 'NG', flag: '🇳🇬', flagUrl: null },
        { id: 2, name: 'Botswana', code: 'BW', flag: '🇧🇼', flagUrl: null },
        { id: 3, name: 'Ghana', code: 'GH', flag: '🇬🇭', flagUrl: null },
        { id: 4, name: 'Kenya', code: 'KE', flag: '🇰🇪', flagUrl: null },
        { id: 5, name: 'South Africa', code: 'ZA', flag: '🇿🇦', flagUrl: null },
        { id: 6, name: 'Tanzania', code: 'TZ', flag: '🇹🇿', flagUrl: null },
        { id: 7, name: 'Uganda', code: 'UG', flag: '🇺🇬', flagUrl: null },
      ];
    }
    return countriesData.data.map((country: any, index: number) => {
      // Check if flag is a URL path (starts with /) or an emoji
      const flagValue = country.flag || '';
      const isFlagUrl = flagValue.startsWith('/') || flagValue.startsWith('http');
      const flagUrl = isFlagUrl 
        ? `${API_BASE_URL.replace('/api', '')}${flagValue}`
        : null;
      const flagEmoji = isFlagUrl ? null : (flagValue || '🏳️');
      
      return {
        id: country.id || index + 1,
        name: country.name || '',
        code: country.code || '',
        flag: flagEmoji,
        flagUrl: flagUrl,
      };
    });
  }, [countriesData?.data]);

  // Initialize profile data from API
  const [profileData, setProfileData] = useState<UserProfile>({
    country: '',
    countryCode: '',
    countryId: null,
    countryFlag: require('../../../assets/login/nigeria-flag.png'),
    countryFlagUrl: null,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    avatar: require('../../../assets/login/memoji.png'),
  });

  // Update profile data when user data is loaded
  useEffect(() => {
    if (userData?.data) {
      const user = userData.data;
      const userCountry = countries.find((c: any) => c.id === user.countryId || c.code === user.countryCode);
      
      setProfileData({
        country: userCountry?.name || user.country || 'Nigeria',
        countryCode: userCountry?.code || user.countryCode || 'NG',
        countryId: user.countryId || userCountry?.id || null,
        countryFlag: userCountry && userCountry.flagUrl 
          ? { uri: userCountry.flagUrl }
          : require('../../../assets/login/nigeria-flag.png'),
        countryFlagUrl: userCountry?.flagUrl || null,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phone || '',
        avatar: require('../../../assets/login/memoji.png'),
      });
      
      // Set selected country ID for modal
      if (user.countryId || (userCountry && userCountry.id)) {
        setSelectedCountryId(user.countryId || (userCountry ? userCountry.id : null));
      }
    }
  }, [userData?.data, countries]);

  // Update profile mutation
  const updateProfileMutation = useUpdateProfile({
    onSuccess: (data) => {
      console.log('[EditProfile] Profile updated successfully:', data);
      showSuccessAlert('Success', 'Profile updated successfully');
      refetchUser();
    },
    onError: (error: any) => {
      console.error('[EditProfile] Error updating profile:', error);
      showErrorAlert('Error', error?.message || 'Failed to update profile');
    },
  });

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
              height: 75 * 0.8, // Using MainNavigator's SCALE
              paddingBottom: 10,
              paddingTop: 0,
              position: 'absolute',
              bottom: 26 * 0.8, // Using MainNavigator's SCALE
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

  // Check if all required fields are filled
  const isFormValid = useMemo(() => {
    return (
      profileData.firstName.trim().length > 0 &&
      profileData.lastName.trim().length > 0 &&
      profileData.email.trim().length > 0 &&
      profileData.phoneNumber.trim().length > 0 &&
      profileData.countryId !== null
    );
  }, [profileData.firstName, profileData.lastName, profileData.email, profileData.phoneNumber, profileData.countryId]);

  const handleSave = () => {
    if (!isFormValid) {
      showWarningAlert('Error', 'Please fill in all required fields');
      return;
    }

    updateProfileMutation.mutate({
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phone: profileData.phoneNumber,
      countryId: profileData.countryId || undefined,
    });
  };

  const handleCountrySelect = () => {
    // Initialize selectedCountryId based on current profile country
    if (profileData.countryId) {
      setSelectedCountryId(profileData.countryId);
    }
    setShowCountryModal(true);
  };

  const handleCountryChange = (countryId: string | number) => {
    setSelectedCountryId(countryId);
  };

  const handleApplyCountry = () => {
    if (selectedCountryId) {
      const selectedCountry = countries.find((c: any) => c.id === selectedCountryId);
      if (selectedCountry) {
        setProfileData({
          ...profileData,
          country: selectedCountry.name,
          countryCode: selectedCountry.code,
          countryId: selectedCountry.id,
          countryFlag: selectedCountry.flagUrl 
            ? { uri: selectedCountry.flagUrl }
            : require('../../../assets/login/nigeria-flag.png'),
          countryFlagUrl: selectedCountry.flagUrl || null,
        });
      }
    }
    setShowCountryModal(false);
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchUser(),
      ]);
      console.log('[EditProfile] Profile data refreshed successfully');
    } catch (error) {
      console.error('[EditProfile] Error refreshing profile data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.backIconCircle}>
              <MaterialCommunityIcons
                name="chevron-left"
                size={24 * SCALE}
                color="#FFFFFF"
              />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Edit Profile</ThemedText>
          </View>
        </View>

        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
          {isLoadingUser ? (
            <View style={styles.avatarContainer}>
              <ActivityIndicator size="large" color="#A9EF45" />
            </View>
          ) : (
            <View style={styles.avatarContainer}>
              <Image
                source={profileData.avatar}
                style={styles.avatar}
                resizeMode="cover"
              />
              <TouchableOpacity style={styles.editIconContainer}>
                <View style={styles.editIconCircle}>
                  <Image
                    source={require('../../../assets/PencilSimpleLine (1).png')}
                    style={styles.editIcon}
                    resizeMode="contain"
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Country Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Country</ThemedText>
            {isLoadingCountries ? (
              <View style={styles.inputField}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={[styles.inputText, { marginLeft: 12 }]}>Loading countries...</ThemedText>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.inputField}
                onPress={handleCountrySelect}
              >
                {profileData.countryFlagUrl ? (
                  <Image
                    source={{ uri: profileData.countryFlagUrl }}
                    style={styles.countryFlag}
                    resizeMode="cover"
                  />
                ) : typeof profileData.countryFlag === 'object' && 'uri' in profileData.countryFlag ? (
                  <Image
                    source={profileData.countryFlag}
                    style={styles.countryFlag}
                    resizeMode="cover"
                  />
                ) : (
                  <Image
                    source={require('../../../assets/login/nigeria-flag.png')}
                    style={styles.countryFlag}
                    resizeMode="cover"
                  />
                )}
                <ThemedText style={styles.inputText}>{profileData.country || 'Select Country'}</ThemedText>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={24 * SCALE}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* First Name Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>First name</ThemedText>
            {isLoadingUser ? (
              <View style={styles.inputField}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={[styles.inputText, { marginLeft: 12 }]}>Loading...</ThemedText>
              </View>
            ) : (
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profileData.firstName}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, firstName: text })
                  }
                  placeholder=""
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
            )}
          </View>

          {/* Last Name Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Last name</ThemedText>
            {isLoadingUser ? (
              <View style={styles.inputField}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={[styles.inputText, { marginLeft: 12 }]}>Loading...</ThemedText>
              </View>
            ) : (
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profileData.lastName}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, lastName: text })
                  }
                  placeholder=""
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
            )}
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Email</ThemedText>
            {isLoadingUser ? (
              <View style={styles.inputField}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={[styles.inputText, { marginLeft: 12 }]}>Loading...</ThemedText>
              </View>
            ) : (
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profileData.email}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, email: text })
                  }
                  placeholder=""
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false}
                />
              </View>
            )}
          </View>

          {/* Phone Number Field */}
          <View style={styles.fieldContainer}>
            <ThemedText style={styles.fieldLabel}>Phone number</ThemedText>
            {isLoadingUser ? (
              <View style={styles.inputField}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={[styles.inputText, { marginLeft: 12 }]}>Loading...</ThemedText>
              </View>
            ) : (
              <View style={styles.inputField}>
                <TextInput
                  style={styles.textInput}
                  value={profileData.phoneNumber}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, phoneNumber: text })
                  }
                  placeholder=""
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  keyboardType="phone-pad"
                />
              </View>
            )}
          </View>
        </View>

        {/* Warning Message */}
        <View style={styles.warningContainer}>
          <ThemedText style={styles.warningText}>
            To edit your account...{' '}
            <ThemedText
              style={styles.warningLink}
              onPress={() => {
                (navigation as any).navigate('Settings', {
                  screen: 'Support',
                });
              }}
            >
              Contact Support
            </ThemedText>
          </ThemedText>
        </View>

        {/* Bottom spacing for Save button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save Button - Fixed at bottom */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={[styles.saveButton, (!isFormValid || updateProfileMutation.isPending) && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={!isFormValid || updateProfileMutation.isPending}
        >
          {updateProfileMutation.isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      {/* Country Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Country</ThemedText>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            {isLoadingCountries ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="small" color="#A9EF45" />
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {countries.map((c: any) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.countryItem}
                    onPress={() => handleCountryChange(c.id)}
                  >
                    {c.flagUrl ? (
                      <Image
                        source={{ uri: c.flagUrl }}
                        style={styles.countryFlagModal}
                        resizeMode="cover"
                      />
                    ) : c.flag ? (
                      <ThemedText style={styles.countryFlagEmojiModal}>{c.flag}</ThemedText>
                    ) : (
                      <Image
                        source={require('../../../assets/login/nigeria-flag.png')}
                        style={styles.countryFlagModal}
                        resizeMode="cover"
                      />
                    )}
                    <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedCountryId === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={selectedCountryId === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleApplyCountry}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 30* 1,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    marginRight: 12 * SCALE,
  },
  backIconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    marginLeft: -40 * SCALE,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginTop: 20 * SCALE,
    marginBottom: 20 * SCALE,
  },
  avatarContainer: {
    width: 111 * SCALE,
    height: 111 * SCALE,
    borderRadius: 55.5 * SCALE,
    position: 'relative',
    overflow: 'visible',
    backgroundColor:'#031020'
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 55.5 * SCALE,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: -2 * SCALE,
    right: -2 * SCALE,
  },
  editIconCircle: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#020c19',
  },
  editIcon: {
    width: 12 * SCALE,
    height: 12 * SCALE,
    tintColor: '#000',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    minHeight: 500 * SCALE,
    opacity: 0.5,
  },
  fieldContainer: {
    marginBottom: 12 * SCALE,
  },
  fieldLabel: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 6 * SCALE,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 11 * SCALE,
    paddingVertical: 18 * SCALE,
    minHeight: 60 * SCALE,
  },
  countryFlag: {
    width: 36 * SCALE,
    height: 36 * SCALE,
    borderRadius: 18 * SCALE,
    marginRight: 13 * SCALE,
  },
  inputText: {
    flex: 1,
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  dropdownIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
  },
  textInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    padding: 0,
    margin: 0,
  },
  warningContainer: {
    backgroundColor: 'rgba(206, 86, 0, 0.1)',
    borderRadius: 10 * SCALE,
    paddingVertical: 11 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 34 * SCALE,
  },
  warningText: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: '90%',
  },
  warningLink: {
    color: '#A9EF45',
  },
  bottomSpacer: {
    height: 80 * SCALE,
  },
  saveButtonContainer: {
    position: 'absolute',
    bottom: 29 * SCALE,
    left: SCREEN_WIDTH * 0.04,
    right: SCREEN_WIDTH * 0.04,
  },
  saveButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100 * SCALE,
    paddingVertical: 18 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    padding: 10,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 15.2,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalList: {
    maxHeight: 390,
    padding: 10,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 10,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
  },
  countryFlagModal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 15,
  },
  countryFlagEmojiModal: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    flex: 1,
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  applyButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
  },
});

export default EditProfile;

