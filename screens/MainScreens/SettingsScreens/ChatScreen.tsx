import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCALE = 0.9;

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
}

const ChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { chatName, chatEmail, reason, chatId } = route.params as any;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'I have made payment',
      sender: 'user',
      timestamp: 'Now',
    },
    {
      id: '2',
      text: 'Coin will be released soon',
      sender: 'agent',
      timestamp: '2 min ago',
    },
    {
      id: '3',
      text: 'I also want to complain about something else that has been goin on in my account',
      sender: 'user',
      timestamp: 'Now',
    },
    {
      id: '4',
      text: 'I will get back to you with more information',
      sender: 'agent',
      timestamp: '2 min ago',
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const handleSend = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'user',
        timestamp: 'Now',
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessage('');
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      // TODO: Implement API call to send message
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
          <Text style={styles.headerName}>Rhinox Agent</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Chat Start Indicator */}
        <View style={styles.chatStartIndicator}>
          <Text style={styles.chatStartText}>You started a chat</Text>
        </View>

        {/* User Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Name</Text>
            <Text style={styles.detailValue}>{chatName || 'Qamardeen AbdulMalik'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{chatEmail || 'abcdefgh@gmail.com'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reason</Text>
            <Text style={styles.detailValue}>{reason || 'Payment Support'}</Text>
          </View>
        </View>

        {/* Messages */}
        {messages.map((msg) => (
          <View
            key={msg.id}
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
              <Text
                style={[
                  styles.messageText,
                  msg.sender === 'user' ? styles.userMessageText : styles.agentMessageText,
                ]}
              >
                {msg.text}
              </Text>
            </View>
            <Text style={styles.messageTimestamp}>{msg.timestamp}</Text>
          </View>
        ))}

        {/* Resolution Indicator */}
        <View style={styles.resolutionIndicator}>
          <MaterialCommunityIcons name="check-circle" size={12 * SCALE} color="#fff" />
          <Text style={styles.resolutionText}>This issue was marked as resolved</Text>
        </View>
      </ScrollView>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachmentButton}>
          <Image
            source={require('../../../assets/Vector (38).png')}
            style={[{ marginBottom: -1, width: 17, height: 19 }]}
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
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Image
            source={require('../../../assets/Vector (39).png')}
            style={[{ marginBottom: -1, width: 24, height: 24 }]}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingTop: 15 * SCALE,
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
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20 * SCALE,
    paddingTop: 20 * SCALE,
    paddingBottom: 20 * SCALE,
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
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10 * 1,
    paddingHorizontal: 15 * SCALE,
    paddingVertical: 13 * SCALE,
    marginHorizontal: 20 * SCALE,
    marginBottom: 20 * SCALE,
    borderWidth: 0.3,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  attachmentButton: {
    marginRight: 12 * SCALE,
  },
  messageInput: {
    flex: 1,
    fontSize: 17 * SCALE,
    fontWeight: '400',
    color: '#FFFFFF',
    maxHeight: 100 * SCALE,
  },
  sendButton: {
    marginLeft: 5 * SCALE,
  },
});

