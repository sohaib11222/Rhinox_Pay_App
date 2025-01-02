import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface Device {
  id: string;
  name: string;
  app: string;
  location: string;
  isCurrentDevice: boolean;
  lastUsed?: string;
}

const DevicesAndSessions = () => {
  const navigation = useNavigation();
  const [selectedSession, setSelectedSession] = useState<Device | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Mock data - Replace with API call
  const currentDevice: Device = {
    id: '1',
    name: 'iPhone 15 Pro Max',
    app: 'RhinoxPay Android 0.0.1',
    location: 'Lagos, Nigeria',
    isCurrentDevice: true,
  };

  const otherSessions: Device[] = [
    {
      id: '2',
      name: 'iPhone 15 Pro Max',
      app: 'RhinoxPay Android 0.0.1',
      location: 'Lagos, Nigeria',
      isCurrentDevice: false,
      lastUsed: '15th Oct, 2025 - 07:22 AM',
    },
    {
      id: '3',
      name: 'iPhone 15 Pro Max',
      app: 'RhinoxPay Android 0.0.1',
      location: 'Lagos, Nigeria',
      isCurrentDevice: false,
      lastUsed: '15th Oct, 2025 - 07:22 AM',
    },
    {
      id: '4',
      name: 'iPhone 15 Pro Max',
      app: 'RhinoxPay Android 0.0.1',
      location: 'Lagos, Nigeria',
      isCurrentDevice: false,
      lastUsed: '15th Oct, 2025 - 07:22 AM',
    },
  ];

  const handleDevicePress = (device: Device) => {
    setSelectedSession(device);
    setShowSessionModal(true);
  };

  const handleTerminateAll = () => {
    // TODO: Implement API call to terminate all sessions
    console.log('Terminate all sessions');
  };

  const handleTerminateSession = () => {
    // TODO: Implement API call to terminate selected session
    console.log('Terminate session:', selectedSession?.id);
    setShowSessionModal(false);
    setSelectedSession(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020C19" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Devices & Sessions</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Central Icon and Description */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <View style={styles.phoneIcon}>
              <View style={styles.phoneBody} />
              <View style={styles.phoneLine} />
            </View>
          </View>
          <ThemedText style={styles.descriptionText}>
            Manage your account devices and sessions
          </ThemedText>
        </View>

        {/* This Device Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>This Device</ThemedText>
            <TouchableOpacity
              style={styles.deviceCard}
              onPress={() => handleDevicePress(currentDevice)}
            >
              <View style={styles.deviceIconContainer}>
                <MaterialCommunityIcons name="cellphone" size={24} color="#A9EF45" />
                <MaterialCommunityIcons
                  name="lock"
                  size={12}
                  color="#A9EF45"
                  style={styles.lockIcon}
                />
              </View>
              <View style={styles.deviceInfo}>
                <ThemedText style={styles.deviceName}>{currentDevice.name}</ThemedText>
                <ThemedText style={styles.deviceApp}>{currentDevice.app}</ThemedText>
              </View>
              <ThemedText style={styles.deviceLocation}>{currentDevice.location}</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Other Sessions Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>Other Sessions</ThemedText>
            {otherSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.deviceCard}
                onPress={() => handleDevicePress(session)}
              >
                <View style={styles.deviceIconContainer}>
                  <MaterialCommunityIcons name="cellphone" size={24} color="#A9EF45" />
                  <MaterialCommunityIcons
                    name="lock"
                    size={12}
                    color="#A9EF45"
                    style={styles.lockIcon}
                  />
                </View>
                <View style={styles.deviceInfo}>
                  <ThemedText style={styles.deviceName}>{session.name}</ThemedText>
                  <ThemedText style={styles.deviceApp}>{session.app}</ThemedText>
                </View>
                <ThemedText style={styles.deviceLocation}>{session.location}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Terminate All Sessions Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.terminateAllButton}
          onPress={handleTerminateAll}
        >
          <ThemedText style={styles.terminateAllButtonText}>Terminate all sessions</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Session Detail Modal */}
      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Session</ThemedText>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <View style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={20} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Central Device Icon */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <MaterialCommunityIcons name="cellphone" size={60} color="#A9EF45" />
              </View>
            </View>

            {/* Session Details */}
            <View style={styles.sessionDetails}>
              {/* Device Card */}
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons
                    name="cellphone-lock"
                    size={24}
                    color="#A9EF45"
                  />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Device</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSession?.name || 'iPhone 15 Pro Max'}
                  </ThemedText>
                </View>
              </View>

              {/* Location Card */}
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={24}
                    color="#A9EF45"
                  />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Location</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSession?.location || 'Lagos, Nigeria'}
                  </ThemedText>
                </View>
              </View>

              {/* Last Used Card */}
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={24}
                    color="#A9EF45"
                  />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Last Used</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSession?.lastUsed || '15th Oct, 2025 - 07:22 AM'}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Terminate Session Button */}
            <TouchableOpacity
              style={styles.terminateSessionButton}
              onPress={handleTerminateSession}
            >
              <ThemedText style={styles.terminateSessionButtonText}>Terminate Session</ThemedText>
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
    backgroundColor: '#020C19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 20 * SCALE,
    paddingBottom: 16 * SCALE,
    backgroundColor: '#020C19',
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40 * SCALE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100 * SCALE,
  },
  iconSection: {
    alignItems: 'center',
    paddingVertical: 40 * SCALE,
  },
  iconCircle: {
    width: 120 * SCALE,
    height: 120 * SCALE,
    borderRadius: 60 * SCALE,
    backgroundColor: '#0A1520',
    borderWidth: 2,
    borderColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20 * SCALE,
  },
  phoneIcon: {
    width: 50 * SCALE,
    height: 70 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  phoneBody: {
    width: 35 * SCALE,
    height: 55 * SCALE,
    backgroundColor: '#A9EF45',
    borderRadius: 6 * SCALE,
    borderWidth: 2,
    borderColor: '#A9EF45',
  },
  phoneLine: {
    width: 25 * SCALE,
    height: 3 * SCALE,
    backgroundColor: '#A9EF45',
    marginTop: 6 * SCALE,
    borderRadius: 2 * SCALE,
  },
  descriptionText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 40 * SCALE,
  },
  section: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 16 * SCALE,
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
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    paddingVertical: 8 * SCALE,
    paddingHorizontal: 8 * SCALE,
    minHeight: 60 * SCALE,
    marginBottom: 10 * SCALE,
  },
  deviceIconContainer: {
    width: 45 * SCALE,
    height: 44 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 5 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14 * SCALE,
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  deviceApp: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  deviceLocation: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingBottom: 30 * SCALE,
    paddingTop: 20 * SCALE,
    backgroundColor: '#020C19',
  },
  terminateAllButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 25 * SCALE,
    paddingVertical: 16 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateAllButtonText: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#020C19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingBottom: 40 * SCALE,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  modalTitle: {
    fontSize: 18 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32 * SCALE,
    height: 32 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconContainer: {
    alignItems: 'center',
    marginVertical: 30 * SCALE,
  },
  modalIconCircle: {
    width: 140 * SCALE,
    height: 140 * SCALE,
    borderRadius: 70 * SCALE,
    backgroundColor: '#0A1520',
    borderWidth: 2,
    borderColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDetails: {
    paddingHorizontal: 20 * SCALE,
    marginBottom: 30 * SCALE,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 10 * SCALE,
    paddingVertical: 8 * SCALE,
    paddingHorizontal: 8 * SCALE,
    minHeight: 60 * SCALE,
    marginBottom: 10 * SCALE,
  },
  detailIcon: {
    width: 45 * SCALE,
    height: 44 * SCALE,
    backgroundColor: '#FFFFFF08',
    borderRadius: 5 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14 * SCALE,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 4 * SCALE,
  },
  detailValue: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  terminateSessionButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 25 * SCALE,
    paddingVertical: 16 * SCALE,
    marginHorizontal: 20 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateSessionButtonText: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
});

export default DevicesAndSessions;

