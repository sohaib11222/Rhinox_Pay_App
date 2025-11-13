import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9; // Scale factor from Figma to actual device

const COUNTRIES = [
  { id: 1, name: 'Nigeria', flag: '🇳🇬', selected: false },
  { id: 2, name: 'Botswana', flag: '🇧🇼', selected: false },
  { id: 3, name: 'Ghana', flag: '🇬🇭', selected: false },
  { id: 4, name: 'Kenya', flag: '🇰🇪', selected: false },
  { id: 5, name: 'South Africa', flag: '🇿🇦', selected: false },
  { id: 6, name: 'Tanzania', flag: '🇹🇿', selected: false },
  { id: 7, name: 'Uganda', flag: '🇺🇬', selected: false },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [promoBannerIndex, setPromoBannerIndex] = useState(0);
  const promoBannerRef = useRef<FlatList>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('Fiat');
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<number | null>(1);
  const [selectedCountryName, setSelectedCountryName] = useState('Nigeria');
  const [showSendFundsModal, setShowSendFundsModal] = useState(false);
  const [sendFundsWalletType, setSendFundsWalletType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [showSendFundsCountryModal, setShowSendFundsCountryModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{ id: string; name: string; balance: string; icon: any } | null>({
    id: '1',
    name: 'Bitcoin',
    balance: '0.00001',
    icon: require('../../assets/CurrencyBtc.png'),
  });
  const [showFundWalletModal, setShowFundWalletModal] = useState(false);
  const [fundWalletType, setFundWalletType] = useState<'Fiat' | 'Crypto'>('Fiat');
  const [showFundWalletCountryModal, setShowFundWalletCountryModal] = useState(false);
  const [showFundWalletAssetModal, setShowFundWalletAssetModal] = useState(false);

  // Promotional banner images - using complete banner images
  const promoBanners = [
    { id: 1, image: require('../../assets/Frame 89.png') },
    { id: 2, image: require('../../assets/Frame 89.png') },
    { id: 3, image: require('../../assets/Frame 89.png') },
  ];

  // Mock data
  const transactions = [
    { id: 1, title: 'Fund Wallet', subtitle: 'From Bank', amount: '+N20,000', date: 'Oct 15,2025', icon: 'arrow-up-circle', status: 'Successful' },
    { id: 2, title: 'NGN to GHC', subtitle: 'Successful', amount: 'N20,000 to c200', date: 'Oct 15,2025', icon: 'swap-horizontal', status: 'Successful' },
    { id: 3, title: 'Fund Wallet', subtitle: 'From Bank', amount: '+N20,000', date: 'Oct 15,2025', icon: 'arrow-up-circle', status: 'Successful' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020c19" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Section */}
        <View style={styles.header}>
          {/* Memoji Avatar */}
          <Image
            source={require('../../assets/login/memoji.png')}
            style={styles.avatar}
            resizeMode="cover"
          />

          {/* Greeting Text */}
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Hi, AbdulMalik</Text>
            <View style={styles.welcomeRow}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.welcomeEmoji}>👋</Text>
            </View>
          </View>

          {/* Flag Icon - Opens Country Modal */}
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowCountryModal(true)}
          >
            <View style={styles.iconCircle}>
              <Image
                source={require('../../assets/login/nigeria-flag.png')}
                style={[{ marginBottom: -1, width: 26, height: 26 }]}
                resizeMode="cover"
              />
            </View>
          </TouchableOpacity>

          {/* Profile Icon */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              (navigation as any).navigate('Home', {
                screen: 'Notifications',
              });
            }}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="bell" size={24 * SCALE} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Balance Section */}
        <View style={styles.balanceSection}>
          <Text style={styles.balanceLabel}>Your balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceAmount}>
              <Text style={styles.balanceCurrency}>N</Text>
              {balanceVisible ? '2,000,000.' : '*******.'}
              <Text style={styles.balanceDecimals}>00</Text>
            </Text>
            <TouchableOpacity
              onPress={() => setBalanceVisible(!balanceVisible)}
              style={styles.eyeButton}
            >
              <MaterialCommunityIcons
                name={balanceVisible ? 'eye' : 'eye-off'}
                size={24 * SCALE}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowSendFundsModal(true)}
          >
            <Image
              source={require('../../assets/send-square.png')}
              style={[{ width: 42, height: 42 }]} resizeMode="cover"
            />            <Text style={styles.actionButtonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowFundWalletModal(true)}
          >
            <View style={styles.rotatedIcon}>
              <Image
                source={require('../../assets/send-2.png')}
                style={[{ width: 42, height: 42 }]} resizeMode="cover"
              />            </View>
            <Text style={styles.actionButtonText}>Fund</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Image
              source={require('../../assets/arrow-swap.png')}
              style={[{ width: 42, height: 42 }]}
              resizeMode="cover"
            />            <Text style={styles.actionButtonText}>Convert</Text>
          </TouchableOpacity>
        </View>

        {/* Active Wallets Section */}
        <View style={styles.walletsHeader}>
          <Text style={styles.walletsTitle}>Active Wallets</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Cards */}
        <View style={styles.walletCardsContainer}>
          {/* NGN Wallet Card with Linear Gradient */}
          <LinearGradient
            colors={['#4880C0', '#1B589E']} // Darker blue at top to lighter blue at bottom
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.walletCard}
          >
            <View style={styles.walletCardContent}>
              <Image
                source={require('../../assets/login/nigeria-flag.png')}
                style={styles.walletIcon}
                resizeMode="cover"
              />
              <View style={styles.walletInfo}>
                <Text style={styles.walletCode}>NGN</Text>
                <Text style={styles.walletName}>Nigerian Naira</Text>
              </View>
            </View>
            <View style={styles.walletDivider} />
            <Text style={styles.walletBalanceLabel}>Balance</Text>
            <Text style={styles.walletBalanceAmount}>
              2,000,000.00<Text style={styles.walletBalanceCurrency}>NGN</Text>
            </Text>
            <Text style={styles.walletUsdAmount}>$20,000</Text>
          </LinearGradient>

          {/* KSH Wallet Card */}
          <View style={[styles.walletCard, styles.walletCardWhite]}>
            <View style={styles.walletCardContent}>
              <Image
                source={require('../../assets/Mask group.png')}
                style={styles.walletIcon}
                resizeMode="cover"
              />

              <View style={styles.walletInfo}>
                <Text style={[styles.walletCode, styles.walletCodeDark]}>KSH</Text>
                <Text style={[styles.walletName, styles.walletNameDark]}>Kenya Shilling</Text>
              </View>
            </View>
            <View style={styles.walletDivider} />
            <Text style={[styles.walletBalanceLabel, styles.walletBalanceLabelDark]}>Balance</Text>
            <Text style={[styles.walletBalanceAmount, styles.walletBalanceAmountDark]}>
              20,000<Text style={styles.walletBalanceCurrencyDark}>KSH</Text>
            </Text>
            <Text style={[styles.walletUsdAmount, styles.walletUsdAmountDark]}>$20,000</Text>
          </View>
        </View>

        {/* Promotional Banner Carousel */}
        <View style={styles.promoBannerContainer}>
          <FlatList
            ref={promoBannerRef}
            data={promoBanners}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id.toString()}
            onMomentumScrollEnd={(event) => {
              const slideIndex = Math.round(
                event.nativeEvent.contentOffset.x / (SCREEN_WIDTH - (SCREEN_WIDTH * 0.094))
              );
              setPromoBannerIndex(slideIndex);
            }}
            renderItem={({ item }) => (
              <View style={styles.promoBanner}>
                <Image
                  source={item.image}
                  style={styles.promoBannerImage}
                  resizeMode="cover"
                />
              </View>
            )}
          />
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationDots}>
          {promoBanners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === promoBannerIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        {/* All Transactions Card */}
        <View style={styles.transactionCard}>
          <View style={styles.transactionCardHeader}>
            <Text style={styles.transactionCardTitle}>All Transactions</Text>
            <View style={styles.filterButtonContainer}>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={() => setShowFilterDropdown(!showFilterDropdown)}
              >
                <Text style={styles.filterButtonText}>{selectedFilter}</Text>
                <MaterialCommunityIcons name="chevron-down" size={12 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
              
              {/* Filter Dropdown */}
              {showFilterDropdown && (
                <View style={styles.filterDropdown}>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedFilter('Fiat');
                      setShowFilterDropdown(false);
                    }}
                  >
                    <Text style={styles.filterOptionText}>Fiat</Text>
                    {selectedFilter === 'Fiat' && (
                      <MaterialCommunityIcons name="check" size={16} color="#A9EF45" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => {
                      setSelectedFilter('Crypto');
                      setShowFilterDropdown(false);
                    }}
                  >
                    <Text style={styles.filterOptionText}>Crypto</Text>
                    {selectedFilter === 'Crypto' && (
                      <MaterialCommunityIcons name="check" size={16} color="#A9EF45" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.transactionTotalAmount}>
            <Text style={styles.transactionTotalCurrency}>N</Text>150,000.<Text style={styles.transactionTotalDecimals}>00</Text>
          </Text>

          {/* Chart Bars */}
          <View style={styles.chartBars}>
            <View style={[styles.chartBar, styles.chartBar1]} />
            <View style={[styles.chartBar, styles.chartBar2]} />
            <View style={[styles.chartBar, styles.chartBar3]} />
            <View style={[styles.chartBar, styles.chartBar4]} />
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot1]} />
              <Text style={styles.legendText}>Send</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot2]} />
              <Text style={styles.legendText}>Deposits</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot3]} />
              <Text style={styles.legendText}>Convert</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDot4]} />
              <Text style={styles.legendText}>Bill Payments</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions Card */}
        <View style={styles.recentTransactionsCard}>
          <View style={styles.recentTransactionsHeader}>
            <Text style={styles.recentTransactionsTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionIconContainer}>
                <View style={styles.transactionIconCircle}>
                  <MaterialCommunityIcons
                    name={transaction.icon as any}
                    size={14 * SCALE}
                    color="#A9EF45"
                  />
                </View>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.title}</Text>
                <View style={styles.transactionStatusRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.transactionSubtitle}>{transaction.status || transaction.subtitle}</Text>
                </View>
              </View>
              <View style={styles.transactionAmountContainer}>
                <Text style={styles.transactionAmount}>{transaction.amount}</Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

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
                  onPress={() => {
                    setSelectedCountry(c.id);
                    setSelectedCountryName(c.name);
                  }}
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
            <TouchableOpacity 
              style={styles.applyButton} 
              onPress={() => setShowCountryModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Funds Modal */}
      <Modal
        visible={showSendFundsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSendFundsModal(false)}
      >
        <View style={styles.sendFundsModalOverlay}>
          <View style={styles.sendFundsModalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sendFundsModalScrollContent}
            >
              <View style={styles.sendFundsModalHeader}>
                <Text style={styles.sendFundsModalTitle}>Send Funds</Text>
                <TouchableOpacity onPress={() => setShowSendFundsModal(false)}>
                  <View style={styles.sendFundsModalCloseCircle}>
                    <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Large Icon */}
              <View style={styles.sendFundsIconContainer}>
                <View style={styles.sendFundsLargeIconCircle}>
                  <Image
                    source={require('../../assets/Group 57.png')}
                    style={styles.sendFundsLargeIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Wallet Type Toggle */}
              <View style={styles.sendFundsWalletToggleContainer}>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleLeft, sendFundsWalletType === 'Fiat' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setSendFundsWalletType('Fiat')}
                >
                  <MaterialCommunityIcons name="bank" size={16 * SCALE} color={sendFundsWalletType === 'Fiat' ? '#000000' : '#FFFFFF'} />
                  <Text style={[styles.sendFundsWalletToggleText, sendFundsWalletType === 'Fiat' && styles.sendFundsWalletToggleTextActive]}>Fiat Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleRight, sendFundsWalletType === 'Crypto' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setSendFundsWalletType('Crypto')}
                >
                  <Image
                    source={require('../../assets/CurrencyBtc.png')}
                    style={styles.sendFundsBitcoinIcon}
                    resizeMode="contain"
                  />
                  <Text style={[styles.sendFundsWalletToggleText, sendFundsWalletType === 'Crypto' && styles.sendFundsWalletToggleTextActive]}>Crypto Wallet</Text>
                </TouchableOpacity>
              </View>

              {sendFundsWalletType === 'Fiat' ? (
                <>
                  {/* Select Currency Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <Text style={styles.sendFundsSectionTitle}>Select Currency</Text>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <Text style={styles.sendFundsBalanceLabel}>My Balance</Text>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          <Text style={styles.sendFundsBalanceAmount}>N200,000</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsCountrySelector}
                        onPress={() => setShowSendFundsCountryModal(true)}
                      >
                        <Image
                          source={require('../../assets/login/nigeria-flag.png')}
                          style={styles.sendFundsCountryFlagImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.sendFundsCountryNameText}>{selectedCountryName}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Send Options Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <Text style={styles.sendFundsSectionTitle}>Send Options</Text>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Rhinox User Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'SendFunds',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (42).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>RhionX User (User ID)</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Send funds immediately to another rhinoxuser anywhere in Africa.</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Bank Account Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'SendFundsDirect',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (43).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Bank Account</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Send to a user's bank account.</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Mobile Money Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'MobileFund',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Cardholder.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Mobile Money</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Send via mobile moneyt</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              ) : (
                <>
                  {/* Select Asset Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <Text style={styles.sendFundsSectionTitle}>Select Crypto</Text>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <Text style={styles.sendFundsBalanceLabel}>My Balance</Text>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          <Text style={styles.sendFundsBalanceAmount}>
                            {selectedAsset ? `${selectedAsset.balance} ${selectedAsset.name}` : '0.00001 BTC'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsAssetSelector}
                        onPress={() => setShowAssetModal(true)}
                      >
                        {selectedAsset ? (
                          <>
                            <Image
                              source={selectedAsset.icon}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <Text style={styles.sendFundsAssetNameText}>{selectedAsset.name}</Text>
                          </>
                        ) : (
                          <>
                            <Image
                              source={require('../../assets/CurrencyBtc.png')}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <Text style={styles.sendFundsAssetNameText}>Bitcoin</Text>
                          </>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Send Options Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <Text style={styles.sendFundsSectionTitle}>Send Options</Text>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Rhinox User Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'SendFundCrypto',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (42).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>RhionX User (User ID)</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Send funds immediately to another rhinoxuser anywhere in Africa.</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Wallet Address Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowSendFundsModal(false);
                          // TODO: Navigate to Wallet Address screen
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/CurrencyBtc.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Wallet Address</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Send to a user's wallet address</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Recent Section - Only show for Fiat */}
              {sendFundsWalletType === 'Fiat' && (
                <View style={styles.sendFundsRecentSection}>
                  <Text style={styles.sendFundsSectionTitle}>Recent</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.sendFundsRecentScrollContent}
                  >
                    {[
                      { id: '1', name: 'Adewale', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                      { id: '2', name: 'Sasha', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                      { id: '3', name: 'Olayemi', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                      { id: '4', name: 'Adejoke', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                      { id: '5', name: 'Tunde', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                    ].map((contact) => (
                      <View key={contact.id} style={styles.sendFundsRecentItem}>
                        <Image source={contact.avatar} style={styles.sendFundsRecentAvatar} resizeMode="cover" />
                        <Text style={styles.sendFundsRecentName}>{contact.name}</Text>
                        <Text style={styles.sendFundsRecentCurrency}>{contact.currency}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Select Asset Modal */}
        <Modal
          visible={showAssetModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAssetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Asset</Text>
                <TouchableOpacity onPress={() => setShowAssetModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
              <ScrollView style={styles.modalList}>
                {[
                  { id: '1', name: 'Bitcoin', balance: '0.00001', icon: require('../../assets/CurrencyBtc.png') },
                  { id: '2', name: 'Ethereum', balance: '10', icon: require('../../assets/CurrencyBtc.png') },
                  { id: '3', name: 'Solana', balance: '100', icon: require('../../assets/CurrencyBtc.png') },
                ].map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={styles.assetItem}
                      onPress={() => {
                        setSelectedAsset(asset);
                        setShowAssetModal(false);
                      }}
                    >
                      <Image
                        source={asset.icon}
                        style={styles.assetItemIcon}
                        resizeMode="cover"
                      />
                      <View style={styles.assetItemInfo}>
                        <Text style={styles.assetItemName}>{asset.name}</Text>
                        <Text style={styles.assetItemBalance}>Bal : {asset.balance}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24 * SCALE}
                        color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.applyButtonContainer}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowAssetModal(false)}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Country Modal for Send Funds */}
        <Modal
          visible={showSendFundsCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSendFundsCountryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country</Text>
                <TouchableOpacity onPress={() => setShowSendFundsCountryModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(c.id);
                      setSelectedCountryName(c.name);
                    }}
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
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowSendFundsCountryModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* Fund Wallet Modal */}
      <Modal
        visible={showFundWalletModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFundWalletModal(false)}
      >
        <View style={styles.sendFundsModalOverlay}>
          <View style={styles.sendFundsModalContent}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sendFundsModalScrollContent}
            >
              <View style={styles.sendFundsModalHeader}>
                <Text style={styles.sendFundsModalTitle}>Fund Wallet</Text>
                <TouchableOpacity onPress={() => setShowFundWalletModal(false)}>
                  <View style={styles.sendFundsModalCloseCircle}>
                    <MaterialCommunityIcons name="close" size={18 * SCALE} color="#000" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Large Icon */}
              <View style={styles.sendFundsIconContainer}>
                <View style={styles.sendFundsLargeIconCircle}>
                  <Image
                    source={require('../../assets/Group 57.png')}
                    style={styles.sendFundsLargeIcon}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* Wallet Type Toggle */}
              <View style={styles.sendFundsWalletToggleContainer}>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleLeft, fundWalletType === 'Fiat' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setFundWalletType('Fiat')}
                >
                  <MaterialCommunityIcons name="bank" size={16 * SCALE} color={fundWalletType === 'Fiat' ? '#000000' : '#FFFFFF'} />
                  <Text style={[styles.sendFundsWalletToggleText, fundWalletType === 'Fiat' && styles.sendFundsWalletToggleTextActive]}>Fiat Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendFundsWalletToggleButton, styles.sendFundsWalletToggleRight, fundWalletType === 'Crypto' && styles.sendFundsWalletToggleActive]}
                  onPress={() => setFundWalletType('Crypto')}
                >
                  <Image
                    source={require('../../assets/CurrencyBtc.png')}
                    style={styles.sendFundsBitcoinIcon}
                    resizeMode="contain"
                  />
                  <Text style={[styles.sendFundsWalletToggleText, fundWalletType === 'Crypto' && styles.sendFundsWalletToggleTextActive]}>Crypto Wallet</Text>
                </TouchableOpacity>
              </View>

              {fundWalletType === 'Fiat' ? (
                <>
                  {/* Select Currency Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <Text style={styles.sendFundsSectionTitle}>Select Currency</Text>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <Text style={styles.sendFundsBalanceLabel}>My Balance</Text>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          <Text style={styles.sendFundsBalanceAmount}>N200,000</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsCountrySelector}
                        onPress={() => setShowFundWalletCountryModal(true)}
                      >
                        <Image
                          source={require('../../assets/login/nigeria-flag.png')}
                          style={styles.sendFundsCountryFlagImage}
                          resizeMode="cover"
                        />
                        <Text style={styles.sendFundsCountryNameText}>{selectedCountryName}</Text>
                        <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Select Channel Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <Text style={styles.sendFundsSectionTitle}>Select Channel</Text>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Bank Transfer Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'FundWallet',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (43).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Bank Transfer</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Fund your wallet via bank transfer</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Mobile Money Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'MobileFund',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Cardholder.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Mobile Money</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Fund your wallet via mobile moneyt</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Conversion Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          // TODO: Navigate to Conversion screen
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/arrow-swap.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Conversion</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Convert funds between your fiat wallets</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* P2P Trading Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          // TODO: Navigate to P2P Trading screen
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Frame 2398.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>P2P Trading</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Trade your assets in our p2p market</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Recent Section */}
                  <View style={styles.sendFundsRecentSection}>
                    <Text style={styles.sendFundsSectionTitle}>Recent</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.sendFundsRecentScrollContent}
                    >
                      {[
                        { id: '1', name: 'Adewale', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '2', name: 'Sasha', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '3', name: 'Olayemi', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '4', name: 'Adejoke', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                        { id: '5', name: 'Tunde', currency: 'NGN', avatar: require('../../assets/Frame 2398.png') },
                      ].map((contact) => (
                        <View key={contact.id} style={styles.sendFundsRecentItem}>
                          <Image source={contact.avatar} style={styles.sendFundsRecentAvatar} resizeMode="cover" />
                          <Text style={styles.sendFundsRecentName}>{contact.name}</Text>
                          <Text style={styles.sendFundsRecentCurrency}>{contact.currency}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                </>
              ) : (
                <>
                  {/* Select Asset Section */}
                  <View style={styles.sendFundsCurrencySection}>
                    <Text style={styles.sendFundsSectionTitle}>Select Crypto</Text>
                    <LinearGradient
                      colors={['#A9EF4533', '#FFFFFF0D']}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.sendFundsBalanceCard}
                    >
                      <View style={styles.sendFundsBalanceCardContent}>
                        <Text style={styles.sendFundsBalanceLabel}>My Balance</Text>
                        <View style={styles.sendFundsBalanceRow}>
                          <Image
                            source={require('../../assets/Vector (34).png')}
                            style={styles.sendFundsWalletIcon}
                            resizeMode="cover"
                          />
                          <Text style={styles.sendFundsBalanceAmount}>
                            {selectedAsset ? `${selectedAsset.balance} ${selectedAsset.name}` : '0.00001 BTC'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.sendFundsAssetSelector}
                        onPress={() => setShowFundWalletAssetModal(true)}
                      >
                        {selectedAsset ? (
                          <>
                            <Image
                              source={selectedAsset.icon}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <Text style={styles.sendFundsAssetNameText}>{selectedAsset.name}</Text>
                          </>
                        ) : (
                          <>
                            <Image
                              source={require('../../assets/CurrencyBtc.png')}
                              style={styles.sendFundsAssetIcon}
                              resizeMode="cover"
                            />
                            <Text style={styles.sendFundsAssetNameText}>Bitcoin</Text>
                          </>
                        )}
                        <MaterialCommunityIcons name="chevron-down" size={14 * SCALE} color="#FFFFFF" />
                      </TouchableOpacity>
                    </LinearGradient>
                  </View>

                  {/* Select Channel Section */}
                  <View style={styles.sendFundsOptionsSection}>
                    <Text style={styles.sendFundsSectionTitle}>Select Channel</Text>
                    <View style={styles.sendFundsOptionsContainer}>
                      {/* Bank Transfer Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'FundWallet',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Vector (43).png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Bank Transfer</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Fund your wallet via bank transfer</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Mobile Money Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          (navigation as any).navigate('Settings', {
                            screen: 'MobileFund',
                          });
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Cardholder.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Mobile Money</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Fund your wallet via mobile moneyt</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* Conversion Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          // TODO: Navigate to Conversion screen
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/arrow-swap.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>Conversion</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Convert funds between your fiat wallets</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* P2P Trading Option */}
                      <TouchableOpacity
                        onPress={() => {
                          setShowFundWalletModal(false);
                          // TODO: Navigate to P2P Trading screen
                        }}
                      >
                        <LinearGradient
                          colors={['#A9EF4533', '#FFFFFF0D']}
                          start={{ x: 1, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={styles.sendFundsOption}
                        >
                          <View style={styles.sendFundsIconCircle}>
                            <Image
                              source={require('../../assets/Frame 2398.png')}
                              style={styles.sendFundsIcon}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={styles.sendFundsTextContainer}>
                            <Text style={styles.sendFundsOptionTitle}>P2P Trading</Text>
                            <Text style={styles.sendFundsOptionSubtitle}>Trade your assets in our p2p market</Text>
                          </View>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>

        {/* Select Asset Modal for Fund Wallet */}
        <Modal
          visible={showFundWalletAssetModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFundWalletAssetModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Asset</Text>
                <TouchableOpacity onPress={() => setShowFundWalletAssetModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFF" />
                </TouchableOpacity>
              </View>
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                />
              </View>
              <ScrollView style={styles.modalList}>
                {[
                  { id: '1', name: 'Bitcoin', balance: '0.00001', icon: require('../../assets/CurrencyBtc.png') },
                  { id: '2', name: 'Ethereum', balance: '10', icon: require('../../assets/CurrencyBtc.png') },
                  { id: '3', name: 'Solana', balance: '100', icon: require('../../assets/CurrencyBtc.png') },
                ].map((asset) => {
                  const isSelected = selectedAsset?.id === asset.id;
                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={styles.assetItem}
                      onPress={() => {
                        setSelectedAsset(asset);
                        setShowFundWalletAssetModal(false);
                      }}
                    >
                      <Image
                        source={asset.icon}
                        style={styles.assetItemIcon}
                        resizeMode="cover"
                      />
                      <View style={styles.assetItemInfo}>
                        <Text style={styles.assetItemName}>{asset.name}</Text>
                        <Text style={styles.assetItemBalance}>Bal : {asset.balance}</Text>
                      </View>
                      <MaterialCommunityIcons
                        name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                        size={24 * SCALE}
                        color={isSelected ? '#A9EF45' : 'rgba(255, 255, 255, 0.3)'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
              <View style={styles.applyButtonContainer}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowFundWalletAssetModal(false)}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Country Modal for Fund Wallet */}
        <Modal
          visible={showFundWalletCountryModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowFundWalletCountryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Country</Text>
                <TouchableOpacity onPress={() => setShowFundWalletCountryModal(false)}>
                  <MaterialCommunityIcons name="close-circle" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalList}>
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={styles.countryItem}
                    onPress={() => {
                      setSelectedCountry(c.id);
                      setSelectedCountryName(c.name);
                    }}
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
              <TouchableOpacity 
                style={styles.applyButton} 
                onPress={() => setShowFundWalletCountryModal(false)}
              >
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Modal>

      {/* Decorative Circles */}

    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047, // ~20px on 430px width
    paddingTop: 45 * SCALE,
    paddingBottom: 13 * SCALE,
  },
  avatar: {
    width: 40 * 1,
    height: 40 * 1,
    borderRadius: 20 * 1,
    backgroundColor: '#A9EF45',
  },
  greetingContainer: {
    flex: 1,
    marginLeft: 12 * SCALE,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  welcomeEmoji: {
    fontSize: 12 * 1,
    marginLeft: 2 * 1,
  },
  iconButton: {
    marginLeft: 12 * 1,
  },
  iconCircle: {
    width: 40 * 1,
    height: 40 * 1,
    borderRadius: 20 * 1,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 26 * SCALE,
    height: 27 * SCALE,
    borderRadius: 13 * SCALE,
  },
  balanceSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.051, // ~22px
    paddingTop: 16 * SCALE,
  },
  balanceLabel: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 6 * SCALE,
  },
  walletCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 50 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
    // lineHeight: 74 * SCALE,
    flex: 1,
  },
  balanceCurrency: {
    fontSize: 14 * 1,
  },
  balanceDecimals: {
    fontSize: 50 * SCALE,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  eyeButton: {
    padding: 4 * SCALE,
    marginTop: 4 * SCALE,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SCREEN_WIDTH * 0.049, // ~21px
    marginTop: 20 * SCALE,
    marginBottom: 10 * SCALE,
    gap: 10 * 1,
  },
  actionButton: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 123 * 1,
    backgroundColor: '#FFFFFF0D',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 15 * 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 123 * SCALE,
  },
  actionButtonText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#A9EF45',
    marginTop: 5 * 1,
  },
  rotatedIcon: {
    transform: [{ rotate: '180deg' }],
  },
  walletsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginTop: 5 * 1,
    marginBottom: 17 * SCALE,
  },
  walletsTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  viewAllText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#A9EF45',
  },
  walletCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    gap: 10 * SCALE,
    marginBottom: 20 * SCALE,
  },
  walletCard: {
    flex: 1,
    borderRadius: 20 * SCALE,
    padding: 10 * SCALE,
    minHeight: 139 * SCALE,
    overflow: 'hidden',
  },
  walletCardWhite: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent',
  },
  walletIcon: {
    width: 33 * 1,
    height: 33 * 1,
    borderRadius: 16.5 * 1,
    marginBottom: 8 * 1,
  },
  walletInfo: {
    marginBottom: 4 * 1,
  },
  walletCode: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
  },
  walletCodeDark: {
    color: '#000000',
  },
  walletName: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  walletNameDark: {
    color: '#000000',
  },
  walletDivider: {
    height: 0.3,
    backgroundColor: '#000',
    marginVertical: 6 * SCALE,
  },
  walletBalanceLabel: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 6 * SCALE,
  },
  walletBalanceLabelDark: {
    color: '#000000',
  },
  walletBalanceAmount: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 6 * SCALE,
  },
  walletBalanceAmountDark: {
    color: '#000000',
  },
  walletBalanceCurrency: {
    fontSize: 8 * 1,
  },
  walletBalanceCurrencyDark: {
    color: '#000000',
  },
  walletUsdAmount: {
    fontSize: 10 * 1,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  walletUsdAmountDark: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  promoBannerContainer: {
    marginBottom: 5 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  promoBanner: {
    width: SCREEN_WIDTH - (SCREEN_WIDTH * 0.094), // Full width minus horizontal margins
    borderRadius: 20 * 1,
    overflow: 'hidden',
    minHeight: 118 * 1,
  },
  promoBannerImage: {
    width: '100%',
    height: 118 * 1,
    borderRadius: 20 * 1,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 1 * SCALE,
    marginTop: 5 * SCALE,
    marginBottom: 14 * SCALE,
  },
  paginationDot: {
    width: 4 * 1,
    height: 4 * 1,
    borderRadius: 2 * 1,
    backgroundColor: '#bababa',
  },
  paginationDotActive: {
    width: 14 * 1,
    backgroundColor: '#A9EF45',
  },
  transactionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  transactionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10 * SCALE,
  },
  transactionCardTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  filterButtonContainer: {
    position: 'relative',
    zIndex: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
    borderRadius: 100,
    paddingHorizontal: 13 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 10 * SCALE,
  },
  filterButtonText: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8 * SCALE,
    backgroundColor: '#020c19',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
    overflow: 'hidden',
    minWidth: 120 * SCALE,
    zIndex: 1000,
    elevation: 10,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13 * SCALE,
    paddingVertical: 12 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOptionText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  transactionTotalAmount: {
    fontSize: 40 * 1,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 20 * SCALE,
    marginTop: 13 * SCALE,
    lineHeight: 59 * SCALE,
  },
  transactionTotalCurrency: {
    fontSize: 10 * SCALE,
  },
  transactionTotalDecimals: {
    fontSize: 40 * 1,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  chartBars: {
    flexDirection: 'row',
    gap: 7 * SCALE,
    marginBottom: 10 * SCALE,
    alignItems: 'flex-end',
    height: 15 * SCALE,
  },
  chartBar: {
    height: 15 * SCALE,
    borderRadius: 3 * SCALE,
  },
  chartBar1: {
    flex: 1.44,
    backgroundColor: '#2965a9',
  },
  chartBar2: {
    flex: 0.67,
    backgroundColor: 'purple',
  },
  chartBar3: {
    flex: 0.67,
    backgroundColor: 'green',
  },
  chartBar4: {
    flex: 0.72,
    backgroundColor: 'yellow',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7 * SCALE,
    marginTop: 10 * SCALE,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 * SCALE,
  },
  legendDot: {
    width: 8 * SCALE,
    height: 8 * SCALE,
    borderRadius: 2 * 1,
  },
  legendDot1: {
    backgroundColor: '#2965a9',
  },
  legendDot2: {
    backgroundColor: 'purple',
  },
  legendDot3: {
    backgroundColor: 'green',
  },
  legendDot4: {
    backgroundColor: 'yellow',
  },
  legendText: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  recentTransactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 15 * 1,
    padding: 14 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
  },
  recentTransactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18 * SCALE,
  },
  recentTransactionsTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * 1,
    padding: 13 * 1,
    marginBottom: 10 * 1,
  },
  transactionIconContainer: {
    marginRight: 12 * SCALE,
  },
  transactionIconCircle: {
    width: 35 * 1,
    height: 35 * 1,
    borderRadius: 17.5 * 1,
    backgroundColor: '#A9EF4533',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  transactionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3 * SCALE,
  },
  statusDot: {
    width: 6 * SCALE,
    height: 6 * SCALE,
    borderRadius: 3 * SCALE,
    backgroundColor: '#A9EF45',
  },
  transactionSubtitle: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#A9EF45',
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 12 * 1,
    fontWeight: '500',
    color: '#008000',
    marginBottom: 4 * SCALE,
  },
  transactionDate: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  bottomSpacer: {
    height: 20 * 1,
  },
  // Send Funds Modal Styles
  sendFundsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  sendFundsModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingTop: 10 * SCALE,
    paddingBottom: 30 * SCALE,
    width: '100%',
    maxHeight: '80%',
  },
  sendFundsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 10 * SCALE,
  },
  sendFundsModalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  sendFundsModalCloseCircle: {
    width: 25 * SCALE,
    height: 25 * SCALE,
    borderRadius: 16 * SCALE,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10 * SCALE,
  },
  sendFundsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15 * SCALE,
    borderWidth: 0.3,
    borderColor: '#484848',
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 10 * SCALE,
    marginBottom: 12 * SCALE,
  },
  sendFundsIconCircle: {
    width: 45 * 1,
    height: 45 * 1,
    borderRadius: 30 * SCALE,
    backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15 * SCALE,
  },
  sendFundsIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    tintColor: '#000000',
  },
  sendFundsTextContainer: {
    flex: 1,
  },
  sendFundsOptionTitle: {
    fontSize: 14 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  sendFundsOptionSubtitle: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  sendFundsModalScrollContent: {
    paddingBottom: 30 * SCALE,
  },
  sendFundsIconContainer: {
    alignItems: 'center',
    marginBottom: 25 * SCALE,
    // marginTop: 10 * SCALE,
  },
  sendFundsLargeIconCircle: {
    width: 120 * SCALE,
    height: 120 * SCALE,
    borderRadius: 30 * SCALE,
    // backgroundColor: '#A9EF45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendFundsLargeIcon: {
    width: 94 * SCALE,
    height: 94 * SCALE,
    // tintColor: '#FFFFFF',
  },
  sendFundsWalletToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    padding: 4 * SCALE,
    marginHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsWalletToggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12 * SCALE,
    borderRadius: 100,
    gap: 6 * SCALE,
  },
  sendFundsWalletToggleLeft: {
    // No special styling needed
  },
  sendFundsWalletToggleRight: {
    // No special styling needed
  },
  sendFundsWalletToggleActive: {
    backgroundColor: '#A9EF45',
  },
  sendFundsWalletToggleText: {
    fontSize: 12 * 1,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  sendFundsWalletToggleTextActive: {
    color: '#000000',
    fontWeight: '400',
  },
  sendFundsBitcoinIcon: {
    width: 16 * SCALE,
    height: 16 * SCALE,
  },
  sendFundsCurrencySection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsSectionTitle: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF80',
    marginBottom: 12 * SCALE,
  },
  sendFundsBalanceCard: {
    borderRadius: 15 * SCALE,
    padding: 14 * SCALE,
    minHeight: 84 * SCALE,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendFundsBalanceCardContent: {
    flex: 1,
  },
  sendFundsBalanceLabel: {
    fontSize: 10 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8 * SCALE,
  },
  sendFundsBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8 * SCALE,
  },
  sendFundsWalletIcon: {
    width: 18 * SCALE,
    height: 16 * SCALE,
  },
  sendFundsBalanceAmount: {
    fontSize: 20 * 1,
    fontWeight: '500',
    color: '#A9EF45',
  },
  sendFundsCountrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  sendFundsCountryFlagImage: {
    width: 36 * SCALE,
    height: 38 * SCALE,
    borderRadius: 18 * SCALE,
  },
  sendFundsCountryNameText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  sendFundsAssetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 100,
    paddingHorizontal: 12 * SCALE,
    paddingVertical: 9 * SCALE,
    gap: 8 * SCALE,
    marginLeft: 12 * SCALE,
  },
  sendFundsAssetIcon: {
    width: 24 * SCALE,
    height: 24 * SCALE,
    borderRadius: 12 * SCALE,
  },
  sendFundsAssetNameText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 12 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginTop: 15 * SCALE,
    marginBottom: 15 * SCALE,
    gap: 10 * SCALE,
  },
  searchInput: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '300',
    color: '#FFFFFF',
  },
  assetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20 * SCALE,
    marginTop: 10 * SCALE,
    borderBottomWidth: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10 * SCALE,
  },
  assetItemIcon: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    marginRight: 15 * SCALE,
  },
  assetItemInfo: {
    flex: 1,
  },
  assetItemName: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4 * SCALE,
  },
  assetItemBalance: {
    fontSize: 12 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  applyButtonContainer: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 15 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  sendFundsOptionsSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsOptionsContainer: {
    // gap: 12 * SCALE,
  },
  sendFundsRecentSection: {
    paddingHorizontal: SCREEN_WIDTH * 0.047,
    marginBottom: 20 * SCALE,
  },
  sendFundsRecentScrollContent: {
    gap: 12 * SCALE,
    paddingRight: SCREEN_WIDTH * 0.047,
  },
  sendFundsRecentItem: {
    alignItems: 'center',
    marginRight: 8 * SCALE,
  },
  sendFundsRecentAvatar: {
    width: 71 * SCALE,
    height: 71 * SCALE,
    borderRadius: 35.5 * SCALE,
    marginBottom: 4 * SCALE,
  },
  sendFundsRecentName: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
    textAlign: 'center',
  },
  sendFundsRecentCurrency: {
    fontSize: 6 * 1,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 216 * 1,
    height: 216 * 1,
    borderRadius: 108 * SCALE,
    backgroundColor: 'rgba(169, 239, 69, 0.1)',
    opacity: 0.5,
  },
  circleTop: {
    top: 119 * 1,
    right: -14 * 1,
  },
  circleBottom: {
    bottom: -14 * SCALE,
    left: -14 * SCALE,
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
});
