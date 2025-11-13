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
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1; // Reduced scale for big phone design

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: '🇳🇬', flagImage: require('../../../assets/login/nigeria-flag.png') },
  { id: 2, name: 'Botswana', flag: '🇧🇼', flagImage: require('../../../assets/login/nigeria-flag.png') }, // Placeholder
  { id: 3, name: 'Ghana', flag: '🇬🇭', flagImage: require('../../../assets/login/nigeria-flag.png') }, // Placeholder
  { id: 4, name: 'Kenya', flag: '🇰🇪', flagImage: require('../../../assets/login/south-africa-flag.png') }, // Using available flag
  { id: 5, name: 'South Africa', flag: '🇿🇦', flagImage: require('../../../assets/login/south-africa-flag.png') },
  { id: 6, name: 'Tanzania', flag: '🇹🇿', flagImage: require('../../../assets/login/nigeria-flag.png') }, // Placeholder
  { id: 7, name: 'Uganda', flag: '🇺🇬', flagImage: require('../../../assets/login/nigeria-flag.png') }, // Placeholder
];

// Types for API integration
interface UserProfile {
  country: string;
  countryFlag: any;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar: any;
}

const EditProfile = () => {
  const navigation = useNavigation();
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(1);

  // Mock user profile data - Replace with API call
  const [profileData, setProfileData] = useState<UserProfile>({
    country: 'Nigeria',
    countryFlag: require('../../../assets/login/nigeria-flag.png'),
    firstName: 'Qamardeen',
    lastName: 'Abdul Malik',
    email: 'qamardeenoladimeji@gmail.com',
    phoneNumber: '07033484845',
    avatar: require('../../../assets/login/memoji.png'),
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

  const handleSave = () => {
    // TODO: Implement API call to save profile data
    console.log('Saving profile:', profileData);
    // After successful save, navigate back
    // navigation.goBack();
  };

  const handleCountrySelect = () => {
    // Initialize selectedCountryId based on current profile country
    const currentCountry = COUNTRIES.find((c) => c.name === profileData.country);
    if (currentCountry) {
      setSelectedCountryId(currentCountry.id);
    }
    setShowCountryModal(true);
  };

  const handleCountryChange = (countryId: number) => {
    setSelectedCountryId(countryId);
  };

  const handleApplyCountry = () => {
    if (selectedCountryId) {
      const selectedCountry = COUNTRIES.find((c) => c.id === selectedCountryId);
      if (selectedCountry) {
        setProfileData({
          ...profileData,
          country: selectedCountry.name,
          countryFlag: selectedCountry.flagImage,
        });
      }
    }
    setShowCountryModal(false);
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
        </View>

        {/* Profile Picture */}
        <View style={styles.profilePictureContainer}>
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
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          {/* Country Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Country</Text>
            <TouchableOpacity
              style={styles.inputField}
              onPress={handleCountrySelect}
            >
              <Image
                source={profileData.countryFlag}
                style={styles.countryFlag}
                resizeMode="cover"
              />
              <Text style={styles.inputText}>{profileData.country}</Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={24 * SCALE}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {/* First Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>First name</Text>
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
          </View>

          {/* Last Name Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Last name</Text>
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
          </View>

          {/* Email Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Email</Text>
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
              />
            </View>
          </View>

          {/* Phone Number Field */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Phone number</Text>
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
          </View>
        </View>

        {/* Warning Message */}
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            To edit your account...<Text style={styles.warningLink}>Contact Support</Text>
          </Text>
        </View>

        {/* Bottom spacing for Save button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save Button - Fixed at bottom */}
      <View style={styles.saveButtonContainer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>Save</Text>
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
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {COUNTRIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={styles.countryItem}
                  onPress={() => handleCountryChange(c.id)}
                >
                  <Image
                    source={c.flagImage}
                    style={styles.countryFlagModal}
                    resizeMode="cover"
                  />
                  <Text style={styles.countryName}>{c.name}</Text>
                  <MaterialCommunityIcons
                    name={selectedCountryId === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24}
                    color={selectedCountryId === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={handleApplyCountry}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
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
    paddingTop: 15 * 1,
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
    width: 26,
    height: 26,
    borderRadius: 13,
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

