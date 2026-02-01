import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Switch,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../src/stores/authStore';
import { EmergencyContact } from '../../src/types';
import { Colors, BorderRadius, Typography, Spacing, Shadows, Gradients } from '../../src/components/ui/theme';

export default function ProfileScreen() {
  const { user, updateProfile, addEmergencyContact, removeEmergencyContact, setSOSCodeWord, signOut } = useAuthStore();

  const [showAddContact, setShowAddContact] = useState(false);
  const [showCodeWordEdit, setShowCodeWordEdit] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });
  const [codeWord, setCodeWord] = useState(user?.sosCodeWord || '');

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(auth)/login');
  };

  const handleAddContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    const contact: EmergencyContact = {
      id: Math.random().toString(36).substring(2, 15),
      name: newContact.name.trim(),
      phone: newContact.phone.trim(),
      relationship: newContact.relationship.trim() || 'Contact',
    };

    addEmergencyContact(contact);
    setNewContact({ name: '', phone: '', relationship: '' });
    setShowAddContact(false);
  };

  const handleSaveCodeWord = () => {
    if (codeWord.trim()) {
      setSOSCodeWord(codeWord.trim());
      setShowCodeWordEdit(false);
      Alert.alert('Saved', 'Your SOS code word has been updated');
    }
  };

  const handleToggleSetting = (setting: 'shareLocation' | 'allowCheckIns' | 'autoEscalate') => {
    if (user) {
      updateProfile({
        settings: {
          ...user.settings,
          [setting]: !user.settings[setting],
        },
      });
    }
  };

  const pickProfileImage = async () => {
    // Request permission
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
        return;
      }
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      // For demo, we'll store the URI directly
      // In production, you'd upload to a server and store the URL
      updateProfile({ profilePicture: imageUri });
      Alert.alert('Success', 'Profile picture updated!');
    }
  };

  const handleEditProfile = () => {
    router.push('/(modals)/edit-profile');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={pickProfileImage} style={styles.avatarContainer}>
              {user?.profilePicture ? (
                <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>
                    {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'demo@safenight.app'}</Text>
            
            <TouchableOpacity style={styles.editProfileButton} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={14} color={Colors.white} />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity onPress={() => setShowAddContact(true)}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {user?.emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Text style={styles.contactInitial}>
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
                <Text style={styles.contactRelationship}>{contact.relationship}</Text>
              </View>
              <TouchableOpacity onPress={() => removeEmergencyContact(contact.id)}>
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {showAddContact && (
            <View style={styles.addContactForm}>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor={Colors.textMuted}
                value={newContact.name}
                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={Colors.textMuted}
                value={newContact.phone}
                onChangeText={(text) => setNewContact({ ...newContact, phone: text })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Relationship (optional)"
                placeholderTextColor={Colors.textMuted}
                value={newContact.relationship}
                onChangeText={(text) => setNewContact({ ...newContact, relationship: text })}
              />
              <View style={styles.addContactButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddContact(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddContact}>
                  <Text style={styles.saveButtonText}>Add Contact</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* SOS Code Word */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SOS Code Word</Text>
          <Text style={styles.sectionDescription}>
            Say this word to trigger an emergency SOS hands-free
          </Text>

          {showCodeWordEdit ? (
            <View style={styles.codeWordEdit}>
              <TextInput
                style={styles.input}
                placeholder="Enter code word"
                placeholderTextColor={Colors.textMuted}
                value={codeWord}
                onChangeText={setCodeWord}
                autoCapitalize="none"
              />
              <View style={styles.addContactButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCodeWordEdit(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveCodeWord}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.codeWordCard}
              onPress={() => setShowCodeWordEdit(true)}
            >
              <View style={styles.codeWordIcon}>
                <Ionicons name="mic" size={24} color={Colors.secondary} />
              </View>
              <View style={styles.codeWordInfo}>
                <Text style={styles.codeWordLabel}>Current code word</Text>
                <Text style={styles.codeWordValue}>
                  {user?.sosCodeWord || 'Not set'}
                </Text>
              </View>
              <Ionicons name="pencil" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Safety Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Settings</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={24} color={Colors.primary} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Share Location</Text>
                <Text style={styles.settingDescription}>
                  Share with friends during active plans
                </Text>
              </View>
            </View>
            <Switch
              value={user?.settings.shareLocation}
              onValueChange={() => handleToggleSetting('shareLocation')}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={24} color={Colors.safe} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Check-In Reminders</Text>
                <Text style={styles.settingDescription}>
                  Get notified for scheduled check-ins
                </Text>
              </View>
            </View>
            <Switch
              value={user?.settings.allowCheckIns}
              onValueChange={() => handleToggleSetting('allowCheckIns')}
              trackColor={{ false: Colors.border, true: Colors.safe }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="alert-circle" size={24} color={Colors.warning} />
              <View style={styles.settingText}>
                <Text style={styles.settingLabel}>Auto-Escalate</Text>
                <Text style={styles.settingDescription}>
                  Alert contacts after missed check-ins
                </Text>
              </View>
            </View>
            <Switch
              value={user?.settings.autoEscalate}
              onValueChange={() => handleToggleSetting('autoEscalate')}
              trackColor={{ false: Colors.border, true: Colors.warning }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weight (for BAC)</Text>
              <Text style={styles.infoValue}>{user?.weight || 140} lbs</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : 'Female'}
              </Text>
            </View>
          </View>
          <Text style={styles.infoNote}>
            This information is used only for BAC estimation and is not shared.
          </Text>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>SafeNight</Text>
          <Text style={styles.appVersion}>Version 1.0.0 (Hackathon Demo)</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarLargeText: {
    color: Colors.white,
    fontSize: Typography['3xl'],
    fontWeight: Typography.bold,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  editProfileText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  userName: {
    color: Colors.white,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  userEmail: {
    color: Colors.white,
    fontSize: Typography.sm,
    opacity: 0.8,
    marginTop: 4,
  },
  section: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
  },
  sectionDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInitial: {
    color: Colors.white,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  contactInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contactName: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  contactPhone: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  contactRelationship: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 2,
  },
  addContactForm: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: Typography.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addContactButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  saveButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  codeWordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  codeWordIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeWordInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  codeWordLabel: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
  },
  codeWordValue: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
  },
  codeWordEdit: {
    marginTop: Spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingLabel: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  settingDescription: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
  },
  infoValue: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  infoNote: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.danger + '20',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  signOutText: {
    color: Colors.danger,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  appName: {
    color: Colors.textMuted,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  appVersion: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: 4,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});
