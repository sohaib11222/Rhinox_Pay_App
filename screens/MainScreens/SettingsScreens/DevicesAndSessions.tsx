import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ScrollView,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetUserSessions, UserSession } from '../../../queries/auth.queries';
import { clearTokensForLogout } from '../../../utils/apiClient';
import {
  useLogout,
  useRevokeUserSession,
  useRevokeOtherUserSessions,
} from '../../../mutations/auth.mutations';
import { showErrorAlert, showConfirmAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

const formatLastUsed = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const DevicesAndSessions = () => {
  const navigation = useNavigation();
  const [selectedSession, setSelectedSession] = useState<UserSession | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useGetUserSessions();

  const sessions = sessionsData?.data?.sessions ?? [];
  const currentSession = useMemo(
    () => sessions.find((session) => session.isCurrentDevice) ?? sessions[0] ?? null,
    [sessions]
  );
  const otherSessions = useMemo(
    () => sessions.filter((session) => !session.isCurrentDevice),
    [sessions]
  );

  const navigateToLogin = async () => {
    await clearTokensForLogout();

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
      return;
    }

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
      (navigation as any).navigate('Auth', { screen: 'Login' });
    }
  };

  const logoutMutation = useLogout({
    onSuccess: async () => {
      await navigateToLogin();
    },
    onError: async (error: any) => {
      if (
        error.status === 401 ||
        error.message?.includes('not logged in') ||
        error.message?.includes('expired')
      ) {
        await navigateToLogin();
        return;
      }

      showErrorAlert(
        'Logout Failed',
        error.message || 'Failed to logout. You will be redirected to login.',
        async () => {
          await navigateToLogin();
        }
      );
    },
  });

  const revokeSessionMutation = useRevokeUserSession({
    onSuccess: async (response) => {
      setShowSessionModal(false);
      setSelectedSession(null);
      await refetchSessions();

      if (response?.data?.revokedCurrentSession) {
        await navigateToLogin();
      }
    },
    onError: (error: any) => {
      showErrorAlert('Error', error.message || 'Failed to terminate session.');
    },
  });

  const revokeOtherSessionsMutation = useRevokeOtherUserSessions({
    onSuccess: async () => {
      await refetchSessions();
    },
    onError: (error: any) => {
      showErrorAlert('Error', error.message || 'Failed to terminate other sessions.');
    },
  });

  const handleRefresh = async () => {
    await refetchSessions();
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 1000,
  });

  const handleDevicePress = (device: UserSession) => {
    setSelectedSession(device);
    setShowSessionModal(true);
  };

  const handleTerminateAll = () => {
    if (otherSessions.length === 0) {
      showErrorAlert('No Other Sessions', 'There are no other active sessions to terminate.');
      return;
    }

    showConfirmAlert(
      'Terminate All Sessions',
      'This will log out all other devices. Your current session will stay active.',
      () => {
        revokeOtherSessionsMutation.mutate();
      },
      undefined,
      'Terminate',
      'Cancel'
    );
  };

  const handleTerminateSession = () => {
    if (!selectedSession) return;

    const isCurrent = selectedSession.isCurrentDevice;

    showConfirmAlert(
      isCurrent ? 'Logout' : 'Terminate Session',
      isCurrent
        ? 'This will log you out from this device. Are you sure?'
        : 'This will log out the selected device. Are you sure?',
      () => {
        if (isCurrent) {
          logoutMutation.mutate();
          return;
        }

        revokeSessionMutation.mutate(selectedSession.id);
      },
      () => {
        setShowSessionModal(false);
        setSelectedSession(null);
      },
      isCurrent ? 'Logout' : 'Terminate',
      'Cancel'
    );
  };

  const isActionPending =
    logoutMutation.isPending ||
    revokeSessionMutation.isPending ||
    revokeOtherSessionsMutation.isPending;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020C19" />

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

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>This Device</ThemedText>
            {isLoadingSessions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={styles.loadingText}>Loading device information...</ThemedText>
              </View>
            ) : currentSession ? (
              <TouchableOpacity
                style={styles.deviceCard}
                onPress={() => handleDevicePress(currentSession)}
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
                  <ThemedText style={styles.deviceName}>{currentSession.name}</ThemedText>
                  <ThemedText style={styles.deviceApp}>{currentSession.app}</ThemedText>
                </View>
                <ThemedText style={styles.deviceLocation}>{currentSession.location}</ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.emptyStateContainer}>
                <ThemedText style={styles.emptyStateText}>No active session found</ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>Other Sessions</ThemedText>
            {isLoadingSessions ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#A9EF45" />
                <ThemedText style={styles.loadingText}>Loading sessions...</ThemedText>
              </View>
            ) : otherSessions.length === 0 ? (
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

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.terminateAllButton,
            (isActionPending || otherSessions.length === 0) && styles.terminateAllButtonDisabled,
          ]}
          onPress={handleTerminateAll}
          disabled={isActionPending || otherSessions.length === 0}
        >
          {revokeOtherSessionsMutation.isPending ? (
            <View style={styles.loadingButtonContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <ThemedText style={styles.terminateAllButtonText}>Terminating...</ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.terminateAllButtonText}>Terminate all sessions</ThemedText>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSessionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Session</ThemedText>
              <TouchableOpacity onPress={() => setShowSessionModal(false)}>
                <View style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={20} color="#000" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <MaterialCommunityIcons name="cellphone" size={60} color="#A9EF45" />
              </View>
            </View>

            <View style={styles.sessionDetails}>
              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons name="cellphone-lock" size={24} color="#A9EF45" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Device</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSession?.name || 'Unknown device'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons name="map-marker" size={24} color="#A9EF45" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Location</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSession?.location || 'Unknown location'}
                  </ThemedText>
                </View>
              </View>

              <View style={styles.detailCard}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons name="calendar-clock" size={24} color="#A9EF45" />
                </View>
                <View style={styles.detailContent}>
                  <ThemedText style={styles.detailLabel}>Last Used</ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {selectedSession?.lastUsed
                      ? formatLastUsed(selectedSession.lastUsed)
                      : 'Unknown'}
                  </ThemedText>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.terminateSessionButton,
                isActionPending && styles.terminateSessionButtonDisabled,
              ]}
              onPress={handleTerminateSession}
              disabled={isActionPending}
            >
              {isActionPending ? (
                <View style={styles.loadingButtonContainer}>
                  <ActivityIndicator size="small" color="#000000" />
                  <ThemedText style={styles.terminateSessionButtonText}>
                    {selectedSession?.isCurrentDevice ? 'Logging out...' : 'Terminating...'}
                  </ThemedText>
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
    paddingTop: 50 * SCALE,
    paddingBottom: 16 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40 * SCALE,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120 * SCALE,
  },
  iconSection: {
    alignItems: 'center',
    paddingVertical: 24 * SCALE,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
  },
  iconCircle: {
    width: 80 * SCALE,
    height: 80 * SCALE,
    borderRadius: 40 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16 * SCALE,
  },
  phoneIcon: {
    width: 32 * SCALE,
    height: 48 * SCALE,
    alignItems: 'center',
  },
  phoneBody: {
    width: 28 * SCALE,
    height: 44 * SCALE,
    borderRadius: 6 * SCALE,
    borderWidth: 2,
    borderColor: '#A9EF45',
  },
  phoneLine: {
    width: 10 * SCALE,
    height: 2 * SCALE,
    backgroundColor: '#A9EF45',
    marginTop: 4 * SCALE,
    borderRadius: 1,
  },
  descriptionText: {
    fontSize: 14 * SCALE,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 16 * SCALE,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 16 * SCALE,
    padding: 16 * SCALE,
  },
  sectionTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12 * SCALE,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 * SCALE,
    paddingVertical: 16 * SCALE,
  },
  loadingText: {
    fontSize: 13 * SCALE,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF0D',
    borderRadius: 12 * SCALE,
    padding: 14 * SCALE,
    marginBottom: 10 * SCALE,
  },
  deviceIconContainer: {
    width: 44 * SCALE,
    height: 44 * SCALE,
    borderRadius: 10 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 * SCALE,
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    bottom: 4 * SCALE,
    right: 4 * SCALE,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  deviceApp: {
    fontSize: 12 * SCALE,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  deviceLocation: {
    fontSize: 11 * SCALE,
    color: 'rgba(255, 255, 255, 0.5)',
    maxWidth: 90 * SCALE,
    textAlign: 'right',
  },
  emptyStateContainer: {
    paddingVertical: 20 * SCALE,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13 * SCALE,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 11 * SCALE,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    marginTop: 6 * SCALE,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingBottom: 24 * SCALE,
    paddingTop: 12 * SCALE,
    backgroundColor: '#020C19',
  },
  terminateAllButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 16 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateAllButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  terminateAllButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
  loadingButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0A1628',
    borderTopLeftRadius: 24 * SCALE,
    borderTopRightRadius: 24 * SCALE,
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 32 * SCALE,
    paddingTop: 16 * SCALE,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20 * SCALE,
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 24 * SCALE,
  },
  modalIconCircle: {
    width: 100 * SCALE,
    height: 100 * SCALE,
    borderRadius: 50 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionDetails: {
    gap: 12 * SCALE,
    marginBottom: 24 * SCALE,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF08',
    borderRadius: 12 * SCALE,
    padding: 14 * SCALE,
  },
  detailIcon: {
    width: 44 * SCALE,
    height: 44 * SCALE,
    borderRadius: 10 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12 * SCALE,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12 * SCALE,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 4 * SCALE,
  },
  detailValue: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  terminateSessionButton: {
    backgroundColor: '#A9EF45',
    borderRadius: 100,
    paddingVertical: 16 * SCALE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  terminateSessionButtonDisabled: {
    backgroundColor: 'rgba(169, 239, 69, 0.3)',
  },
  terminateSessionButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '600',
    color: '#000000',
  },
});

export default DevicesAndSessions;
