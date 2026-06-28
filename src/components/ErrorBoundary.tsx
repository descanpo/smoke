import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

// Global hata sınırı — render sırasında atılan herhangi bir exception uygulamayı
// boş ekranla çökertmek yerine kullanıcıya anlamlı bir mesaj ve "Tekrar dene"
// seçeneği gösterir. Tema context'ine bağımlı olmadan çalışır (context'in kendisi
// patlamış olabilir), bu yüzden sabit koyu renkler kullanır.
interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (__DEV__) console.warn('ErrorBoundary caught:', error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={s.root}>
        <Text style={s.emoji}>🌿</Text>
        <Text style={s.title}>Bir şeyler ters gitti</Text>
        <Text style={s.body}>
          Beklenmeyen bir hata oluştu. Endişelenme, ilerlemen güvende. Lütfen tekrar dene.
        </Text>
        <TouchableOpacity style={s.btn} onPress={this.reset} activeOpacity={0.85}>
          <Text style={s.btnText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0E12',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 52, marginBottom: 20 },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  btn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 15,
    borderRadius: 16,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
      default: {},
    }),
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

export default ErrorBoundary;
