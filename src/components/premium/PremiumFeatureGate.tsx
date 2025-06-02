import React, { ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../hooks/useSubscription';

interface PremiumFeatureGateProps {
  children: ReactNode;
  featureName: string;
  description: string;
  onPress?: () => void;
}

export default function PremiumFeatureGate({
  children,
  featureName,
  description,
  onPress,
}: PremiumFeatureGateProps) {
  const [showModal, setShowModal] = React.useState(false);
  const { isPremium, redirectToCheckout } = useSubscription();

  if (isPremium) {
    return <>{children}</>;
  }

  const handlePremiumFeaturePress = () => {
    setShowModal(true);
  };

  const handleUpgrade = async () => {
    setShowModal(false);
    try {
      await redirectToCheckout();
    } catch (error) {
      Alert.alert('Error', 'Failed to start upgrade process');
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.disabledContainer}
        onPress={handlePremiumFeaturePress}
      >
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>PRO</Text>
        </View>
        <View style={styles.disabledOverlay} />
        {children}
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Ionicons name="flash" size={32} color="#0ea5e9" />
              <Text style={styles.modalTitle}>{featureName}</Text>
              <Text style={styles.modalDescription}>{description}</Text>
            </View>

            <View style={styles.featuresList}>
              <Text style={styles.featuresTitle}>Premium Features:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.featureText}>AI Flashcard Generation</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.featureText}>AI Note Improvement</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                <Text style={styles.featureText}>Priority Support</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  disabledContainer: {
    position: 'relative',
    opacity: 0.6,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 1,
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#0ea5e9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    maxWidth: 400,
    width: '90%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  featuresList: {
    marginBottom: 25,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#374151',
  },
  upgradeButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
  },
});