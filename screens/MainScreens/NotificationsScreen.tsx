import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 1;

interface Notification {
  id: string;
  type: 'transaction' | 'general';
  icon: any;
  iconType: 'navigation' | 'user-multiple' | 'arrow-reload' | 'general';
  title: string;
  amount?: string;
  status?: string;
  description?: string;
  date: string;
  hasViewTransaction?: boolean;
  image?: any;
}

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'all' | 'general' | 'transactions'>('all');

  // Hide bottom tab bar when focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderTopWidth: 0,
              height: 75 * SCALE,
              paddingBottom: 10,
              paddingTop: 0,
              position: 'absolute',
              bottom: 26 * SCALE,
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

  // Sample notification data - TODO: Replace with API call
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'transaction',
      icon: require('../../assets/Vector (40).png'),
      iconType: 'navigation',
      title: 'Bank Transfer Successful',
      amount: 'N50,000',
      status: 'Success',
      date: '20 Oct, 2025',
      hasViewTransaction: true,
    },
    {
      id: '2',
      type: 'transaction',
      icon: require('../../assets/user-multiple.png'),
      iconType: 'user-multiple',
      title: 'P2P Transaction completed',
      amount: 'N50,000',
      status: 'Success',
      date: '20 Oct, 2025',
      hasViewTransaction: true,
    },
    {
      id: '3',
      type: 'transaction',
      icon: require('../../assets/arrow-reload-horizontal.png'),
      iconType: 'arrow-reload',
      title: 'NGN - GHC conversion completed',
      amount: 'N50,000',
      status: 'Success',
      date: '20 Oct, 2025',
      hasViewTransaction: true,
    },
    {
      id: '4',
      type: 'general',
      icon: require('../../assets/Group 49.png'),
      iconType: 'general',
      title: 'Get the best service',
      description: 'Get the best service on rhinoxpay, swap easily between currencies and buy crypto easily via p2p',
      date: '20 Oct, 2025',
    },
    {
      id: '5',
      type: 'general',
      icon: require('../../assets/Group 49.png'),
      iconType: 'general',
      title: 'Get the best service',
      description: 'Get the best service on rhinoxpay, swap easily between currencies and buy crypto easily via p2p',
      date: '20 Oct, 2025',
      image: require('../../assets/CoinVertical.png'),
    },
  ]);

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'general') return notification.type === 'general';
    if (activeTab === 'transactions') return notification.type === 'transaction';
    return true;
  });

  const handleViewTransaction = (notification: Notification) => {
    // TODO: Navigate to transaction details
    console.log('View transaction:', notification.id);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="chevron-left" size={24 * SCALE} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'general' && styles.tabActive]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>
            General
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transactions' && styles.tabActive]}
          onPress={() => setActiveTab('transactions')}
        >
          <Text style={[styles.tabText, activeTab === 'transactions' && styles.tabTextActive]}>
            Transactions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.notificationsCard}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.notificationsContainer}>
            {filteredNotifications.map((notification) => {
              const itemHeight = notification.type === 'transaction' 
                ? 185 * SCALE 
                : notification.image 
                  ? 150 * SCALE 
                  : 135 * SCALE;
              
              return (
                <View 
                  key={notification.id} 
                  style={[
                    styles.notificationItem,
                    { height: itemHeight }
                  ]}
                >
                  {/* Icon */}
                  <View style={styles.notificationIconContainer}>
                    <View style={[
                      styles.notificationIconCircle,
                      notification.type === 'general' && styles.notificationIconCircleGeneral
                    ]}>
                      <Image
                        source={notification.icon}
                        style={styles.notificationIconImage}
                        resizeMode="contain"
                      />
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.notificationContent}>
                    {notification.type === 'transaction' ? (
                      <>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {notification.status && (
                          <Text style={styles.notificationStatus}>{notification.status}</Text>
                        )}
                        {notification.amount && (
                          <Text style={styles.notificationAmount}>{notification.amount}</Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        {notification.image ? (
                          <View style={styles.descriptionWithImageContainer}>
                            <Image
                              source={notification.image}
                              style={styles.notificationImage}
                              resizeMode="cover"
                            />
                            <Text style={styles.notificationDescription}>
                              {notification.description}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.notificationDescription}>
                            {notification.description}
                          </Text>
                        )}
                      </>
                    )}
                  </View>

                  {/* Footer */}
                  <View style={[
                    styles.notificationFooter,
                    notification.type === 'general' && styles.notificationFooterGeneral
                  ]}>
                    <Text style={styles.notificationDate}>{notification.date}</Text>
                    {notification.hasViewTransaction && (
                      <TouchableOpacity onPress={() => handleViewTransaction(notification)}>
                        <Text style={styles.viewTransactionText}>View Transaction</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 15 * SCALE,
    paddingBottom: 20 * SCALE,
    position: 'relative',
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    zIndex: 1,
  },
  iconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: '#FFFFFF08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 22 * SCALE,
    marginTop: 5 * SCALE,
    marginBottom: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 100 * SCALE,
    padding: 4 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12 * SCALE,
    alignItems: 'center',
    borderRadius: 100 * SCALE,
  },
  tabActive: {
    backgroundColor: '#A9EF45',
  },
  tabText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.2)',
  },
  tabTextActive: {
    color: '#000000',
  },
  notificationsList: {
    flex: 1,
  },
  notificationsContent: {
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 40 * SCALE,
  },
  notificationsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 14 * SCALE,
  },
  sectionTitle: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 13 * SCALE,
  },
  notificationsContainer: {
    gap: 13 * SCALE,
  },
  notificationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10 * 1,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  notificationIconContainer: {
    position: 'absolute',
    left: 8 * SCALE,
    top: 8 * SCALE,
  },
  notificationIconCircle: {
    width: 30 * SCALE,
    height: 30 * SCALE,
    borderRadius: 15 * SCALE,
    backgroundColor: '#FFFFFF08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconCircleGeneral: {
    backgroundColor: '#A9EF45',
  },
  notificationIconImage: {
    width: 14 * SCALE,
    height: 14 * SCALE,
  },
  notificationContent: {
    // marginLeft: 47 * SCALE,
    marginTop: 8 * SCALE,
    marginRight: 8 * SCALE,
    flex: 1,
    paddingBottom: 50 * SCALE, // Space for footer
  },
  notificationTitle: {
    fontSize: 14 * 1,
    marginLeft:47,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 8 * SCALE,
  },
  notificationAmount: {
    fontSize: 30 * 1,
    fontWeight: '600',
    color: '#A9EF45',
    marginTop: 8 * SCALE,
    marginBottom: 4 * SCALE,
    alignSelf: 'center',
  },
  notificationStatus: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 30 * 1,
    alignSelf: 'center',
   
  },
  notificationDescription: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 16 * SCALE,
    flex: 1,
    flexWrap: 'wrap',
    marginLeft:30,
    marginTop:10,
  },
  descriptionWithImageContainer: {
    flexDirection: 'row',
    marginTop: 8 * SCALE,
    alignItems: 'flex-start',
    gap: 10 * SCALE,
  },
  notificationImage: {
    width: 86 * SCALE,
    height: 49 * SCALE,
    borderRadius: 10 * SCALE,
    flexShrink: 0,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopWidth: 0.3,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 13 * SCALE,
    marginTop: 'auto',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  notificationFooterGeneral: {
    paddingHorizontal: 60 * SCALE,
    justifyContent: 'flex-start',
  },
  notificationDate: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  viewTransactionText: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#A9EF45',
  },
});

