import {
  createBox,
  createText,
  createRestyleComponent,
  createVariant,
  VariantProps,
  spacing,
  border,
  backgroundColor,
  layout,
  shadow,
  typography,
  color,
  SpacingProps,
  BorderProps,
  BackgroundColorProps,
  LayoutProps,
  ShadowProps,
  TypographyProps,
  ColorProps,
} from '@shopify/restyle';
import { TouchableOpacity, TouchableOpacityProps, TextInput, TextInputProps, ViewProps } from 'react-native';
import { Theme } from '../../constants/restyleTheme';

// Box component - replaces View
export const Box = createBox<Theme>();

// Text component with theme-aware variants
export const Text = createText<Theme>();

// Button component with variants
type ButtonProps = SpacingProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  LayoutProps<Theme> &
  ShadowProps<Theme> &
  VariantProps<Theme, 'buttonVariants'> &
  TouchableOpacityProps;

export const Button = createRestyleComponent<ButtonProps, Theme>([
  spacing,
  border,
  backgroundColor,
  layout,
  shadow,
  createVariant({ themeKey: 'buttonVariants' }),
], TouchableOpacity);

// Card component with variants
type CardProps = SpacingProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  LayoutProps<Theme> &
  ShadowProps<Theme> &
  VariantProps<Theme, 'cardVariants'> &
  ViewProps;

export const Card = createRestyleComponent<CardProps, Theme>([
  spacing,
  border,
  backgroundColor,
  layout,
  shadow,
  createVariant({ themeKey: 'cardVariants' }),
]);

// Input component
type InputProps = SpacingProps<Theme> &
  BorderProps<Theme> &
  BackgroundColorProps<Theme> &
  LayoutProps<Theme> &
  TypographyProps<Theme> &
  ColorProps<Theme> &
  TextInputProps;

export const Input = createRestyleComponent<InputProps, Theme>([
  spacing,
  border,
  backgroundColor,
  layout,
  typography,
  color,
], TextInput);

// Re-export utility components
export { LoadingSpinner } from './LoadingSpinner';
export { ErrorMessage } from './ErrorMessage';