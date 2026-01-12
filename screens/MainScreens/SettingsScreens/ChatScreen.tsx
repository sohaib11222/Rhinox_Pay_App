import React, { useState, useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  ActionSheetIOS,
  Keyboard,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '../../../components';
import { usePullToRefresh } from '../../../hooks/usePullToRefresh';
import { useGetSupportChatDetails } from '../../../queries/support.queries';
import { useSendSupportMessage, useMarkSupportMessagesRead } from '../../../mutations/support.mutations';
import { showErrorAlert, showWarningAlert, showAlert } from '../../../utils/customAlert';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
  imageUri?: string | undefined;
  localImageUri?: string | undefined; // For images that haven't been uploaded yet
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatName, chatEmail, reason, chatId } = route.params as any;
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [showImagePickerModal, setShowImagePickerModal] = useState(false);
  // Store image URIs for sent messages (keyed by message text + timestamp)
  const [sentImageMap, setSentImageMap] = useState<Map<string, string>>(new Map());
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch chat details with messages
  const {
    data: chatDetailsData,
    isLoading: isLoadingChatDetails,
    isError: isChatDetailsError,
    error: chatDetailsError,
    refetch: refetchChatDetails,
  } = useGetSupportChatDetails(chatId ? Number(chatId) : 0);

  // Transform API messages to UI format
  const messages: Message[] = useMemo(() => {
    const apiMessages = chatDetailsData?.data?.messages || [];
    if (!Array.isArray(apiMessages)) {
      return [];
    }
    
    const transformedMessages: Message[] = apiMessages.map((msg: any) => {
      // Determine if message is from user or agent
      // API typically returns senderType or we can check if senderId matches the chat owner
      // For now, we'll check senderType first, then fallback to checking if it's not an admin/agent
      const isUserMessage = msg.senderType === 'user' || 
                           (msg.senderType !== 'admin' && msg.senderType !== 'agent' && !msg.isFromSupport);
      
      // Format timestamp
      let formattedTimestamp = 'Now';
      if (msg.createdAt) {
        try {
          const date = new Date(msg.createdAt);
          const now = new Date();
          const diffMs = now.getTime() - date.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          
          if (diffMins < 1) {
            formattedTimestamp = 'Now';
          } else if (diffMins < 60) {
            formattedTimestamp = `${diffMins} min ago`;
          } else if (diffMins < 1440) {
            const hours = Math.floor(diffMins / 60);
            formattedTimestamp = `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
          } else {
            formattedTimestamp = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
          }
        } catch {
          formattedTimestamp = 'Now';
        }
      }

      const messageText = msg.message || msg.text || '';
      
      // Check if this message has an associated image in our sent image map
      // Match by message text (which includes "[Image attached]" for image messages)
      const storedImageUri = sentImageMap.get(messageText);
      
      // Use API image URL if available, otherwise use stored image URI
      const imageUri = msg.imageUrl || msg.attachment?.url || storedImageUri || undefined;

      return {
        id: msg.id,
        text: messageText,
        sender: (isUserMessage ? 'user' : 'agent') as 'user' | 'agent',
        timestamp: formattedTimestamp,
        imageUri: imageUri,
        // If we have a stored image and no API image, use localImageUri
        localImageUri: (!msg.imageUrl && !msg.attachment?.url && storedImageUri) ? storedImageUri : undefined,
      };
    });

    // Add pending image message if exists
    if (pendingImageUri) {
      transformedMessages.push({
        id: `pending-${Date.now()}`,
        text: message.trim() || '[Image attached]',
        sender: 'user' as const,
        timestamp: 'Now',
        localImageUri: pendingImageUri,
      } as Message);
    }

    return transformedMessages;
  }, [chatDetailsData?.data?.messages, pendingImageUri, message, sentImageMap]);

  // Mark messages as read when chat is opened
  const markAsReadMutation = useMarkSupportMessagesRead(chatId ? Number(chatId) : 0, {
    onSuccess: () => {
      console.log('[ChatScreen] Messages marked as read');
      // Refetch chat details to update unread count
      refetchChatDetails();
    },
    onError: (error) => {
      console.error('[ChatScreen] Error marking messages as read:', error);
    },
  });

  // Mark messages as read when component mounts or chatId changes
  useEffect(() => {
    if (chatId) {
      markAsReadMutation.mutate();
    }
  }, [chatId]);

  // Send message mutation
  const sendMessageMutation = useSendSupportMessage(chatId ? Number(chatId) : 0, {
    onSuccess: (data) => {
      console.log('[ChatScreen] Message sent successfully:', data);
      setMessage('');
      // Keep pendingImageUri until refetch completes to show image in the message
      // The image is stored in sentImageMap, so it will persist after refetch
      // Refetch chat details to get new message
      refetchChatDetails().then(() => {
        // Clear pending image after refetch completes (image is now in sentImageMap)
        setPendingImageUri(null);
        // Scroll to bottom after refetch
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
      // Scroll to bottom immediately
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
    onError: (error: any) => {
      console.error('[ChatScreen] Error sending message:', error);
      setPendingImageUri(null);
      // Remove image from map on error
      setSentImageMap(prev => {
        const newMap = new Map(prev);
        // Find and remove the image entry
        for (const [key, value] of newMap.entries()) {
          if (value === pendingImageUri) {
            newMap.delete(key);
            break;
          }
        }
        return newMap;
      });
      showErrorAlert('Error', error?.message || 'Failed to send message. Please try again.');
    },
  });

  // Hide bottom tab bar when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // ChatScreen -> SettingsStack -> TabNavigator
      // Go up 2 levels to reach the Tab Navigator
      const settingsStack = navigation.getParent();
      const tabNavigator = settingsStack?.getParent();

      if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
        tabNavigator.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      return () => {
        // Restore tab bar when leaving this screen
        if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
          tabNavigator.setOptions({
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

  // Also hide on mount to ensure it's hidden immediately
  useLayoutEffect(() => {
    const settingsStack = navigation.getParent();
    const tabNavigator = settingsStack?.getParent();

    if (tabNavigator && typeof tabNavigator.setOptions === 'function') {
      tabNavigator.setOptions({
        tabBarStyle: { display: 'none' },
      });
    }
  }, [navigation]);

  // Request image picker permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        console.log('[ChatScreen] Media library permission not granted');
      }
    })();
  }, []);

  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Scroll to bottom when keyboard appears
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 250 : 300);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Handle image picker
  const handleImagePicker = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            handleTakePhoto();
          } else if (buttonIndex === 2) {
            handlePickImage();
          }
        }
      );
    } else {
      setShowImagePickerModal(true);
    }
  };

  const handleTakePhotoFromModal = async () => {
    setShowImagePickerModal(false);
    await handleTakePhoto();
  };

  const handlePickImageFromModal = async () => {
    setShowImagePickerModal(false);
    await handlePickImage();
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showWarningAlert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        // Show preview - don't auto-send
      }
    } catch (error: any) {
      console.error('[ChatScreen] Error taking photo:', error);
      showErrorAlert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        // Show preview - don't auto-send
      }
    } catch (error: any) {
      console.error('[ChatScreen] Error picking image:', error);
      showErrorAlert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSendImage = async (imageUri: string) => {
    if (!chatId) {
      showErrorAlert('Error', 'Chat ID not found. Please try again.');
      return;
    }

    // Check if chat is resolved or appealed (can't send messages)
    if (chatDetailsData?.data?.status === 'resolved' || chatDetailsData?.data?.status === 'appealed') {
      showWarningAlert('Chat Closed', 'This chat has been closed. You cannot send messages to resolved or appealed chats.');
      setSelectedImage(null);
      return;
    }

    try {
      // Store image URI for display while sending
      setPendingImageUri(imageUri);
      
      // Create message text - if there's text, include it, otherwise just indicate image
      const imageMessage = message.trim() 
        ? `${message.trim()}\n[Image attached]`
        : '[Image attached]';
      
      // Store the image URI with the message text as the key
      // This allows us to match it to the message after it's sent
      setSentImageMap(prev => {
        const newMap = new Map(prev);
        newMap.set(imageMessage, imageUri);
        return newMap;
      });
      
      sendMessageMutation.mutate({
        message: imageMessage,
      });

      // Clear selected image after sending
      setSelectedImage(null);
      setMessage('');
    } catch (error: any) {
      console.error('[ChatScreen] Error sending image:', error);
      setPendingImageUri(null);
      showErrorAlert('Error', 'Failed to send image. Please try again.');
    }
  };

  const handleSend = () => {
    if (!message.trim() && !selectedImage) {
      return;
    }

    if (!chatId) {
      showErrorAlert('Error', 'Chat ID not found. Please try again.');
      return;
    }

    // Check if chat is resolved or appealed (can't send messages)
    if (chatDetailsData?.data?.status === 'resolved' || chatDetailsData?.data?.status === 'appealed') {
      showWarningAlert('Chat Closed', 'This chat has been closed. You cannot send messages to resolved or appealed chats.');
      return;
    }

    // If there's a selected image, send it with optional text
    if (selectedImage) {
      handleSendImage(selectedImage);
    } else if (message.trim()) {
      // Send text message via API
      sendMessageMutation.mutate({
        message: message.trim(),
      });
    }
  };

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    console.log('[ChatScreen] Refreshing chat messages...');
    try {
      await refetchChatDetails();
      console.log('[ChatScreen] Chat messages refreshed successfully');
    } catch (error) {
      console.error('[ChatScreen] Error refreshing chat messages:', error);
    }
  };

  const { refreshing, onRefresh } = usePullToRefresh({
    onRefresh: handleRefresh,
    refreshDelay: 2000,
  });

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
        <Image
          source={require('../../../assets/Frame 2398.png')}
          style={styles.headerAvatar}
        />
        <View style={styles.headerInfo}>
          <ThemedText style={styles.headerName}>Rhinox Agent</ThemedText>
          <ThemedText style={styles.headerStatus}>Online</ThemedText>
        </View>
      </View>

      {isLoadingChatDetails ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#A9EF45" />
          <ThemedText style={styles.loadingText}>Loading chat...</ThemedText>
        </View>
      ) : isChatDetailsError ? (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={40 * SCALE} color="#ff0000" />
          <ThemedText style={styles.errorText}>
            {chatDetailsError?.message || 'Failed to load chat. Please try again.'}
          </ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetchChatDetails()}
          >
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.chatWrapper}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatContainer}
            contentContainerStyle={[
              styles.chatContent,
              { paddingBottom: (keyboardHeight > 0 ? keyboardHeight : 0) + 120 * SCALE }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
          {/* Chat Start Indicator */}
          <View style={styles.chatStartIndicator}>
            <ThemedText style={styles.chatStartText}>You started a chat</ThemedText>
          </View>

          {/* User Details Card */}
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Name</ThemedText>
              <ThemedText style={styles.detailValue}>
                {chatDetailsData?.data?.name || chatName || 'N/A'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Email</ThemedText>
              <ThemedText style={styles.detailValue}>
                {chatDetailsData?.data?.email || chatEmail || 'N/A'}
              </ThemedText>
            </View>
            <View style={styles.detailRow}>
              <ThemedText style={styles.detailLabel}>Reason</ThemedText>
              <ThemedText style={styles.detailValue}>
                {chatDetailsData?.data?.reason || reason || 'N/A'}
              </ThemedText>
            </View>
          </View>

          {/* Messages */}
          {messages.length > 0 ? (
            messages.map((msg) => (
              <View
                key={String(msg.id)}
                style={[
                  styles.messageContainer,
                  msg.sender === 'user' ? styles.userMessage : styles.agentMessage,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    msg.sender === 'user' ? styles.userBubble : styles.agentBubble,
                  ]}
                >
                  {(msg.imageUri || msg.localImageUri) ? (
                    <Image
                      source={{ uri: msg.localImageUri || msg.imageUri }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  ) : null}
                  {(() => {
                    // Clean up text - remove "[Image attached]" indicator if image is shown
                    let displayText = msg.text || '';
                    if (msg.imageUri || msg.localImageUri) {
                      // If image is shown, remove the "[Image attached]" text
                      displayText = displayText.replace(/\n\[Image attached\]/g, '').replace(/\[Image attached\]/g, '').trim();
                    }
                    // Only show text if there's actual content (not just empty after cleanup)
                    return displayText ? (
                      <ThemedText
                        style={[
                          styles.messageText,
                          msg.sender === 'user' ? styles.userMessageText : styles.agentMessageText,
                        ]}
                      >
                        {displayText}
                      </ThemedText>
                    ) : null;
                  })()}
                </View>
                <ThemedText style={styles.messageTimestamp}>{msg.timestamp}</ThemedText>
              </View>
            ))
          ) : (
            <View style={styles.emptyMessagesContainer}>
              <ThemedText style={styles.emptyMessagesText}>No messages yet. Start the conversation!</ThemedText>
            </View>
          )}

          {/* Resolution Indicator - Only show if chat is resolved */}
          {chatDetailsData?.data?.status === 'resolved' && (
            <View style={styles.resolutionIndicator}>
              <MaterialCommunityIcons name="check-circle" size={12 * SCALE} color="#fff" />
              <ThemedText style={styles.resolutionText}>This issue was marked as resolved</ThemedText>
            </View>
          )}
          </ScrollView>

          {/* Selected Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Message Input */}
          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={styles.attachmentButton}
                onPress={handleImagePicker}
              >
                <Image
                  source={require('../../../assets/Vector (38).png')}
                  style={styles.attachmentIcon}
                  resizeMode="cover"
                />
              </TouchableOpacity>
              <TextInput
                style={styles.messageInput}
                placeholder="Type message"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                value={message}
                onChangeText={setMessage}
                multiline
                onFocus={() => {
                  // Scroll to bottom when input is focused
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, Platform.OS === 'ios' ? 300 : 500);
                }}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  ((!message.trim() && !selectedImage) || sendMessageMutation.isPending || isLoadingChatDetails) && styles.sendButtonDisabled
                ]} 
                onPress={handleSend}
                disabled={(!message.trim() && !selectedImage) || sendMessageMutation.isPending || isLoadingChatDetails}
              >
                {sendMessageMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Image
                    source={require('../../../assets/Vector (39).png')}
                    style={styles.sendIcon}
                    resizeMode="cover"
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* Image Picker Modal - Android */}
      <Modal
        visible={showImagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImagePickerModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowImagePickerModal(false)}
        >
          <View style={styles.imagePickerModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.imagePickerModalHeader}>
              <ThemedText style={styles.imagePickerModalTitle}>Select Image</ThemedText>
              <TouchableOpacity
                onPress={() => setShowImagePickerModal(false)}
                style={styles.imagePickerModalCloseButton}
              >
                <MaterialCommunityIcons name="close-circle" size={24 * SCALE} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={handleTakePhotoFromModal}
            >
              <MaterialCommunityIcons name="camera-outline" size={24 * SCALE} color="#FFFFFF" style={styles.imagePickerOptionIcon} />
              <ThemedText style={styles.imagePickerOptionText}>Take Photo</ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>

            <View style={styles.imagePickerOptionDivider} />

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={handlePickImageFromModal}
            >
              <MaterialCommunityIcons name="image-outline" size={24 * SCALE} color="#FFFFFF" style={styles.imagePickerOptionIcon} />
              <ThemedText style={styles.imagePickerOptionText}>Choose from Library</ThemedText>
              <MaterialCommunityIcons name="chevron-right" size={20 * SCALE} color="rgba(255, 255, 255, 0.5)" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imagePickerCancelButton}
              onPress={() => setShowImagePickerModal(false)}
            >
              <ThemedText style={styles.imagePickerCancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020c19',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingTop: 50 * SCALE,
    paddingBottom: 20 * SCALE,
  },
  backButton: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    marginRight: 12 * SCALE,
  },
  iconCircle: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 40 * SCALE,
    height: 40 * SCALE,
    borderRadius: 20 * SCALE,
    marginRight: 12 * SCALE,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 2 * SCALE,
  },
  headerStatus: {
    fontSize: 8 * 1,
    fontWeight: '300',
    color: '#A9EF45',
  },
  chatWrapper: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    flexGrow: 1,
  },
  inputWrapper: {
    backgroundColor: 'transparent',
    ...(Platform.OS === 'android' && {
      position: 'relative',
    }),
  },
  chatStartIndicator: {
    backgroundColor: '#A9EF451A',
    borderRadius: 100 * SCALE,
    paddingVertical: 5 * SCALE,
    paddingHorizontal: 12 * SCALE,
    alignSelf: 'center',
    marginBottom: 20 * SCALE,
    width: '100%',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatStartText: {
    fontSize: 10 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF0D',
    borderRadius: 10 * SCALE,
    paddingHorizontal: 14 * SCALE,
    paddingVertical: 0,
    marginBottom: 20 * SCALE,
    borderWidth: 0.3,
    borderColor: '#FFFFFF33',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
  },
  detailValue: {
    fontSize: 12 * 1,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'right',
  },
  messageContainer: {
    marginBottom: 12 * SCALE,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  agentMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 10 * 1,
    paddingHorizontal: 17 * SCALE,
    paddingVertical: 14 * SCALE,
    marginBottom: 4 * SCALE,
  },
  userBubble: {
    backgroundColor: '#396EAC',
  },
  agentBubble: {
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 14 * 1,
    fontWeight: '400',
    lineHeight: 24 * SCALE,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  agentMessageText: {
    color: '#000000',
  },
  messageTimestamp: {
    fontSize: 10 * SCALE,
    fontWeight: '300',
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4 * SCALE,
  },
  resolutionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A9EF451A',
    borderRadius: 100 * SCALE,
    paddingVertical: 5 * SCALE,
    paddingHorizontal: 12 * SCALE,
    alignSelf: 'center',
    marginTop: 10 * SCALE,
    width: '100%',
    textAlign: 'center',
    justifyContent: 'center',
  },
  resolutionText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    marginLeft: 8 * SCALE,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * 1,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 13 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: Platform.OS === 'ios' ? 20 * SCALE : 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 50 * SCALE,
  },
  attachmentButton: {
    marginRight: 12 * SCALE,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4 * SCALE,
  },
  attachmentIcon: {
    width: 17,
    height: 19,
  },
  messageInput: {
    flex: 1,
    fontSize: 17 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    maxHeight: 100 * SCALE,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    marginLeft: 5 * SCALE,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4 * SCALE,
    minWidth: 32 * SCALE,
    minHeight: 32 * SCALE,
  },
  sendIcon: {
    width: 24,
    height: 24,
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
  emptyMessagesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40 * SCALE,
  },
  emptyMessagesText: {
    fontSize: 12 * SCALE,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  imagePreviewContainer: {
    marginHorizontal: 20 * SCALE,
    marginBottom: 10 * SCALE,
    position: 'relative',
  },
  imagePreview: {
    width: 150 * SCALE,
    height: 150 * SCALE,
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  removeImageButton: {
    position: 'absolute',
    top: -10 * SCALE,
    right: -10 * SCALE,
    backgroundColor: '#020c19',
    borderRadius: 12 * SCALE,
  },
  messageImage: {
    width: 200 * SCALE,
    height: 200 * SCALE,
    borderRadius: 10 * SCALE,
    marginBottom: 8 * SCALE,
  },
  // Image Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  imagePickerModalContent: {
    backgroundColor: '#020c19',
    borderTopLeftRadius: 30 * SCALE,
    borderTopRightRadius: 30 * SCALE,
    paddingBottom: 30 * SCALE,
    paddingTop: 20 * SCALE,
    maxHeight: '50%',
  },
  imagePickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingBottom: 18 * SCALE,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10 * SCALE,
  },
  imagePickerModalTitle: {
    fontSize: 16 * SCALE,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imagePickerModalCloseButton: {
    padding: 4 * SCALE,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20 * SCALE,
    paddingVertical: 18 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 20 * SCALE,
    marginBottom: 10 * SCALE,
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  imagePickerOptionIcon: {
    marginRight: 15 * SCALE,
  },
  imagePickerOptionText: {
    flex: 1,
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  imagePickerOptionDivider: {
    height: 0.3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20 * SCALE,
    marginVertical: 5 * SCALE,
  },
  imagePickerCancelButton: {
    marginHorizontal: 20 * SCALE,
    marginTop: 10 * SCALE,
    paddingVertical: 16 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePickerCancelButtonText: {
    fontSize: 14 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

