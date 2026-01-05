import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Modal,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetCurrentUser } from '../../../queries/auth.queries';
import { getAccessToken, clearTokens } from '../../../utils/apiClient';
import { useLogout } from '../../../mutations/auth.mutations';
import { showErrorAlert, showConfirmAlert, showInfoAlert } from '../../../utils/customAlert';

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
  const [otherSessions, setOtherSessions] = useState<Device[]>([]);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);

  // Get current user data
  const { data: userData, isLoading: isLoadingUser, refetch: refetchUser } = useGetCurrentUser();

  // Get current access token to identify this session
  useEffect(() => {
    const loadCurrentToken = async () => {
      const token = await getAccessToken();
      setCurrentSessionToken(token);
    };
    loadCurrentToken();
  }, []);

  // Get current device information dynamically
  const currentDevice: Device = useMemo(() => {
    // Get device information from Platform API
    const osName = Platform.OS === 'ios' ? 'iOS' : 'Android';
    const osVersion = Platform.Version;
    
    // Format device name based on platform
    let deviceName = '';
    if (Platform.OS === 'ios') {
      // For iOS, use iPhone with version
      deviceName = `iPhone ${osVersion}`;
    } else {
      // For Android, use OS version
      deviceName = `Android Device ${osVersion}`;
    }

    // Get app version from app.json
    const appVersion = '1.0.0'; // From app.json version
    
    // Get location from user data if available, otherwise use default
    let location = 'Lagos, Nigeria'; // Default
    if (userData?.data?.user?.location) {
      location = userData.data.user.location;
    } else if (userData?.data?.location) {
      location = userData.data.location;
    }

    // Get user email/name for session identification
    const userEmail = userData?.data?.user?.email || userData?.data?.email || '';
    const userName = userData?.data?.user?.name || userData?.data?.name || '';

    return {
      id: currentSessionToken || 'current',
      name: deviceName,
      app: `RhinoxPay ${osName} ${appVersion}`,
      location: location,
      isCurrentDevice: true,
      lastUsed: new Date().toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }, [userData, currentSessionToken]);

  // Format date for last used
  const formatLastUsed = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Initialize sessions - for now, only show current session since there's no sessions API
  useEffect(() => {
    loadSessions();
  }, [userData, currentSessionToken]);

  const loadSessions = () => {
    // Since there's no sessions API endpoint, we only show the current logged-in session
    // Other sessions would need to be fetched from a sessions API endpoint
    // For now, we'll show an empty array for other sessions
    setOtherSessions([]);
    
    // TODO: When sessions API is available, fetch other sessions here
    // Example:
    // const response = await apiClient.get('/auth/sessions');
    // const sessions = response.data.data.sessions;
    // setOtherSessions(sessions.filter(s => s.id !== currentSessionToken));
  };

  const handleDevicePress = (device: Device) => {
    setSelectedSession(device);
    setShowSessionModal(true);
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[DevicesAndSessions] Refreshing sessions data...');
    try {
      // Reload user data and sessions
      await refetchUser();
      const token = await getAccessToken();
      setCurrentSessionToken(token);
      loadSessions();
      console.log('[DevicesAndSessions] Sessions data refreshed successfully');
    } catch (error) {
      console.error('[DevicesAndSessions] Error refreshing sessions data:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

  // Navigate to login screen
  const navigateToLogin = async () => {
    // Clear tokens from storage (even if logout API failed)
    await clearTokens();
    console.log('[DevicesAndSessions] Tokens cleared, navigating to Login...');
    
    // Navigate to Auth/Login screen
    const rootNavigation = navigation.getParent()?.getParent()?.getParent();
    if (rootNavigation) {
      rootNavigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'Auth' as never,
              params: {
                screen: 'Login' as never,
              },
            },
          ],
        })
      );
    } else {
      // Fallback: try to navigate directly
      try {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'Auth' as never,
                params: {
                  screen: 'Login' as never,
                },
              },
            ],
          })
        );
      } catch (error) {
        console.error('[DevicesAndSessions] Navigation error:', error);
        // Last resort: navigate to Auth
        (navigation as any).navigate('Auth', { screen: 'Login' });
      }
    }
  };

  // Logout mutation
  const logoutMutation = useLogout({
    onSuccess: async () => {
      console.log('[DevicesAndSessions] Logout successful');
      await navigateToLogin();
    },
    onError: async (error: any) => {
      console.error('[DevicesAndSessions] Logout error:', error);
      
      // If 401 error (token expired/invalid), still clear tokens and navigate to login
      if (error.status === 401 || error.message?.includes('not logged in') || error.message?.includes('expired')) {
        console.log('[DevicesAndSessions] Token expired or invalid (401), clearing tokens and navigating to login...');
        await navigateToLogin();
      } else {
        // For other errors, show alert but still try to navigate to login
        showErrorAlert(
          'Logout Failed',
          error.message || 'Failed to logout. You will be redirected to login.',
          async () => {
            await navigateToLogin();
          }
        );
      }
    },
  });

  const handleTerminateAll = () => {
    // For now, terminate all sessions means logout (since we only have current session)
    // TODO: When sessions API is available, implement terminate all sessions endpoint
    showConfirmAlert(
      'Terminate All Sessions',
      'This will log you out from all devices. Are you sure?',
      () => {
        logoutMutation.mutate();
      },
      undefined,
      'Terminate',
      'Cancel'
    );
  };

  const handleTerminateSession = () => {
    if (!selectedSession) return;

    // If it's the current device, logout
    if (selectedSession.isCurrentDevice || selectedSession.id === currentSessionToken || selectedSession.id === 'current') {
      showConfirmAlert(
        'Terminate Session',
        'This will log you out from this device. Are you sure?',
        () => {
          setShowSessionModal(false);
          setSelectedSession(null);
          logoutMutation.mutate();
        },
        () => {
          setShowSessionModal(false);
          setSelectedSession(null);
        },
        'Terminate',
        'Cancel'
      );
    } else {
      // For other sessions, when API is available
      // TODO: Implement API call to terminate specific session
      showInfoAlert(
        'Terminate Session',
        'This feature will be available when sessions API is implemented.',
        () => {
          setShowSessionModal(false);
          setSelectedSession(null);
        }
      );
    }
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
            {isLoadingUser ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={styles.loadingText}>Loading device information...</ThemedText>
              </View>
            ) : (
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
            )}
          </View>
        </View>

        {/* Other Sessions Section */}
        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>Other Sessions</ThemedText>
            {otherSessions.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <ThemedText style={styles.emptyStateText}>
                  No other active sessions found
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  When you log in from other devices, they will appear here
                </ThemedText>
              </View>
            ) : (
              otherSessions.map((session) => (
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
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Terminate All Sessions Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.terminateAllButton,
            logoutMutation.isPending && styles.terminateAllButtonDisabled
          ]}
          onPress={handleTerminateAll}
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? (
            <View style={styles.loadingButtonContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <ThemedText style={styles.terminateAllButtonText}>Logging out...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.terminateAllButtonText}>Terminate all sessions</ThemedText>
          )}
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
              style={[
                styles.terminateSessionButton,
                logoutMutation.isPending && styles.terminateSessionButtonDisabled
              ]}
              onPress={handleTerminateSession}
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#000000" />
                  <ThemedText style={styles.terminateSessionButtonText}>Logging out...</ThemedText>
                </View>
              ) : (
                <ThemedText style={styles.terminateSessionButtonText}>
                  {selectedSession?.isCurrentDevice ? 'Logout' : 'Terminate Session'}
                </ThemedText>
              )}
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
    paddingTop: 20 * SCALE,
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
  terminateAllButtonDisabled: {
    opacity: 0.6,
  },
  terminateSessionButtonDisabled: {
    opacity: 0.6,
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8 * SCALE,
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
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20 * SCALE,
  },
  loadingText: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 10 * SCALE,
  },
  emptyStateContainer: {
    paddingVertical: 30 * SCALE,
    paddingHorizontal: 20 * SCALE,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8 * SCALE,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});

export default DevicesAndSessions;

