import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  isPassword = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error,
  helperText,
}) {
  const { theme, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            {label}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: isDark ? '#141A2D' : '#F8FAFC',
            borderColor: error
              ? theme.accentRose
              : isFocused
              ? theme.primary
              : theme.border,
            borderWidth: isFocused ? 1.5 : 1,
            shadowColor: isFocused ? theme.primary : '#000',
            shadowOpacity: isFocused ? (isDark ? 0.25 : 0.12) : 0.02,
            shadowRadius: isFocused ? 8 : 2,
            elevation: isFocused ? 2 : 1,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={19}
            color={
              error
                ? theme.accentRose
                : isFocused
                ? theme.primary
                : theme.textMuted
            }
            style={styles.icon}
          />
        )}

        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={isPassword && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowPassword(!showPassword)}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={19}
              color={showPassword ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={theme.accentRose} />
          <Text style={[styles.errorText, { color: theme.accentRose }]}>
            {error}
          </Text>
        </View>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: theme.textMuted }]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelRow: {
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 2 },
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButton: {
    padding: 6,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
    paddingHorizontal: 2,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 2,
  },
});
