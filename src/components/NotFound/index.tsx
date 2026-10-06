import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useTheme } from '../../shared/themeContext/useTheme';

export default function NotFound() {
  const { palette } = useTheme();
  return <View nativeID='not-found' style={{ minHeight: 350, padding: 45, justifyContent: 'center', alignItems: 'center', gap: 20, backgroundColor: palette.background }}><Text accessibilityRole='header' style={{ color: palette.text, fontSize: 30, fontWeight: '600' }}>Off the map.</Text><Text style={{ color: palette.muted }}>This entry hasn’t been discovered yet.</Text><Link href='/' style={{ color: palette.red }}>Return to discovery →</Link></View>;
}
