import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { SPACING } from '../../constants/theme';
import { useThemeStore } from '../../store/useThemeStore';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export const Input: React.FC<InputProps> = ({
  label,
  icon,
  error,
  isPassword,
  containerStyle,
  style,
  placeholderTextColor,
  secureTextEntry,
  ...props
}) => {
  const { colors, isDarkMode } = useThemeStore();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDarkMode ? colors.surface : '#FFFFFF',
            borderColor: error ? colors.error : colors.border,
          },
        ]}
      >
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={placeholderTextColor || colors.textMuted}
          secureTextEntry={isSecure}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            style={styles.eyeWrapper}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
          >
            {showPassword ? (
              <EyeOff color={colors.textMuted} size={20} />
            ) : (
              <Eye color={colors.textMuted} size={20} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  iconWrapper: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  eyeWrapper: {
    paddingLeft: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
});
