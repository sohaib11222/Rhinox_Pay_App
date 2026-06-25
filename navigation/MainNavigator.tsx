import React from "react";
import { createBottomTabNavigator, BottomTabBar } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigationState, CommonActions } from "@react-navigation/native";
import HomeScreen from "../screens/MainScreens/HomeScreen";
import NotificationsScreen from "../screens/MainScreens/NotificationsScreen";
import TransactionsScreen from "../screens/MainScreens/TransactionsScreen";
import SendTransactionsScreen from "../screens/MainScreens/SendTransactionsScreen";
import FundTransactionsScreen from "../screens/MainScreens/FundTransactionsScreen";
import WithdrawalsScreen from "../screens/MainScreens/WithdrawalsScreen";
import BillPaymentsScreen from "../screens/MainScreens/BillPaymentsScreen";
import P2PTransactionsScreen from "../screens/MainScreens/P2PTransactionsScreen";
import CryptoDepositScreen from "../screens/MainScreens/CryptoDepositScreen";
import CryptoWithdrawalsScreen from "../screens/MainScreens/CryptoWithdrawalsScreen";
import BillPaymentMainScreen from "../screens/MainScreens/billpayment screens/BillPaymentMainScreen";
import Airtime from "../screens/MainScreens/billpayment screens/Airtime";
import DataRecharge from "../screens/MainScreens/billpayment screens/DataRecharge";
import InternetSubscription from "../screens/MainScreens/billpayment screens/InternetSubscription";
import Electricity from "../screens/MainScreens/billpayment screens/Electricity";
import CableTv from "../screens/MainScreens/billpayment screens/CableTv";
import Betting from "../screens/MainScreens/billpayment screens/Betting";
import BeneficiariesScreen from "../screens/MainScreens/billpayment screens/BeneficiariesScreen";
import Wallet from "../screens/MainScreens/WalletScreens/Wallet";
import CryptoAssetDetails from "../screens/MainScreens/WalletScreens/CryptoAssetDetails";
import Withdrawal from "../screens/MainScreens/WalletScreens/Withdrawal";
import Fund from "../screens/MainScreens/WalletScreens/Fund";
import Settings from "../screens/MainScreens/SettingsScreens/Settings";
import EditProfile from "../screens/MainScreens/SettingsScreens/EditProfile";
import P2PProfile from "../screens/MainScreens/SettingsScreens/P2PProfile";
import AccountSecurity from "../screens/MainScreens/SettingsScreens/AccountSecurity";
import Support from "../screens/MainScreens/SettingsScreens/Support";
import ChatScreen from "../screens/MainScreens/SettingsScreens/ChatScreen";
import Rewards from "../screens/MainScreens/SettingsScreens/Rewards";
import RewardsHistory from "../screens/MainScreens/SettingsScreens/RewardsHistory";
import ClaimRewardScreen from "../screens/MainScreens/SettingsScreens/ClaimRewardScreen";
import NotificationSettings from "../screens/MainScreens/SettingsScreens/NotificationSettings";
import DevicesAndSessions from "../screens/MainScreens/SettingsScreens/DevicesAndSessions";
import PaymentSettings from "../screens/MainScreens/P2PScreens/PaymentSettings";
import BuyOrder from "../screens/MainScreens/P2PScreens/BuyOrder";
import SellOrder from "../screens/MainScreens/P2PScreens/SellOrder";
import SellOrderFlow from "../screens/MainScreens/P2PScreens/SellOrderFlow";
import MyAdsScreen from "../screens/MainScreens/P2PScreens/MyAdsScreen";
import CreateBuyAd from "../screens/MainScreens/P2PScreens/CreateBuyAd";
import CreateSellAd from "../screens/MainScreens/P2PScreens/CreateSellAd";
import AdDetails from "../screens/MainScreens/P2PScreens/AdDetails";
import OrderDetails from "../screens/MainScreens/P2PScreens/OrderDetails";
import SendFundsScreen from "../screens/MainScreens/P2PScreens/SendFundsScreen";
import SendFundsDirectScreen from "../screens/MainScreens/SendFundScreens/SendFundsDirectScreen";
import SendFundCrypto from "../screens/MainScreens/SendFundScreens/SendFundCrypto";
import SendToRhinoxPayUser from "../screens/MainScreens/SendFundScreens/SendToRhinoxPayUser";
import WalletAddressScreen from "../screens/MainScreens/SendFundScreens/WalletAddressScreen";
import FundWalletScreen from "../screens/MainScreens/SendFundScreens/FundWalletScreen";
import MobileFundScreen from "../screens/MainScreens/SendFundScreens/MobileFundScreen";
import Conversion from "../screens/MainScreens/SendFundScreens/Conversion";
import AssetsScreen from "../screens/MainScreens/SendFundScreens/AssetsScreen";
import P2PFundScreen from "../screens/MainScreens/SendFundScreens/P2PFundScreen";
import CryptoFundDepositScreen from "../screens/MainScreens/SendFundScreens/CryptoFundDepositScreen";
import { View, StyleSheet, Image } from "react-native";
import { BlurView } from "expo-blur";
import {
  defaultTabBarStyle,
  tabBarWrapperStyle,
  TAB_ACTIVE_CIRCLE_SIZE,
  TAB_ICON_SIZE,
} from "./tabBarConfig";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TransactionsStack = createNativeStackNavigator();
const WalletStack = createNativeStackNavigator();
const SettingsStack = createNativeStackNavigator();

