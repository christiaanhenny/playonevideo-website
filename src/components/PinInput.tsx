import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { COLORS, FONTS } from '../constants';
import { Delete } from 'lucide-react-native';

interface Props {
  length?: 4 | 6;
  onComplete: (pin: string) => void;
  error?: string | null;
}

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

export function PinInput({ length = 4, onComplete, error }: Props) {
  const [entered, setEntered] = useState('');
  const hasCalledComplete = useRef(false);

  const handlePress = (key: string) => {
    if (key === '') return;
    if (key === '⌫') {
      setEntered(prev => prev.slice(0, -1));
      hasCalledComplete.current = false;
      return;
    }
    if (entered.length >= length) return;
    const next = entered + key;
    setEntered(next);
    if (next.length === length && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      setTimeout(() => {
        onComplete(next);
        setEntered('');
        hasCalledComplete.current = false;
      }, 150);
    }
  };

  return (
    <View style={styles.container}>
      {/* Dots */}
      <View style={styles.dots}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i < entered.length && styles.dotFilled]}
          />
        ))}
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : null}

      {/* Keypad */}
      <View style={styles.keypad}>
        {DIGITS.map((digit, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.key, digit === '' && styles.keyEmpty]}
            onPress={() => handlePress(digit)}
            disabled={digit === ''}
            activeOpacity={0.55}
          >
            {digit === '⌫' ? (
              <Delete size={22} color={COLORS.textSecondary} />
            ) : (
              <Text style={[
                styles.keyText,
                digit === '' && styles.keyHidden,
              ]}>
                {digit}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  dots: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    marginTop: 8,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  dotFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  error: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
  },
  key: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  keyEmpty: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
    elevation: 0,
  },
  keyHidden: {
    opacity: 0,
  },
  keyText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
});
