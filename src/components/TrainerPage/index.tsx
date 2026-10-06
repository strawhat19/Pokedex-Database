import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../shared/themeContext/useTheme';
import TrainerPanel from '../TrainerPanel';
import type { TrainerPanelView } from '../TrainerPanel/types';

const paths = { teams: '/teams', profile: '/profile', signin: '/signin', signup: '/signup' } as const;

export default function TrainerPage({ view }: { view: TrainerPanelView }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  useFonts({ Inter: require('../../../assets/fonts/Inter-Variable.ttf'), SpaceGrotesk: require('../../../assets/fonts/SpaceGrotesk-Variable.ttf') });
  return <View nativeID={`trainer-access-${view}`} style={{ flex: 1, padding: 24, paddingTop: insets.top + 20, backgroundColor: palette.background }}>
    <Pressable accessibilityRole='button' onPress={() => router.replace('/')}><Text style={{ color: palette.muted }}>← Back to discovery</Text></Pressable>
    <Text accessibilityRole='header' style={{ color: palette.text, fontSize: 30, marginTop: 80 }}>Your Trainer Passport.</Text>
    <TrainerPanel view={view} onViewChange={next => router.replace(paths[next])} onClose={() => router.replace('/')} />
  </View>;
}
