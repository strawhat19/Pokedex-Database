import React, { useMemo, useState } from 'react';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { pageContent, type InfoPageName } from './content';
import { createInfoStyles } from './styles.native';
import { regions } from '../Landing/useLanding';
import { pokemonArtworkImages } from '../../../assets/pokemon';
import { useTheme } from '../../shared/themeContext/useTheme';
import type { Href } from 'expo-router';

export interface InfoPageProps {
  page: InfoPageName;
}

const endpoints = [
  { path: `/api/health`, description: `API process health, cache status, and runtime metrics when available.` },
  { path: `/api/v1/pokemon`, description: `Paginated Gen I–IV entries. Filter by name or number, generation, and type.` },
  { path: `/api/v1/pokemon/{id}`, description: `An entry with artwork, descriptions, abilities, stats, and evolution data.` },
  { path: `/api/v1/pokemon/{id}/evolutions`, description: `Evolution stages and methods, including levels, items, trade, and other conditions.` },
];

const openAPIUrl = () => {
  const origin = process.env.EXPO_PUBLIC_API_ORIGIN?.trim();
  if (!origin) return null;
  try {
    const url = new URL(origin);
    return url.protocol === `https:` || url.protocol === `http:` ? `${url.origin}/openapi.json` : null;
  } catch { return null; }
};

