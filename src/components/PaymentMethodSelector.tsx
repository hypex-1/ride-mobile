import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Text, 
  Card, 
  Icon, 
  Chip,
  Divider,
  Surface
} from 'react-native-paper';
import { PaymentMethod } from '../services/payment';

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod;
  availableMethods: PaymentMethod[];
  onMethodSelect: (method: PaymentMethod) => void;
  showTitle?: boolean;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  availableMethods,
  onMethodSelect,
  showTitle = true,
}) => {
  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'CASH':
        return 'cash';
      case 'DIGITAL_WALLET':
        return 'wallet';
      case 'CARD':
        return 'credit-card';
      default:
        return 'currency-usd';
    }
  };

  const getMethodColor = (method: PaymentMethod) => {
    if (!method.enabled) return '#ccc';
    
    switch (method.type) {
      case 'CASH':
        return '#4CAF50';
      case 'DIGITAL_WALLET':
        return '#2196F3';
      case 'CARD':
        return '#FF9800';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      {showTitle && (
        <Text variant="titleMedium" style={styles.title}>
          Payment Method
        </Text>
      )}
      
      <View style={styles.methodsList}>
        {availableMethods.map((method, index) => (
          <React.Fragment key={method.id}>
            <TouchableOpacity
              style={[
                styles.methodCard,
                !method.enabled && styles.disabledCard,
                selectedMethod.id === method.id && styles.selectedCard,
              ]}
              onPress={() => method.enabled && onMethodSelect(method)}
              disabled={!method.enabled}
            >
              <View style={styles.methodContent}>
                <View style={styles.methodInfo}>
                  <Icon 
                    source={getMethodIcon(method)} 
                    size={24} 
                    color={getMethodColor(method)} 
                  />
                  <View style={styles.methodDetails}>
                    <Text 
                      variant="bodyLarge" 
                      style={[
                        styles.methodName,
                        !method.enabled && styles.disabledText
                      ]}
                    >
                      {method.name}
                    </Text>
                    <Text 
                      variant="bodySmall" 
                      style={[
                        styles.methodDescription,
                        !method.enabled && styles.disabledText
                      ]}
                    >
                      {method.description}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.methodActions}>
                  {!method.enabled && (
                    <Chip 
                      mode="flat" 
                      style={styles.comingSoonChip}
                      textStyle={styles.comingSoonText}
                      compact
                    >
                      Coming Soon
                    </Chip>
                  )}
                  
                  {method.enabled && selectedMethod.id === method.id && (
                    <Icon source="check-circle" size={24} color="#4CAF50" />
                  )}
                  
                  {method.enabled && selectedMethod.id !== method.id && (
                    <Icon source="radiobox-blank" size={24} color="#ccc" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
            
            {index < availableMethods.length - 1 && (
              <Divider style={styles.divider} />
            )}
          </React.Fragment>
        ))}
      </View>
      
      {/* Selected Method Summary */}
      <Surface style={styles.selectedSummary}>
        <View style={styles.summaryContent}>
          <Icon 
            source={getMethodIcon(selectedMethod)} 
            size={20} 
            color={getMethodColor(selectedMethod)} 
          />
          <Text variant="bodyMedium" style={styles.summaryText}>
            You'll pay with {selectedMethod.name}
          </Text>
        </View>
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  methodsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  methodCard: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  disabledCard: {
    opacity: 0.6,
  },
  selectedCard: {
    backgroundColor: '#f8f9ff',
  },
  methodContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodDetails: {
    marginLeft: 12,
    flex: 1,
  },
  methodName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  methodDescription: {
    opacity: 0.7,
    lineHeight: 16,
  },
  disabledText: {
    opacity: 0.5,
  },
  methodActions: {
    alignItems: 'flex-end',
  },
  comingSoonChip: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
  },
  comingSoonText: {
    color: '#FF9800',
    fontSize: 11,
  },
  divider: {
    marginHorizontal: 16,
  },
  selectedSummary: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: 8,
    color: '#2E7D32',
    fontWeight: '500',
  },
});

export default PaymentMethodSelector;