import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing, borderRadius } from '../lib/theme';

type Props = { children: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app hit an unexpected error. Try again, and if it keeps happening, restart the app.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
  },
  icon: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.functional.error,
    marginBottom: spacing.lg,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface.secondary,
    textAlign: 'center',
    lineHeight: 72,
    overflow: 'hidden',
  },
  title: {
    ...typography.titleSmall,
    marginBottom: spacing.md,
  },
  body: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.xxxl,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
