import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { EmergencyContact } from '../../src/types';
import { Colors, BorderRadius, Typography, Spacing, Gradients } from '../../src/components/ui/theme';

export default function OnboardingScreen() {
  const { user, addEmergencyContact, setSOSCodeWord, updateProfile } = useAuthStore();
  const [step, setStep] = useState(1);

  // Step 1: Emergency Contact
  const [contact, setContact] = useState({ name: '', phone: '', relationship: '' });

  // Step 2: Code Word
  const [codeWord, setCodeWord] = useState('');

  // Step 3: Profile Info
  const [weight, setWeight] = useState('140');
  const [gender, setGender] = useState<'female' | 'other'>('female');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleAddContact = () => {
    if (!contact.name.trim() || !contact.phone.trim()) return;

    const emergencyContact: EmergencyContact = {
      id: Math.random().toString(36).substring(2, 15),
      name: contact.name.trim(),
      phone: contact.phone.trim(),
      relationship: contact.relationship.trim() || 'Emergency Contact',
    };

    addEmergencyContact(emergencyContact);
    setStep(2);
  };

  const handleSetCodeWord = () => {
    if (codeWord.trim()) {
      setSOSCodeWord(codeWord.trim());
    }
    setStep(3);
  };

  const handleProfileInfo = () => {
    updateProfile({
      weight: parseInt(weight) || 140,
      gender,
    });
    setStep(4);
  };

  const handleVerification = () => {
    setIsVerifying(true);
    // Simulate API call
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 2000);
  };

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* ... existing Step 1 content ... */}
      <View style={styles.stepIcon}>
        <Ionicons name="people" size={40} color={Colors.primary} />
      </View>
      <Text style={styles.stepTitle}>Add Emergency Contact</Text>
      <Text style={styles.stepDescription}>
        This person will be notified if you trigger an SOS alert
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Contact name"
          placeholderTextColor={Colors.textMuted}
          value={contact.name}
          onChangeText={(text) => setContact({ ...contact, name: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+1 (555) 123-4567"
          placeholderTextColor={Colors.textMuted}
          value={contact.phone}
          onChangeText={(text) => setContact({ ...contact, phone: text })}
          keyboardType="phone-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Relationship (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Mom, Best Friend"
          placeholderTextColor={Colors.textMuted}
          value={contact.relationship}
          onChangeText={(text) => setContact({ ...contact, relationship: text })}
        />
      </View>

      <TouchableOpacity
        style={[styles.nextButton, (!contact.name.trim() || !contact.phone.trim()) && styles.buttonDisabled]}
        onPress={handleAddContact}
        disabled={!contact.name.trim() || !contact.phone.trim()}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={() => setStep(2)}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* ... existing Step 2 content ... */}
      <View style={styles.stepIcon}>
        <Ionicons name="mic" size={40} color={Colors.secondary} />
      </View>
      <Text style={styles.stepTitle}>Set Your Code Word</Text>
      <Text style={styles.stepDescription}>
        Say this word to trigger an emergency SOS hands-free when you can't reach your phone
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Code Word</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., pineapple"
          placeholderTextColor={Colors.textMuted}
          value={codeWord}
          onChangeText={setCodeWord}
          autoCapitalize="none"
        />
        <Text style={styles.inputHint}>
          Choose something unique you wouldn't say normally
        </Text>
      </View>

      <View style={styles.exampleCard}>
        <Ionicons name="bulb-outline" size={20} color={Colors.caution} />
        <Text style={styles.exampleText}>
          Good code words: "pineapple", "starlight", "butterfly". Avoid common words like "help" or "emergency".
        </Text>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleSetCodeWord}>
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.skipButton} onPress={() => setStep(3)}>
        <Text style={styles.skipButtonText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIcon}>
        <Ionicons name="fitness" size={40} color={Colors.safe} />
      </View>
      <Text style={styles.stepTitle}>BAC Estimation Info</Text>
      <Text style={styles.stepDescription}>
        This helps us estimate your blood alcohol level more accurately
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Weight (lbs)</Text>
        <TextInput
          style={styles.input}
          placeholder="140"
          placeholderTextColor={Colors.textMuted}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>
        <View style={styles.genderOptions}>
          {(['female', 'other'] as const).map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.genderOption, gender === option && styles.genderOptionActive]}
              onPress={() => setGender(option)}
            >
              <Text style={[styles.genderText, gender === option && styles.genderTextActive]}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.inputHint}>
          Used for BAC calculation (biological factors affect alcohol metabolism)
        </Text>
      </View>

      <View style={styles.privacyCard}>
        <Ionicons name="lock-closed" size={20} color={Colors.primary} />
        <Text style={styles.privacyText}>
          This information is stored locally and never shared
        </Text>
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={handleProfileInfo}>
        <Text style={styles.nextButtonText}>Next: Verify ID</Text>
        <Ionicons name="arrow-forward" size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepIcon}>
        <Ionicons name={isVerified ? "shield-checkmark" : "scan"} size={40} color={isVerified ? Colors.safe : Colors.text} />
      </View>
      <Text style={styles.stepTitle}>{isVerified ? "Identity Verified" : "Verify Identity"}</Text>
      <Text style={styles.stepDescription}>
        To ensure SafeNight remains a safe community for women, we ask you to verify your ID.
      </Text>

      {!isVerified ? (
        <TouchableOpacity
          style={styles.scanIdBox}
          onPress={handleVerification}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <ActivityIndicator size="large" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.scanText}>Tap to Scan Driver's License</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.verifiedBox}>
          <Ionicons name="checkmark-circle" size={64} color={Colors.safe} />
          <Text style={styles.verifiedTitle}>Verification Successful</Text>
          <Text style={styles.verifiedText}>
            ID matches profile ({gender.charAt(0).toUpperCase() + gender.slice(1)})
          </Text>
        </View>
      )}

      <View style={styles.privacyCard}>
        <Ionicons name="eye-off" size={20} color={Colors.caution} />
        <Text style={styles.privacyText}>
          ID images are processed instantly and NOT stored on our servers.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.completeButton, !isVerified && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={!isVerified}
      >
        <Text style={styles.completeButtonText}>Complete Setup</Text>
        <Ionicons name="checkmark" size={20} color={Colors.white} />
      </TouchableOpacity>

      {!isVerified && (
        <TouchableOpacity style={styles.skipButton} onPress={() => setIsVerified(true)}>
          {/* Demo backdoor */}
          <Text style={styles.skipButtonText}>[Demo: Simulate Verify]</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Welcome, {user?.displayName?.split(' ')[0]}!</Text>
          <Text style={styles.headerSubtitle}>Let's set up your safety features</Text>

          {/* Progress */}
          <View style={styles.progress}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive,
                  s < step && styles.progressDotComplete,
                ]}
              >
                {s < step && <Ionicons name="checkmark" size={12} color={Colors.white} />}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* Step Content */}
        <View style={styles.content}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl * 2,
    borderBottomRightRadius: BorderRadius.xl * 2,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: Colors.white,
    fontSize: Typography.base,
    opacity: 0.9,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.white,
  },
  progressDotComplete: {
    backgroundColor: Colors.safe,
  },
  content: {
    padding: Spacing.lg,
  },
  stepContent: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    color: Colors.text,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    textAlign: 'center',
  },
  stepDescription: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  inputGroup: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginBottom: Spacing.xs,
  },
  input: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: Typography.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputHint: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  genderTextActive: {
    color: Colors.white,
  },
  exampleCard: {
    flexDirection: 'row',
    backgroundColor: Colors.caution + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  exampleText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  privacyCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  privacyText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  skipButton: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  skipButtonText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.safe,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    width: '100%',
    marginTop: Spacing.md,
  },
  completeButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  scanIdBox: {
    width: '100%',
    height: 200,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  scanText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    textAlign: 'center',
  },
  verifiedBox: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.safe + '10',
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.safe,
  },
  verifiedTitle: {
    color: Colors.safe,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  verifiedText: {
    color: Colors.text,
    fontSize: Typography.sm,
    textAlign: 'center',
  },
});
