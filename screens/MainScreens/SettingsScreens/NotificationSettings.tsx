import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemedText } from '../../../components';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface NotificationOption {
  id: string;
  title: string;
  enabled: boolean;
}

const NotificationSettings = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<NotificationOption[]>([
    {
      id: 'push',
      title: 'Push Notifications',
      enabled: true,
    },
    {
      id: 'rate',
      title: 'Rate Alerts',
      enabled: true,
    },
    {
      id: 'deals',
      title: 'Latest Deals alerts',
      enabled: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
    // TODO: Implement API call to save notification preferences
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A2D50" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Notification Settings</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* Notifications Card */}
      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {/* Section Title */}
          <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          
          {/* Notification Options */}
          {notifications.map((notification, index) => (
            <View key={notification.id}>
              <View style={styles.notificationItem}>
                <ThemedText style={styles.notificationTitle}>
                  {notification.title}
                </ThemedText>
                <Switch
                  value={notification.enabled}
                  onValueChange={() => handleToggle(notification.id)}
                  trackColor={{ false: '#3E3E3E', true: '#A9EF45' }}
                  thumbColor={notification.enabled ? '#FFFFFF' : '#F4F3F4'}
                  ios_backgroundColor="#3E3E3E"
                />
              </View>
              {index < notifications.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      </View>
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
    backgroundColor:'#020C19'
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
  cardContainer: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    paddingTop: 20 * SCALE,
  },
  card: {
    backgroundColor: '#FFFFFF08',
    borderRadius: 15 * SCALE,
    paddingVertical: 16 * SCALE,
    paddingHorizontal: 16 * SCALE,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 14 * SCALE,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16 * SCALE,
    paddingHorizontal: 4 * SCALE,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9 * SCALE,
    paddingHorizontal: 10 * SCALE,
    backgroundColor:'#FFFFFF08',
    marginBottom:10,
    padding:10,
    borderWidth:0.3,
    borderRadius:10,
    borderColor:'#FFFFFF33'

    
  },
  notificationTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    flex: 1,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginLeft: 4 * SCALE,
    marginRight: 4 * SCALE,
  },
});

export default NotificationSettings;