// Stack Navigator for Home tab
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
};

// Stack Navigator for Transactions tab
const TransactionsStackNavigator = () => {
  return (
    <TransactionsStack.Navigator screenOptions={{ headerShown: false }}>
      <TransactionsStack.Screen name="TransactionsList" component={TransactionsScreen} />
      <TransactionsStack.Screen name="SendTransactions" component={SendTransactionsScreen} />
      <TransactionsStack.Screen name="FundTransactions" component={FundTransactionsScreen} />
      <TransactionsStack.Screen name="Withdrawals" component={WithdrawalsScreen} />
      <TransactionsStack.Screen name="BillPayments" component={BillPaymentsScreen} />
      <TransactionsStack.Screen name="P2PTransactions" component={P2PTransactionsScreen} />
      <TransactionsStack.Screen name="CryptoDeposit" component={CryptoDepositScreen} />
      <TransactionsStack.Screen name="CryptoWithdrawals" component={CryptoWithdrawalsScreen} />
      <TransactionsStack.Screen name="Airtime" component={Airtime} />
      <TransactionsStack.Screen name="DataRecharge" component={DataRecharge} />
      <TransactionsStack.Screen name="InternetSubscription" component={InternetSubscription} />
      <TransactionsStack.Screen name="Electricity" component={Electricity} />
      <TransactionsStack.Screen name="CableTv" component={CableTv} />
      <TransactionsStack.Screen name="Betting" component={Betting} />
      <TransactionsStack.Screen name="Beneficiaries" component={BeneficiariesScreen} />
    </TransactionsStack.Navigator>
  );
};

// Stack Navigator for Wallet tab
const WalletStackNavigator = () => {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="WalletMain" component={Wallet} />
      <WalletStack.Screen name="CryptoAssetDetails" component={CryptoAssetDetails} />
      <WalletStack.Screen name="Withdrawal" component={Withdrawal} />
      <WalletStack.Screen name="Fund" component={Fund} />
    </WalletStack.Navigator>
  );
};

// Stack Navigator for Settings tab
const SettingsStackNavigator = () => {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsMain" component={Settings} />
      <SettingsStack.Screen name="EditProfile" component={EditProfile} />
      <SettingsStack.Screen name="P2PProfile" component={P2PProfile} />
      <SettingsStack.Screen name="PaymentSettings" component={PaymentSettings} />
      <SettingsStack.Screen name="BuyOrder" component={BuyOrder} />
      <SettingsStack.Screen name="SellOrder" component={SellOrder} />
      <SettingsStack.Screen name="SellOrderFlow" component={SellOrderFlow} />
      <SettingsStack.Screen name="MyAdsScreen" component={MyAdsScreen} />
      <SettingsStack.Screen name="CreateBuyAd" component={CreateBuyAd} />
      <SettingsStack.Screen name="CreateSellAd" component={CreateSellAd} />
      <SettingsStack.Screen name="AdDetails" component={AdDetails} />
      <SettingsStack.Screen name="OrderDetails" component={OrderDetails} />
      <SettingsStack.Screen name="SendFunds" component={SendFundsScreen} />
      <SettingsStack.Screen name="SendFundsDirect" component={SendFundsDirectScreen} />
      <SettingsStack.Screen name="SendFundCrypto" component={SendFundCrypto} />
      <SettingsStack.Screen name="SendToRhinoxPayUser" component={SendToRhinoxPayUser} />
      <SettingsStack.Screen name="WalletAddress" component={WalletAddressScreen} />
      <SettingsStack.Screen name="FundWallet" component={FundWalletScreen} />
      <SettingsStack.Screen name="MobileFund" component={MobileFundScreen} />
      <SettingsStack.Screen name="Conversion" component={Conversion} />
      <SettingsStack.Screen name="Assets" component={AssetsScreen} />
      <SettingsStack.Screen name="P2PFund" component={P2PFundScreen} />
      <SettingsStack.Screen name="CryptoFundDeposit" component={CryptoFundDepositScreen} />
      <SettingsStack.Screen name="AccountSecurity" component={AccountSecurity} />
      <SettingsStack.Screen name="Support" component={Support} />
      <SettingsStack.Screen name="ChatScreen" component={ChatScreen} />
      <SettingsStack.Screen name="Rewards" component={Rewards} />
      <SettingsStack.Screen name="RewardsHistory" component={RewardsHistory} />
      <SettingsStack.Screen name="ClaimReward" component={ClaimRewardScreen} />
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettings} />
      <SettingsStack.Screen name="DevicesAndSessions" component={DevicesAndSessions} />
    </SettingsStack.Navigator>
  );
};

