import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: '🇳🇬' },
  { id: 2, name: 'Botswana', flag: '🇧🇼' },
  { id: 3, name: 'Ghana', flag: '🇬🇭' },
  { id: 4, name: 'Kenya', flag: '🇰🇪' },
  { id: 5, name: 'South Africa', flag: '🇿🇦' },
  { id: 6, name: 'Tanzania', flag: '🇹🇿' },
  { id: 7, name: 'Uganda', flag: '🇺🇬' },
];

const ID_TYPES = [
  { id: 1, name: 'International Passport' },
  { id: 2, name: 'National ID Card' },
  { id: 3, name: 'Voters Card' },
  { id: 4, name: 'Drivers License' },
];

const KYC = () => {
  const navigation = useNavigation();
  const [country, setCountry] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [dob, setDob] = useState('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showIDTypeModal, setShowIDTypeModal] = useState(false);
  const [showDOBModal, setShowDOBModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(null);
  const [selectedIDType, setSelectedIDType] = useState<number | null>(null);
  
  const [day, setDay] = useState('DD');
  const [month, setMonth] = useState('MM');
  const [year, setYear] = useState('YYYY');

  const handleProceed = () => {
    navigation.navigate('FacialRegister' as never);
  };

  const handleContinueLater = () => {
    console.log('Continue later');
  };

  const handleCountrySelect = (id: number, name: string) => {
    setSelectedCountry(id);
    setCountry(name);
  };

  const handleIDTypeSelect = (id: number, name: string) => {
    setSelectedIDType(id);
    setIdType(name);
  };

  const handleApplyCountry = () => {
    setShowCountryModal(false);
  };

  const handleApplyIDType = () => {
    setShowIDTypeModal(false);
  };

  const handleApplyDOB = () => {
    setDob(`${day}/${month}/${year}`);
    setShowDOBModal(false);
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
        <Text style={styles.headerTitle}>KYC Registration</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Shield Icon */}
        <View style={styles.iconContainer}>
        <Image
            source={require('../../assets/shield-tick.png')}
            style={styles.shieldIcon}
            resizeMode="contain"
          />        
        </View>

        {/* Title */}
        <Text style={styles.title}>Complete KYC Registration</Text>
        <Text style={styles.subtitle}>
          Complete your KYC registration to unlock full access
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar1} />
          <View style={styles.progressBar2} />
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          <View style={styles.formInner}>
            {/* Country */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Country</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={[styles.input, !country && styles.placeholderStyle]}>
                  {country || 'Select your country'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Input your first name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Input your last name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Middle Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Middle Name</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Input your Middle name (optional)"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={middleName}
                  onChangeText={setMiddleName}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of birth</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowDOBModal(true)}
              >
                <Text style={[styles.input, !dob && styles.placeholderStyle]}>
                  {dob || 'Enter your date of birth'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>

            {/* ID Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ID Type</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowIDTypeModal(true)}
              >
                <Text style={[styles.input, !idType && styles.placeholderStyle]}>
                  {idType || 'Select id type'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>

            {/* ID Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>ID Number</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Input id Number"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={idNumber}
                  onChangeText={setIdNumber}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
          <Text style={styles.proceedButtonText}>Proceed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.continueButton} onPress={handleContinueLater}>
          <Text style={styles.continueButtonText}>Continue Later</Text>
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
                  onPress={() => handleCountrySelect(c.id, c.name)}
                >
                  <Text style={styles.countryFlag}>{c.flag}</Text>
                  <Text style={styles.countryName}>{c.name}</Text>
                  <MaterialCommunityIcons
                    name={selectedCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24}
                    color={selectedCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCountry}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ID Type Modal */}
      <Modal
        visible={showIDTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowIDTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.idModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select ID Type</Text>
              <TouchableOpacity onPress={() => setShowIDTypeModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.idList}>
              {ID_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.idItem}
                  onPress={() => handleIDTypeSelect(type.id, type.name)}
                >
                  <Text style={styles.idName}>{type.name}</Text>
                  <MaterialCommunityIcons
                    name={selectedIDType === type.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24}
                    color={selectedIDType === type.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyIDType}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date of Birth Modal */}
      <Modal
        visible={showDOBModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDOBModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dobModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Date of birth</Text>
              <TouchableOpacity onPress={() => setShowDOBModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.dobSubtitle}>Select your date of birth</Text>
            <View style={styles.dobInputs}>
              <TouchableOpacity style={styles.dobInput}>
                <Text style={styles.dobText}>{day}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dobInput}>
                <Text style={styles.dobText}>{month}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.dobInputLarge}>
                <Text style={styles.dobText}>{year}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyDOB}>
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
    </View>
  );
};

export default KYC;

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
  headerTitle: {
    fontSize: 15.2, // 19 * 0.8
    fontWeight: '500',
    color: '#FFFFFF',
  },
  shieldIcon: {
    width: 50,
    height: 50,
  },
  scrollView: {
    flex: 1,
  },
  iconContainer: {
    position: 'absolute',
    right: 20,
    top: 0,
  },
  title: {
    fontSize: 15.2,
    fontWeight: '500',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 9.6, // 12 * 0.8
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  progressBar1: {
    flex: 1,
    height: 8,
    backgroundColor: '#A9EF45',
    borderRadius: 4,
  },
  progressBar2: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15,
    padding: 14,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  formInner: {
    // Additional styles if needed
  },
  inputGroup: {
    marginBottom: 21,
  },
  inputLabel: {
    fontSize: 11.2, // 14 * 0.8
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  input: {
    flex: 1,
    fontSize: 11.2,
    fontWeight: '300',
    color: '#FFFFFF',
    paddingVertical: 0,
  },
  placeholderStyle: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  proceedButton: {
    backgroundColor: '#A9EF45',
    height: 60,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  proceedButtonText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#000000',
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
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalTitle: {
    fontSize: 15.2,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  modalList: {
    maxHeight: 400,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  countryFlag: {
    fontSize: 20,
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
  idModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    height: 448,
  },
  idList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  idItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    marginBottom: 12,
  },
  idName: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  dobModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    height: 307,
  },
  dobSubtitle: {
    fontSize: 11.2,
    fontWeight: '400',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  dobInputs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 13,
    marginBottom: 20,
  },
  dobInput: {
    width: 91,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  dobInputLarge: {
    flex: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  dobText: {
    fontSize: 11.2,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
  },
});

