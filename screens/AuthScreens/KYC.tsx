import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Modal,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemedText } from '../../components';
import { useSubmitKYC } from '../../mutations/kyc.mutations';
import { useGetCountries } from '../../queries/country.queries';
import { useGetKYCStatus } from '../../queries/kyc.queries';
import { API_BASE_URL } from '../../utils/apiConfig';
import { showSuccessAlert, showErrorAlert, showWarningAlert } from '../../utils/customAlert';

const ID_TYPES = [
  { id: 1, name: 'International Passport', apiValue: 'passport' },
  { id: 2, name: 'National ID Card', apiValue: 'national_id' },
  { id: 3, name: 'Voters Card', apiValue: 'voters_card' },
  { id: 4, name: 'Drivers License', apiValue: 'drivers_license' },
];

interface Country {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}

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

  // Fetch countries from API
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useGetCountries({
    queryKey: ['countries'],
    retry: 2,
    retryDelay: 1000,
  });

  const countries: Country[] = countriesData?.data || [];

  // Fetch KYC status to check if already verified
  const { data: kycStatusData, isLoading: isLoadingKYCStatus } = useGetKYCStatus();

  // Determine KYC status from API
  const kycStatus = kycStatusData?.data?.status || kycStatusData?.data?.kycStatus || 'not_done';
  const kycStatusLower = (kycStatus as string).toLowerCase();
  
  // Check if KYC is already verified/approved
  const isKYCVerified = kycStatusLower === 'approved' || kycStatusLower === 'verified' || kycStatusLower === 'complete';
  const isKYCPending = kycStatusLower === 'pending' || kycStatusLower === 'under_review' || kycStatusLower === 'submitted';
  
  const [day, setDay] = useState('DD');
  const [month, setMonth] = useState('MM');
  const [year, setYear] = useState('YYYY');
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  
  // Generate days (1-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  
  // Generate months (1-12)
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  
  // Generate years (current year back to 100 years ago)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  // KYC Submission Mutation
  const submitKYCMutation = useSubmitKYC({
    onSuccess: (data) => {
      console.log('[KYC] Submission successful:', JSON.stringify(data, null, 2));
      showSuccessAlert(
        'KYC Submitted',
        'Your KYC information has been submitted successfully.',
        () => {
          navigation.navigate('FacialRegister' as never);
        }
      );
    },
    onError: (error: any) => {
      console.error('[KYC] Submission error:', error);
      showErrorAlert(
        'Submission Failed',
        error.message || 'Failed to submit KYC information. Please try again.'
      );
    },
  });

  // Check if form is valid
  const isFormValid = () => {
    return (
      selectedCountry !== null &&
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      dob.length > 0 &&
      selectedIDType !== null &&
      idNumber.trim().length > 0
    );
  };

  // Format date from DD/MM/YYYY to YYYY-MM-DD
  const formatDateForAPI = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  };

  // Get API value for ID type
  const getIDTypeAPIValue = (): string => {
    const selectedType = ID_TYPES.find(type => type.id === selectedIDType);
    return selectedType?.apiValue || '';
  };

  const handleProceed = () => {
    // Prevent submission if already verified
    if (isKYCVerified) {
      showWarningAlert(
        'KYC Already Verified',
        'Your KYC has already been verified. You cannot submit it again.'
      );
      return;
    }

    // Prevent submission if pending
    if (isKYCPending) {
      showWarningAlert(
        'KYC Under Review',
        'Your KYC submission is currently under review. Please wait for approval before submitting again.'
      );
      return;
    }

    if (!isFormValid()) {
      showWarningAlert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    // Format date of birth
    const formattedDate = formatDateForAPI(dob);
    const idTypeAPIValue = getIDTypeAPIValue();

    // Prepare KYC data
    const kycData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      middleName: middleName.trim() || undefined,
      dateOfBirth: formattedDate,
      idType: idTypeAPIValue,
      idNumber: idNumber.trim(),
      countryId: selectedCountry!,
      // idDocumentUrl will be added later with file upload functionality
    };

    console.log('[KYC] Submitting KYC data:', JSON.stringify(kycData, null, 2));
    submitKYCMutation.mutate(kycData);
  };

  const handleContinueLater = () => {
    console.log('Continue later');
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country.id);
    setCountry(country.name);
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
    if (day !== 'DD' && month !== 'MM' && year !== 'YYYY') {
      setDob(`${day}/${month}/${year}`);
      setShowDOBModal(false);
    }
  };

  const handleDaySelect = (selectedDay: string) => {
    setDay(selectedDay);
    setShowDayPicker(false);
  };

  const handleMonthSelect = (selectedMonth: string) => {
    setMonth(selectedMonth);
    setShowMonthPicker(false);
  };

  const handleYearSelect = (selectedYear: string) => {
    setYear(selectedYear);
    setShowYearPicker(false);
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
        <ThemedText style={styles.headerTitle}>KYC Registration</ThemedText>
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
        <ThemedText style={styles.title}>Complete KYC Registration</ThemedText>
        <ThemedText style={styles.subtitle}>
          {isKYCVerified 
            ? 'Your KYC has been verified. You have full access to all features.'
            : isKYCPending
            ? 'Your KYC submission is under review. Please wait for approval.'
            : 'Complete your KYC registration to unlock full access'
          }
        </ThemedText>

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
              <ThemedText style={styles.inputLabel}>Country</ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, (isKYCVerified || isKYCPending) && styles.inputDisabled]}
                onPress={() => !isKYCVerified && !isKYCPending && setShowCountryModal(true)}
                disabled={isKYCVerified || isKYCPending}
              >
                <ThemedText style={[styles.input, !country && styles.placeholderStyle]}>
                  {country || 'Select your country'}
                </ThemedText>
                {!isKYCVerified && !isKYCPending && (
                  <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.5)" />
                )}
              </TouchableOpacity>
            </View>

            {/* First Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>First Name</ThemedText>
              <View style={[styles.inputWrapper, (isKYCVerified || isKYCPending) && styles.inputDisabled]}>
                <TextInput
                  style={styles.input}
                  placeholder="Input your first name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={!isKYCVerified && !isKYCPending}
                />
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Last Name</ThemedText>
              <View style={[styles.inputWrapper, (isKYCVerified || isKYCPending) && styles.inputDisabled]}>
                <TextInput
                  style={styles.input}
                  placeholder="Input your last name"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!isKYCVerified && !isKYCPending}
                />
              </View>
            </View>

            {/* Middle Name */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Middle Name</ThemedText>
              <View style={[styles.inputWrapper, (isKYCVerified || isKYCPending) && styles.inputDisabled]}>
                <TextInput
                  style={styles.input}
                  placeholder="Input your Middle name (optional)"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={middleName}
                  onChangeText={setMiddleName}
                  editable={!isKYCVerified && !isKYCPending}
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>Date of birth</ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, (isKYCVerified || isKYCPending) && styles.inputDisabled]}
                onPress={() => !isKYCVerified && !isKYCPending && setShowDOBModal(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                disabled={isKYCVerified || isKYCPending}
              >
                <ThemedText 
                  style={[styles.input, !dob && styles.placeholderStyle]}
                  pointerEvents="none"
                >
                  {dob || 'Enter your date of birth'}
                </ThemedText>
                {!isKYCVerified && !isKYCPending && (
                  <View pointerEvents="none">
                    <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.5)" />
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ID Type */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>ID Type</ThemedText>
              <TouchableOpacity
                style={[styles.inputWrapper, (isKYCVerified || isKYCPending) && styles.inputDisabled]}
                onPress={() => !isKYCVerified && !isKYCPending && setShowIDTypeModal(true)}
                disabled={isKYCVerified || isKYCPending}
              >
                <ThemedText style={[styles.input, !idType && styles.placeholderStyle]}>
                  {idType || 'Select id type'}
                </ThemedText>
                {!isKYCVerified && !isKYCPending && (
                  <MaterialCommunityIcons name="chevron-down" size={24} color="rgba(255, 255, 255, 0.5)" />
                )}
              </TouchableOpacity>
            </View>

            {/* ID Number */}
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>ID Number</ThemedText>
              <View style={[styles.inputWrapper, (isKYCVerified || isKYCPending) && styles.inputDisabled]}>
                <TextInput
                  style={styles.input}
                  placeholder="Input id Number"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={idNumber}
                  onChangeText={setIdNumber}
                  editable={!isKYCVerified && !isKYCPending}
                />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.proceedButton,
            (!isFormValid() || submitKYCMutation.isPending || isKYCVerified || isKYCPending || isLoadingKYCStatus) && styles.proceedButtonDisabled,
          ]}
          onPress={handleProceed}
          disabled={!isFormValid() || submitKYCMutation.isPending || isKYCVerified || isKYCPending || isLoadingKYCStatus}
        >
          {submitKYCMutation.isPending ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <ThemedText style={styles.proceedButtonText}>
              {isKYCVerified ? 'Already Verified' : isKYCPending ? 'Under Review' : 'Proceed'}
            </ThemedText>
          )}
        </TouchableOpacity>
        
        {!isKYCVerified && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinueLater}
            disabled={submitKYCMutation.isPending || isKYCPending}
          >
            <ThemedText style={styles.continueButtonText}>Continue Later</ThemedText>
          </TouchableOpacity>
        )}
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
            <ScrollView style={styles.modalList}>
              {countriesLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#A9EF45" />
                  <ThemedText style={styles.loadingText}>Loading countries...</ThemedText>
                </View>
              ) : countriesError ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>
                    Failed to load countries. Please try again.
                  </ThemedText>
                </View>
              ) : countries.length === 0 ? (
                <View style={styles.errorContainer}>
                  <ThemedText style={styles.errorText}>No countries available</ThemedText>
                </View>
              ) : (
                countries.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.countryItem}
                    onPress={() => handleCountrySelect(c)}
                  >
                    {c.flag ? (
                      <Image
                        source={{
                          uri: c.flag.startsWith('/')
                            ? `${API_BASE_URL.replace('/api', '')}${c.flag}`
                            : c.flag,
                        }}
                        style={styles.countryFlagImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <ThemedText style={styles.countryFlag}>{c.code}</ThemedText>
                    )}
                    <ThemedText style={styles.countryName}>{c.name}</ThemedText>
                    <MaterialCommunityIcons
                      name={selectedCountry === c.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={selectedCountry === c.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                    />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyCountry}>
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
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
              <ThemedText style={styles.modalTitle}>Select ID Type</ThemedText>
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
                  <ThemedText style={styles.idName}>{type.name}</ThemedText>
                  <MaterialCommunityIcons
                    name={selectedIDType === type.id ? 'radiobox-marked' : 'radiobox-blank'}
                    size={24}
                    color={selectedIDType === type.id ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyIDType}>
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
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
              <ThemedText style={styles.modalTitle}>Date of birth</ThemedText>
              <TouchableOpacity onPress={() => setShowDOBModal(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ThemedText style={styles.dobSubtitle}>Select your date of birth</ThemedText>
            <View style={styles.dobInputs}>
              <TouchableOpacity
                style={styles.dobInput}
                onPress={() => setShowDayPicker(true)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.dobText, day !== 'DD' && styles.dobTextSelected]}>
                  {day}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dobInput}
                onPress={() => setShowMonthPicker(true)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.dobText, month !== 'MM' && styles.dobTextSelected]}>
                  {month === 'MM' ? month : months.find(m => m.value === month)?.label || month}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dobInputLarge}
                onPress={() => setShowYearPicker(true)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.dobText, year !== 'YYYY' && styles.dobTextSelected]}>
                  {year}
                </ThemedText>
                <MaterialCommunityIcons name="chevron-down" size={16} color="rgba(255, 255, 255, 0.5)" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[
                styles.applyButton,
                (day === 'DD' || month === 'MM' || year === 'YYYY') && styles.applyButtonDisabled,
              ]}
              onPress={handleApplyDOB}
              disabled={day === 'DD' || month === 'MM' || year === 'YYYY'}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Day Picker Modal */}
      <Modal
        visible={showDayPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDayPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Day</ThemedText>
              <TouchableOpacity onPress={() => setShowDayPicker(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {days.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.pickerItem}
                  onPress={() => handleDaySelect(d)}
                >
                  <ThemedText
                    style={[
                      styles.pickerItemText,
                      day === d && styles.pickerItemTextSelected,
                    ]}
                  >
                    {d}
                  </ThemedText>
                  {day === d && (
                    <MaterialCommunityIcons name="check" size={20} color="#A9EF45" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Month</ThemedText>
              <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {months.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={styles.pickerItem}
                  onPress={() => handleMonthSelect(m.value)}
                >
                  <ThemedText
                    style={[
                      styles.pickerItemText,
                      month === m.value && styles.pickerItemTextSelected,
                    ]}
                  >
                    {m.label}
                  </ThemedText>
                  {month === m.value && (
                    <MaterialCommunityIcons name="check" size={20} color="#A9EF45" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select Year</ThemedText>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {years.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={styles.pickerItem}
                  onPress={() => handleYearSelect(y)}
                >
                  <ThemedText
                    style={[
                      styles.pickerItemText,
                      year === y && styles.pickerItemTextSelected,
                    ]}
                  >
                    {y}
                  </ThemedText>
                  {year === y && (
                    <MaterialCommunityIcons name="check" size={20} color="#A9EF45" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  inputDisabled: {
    opacity: 0.5,
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
  proceedButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
    opacity: 0.5,
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
  countryFlagImage: {
    width: 30,
    height: 20,
    marginRight: 15,
    borderRadius: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 11.2,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 10,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 11.2,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
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
  dobTextSelected: {
    color: '#FFFFFF',
  },
  applyButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
    opacity: 0.5,
  },
  pickerModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  pickerList: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pickerItemTextSelected: {
    color: '#A9EF45',
    fontWeight: '500',
  },
});