// CallScreen replaced with BillPaymentMainScreen for 3rd tab

// Tab icon component using image assets
const TabIcon = ({ routeName, focused }: { routeName: string; focused: boolean }) => {
  let iconSource: any;
  
  if (routeName === "Home") {
    iconSource = require("../assets/home_tabicon.png");
  } else if (routeName === "Transactions") {
    iconSource = require("../assets/transaction_tabicon.png");
  } else if (routeName === "BillPayment") {
    iconSource = require("../assets/billpayment_tabicon.png");
  } else if (routeName === "Wallet") {
    iconSource = require("../assets/wallet_tabicon.png");
  } else if (routeName === "Settings") {
    iconSource = require("../assets/setting_tabicon.png");
  } else {
    // Default fallback
    iconSource = require("../assets/home_tabicon.png");
  }

  // Black tint when active, no tint when inactive
  const tintColor = focused ? "#000000" : undefined;

  return (
    <View style={styles.tabIconInner}>
      <Image
        source={iconSource}
        style={{
          width: TAB_ICON_SIZE,
          height: TAB_ICON_SIZE,
          tintColor: tintColor,
        }}
        resizeMode="contain"
      />
    </View>
  );
};

// Custom Tab Bar Component that checks navigation state
const CustomTabBar = (props: any) => {
  // Screens that should hide the tab bar
  const screensToHideTabBar = ['BuyOrder', 'SellOrder', 'SellOrderFlow', 'ChatScreen', 'P2PProfile', 'MyAdsScreen', 'CreateBuyAd', 'CreateSellAd', 'AdDetails', 'SendFunds', 'SendFundsDirect', 'SendFundCrypto', 'SendToRhinoxPayUser', 'FundWallet', 'MobileFund', 'Conversion', 'Assets', 'P2PFund', 'PaymentSettings', 'Rewards', 'RewardsHistory', 'ClaimReward', 'NotificationSettings', 'DevicesAndSessions', 'Beneficiaries'];
  
  // Get the current navigation state
  const navigationState = useNavigationState((state) => state);
  
  // Check if current screen should hide tab bar
  let shouldHideTabBar = false;
  
  if (navigationState) {
    // Find the currently focused tab
    const focusedTab = navigationState.routes[navigationState.index ?? 0];
    
    if (focusedTab?.state) {
      // Get the focused screen in the nested stack
      const stackState = focusedTab.state;
      const focusedScreen = stackState.routes[stackState.index ?? 0];
      
      if (focusedScreen && screensToHideTabBar.includes(focusedScreen.name)) {
        shouldHideTabBar = true;
      }
    }
  }
  
  // If we should hide the tab bar, return null
  if (shouldHideTabBar) {
    return null;
  }
  
  // Otherwise, return the default tab bar inset from screen edges
  return (
    <View style={tabBarWrapperStyle}>
      <BottomTabBar {...props} />
    </View>
  );
};

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={({ route }) => {
        return {
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarLabel:
            route.name === 'BillPayment'
              ? 'Bill'
              : route.name === 'Transactions'
                ? 'Activity'
                : route.name,
          tabBarAccessibilityLabel:
            route.name === 'BillPayment'
              ? 'Bill Payment'
              : route.name === 'Home'
                ? 'Home dashboard'
                : route.name === 'Transactions'
                  ? 'Transactions history'
                  : route.name === 'Wallet'
                    ? 'Wallet balances'
                    : route.name === 'Settings'
                      ? 'Settings and profile'
                      : route.name,
          tabBarItemStyle: styles.tabBarItem,
          tabBarBackground: () => (
            <View style={styles.tabBarBackground}>
              <BlurView
                intensity={80}
                tint="dark"
                style={styles.tabBarBlur}
              />
              <View style={styles.tabBarOverlay} />
            </View>
          ),
          tabBarStyle: defaultTabBarStyle,
          tabBarIcon: ({ focused }) => {
          if (focused) {
            // Active tab: bright green circle with dark icon
            return (
              <View style={styles.tabIconContainer}>
                <View style={styles.activeTabContainer}>
                  <TabIcon routeName={route.name} focused={focused} />
                </View>
              </View>
            );
          }

          // Inactive tabs: just the icon
          return (
            <View style={styles.tabIconContainer}>
              <TabIcon routeName={route.name} focused={focused} />
            </View>
          );
        },
          tabBarActiveTintColor: "#A9EF45",
          tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)",
        };
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Get the Home stack navigator
            const state = navigation.getState();
            const homeTab = state.routes.find((r) => r.name === 'Home');
            
            if (homeTab && homeTab.state) {
              const homeState = homeTab.state;
              // If we're not on the initial screen (HomeMain), navigate to it
              if (homeState.index !== undefined && homeState.index > 0) {
                // Navigate to HomeMain within the Home stack
                navigation.navigate('Home', {
                  screen: 'HomeMain',
                });
              }
            }
          },
        })}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Get the Transactions stack navigator
            const state = navigation.getState();
            const transactionsTab = state.routes.find((r) => r.name === 'Transactions');
            
            if (transactionsTab && transactionsTab.state) {
              const transactionsState = transactionsTab.state;
              // If we're not on the initial screen (TransactionsList), navigate to it
              if (transactionsState.index !== undefined && transactionsState.index > 0) {
                // Navigate to TransactionsList within the Transactions stack
                navigation.navigate('Transactions', {
                  screen: 'TransactionsList',
                });
              }
            }
          },
        })}
      />
      <Tab.Screen
        name="BillPayment"
        component={BillPaymentMainScreen}
        options={{ tabBarLabel: 'Bill', tabBarAccessibilityLabel: 'Bill Payment' }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Get the Wallet stack navigator
            const state = navigation.getState();
            const walletTab = state.routes.find((r) => r.name === 'Wallet');
            
            if (walletTab && walletTab.state) {
              const walletState = walletTab.state;
              // If we're not on the initial screen (WalletMain), navigate to it
              if (walletState.index !== undefined && walletState.index > 0) {
                // Navigate to WalletMain within the Wallet stack
                navigation.navigate('Wallet', {
                  screen: 'WalletMain',
                });
              }
            }
          },
        })}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Always check and navigate to SettingsMain if not already there
            const state = navigation.getState();
            const settingsTab = state.routes.find((r) => r.name === 'Settings');
            
            let shouldNavigateToMain = false;
            
            if (settingsTab && settingsTab.state) {
              const settingsState = settingsTab.state;
              const currentRoute = settingsState.routes[settingsState.index ?? 0];
              
              // Check if we're not on SettingsMain
              if (!currentRoute || currentRoute.name !== 'SettingsMain') {
                shouldNavigateToMain = true;
              }
            } else {
              // If Settings tab state doesn't exist, navigate to SettingsMain
              shouldNavigateToMain = true;
            }
            
            if (shouldNavigateToMain) {
              // Prevent default tab navigation
              e.preventDefault();
              
              // Navigate to SettingsMain
              navigation.navigate('Settings', {
                screen: 'SettingsMain',
              });
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
    overflow: 'hidden',
  },
  tabBarBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100,
  },
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 12, 25, 0.72)',
    borderRadius: 100,
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    marginVertical: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    marginTop: 0,
    marginBottom: 2,
  },
  tabIconContainer: {
    width: TAB_ACTIVE_CIRCLE_SIZE,
    height: TAB_ACTIVE_CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconInner: {
    width: TAB_ICON_SIZE,
    height: TAB_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabContainer: {
    width: TAB_ACTIVE_CIRCLE_SIZE,
    height: TAB_ACTIVE_CIRCLE_SIZE,
    borderRadius: TAB_ACTIVE_CIRCLE_SIZE / 2,
    backgroundColor: '#A9EF45', // Bright green background for active tab
    alignItems: 'center',
    justifyContent: 'center',
  },
});
