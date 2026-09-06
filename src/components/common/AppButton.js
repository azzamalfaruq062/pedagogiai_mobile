import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

export default function AppButton({
  title,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
  size = 'lg', // 'sm' | 'md' | 'lg'
  icon,
  iconPosition = 'right',
  loading = false,
  disabled = false,
  style,
  textStyle,
}) {
  const { theme, isDark } = useTheme();

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isSecondary = variant === 'secondary';

  const content = (
    <View style={styles.innerRow}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isOutline ? theme.primary : '#FFFFFF'}
          style={styles.spinner}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={18}
              color={isOutline ? theme.primary : '#FFFFFF'}
              style={styles.leftIcon}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              isOutline && { color: theme.primary },
              isSecondary && { color: theme.textPrimary },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={18}
              color={isOutline ? theme.primary : '#FFFFFF'}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </View>
  );

  if (isPrimary && !disabled) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.88}
        style={[styles.wrapper, style]}
      >
        <LinearGradient
          colors={theme.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.baseButton,
            styles.primaryShadow,
            { opacity: disabled ? 0.6 : 1 },
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.baseButton,
        isOutline && [
          styles.outlineButton,
          { borderColor: theme.border, backgroundColor: 'transparent' },
        ],
        isSecondary && [
          styles.secondaryButton,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        ],
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  baseButton: {
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryShadow: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  outlineButton: {
    borderWidth: 1.5,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  spinner: {
    marginVertical: 2,
  },
});
