import React, { useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    StatusBar,
    Modal,
    Dimensions,
    TextInput,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetSupportChats } from '../../../queries/support.queries';
import { useCreateSupportChat } from '../../../mutations/support.mutations';
import { useGetCurrentUser } from '../../../queries/auth.queries';
import { showErrorAlert, showWarningAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface Chat {
    id: string | number;
    agentName: string;
    agentAvatar: any;
    lastMessage: string;
    date: string;
    unreadCount: number;
    status: 'active' | 'resolved' | 'appealed';
}

const Support = () => {
    const navigation = useNavigation();
    const [activeTab, setActiveTab] = useState<'active' | 'resolved' | 'appealed'>('active');
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showReasonModal, setShowReasonModal] = useState(false);
    const [chatName, setChatName] = useState('');
    const [chatEmail, setChatEmail] = useState('');
    const [selectedReason, setSelectedReason] = useState<string>('');

    // Get current user data
    const {
        data: userData,
        isLoading: isLoadingUser,
    } = useGetCurrentUser();

    // Set user data when available
    React.useEffect(() => {
        if (userData?.data?.user) {
            const user = userData.data.user;
            const fullName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`.trim()
                : user.firstName || user.lastName || user.name || '';
            const userEmail = user.email || '';
            
            if (fullName && !chatName) {
                setChatName(fullName);
            }
            if (userEmail && !chatEmail) {
                setChatEmail(userEmail);
            }
        }
    }, [userData?.data?.user]);
    const [reasonOptions] = useState([
        { id: 'Payment Issue', label: 'Payment Issue' },
        { id: 'Account issue', label: 'Account issue' },
        { id: 'P2P Issue', label: 'P2P Issue' },
    ]);

    // Fetch support chats from API
    const {
        data: chatsData,
        isLoading: isLoadingChats,
        isError: isChatsError,
        error: chatsError,
        refetch: refetchChats,
    } = useGetSupportChats({
        status: activeTab === 'active' ? 'active' : activeTab === 'resolved' ? 'resolved' : activeTab === 'appealed' ? 'appealed' : 'all',
        limit: 50,
        offset: 0,
    });

    // Transform API data to UI format
    const chats: Chat[] = useMemo(() => {
        if (!chatsData?.data || !Array.isArray(chatsData.data)) {
            return [];
        }

        return chatsData.data.map((chat: any) => {
            // Format date
            let formattedDate = 'N/A';
            if (chat.lastMessage?.createdAt) {
                try {
                    const date = new Date(chat.lastMessage.createdAt);
                    formattedDate = date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                } catch {
                    formattedDate = 'N/A';
                }
            } else if (chat.createdAt) {
                try {
                    const date = new Date(chat.createdAt);
                    formattedDate = date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    });
                } catch {
                    formattedDate = 'N/A';
                }
            }

            return {
                id: chat.id,
                agentName: chat.name || 'RhinoX Agent', // Use name from API or default
                agentAvatar: require('../../../assets/Frame 2398.png'),
                lastMessage: chat.lastMessage?.message || 'No messages yet',
                date: formattedDate,
                unreadCount: chat.unreadCount || 0,
                status: chat.status || 'active',
            };
        });
    }, [chatsData?.data]);

    // Create support chat mutation
    const createChatMutation = useCreateSupportChat({
        onSuccess: (data) => {
            console.log('[Support] Chat created successfully:', data);
            const chatId = data?.data?.id;
            const createdChat = data?.data;
            
            // Save the values before clearing
            const savedName = chatName;
            const savedEmail = chatEmail;
            const savedReason = reasonOptions.find((r) => r.id === selectedReason)?.label || selectedReason;
            
            setShowDetailsModal(false);
            setSelectedReason('');
            
            // Navigate to chat screen with created chat data
            (navigation as any).navigate('Settings', {
                screen: 'ChatScreen',
                params: {
                    chatId: chatId,
                    chatName: createdChat?.name || savedName,
                    chatEmail: createdChat?.email || savedEmail,
                    reason: createdChat?.reason || savedReason,
                },
            });
        },
        onError: (error: any) => {
            console.error('[Support] Error creating chat:', error);
            showErrorAlert('Error', error?.message || 'Failed to create support chat. Please try again.');
        },
    });

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

    const filteredChats = useMemo(() => {
        return chats.filter((chat) => chat.status === activeTab);
    }, [chats, activeTab]);

    // Pull-to-refresh functionality
    const handleRefresh = async () => {
        console.log('[Support] Refreshing support chats data...');
        try {
            await refetchChats();
            console.log('[Support] Support chats data refreshed successfully');
        } catch (error) {
            console.error('[Support] Error refreshing support chats data:', error);
        }
    };

    const { refreshing, onRefresh } = usePullToRefresh({
      onRefresh: handleRefresh,
      refreshDelay: 2000,
    });

    const handleNewChat = () => {
        // Pre-fill with user data if available
        if (userData?.data?.user) {
            const user = userData.data.user;
            const fullName = user.firstName && user.lastName 
                ? `${user.firstName} ${user.lastName}`.trim()
                : user.firstName || user.lastName || user.name || '';
            const userEmail = user.email || '';
            setChatName(fullName);
            setChatEmail(userEmail);
        } else {
            // Clear if no user data
            setChatName('');
            setChatEmail('');
        }
        setSelectedReason('');
        setShowDetailsModal(true);
    };

    const handleSaveDetails = () => {
        if (!chatName || !chatEmail || !selectedReason) {
            showWarningAlert('Validation Error', 'Please fill in all required fields (Name, Email, and Reason).');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(chatEmail)) {
            showWarningAlert('Validation Error', 'Please enter a valid email address.');
            return;
        }

        // Create support chat
        createChatMutation.mutate({
            name: chatName.trim(),
            email: chatEmail.trim(),
            reason: reasonOptions.find((r) => r.id === selectedReason)?.label || selectedReason,
        });
    };

    const handleSelectReason = () => {
        setShowDetailsModal(false);
        setShowReasonModal(true);
    };

    const handleApplyReason = () => {
        if (selectedReason) {
            setShowReasonModal(false);
            setShowDetailsModal(true);
        }
    };

    const handleChatPress = (chat: Chat) => {
        (navigation as any).navigate('Settings', {
            screen: 'ChatScreen',
            params: {
                chatId: chat.id,
                chatName: chat.agentName,
                chatEmail: chatsData?.data?.find((c: any) => c.id === chat.id)?.email || 'support@rhinox.com',
                reason: chatsData?.data?.find((c: any) => c.id === chat.id)?.reason || 'Payment Support',
            },
        });
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
                    <View style={[styles.iconCircle, {width: 40, height: 40, backgroundColor:'#FFFFFF08'}]}>
                        <MaterialCommunityIcons name="chevron-left" size={24 * 1} color="#FFFFFF" />
                    </View>
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle]}>Support</ThemedText>
                <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
                    <View style={{ backgroundColor: '#A9EF45', borderRadius: 100, padding: 10, width: 50 * SCALE, height: 50 * SCALE, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={styles.iconCircle}>
                            <MaterialCommunityIcons name="plus" size={22 * SCALE} color="#A9EF45" />
                        </View>
                    </View>
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'active' && styles.tabActive]}
                    onPress={() => setActiveTab('active')}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
                        Active
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'resolved' && styles.tabActive]}
                    onPress={() => setActiveTab('resolved')}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'resolved' && styles.tabTextActive]}>
                        Resolved
                    </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'appealed' && styles.tabActive]}
                    onPress={() => setActiveTab('appealed')}
                >
                    <ThemedText style={[styles.tabText, activeTab === 'appealed' && styles.tabTextActive]}>
                        Appealed
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            {isLoadingChats ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#A9EF45" />
                    <ThemedText style={styles.loadingText}>Loading chats...</ThemedText>
                </View>
            ) : isChatsError ? (
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
                    <ThemedText style={styles.errorText}>
                        {chatsError?.message || 'Failed to load chats. Please try again.'}
                    </ThemedText>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => refetchChats()}
                    >
                        <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
                    </TouchableOpacity>
                </View>
            ) : filteredChats.length > 0 ? (
                <ScrollView
                    style={styles.chatList}
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
                    <ThemedText style={styles.sectionTitle}>
                        {activeTab === 'active' ? 'Active Chats' : activeTab === 'resolved' ? 'Resolved Chats' : 'Appealed Chats'}
                    </ThemedText>
                    {filteredChats.map((chat) => (
                        <TouchableOpacity
                            key={String(chat.id)}
                            style={styles.chatItem}
                            onPress={() => handleChatPress(chat)}
                        >
                            <Image source={chat.agentAvatar} style={styles.agentAvatar} />
                            <View style={styles.chatInfo}>
                                <ThemedText style={styles.agentName}>{chat.agentName}</ThemedText>
                                <ThemedText style={styles.lastMessage}>{chat.lastMessage}</ThemedText>
                            </View>
                            <View style={styles.chatMeta}>
                                {chat.unreadCount > 0 && (
                                    <View style={styles.unreadBadge}>
                                        <ThemedText style={styles.unreadText}>{chat.unreadCount}</ThemedText>
                                    </View>
                                )}
                                <ThemedText style={styles.chatDate}>{chat.date}</ThemedText>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <View style={styles.emptyIcon}>
                        <Image
                            source={require('../../../assets/Vector (37).png')}
                            style={[{ marginBottom: -1, width: 111, height: 111 }]}
                            resizeMode="cover"
                        />
                    </View>
                    <ThemedText style={styles.emptyText}>You have not started any chat</ThemedText>
                    <TouchableOpacity style={styles.newChatButtonLarge} onPress={handleNewChat}>
                        <ThemedText style={styles.newChatButtonText}>New Chat</ThemedText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Details Modal */}
            <Modal
                visible={showDetailsModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetailsModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Details</ThemedText>
                            <TouchableOpacity onPress={() => setShowDetailsModal(false)}>
                                <View style={styles.closeButtonCircle}>
                                    <MaterialCommunityIcons name="close" size={20 * SCALE} color="#000" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Form Fields */}
                        <View style={styles.formContainer}>
                            <View style={styles.formField}>
                                <ThemedText style={styles.fieldLabel}>Name</ThemedText>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Qamardeen Abdul Malik"
                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        value={chatName}
                                        onChangeText={setChatName}
                                    />
                                </View>
                            </View>

                            <View style={styles.formField}>
                                <ThemedText style={styles.fieldLabel}>Email</ThemedText>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="abcdfgett@gmail.com"
                                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                        value={chatEmail}
                                        onChangeText={setChatEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>
                            </View>

                            <View style={styles.formField}>
                                <ThemedText style={styles.fieldLabel}>Reason</ThemedText>
                                <TouchableOpacity
                                    style={styles.inputContainer}
                                    onPress={handleSelectReason}
                                >
                                    <ThemedText style={[styles.input, !selectedReason && styles.inputPlaceholder]}>
                                        {selectedReason ? reasonOptions.find((r) => r.id === selectedReason)?.label : 'Select reason'}
                                    </ThemedText>
                                    <MaterialCommunityIcons name="chevron-down" size={24 * SCALE} color="rgba(255, 255, 255, 0.5)" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={[
                                styles.saveButton, 
                                (!chatName || !chatEmail || !selectedReason || createChatMutation.isPending) && styles.saveButtonDisabled
                            ]}
                            onPress={handleSaveDetails}
                            disabled={!chatName || !chatEmail || !selectedReason || createChatMutation.isPending}
                        >
                            {createChatMutation.isPending ? (
                                <ActivityIndicator size="small" color="#000000" />
                            ) : (
                                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Select Reason Modal */}
            <Modal
                visible={showReasonModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowReasonModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Select reason</ThemedText>
                            <TouchableOpacity onPress={() => setShowReasonModal(false)}>
                                <View style={styles.closeButtonCircle}>
                                    <MaterialCommunityIcons name="close" size={20 * SCALE} color="#000" />
                                </View>
                            </TouchableOpacity>
                        </View>

                        {/* Reason Options */}
                        <View style={styles.reasonList}>
                            {reasonOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.id}
                                    style={styles.reasonItem}
                                    onPress={() => setSelectedReason(option.id)}
                                >
                                    <ThemedText style={styles.reasonText}>{option.label}</ThemedText>
                                    <View style={[
                                        styles.radioButton,
                                        selectedReason === option.id && styles.radioButtonActive
                                    ]}>
                                        {selectedReason === option.id && <View style={styles.radioButtonSelected} />}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Apply Button */}
                        <TouchableOpacity
                            style={[styles.saveButton, !selectedReason && styles.saveButtonDisabled]}
                            onPress={handleApplyReason}
                            disabled={!selectedReason}
                        >
                            <ThemedText style={styles.saveButtonText}>Apply</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default Support;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020c19',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20 * SCALE,
        paddingTop: 30* 1,
        paddingBottom: 20 * SCALE,
    },
    backButton: {
        width: 40 * SCALE,
        height: 40 * SCALE,
    },
    newChatButton: {
        width: 40 * SCALE,
        height: 40 * SCALE,
    },
    iconCircle: {
        width: 25 * 1,
        height: 25 * 1,
        borderRadius: 100 * SCALE,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 16 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
    },
    tabsContainer: {
        flexDirection: 'row',
        marginHorizontal: 22 * SCALE,
        marginTop: 20 * SCALE,
        marginBottom: 20 * SCALE,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 100 * SCALE,
        padding: 4 * SCALE,
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
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    tabTextActive: {
        color: '#000000',
    },
    chatList: {
        flex: 1,
        paddingHorizontal: 20 * SCALE,
        backgroundColor: '#FFFFFF08',
        borderWidth: 0.3,
        borderColor: '#FFFFFF33',
        borderRadius: 15 * 1,
        marginHorizontal: 20,
        marginBottom: 20,

    },
    sectionTitle: {
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#FFFFFF',
        marginBottom: 10 * SCALE,
        marginTop: 10
    },
    chatItem: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10 * SCALE,
        padding: 14 * SCALE,
        marginBottom: 12 * SCALE,
        alignItems: 'center',
    },
    agentAvatar: {
        width: 45 * SCALE,
        height: 45 * SCALE,
        borderRadius: 22.5 * SCALE,
        marginRight: 12 * SCALE,
    },
    chatInfo: {
        flex: 1,
    },
    agentName: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
        marginBottom: 4 * SCALE,
    },
    lastMessage: {
        fontSize: 10 * 1,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    chatMeta: {
        alignItems: 'flex-end',
    },
    unreadBadge: {
        width: 16 * SCALE,
        height: 16 * SCALE,
        borderRadius: 8 * SCALE,
        backgroundColor: '#A9EF45',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4 * SCALE,
    },
    unreadText: {
        fontSize: 10 * SCALE,
        fontWeight: '400',
        color: '#000000',
    },
    chatDate: {
        fontSize: 8 * SCALE,
        marginTop: 5,
        fontWeight: '300',
        color: 'rgba(255, 255, 255, 0.5)',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20 * SCALE,
    },
    emptyIcon: {
        marginBottom: 20 * SCALE,
    },
    emptyText: {
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
        marginBottom: 40 * SCALE,
    },
    newChatButtonLarge: {
        backgroundColor: '#A9EF45',
        paddingHorizontal: 75 * SCALE,
        paddingVertical: 17 * SCALE,
        borderRadius: 100 * SCALE,
    },
    newChatButtonText: {
        fontSize: 14 * SCALE,
        fontWeight: '400',
        color: '#000000',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#020c19',
        borderTopLeftRadius: 20 * SCALE,
        borderTopRightRadius: 20 * SCALE,
        paddingBottom: 40 * SCALE,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10 * SCALE,
        borderBottomWidth: 0.3,
        paddingHorizontal:20,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)',
        marginBottom: 10 * SCALE,
        paddingVertical:12,
      },
      modalTitle: {
        fontSize: 16 * 1,
        fontWeight: '500',
        color: '#FFFFFF',
        flex: 1,
      },
    closeButtonCircle: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        borderRadius: 100 * SCALE,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    formContainer: {
        paddingHorizontal: 20 * SCALE,
    },
    formField: {
        marginBottom: 20 * SCALE,
    },
    fieldLabel: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
        marginBottom: 8 * SCALE,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 10 * SCALE,
        paddingHorizontal: 11 * SCALE,
        paddingVertical: 21 * SCALE,
        borderWidth: 0.3,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        minHeight: 60 * SCALE,
    },
    input: {
        flex: 1,
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
        padding: 0,
    },
    inputPlaceholder: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
    saveButton: {
        backgroundColor: '#A9EF45',
        marginHorizontal: 20 * SCALE,
        marginTop: 20 * SCALE,
        paddingVertical: 17 * SCALE,
        borderRadius: 100 * SCALE,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveButtonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#000000',
    },
    reasonList: {
        paddingHorizontal: 20 * SCALE,
        // paddingTop: 20 * SCALE,
        // padding: 10 * SCALE,
    },
    reasonItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 22 * SCALE,
        borderBottomWidth: 0.3,
        backgroundColor: '#FFFFFF0D',
        padding: 15 * SCALE,
        borderRadius: 10 * SCALE,
        marginTop: 10 * SCALE,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        minHeight: 60 * SCALE,
    },
    reasonText: {
        fontSize: 14 * 1,
        fontWeight: '400',
        color: '#FFFFFF',
    },
    radioButton: {
        width: 24 * SCALE,
        height: 24 * SCALE,
        borderRadius: 12 * SCALE,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
    },
    radioButtonActive: {
        borderColor: '#A9EF45',
        backgroundColor: 'rgba(169, 239, 69, 0.1)',
    },
    radioButtonSelected: {
        width: 12 * SCALE,
        height: 12 * SCALE,
        borderRadius: 6 * SCALE,
        backgroundColor: '#A9EF45',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40 * SCALE,
    },
    loadingText: {
        fontSize: 12 * SCALE,
        fontWeight: '400',
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 10 * SCALE,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40 * SCALE,
        paddingHorizontal: 20 * SCALE,
    },
    errorText: {
        fontSize: 12 * SCALE,
        fontWeight: '400',
        color: '#ff0000',
        marginTop: 10 * SCALE,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#A9EF45',
        borderRadius: 100 * SCALE,
        paddingHorizontal: 20 * SCALE,
        paddingVertical: 10 * SCALE,
        marginTop: 20 * SCALE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryButtonText: {
        fontSize: 12 * SCALE,
        fontWeight: '400',
        color: '#000000',
    },
});

