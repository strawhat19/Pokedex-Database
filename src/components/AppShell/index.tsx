import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

export default function AppShell({ children }: PropsWithChildren) {
  return <View nativeID='native-app-shell' style={{ flex: 1 }}>{children}</View>;
}