export default function InfoPage({ page }: InfoPageProps) {
  const sticky = true;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette, isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    Inter: require('../../../assets/fonts/Inter-Variable.ttf'),
    SpaceGrotesk: require('../../../assets/fonts/SpaceGrotesk-Variable.ttf'),
  });
  const styles = useMemo(() => createInfoStyles(palette, fontsLoaded), [palette, fontsLoaded]);
  const content = pageContent[page];
  const action = content.action;
  const specification = openAPIUrl();
  const openExternal = (href: string) => {
    setLinkError(null);
    void Linking.openURL(href).catch(() => setLinkError(`This link could not be opened on your device. Try again.`));
  };
  const openAction = (href: string) => {
    if (href.startsWith(`/`)) router.push(href as Href);
    else openExternal(href);
  };

  return (
    <View nativeID={`info-page-${page}`} style={[styles.screen, { paddingTop: insets.top }]}>
      <View nativeID={`info-header-${page}`} style={[styles.header, sticky && { elevation: 2 }, scrolled && { backgroundColor: `${palette.surface}ed` }]}>
        <Pressable nativeID={`info-home-${page}`} accessibilityRole='button' accessibilityLabel='Back to Pokedex Database' style={styles.homeLink} onPress={() => router.push(`/`)}>
          <Ionicons name='arrow-back-outline' size={19} color={palette.text} /><Text style={styles.homeLabel}>Pokedex Database</Text>
        </Pressable>
        <Pressable nativeID={`info-theme-${page}`} accessibilityRole='button' accessibilityLabel={isDark ? `Switch to light mode` : `Switch to dark mode`} style={styles.themeButton} onPress={toggleTheme}>
          <Ionicons name={isDark ? `sunny-outline` : `moon-outline`} size={18} color={palette.text} />
        </Pressable>
      </View>
      <ScrollView nativeID={`info-scroll-${page}`} scrollEventThrottle={64} contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 25, 34) }]} onScroll={(event) => setScrolled(event.nativeEvent.contentOffset.y > 12)}>
        <Text nativeID={`info-eyebrow-${page}`} style={styles.eyebrow}>{content.eyebrow}</Text>
        <Text nativeID={`info-title-${page}`} accessibilityRole='header' style={styles.title}>{content.title}</Text>
        <Text nativeID={`info-intro-${page}`} style={styles.intro}>{content.intro}</Text>
        {page === `regions` && regions.map((region) => (
          <Pressable
            key={region.generation}
            nativeID={`region-page-card-${region.generation}`}
            accessibilityRole='button'
            accessibilityLabel={`Explore ${region.name}, generation ${region.generation}`}
            style={styles.regionCard}
            onPress={() => router.push({ pathname: `/pokedex`, params: { generation: region.generation } })}
          >
            <View style={styles.regionInfo}>
              <Text style={styles.eyebrow}>{`GEN ${region.generation} / NO. ${region.range}`}</Text>
              <Text style={styles.regionTitle}>{region.name}</Text>
              <Text style={styles.regionMeta}>{`${region.count} Pokémon · ${region.games}`}</Text>
              <View style={styles.regionLink}><Text style={styles.regionLinkText}>Explore region</Text><Ionicons name='arrow-forward-outline' size={13} color={palette.red} /></View>
            </View>
            <Image source={pokemonArtworkImages[region.starter].default} accessibilityLabel={`${region.name} starter Pokémon`} style={styles.regionImage} />
          </Pressable>
        ))}
        {content.blocks.map((block, index) => (
          <View key={`${block.title}-${index}`} nativeID={`info-block-${page}-${index}`} style={styles.block}>
            <Text nativeID={`info-block-title-${page}-${index}`} accessibilityRole='header' style={styles.blockTitle}>{block.title}</Text>
            <Text nativeID={`info-block-text-${page}-${index}`} style={styles.blockText}>{block.text}</Text>
          </View>
        ))}
        {page === `developers` && (
          <View nativeID='native-api-endpoints' style={styles.apiCard}>
            <Text accessibilityRole='header' style={styles.blockTitle}>Explore the endpoints</Text>
            {endpoints.map((endpoint, index) => (
              <View key={endpoint.path} nativeID={`api-endpoint-${index}`} style={styles.endpoint}>
                <View style={styles.endpointLine}><Text style={styles.method}>GET</Text><Text selectable style={styles.endpointPath}>{endpoint.path}</Text></View>
                <Text style={styles.endpointCopy}>{endpoint.description}</Text>
              </View>
            ))}
            <Text selectable nativeID='api-query-example' style={styles.code}>{`GET /api/v1/pokemon\n  ?generation=1\n  &type=fire\n  &limit=8\n  &offset=0`}</Text>
            <Text style={styles.connectionNote}>Responses share a success flag, request ID, normalized data, and metadata. Failed requests include a clear error code and retry guidance.</Text>
            <Pressable
              nativeID='native-openapi-link'
              accessibilityRole='link'
              accessibilityState={{ disabled: !specification }}
              disabled={!specification}
              style={[styles.outlineAction, !specification && { opacity: 0.5 }]}
              onPress={() => { if (specification) openExternal(specification); }}
            ><Ionicons name='document-text-outline' size={17} color={palette.text} /><Text style={styles.outlineLabel}>Open OpenAPI specification</Text></Pressable>
            {!specification && <Text nativeID='native-api-connection-needed' style={styles.connectionNote}>To open the specification on a device, connect this app to its API server with EXPO_PUBLIC_API_ORIGIN. The web app serves it at /openapi.json.</Text>}
          </View>
        )}
        {page === `contact` && (
          <Pressable nativeID='native-contact-email' accessibilityRole='link' style={styles.action} onPress={() => openExternal(`mailto:rakib987@gmail.com`)}>
            <Ionicons name='mail-outline' size={18} color='#fff' /><Text style={styles.actionLabel}>{action?.label ?? `Email the creator`}</Text>
          </Pressable>
        )}
        {action && page !== `contact` && (
          <Pressable nativeID={`info-action-${page}`} accessibilityRole='link' style={styles.action} onPress={() => openAction(action.href)}>
            <Text style={styles.actionLabel}>{action.label}</Text><Ionicons name='arrow-forward-outline' size={17} color='#fff' />
          </Pressable>
        )}
        {linkError && <Text nativeID={`info-link-error-${page}`} accessibilityRole='alert' style={styles.feedback}>{linkError}</Text>}
        <View nativeID={`info-footer-${page}`} style={styles.footer}>
          <View style={styles.footerLinks}>{([['About', `/about`], ['Privacy', `/privacy`], ['Terms', `/terms`], ['Contact', `/contact`], ['API', `/developers`]] as const).map(([label, href]) => <Pressable key={label} nativeID={`info-footer-${page}-${label.toLowerCase()}`} accessibilityRole='link' onPress={() => router.push(href)}><Text style={styles.footerLink}>{label}</Text></Pressable>)}</View>
          <Text style={styles.footerCopy}>An independent fan project. Pokémon and character artwork belong to their respective owners.</Text>
          <View style={styles.footerBottom}><Text style={styles.footerCopy}>{`© ${new Date().getFullYear()} Pokedex Database`}</Text><Pressable nativeID={`info-piratechs-${page}`} accessibilityRole='link' onPress={() => openExternal(`https://piratechs.com/`)}><Text style={styles.footerLink}>Made by Piratechs ↗</Text></Pressable></View>
        </View>
      </ScrollView>
    </View>
  );
}
