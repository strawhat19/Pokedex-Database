import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AccessibilityInfo, Animated, Image, Linking, Modal, Pressable,
  ScrollView, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import PokemonCard from '../PokemonCard';
import TrainerPanel from '../TrainerPanel';
import { createStyles } from './styles.native';
import { regions, useLanding } from './useLanding';
import { pokemonAPI } from '../../api/pokemon';
import { trainerImages } from '../../../assets/trainers';
import { useAuth } from '../../shared/authContext/useAuth';
import { errorMessage } from '../../shared/common/values';
import { useTrainer } from '../../shared/teams/useTrainer';
import { useTheme } from '../../shared/themeContext/useTheme';
import { pokemonArtworkImages } from '../../../assets/pokemon';
import { pokemonTypes } from '../../shared/pokemon/types';
import type { TeamPokemon } from '../../shared/models';
import type { TrainerPanelView } from '../TrainerPanel/types';
import type { PokemonCard as PokemonRecord, PokemonDetail, PokemonGeneration } from '../../shared/pokemon/types';

interface LandingProps {
  catalogOnly?: boolean;
  initialGeneration?: PokemonGeneration;
}

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (active) setReduced(value); }).catch(() => undefined);
    const listener = AccessibilityInfo.addEventListener(`reduceMotionChanged`, setReduced);
    return () => { active = false; listener.remove(); };
  }, []);
  return reduced;
};

const Reveal = ({ children, delay = 0, reduced }: { children: React.ReactNode; delay?: number; reduced: boolean }) => {
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, { toValue: 1, duration: reduced ? 0 : 650, delay: reduced ? 0 : delay, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [delay, progress, reduced]);
  return <Animated.View style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>{children}</Animated.View>;
};

const Skeleton = ({ reduced }: { reduced: boolean }) => {
  const { palette } = useTheme();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const opacity = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    if (reduced) { opacity.setValue(1); return; }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.55, duration: 650, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [opacity, reduced]);
  return (
    <Animated.View accessibilityLabel='Loading Pokémon entry' style={[styles.skeleton, { opacity }]}>
      <View style={[styles.skeletonLine, { width: `28%` }]} /><View style={styles.skeletonImage} />
      <View style={[styles.skeletonLine, { width: `57%`, height: 22 }]} />
      <View style={styles.skeletonLine} /><View style={[styles.skeletonLine, { width: `80%` }]} />
    </Animated.View>
  );
};

export default function Landing({ catalogOnly = false, initialGeneration }: LandingProps) {
  const sticky = true;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { user, loading: authLoading } = useAuth();
  const { palette, isDark, toggleTheme } = useTheme();
  const { votes, voteTotals, toggleVote } = useTrainer();
  const styles = useMemo(() => createStyles(palette), [palette]);
  const entries = useLanding(initialGeneration);
  const reduced = useReducedMotion();
  const scroll = useRef<ScrollView>(null);
  const [fontsLoaded, fontError] = useFonts({
    Inter: require('../../../assets/fonts/Inter-Variable.ttf'),
    SpaceGrotesk: require('../../../assets/fonts/SpaceGrotesk-Variable.ttf'),
  });
  const [scrolled, setScrolled] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const heroHeight = useRef(catalogOnly ? 240 : 740);
  const entriesOffset = useRef(0);
  const topVisibility = useRef(new Animated.Value(0)).current;
  const [heroShiny, setHeroShiny] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderTimedOut, setLoaderTimedOut] = useState(false);
  const opening = useRef(new Animated.Value(0)).current;
  const [panel, setPanel] = useState<TrainerPanelView | null>(null);
  const [pendingPokemon, setPendingPokemon] = useState<TeamPokemon | null>(null);
  const [pendingVote, setPendingVote] = useState<{ id: number; value: 1 | -1 } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PokemonDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRevision, setDetailRevision] = useState(0);

  useEffect(() => {
    if ((entries.loading && !loaderTimedOut) || (!fontsLoaded && !fontError) || !loaderVisible) return;
    const animation = Animated.timing(opening, { toValue: 1, duration: reduced ? 0 : 750, delay: reduced ? 0 : 180, useNativeDriver: true });
    animation.start(({ finished }) => { if (finished) setLoaderVisible(false); });
    return () => animation.stop();
  }, [entries.loading, fontError, fontsLoaded, loaderVisible, loaderTimedOut, opening, reduced]);

  useEffect(() => {
    if (!loaderVisible) return;
    const timer = setTimeout(() => setLoaderTimedOut(true), 12000);
    return () => clearTimeout(timer);
  }, [loaderVisible]);

  useEffect(() => {
    const animation = Animated.timing(topVisibility, { toValue: scrolled ? 1 : 0, duration: reduced ? 0 : 220, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [scrolled, topVisibility, reduced]);

  useEffect(() => {
    if (!detailId) { setDetail(null); return; }
    const controller = new AbortController();
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    void pokemonAPI.detail(detailId, controller.signal).then((response) => {
      if (controller.signal.aborted) return;
      if (!response.success) throw new Error(response.error.message);
      setDetail(response.data);
    }).catch((failure) => { if (!controller.signal.aborted) setDetailError(errorMessage(failure)); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [detailId, detailRevision]);

  const openTrainer = (view: TrainerPanelView) => {
    setPendingVote(null);
    setPendingPokemon(null);
    setActionError(null);
    setPanel(user ? view : view === `signup` ? `signup` : `signin`);
  };
  const vote = (id: number, value: 1 | -1) => {
    if (authLoading) return;
    if (!user) { setPendingVote({ id, value }); setPendingPokemon(null); setPanel(`signup`); return; }
    setActionError(null);
    void toggleVote(id, value).catch((failure) => setActionError(errorMessage(failure)));
  };
  const addToTeam = (pokemon: PokemonRecord, shiny: boolean) => {
    if (authLoading) return;
    setPendingVote(null);
    setPendingPokemon({ id: pokemon.id, name: pokemon.displayName, types: pokemon.types, image: (shiny ? pokemon.artwork.shiny ?? pokemon.artwork.shinySprite : pokemon.artwork.default ?? pokemon.artwork.sprite) ?? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png` });
    setPanel(user ? `teams` : `signup`);
  };
  const authenticated = () => {
    if (pendingVote) {
      void toggleVote(pendingVote.id, pendingVote.value).catch((failure) => setActionError(errorMessage(failure)));
      setPendingVote(null);
      setPanel(null);
    } else setPanel(pendingPokemon ? `teams` : `profile`);
  };
  const closePanel = () => { setPanel(null); setPendingPokemon(null); setPendingVote(null); };
  const jumpToTop = () => scroll.current?.scrollTo({ y: 0, animated: !reduced });
  const changePage = (offset: number | null | undefined) => {
    if (typeof offset !== `number`) return;
    entries.setOffset(offset);
    scroll.current?.scrollTo({ y: entriesOffset.current, animated: !reduced });
  };

  return (
    <View nativeID='pokedex-native-app' style={[styles.screen, { paddingTop: insets.top }]}>
      <View nativeID='pokedex-native-header' style={[styles.header, sticky && { elevation: 2 }, headerScrolled && { backgroundColor: `${palette.surface}ed` }]}>
        <Pressable nativeID='pokedex-native-brand' accessibilityRole='button' accessibilityLabel='Pokedex Database home' style={styles.brand} onPress={() => router.push(`/`)}>
          <Image source={require('../../../assets/pokeball.png')} style={styles.brandMark} />
          <View><Text style={styles.brandName}>POKEDEX</Text><Text style={styles.brandSub}>DATABASE</Text></View>
        </Pressable>
        <View style={styles.row}>
          <Pressable nativeID='pokedex-theme-toggle' accessibilityRole='button' accessibilityLabel={isDark ? `Switch to light mode` : `Switch to dark mode`} style={styles.circleButton} onPress={toggleTheme}>
            <Ionicons name={isDark ? `sunny-outline` : `moon-outline`} size={18} color={palette.text} />
          </Pressable>
          <Pressable nativeID='pokedex-trainer-button' accessibilityRole='button' accessibilityLabel={user ? `Open trainer profile` : `Become a trainer`} style={styles.circleButton} onPress={() => openTrainer(user ? `profile` : `signup`)}>
            {user ? <Image source={trainerImages[user.trainerId] ?? trainerImages.red} style={styles.avatar} /> : <Ionicons name='person-outline' size={18} color={palette.text} />}
          </Pressable>
        </View>
      </View>
      <ScrollView
        ref={scroll}
        nativeID='pokedex-native-scroll'
        scrollEventThrottle={64}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={styles.content}
        onScroll={(event) => { const offset = event.nativeEvent.contentOffset.y; setHeaderScrolled(offset > 12); setScrolled(offset > heroHeight.current); }}
      >
        {!catalogOnly && (
          <>
            <View nativeID='pokedex-hero' style={styles.hero} onLayout={(event) => { heroHeight.current = event.nativeEvent.layout.height; }}>
              <Reveal reduced={reduced}>
                <View style={styles.row}><View style={styles.statusDot} /><Text style={styles.eyebrow}>YOUR ADVENTURE, RECONNECTED.</Text></View>
                <Text style={styles.title}>A world of{`\n`}Pokémon.{`\n`}Your <Text style={styles.titleAccent}>Pokédex.</Text></Text>
                <Text style={styles.body}>From Pallet Town to the peaks of Sinnoh. Rediscover your favorites, explore every evolution, and build a team that feels like you.</Text>
                <View style={styles.heroActions}>
                  <Pressable nativeID='hero-browse-button' accessibilityRole='button' style={styles.primaryButton} onPress={() => router.push(`/pokedex`)}>
                    <Ionicons name='scan-outline' size={17} color='#fff' /><Text style={styles.primaryText}>Open Pokédex</Text>
                  </Pressable>
                  <Pressable nativeID='hero-trainer-button' accessibilityRole='button' style={styles.outlineButton} onPress={() => openTrainer(user ? `teams` : `signup`)}>
                    <Text style={styles.buttonText}>{user ? `My teams` : `Become a trainer`}</Text><Ionicons name='arrow-forward-outline' size={15} color={palette.text} />
                  </Pressable>
                </View>
              </Reveal>
              <Reveal reduced={reduced} delay={140}>
                <View nativeID='hero-pokemon-display' style={styles.heroVisual}>
                  <View style={styles.heroCircle} /><View style={styles.heroRing} />
                  <Text style={styles.heroNumber}>KANTO / NO. 006</Text>
                  <Image source={pokemonArtworkImages[6][heroShiny ? `shiny` : `default`]} accessibilityLabel={heroShiny ? `Shiny Charizard` : `Charizard`} style={styles.heroArtwork} />
                  <View style={styles.heroFoot}>
                    <View><Text style={styles.heroName}>Charizard</Text><Text style={styles.heroCategory}>The Flame Pokémon · Fire / Flying</Text></View>
                    <Pressable nativeID='hero-shiny-button' accessibilityRole='button' accessibilityLabel='Toggle shiny Charizard' accessibilityState={{ selected: heroShiny }} style={styles.heroShiny} onPress={() => setHeroShiny((value) => !value)}>
                      <Ionicons name='sparkles-outline' size={20} color={heroShiny ? palette.red : palette.muted} />
                    </Pressable>
                  </View>
                </View>
              </Reveal>
            </View>
            <View nativeID='pokedex-coverage' style={styles.metricStrip}>
              {[['493', `Pokémon to discover`], ['4', `Iconic regions`], ['∞', `Ways to adventure`]].map(([value, label]) => (
                <View key={value} nativeID={`pokedex-metric-${value}`} style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>
              ))}
            </View>
          </>
        )}
        <View nativeID='pokedex-entries' style={styles.section} onLayout={(event) => { entriesOffset.current = event.nativeEvent.layout.y; }}>
          <Reveal reduced={reduced} delay={120}>
            <Text style={styles.eyebrow}>THE NATIONAL POKÉDEX / GEN I–IV</Text>
            <Text style={styles.sectionHeading}>Familiar faces.{`\n`}New discoveries.</Text>
            <Text style={styles.sectionBody}>Every entry has a story. Find your next partner.</Text>
          </Reveal>
          <View nativeID='pokedex-search-field' style={styles.searchField}>
            <Ionicons name='search-outline' size={18} color={palette.muted} />
            <TextInput
              value={entries.q}
              nativeID='pokedex-search'
              autoCorrect={false}
              autoCapitalize='none'
              placeholder='Search a Pokémon or number…'
              accessibilityLabel='Search Pokémon by name or number'
              placeholderTextColor={palette.muted}
              style={styles.searchInput}
              onChangeText={entries.setQuery}
            />
            {!!entries.q && <Pressable accessibilityRole='button' accessibilityLabel='Clear search' onPress={() => entries.setQuery(``)}><Ionicons name='close-circle-outline' size={18} color={palette.muted} /></Pressable>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {([`all`, 1, 2, 3, 4] as const).map((generation) => (
              <Pressable key={generation} nativeID={`pokedex-generation-${generation}`} accessibilityRole='button' accessibilityState={{ selected: entries.generation === generation }} style={[styles.chip, entries.generation === generation && styles.chipSelected]} onPress={() => entries.chooseGeneration(generation)}>
                <Text style={[styles.chipText, entries.generation === generation && styles.chipTextSelected]}>{generation === `all` ? `All regions` : regions[generation - 1].name}</Text>
              </Pressable>
            ))}
            <Pressable nativeID='pokedex-all-shiny' accessibilityRole='button' accessibilityState={{ selected: entries.shiny }} style={[styles.chip, entries.shiny && styles.chipSelected]} onPress={() => entries.setShiny((value) => !value)}>
              <Text style={[styles.chipText, entries.shiny && styles.chipTextSelected]}>✧ Shiny</Text>
            </Pressable>
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {([`all`, ...pokemonTypes] as const).map((type) => (
              <Pressable key={type} nativeID={`pokedex-type-${type}`} accessibilityRole='button' accessibilityState={{ selected: entries.type === type }} style={[styles.chip, entries.type === type && styles.chipSelected]} onPress={() => entries.chooseType(type)}>
                <Text style={[styles.chipText, entries.type === type && styles.chipTextSelected]}>{type === `all` ? `All types` : type}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.resultCount}>{entries.loading ? `Reading the database…` : entries.error ? `Connection needed` : `${entries.pagination?.total ?? entries.pokemon.length} entries · Pokémon data from PokéAPI`}</Text>
          {actionError && <Text accessibilityRole='alert' style={[styles.feedbackBody, { color: palette.red }]}>{actionError}</Text>}
          <View nativeID='pokedex-pokemon-grid' style={styles.grid}>
            {entries.loading ? [0, 1, 2].map((id) => <Skeleton key={id} reduced={reduced} />) : entries.error ? (
              <View nativeID='pokedex-load-error' style={styles.feedback}>
                <Ionicons name='cloud-offline-outline' size={27} color={palette.red} />
                <Text style={styles.feedbackTitle}>The connection took a detour.</Text>
                <Text style={styles.feedbackBody}>{entries.error}</Text>
                <Pressable accessibilityRole='button' style={styles.outlineButton} onPress={entries.retry}><Ionicons name='refresh-outline' size={16} color={palette.text} /><Text style={styles.buttonText}>Try again</Text></Pressable>
              </View>
            ) : entries.pokemon.length === 0 ? (
              <View nativeID='pokedex-empty' style={styles.feedback}>
                <Text style={styles.feedbackTitle}>No Pokémon spotted.</Text><Text style={styles.feedbackBody}>Try another name, number, region, or type.</Text>
                <Pressable accessibilityRole='button' style={styles.outlineButton} onPress={entries.resetFilters}><Ionicons name='filter-outline' size={16} color={palette.text} /><Text style={styles.buttonText}>Reset filters</Text></Pressable>
              </View>
            ) : entries.pokemon.map((pokemon, index) => (
              <Reveal key={pokemon.id} reduced={reduced} delay={Math.min(index * 45, 250)}><PokemonCard pokemon={pokemon} shinyMode={entries.shiny} disabled={authLoading} vote={votes[pokemon.id]} voteTotal={voteTotals[pokemon.id] ?? 0} onOpen={setDetailId} onAdd={addToTeam} onVote={vote} /></Reveal>
            ))}
          </View>
          {!entries.loading && !entries.error && entries.pagination && (
            <View style={[styles.row, styles.more]}>
              <Pressable nativeID='pokedex-page-previous' accessibilityRole='button' disabled={entries.pagination.previous === null} style={[styles.outlineButton, { flex: 1, opacity: entries.pagination.previous === null ? 0.4 : 1 }]} onPress={() => changePage(entries.pagination?.previous)}><Ionicons name='arrow-back-outline' size={16} color={palette.text} /><Text style={styles.buttonText}>Previous</Text></Pressable>
              <Pressable nativeID='pokedex-page-next' accessibilityRole='button' disabled={entries.pagination.next === null} style={[styles.outlineButton, { flex: 1, opacity: entries.pagination.next === null ? 0.4 : 1 }]} onPress={() => changePage(entries.pagination?.next)}><Text style={styles.buttonText}>Next entries</Text><Ionicons name='arrow-forward-outline' size={16} color={palette.text} /></Pressable>
            </View>
          )}
        </View>
        {!catalogOnly && (
          <>
            <View nativeID='pokedex-regions' style={styles.section}>
              <Text style={styles.eyebrow}>FOUR REGIONS. A LIFETIME OF MEMORIES.</Text><Text style={styles.sectionHeading}>Where will you go?</Text>
              {regions.map((region) => (
                <Pressable key={region.generation} nativeID={`pokedex-region-${region.generation}`} accessibilityRole='button' accessibilityLabel={`Explore ${region.name}`} style={styles.regionCard} onPress={() => router.push({ pathname: `/pokedex`, params: { generation: region.generation } })}>
                  <View><Text style={styles.eyebrow}>{`GEN ${region.generation} / ${region.range}`}</Text><Text style={styles.regionTitle}>{region.name}</Text><Text style={styles.regionMeta}>{`${region.count} Pokémon · ${region.subtitle}`}</Text></View>
                  <Image source={pokemonArtworkImages[region.starter].default} style={styles.regionArt} />
                </Pressable>
              ))}
            </View>
            <View nativeID='pokedex-trainer-feature' style={styles.section}>
              <View style={styles.featureCard}>
                <Ionicons name='people-outline' size={27} color={palette.text} /><Text style={styles.featureTitle}>Your team. Your story.</Text>
                <Text style={styles.featureCopy}>Choose a classic trainer, build teams of 3, 6, or 10, and give your favorite Pokémon a place on the roster. Your adventure stays saved on this device.</Text>
                <Pressable nativeID='team-feature-button' accessibilityRole='button' style={styles.primaryButton} onPress={() => openTrainer(user ? `teams` : `signup`)}><Text style={styles.primaryText}>{user ? `Open my teams` : `Get your trainer pass`}</Text><Ionicons name='arrow-forward-outline' size={17} color='#fff' /></Pressable>
              </View>
            </View>
            <View nativeID='pokedex-developer-feature' style={styles.section}>
              <Text style={styles.eyebrow}>BUILT FOR CURIOUS MINDS</Text><Text style={styles.sectionHeading}>A little data.{`\n`}A lot of possibility.</Text>
              <View style={styles.featureCard}>
                <Text style={styles.code}>{`GET /api/v1/pokemon/6\n\n{\n  "name": "charizard",\n  "generation": 1,\n  "types": ["fire", "flying"]\n}`}</Text>
                <Text style={styles.featureCopy}>A clean, versioned API for Pokémon, descriptions, shiny artwork, and evolution methods. Build your next adventure on familiar ground.</Text>
                <Pressable nativeID='developer-docs-button' accessibilityRole='button' style={styles.outlineButton} onPress={() => router.push(`/developers`)}><Ionicons name='code-slash-outline' size={17} color={palette.text} /><Text style={styles.buttonText}>Explore the API</Text></Pressable>
              </View>
            </View>
          </>
        )}
        <View nativeID='pokedex-native-footer' style={styles.footer}>
          <View style={styles.footerLinks}>{([['About', `/about`], ['Privacy', `/privacy`], ['Terms', `/terms`], ['Contact', `/contact`]] as const).map(([label, href]) => <Pressable key={label} nativeID={`footer-${label.toLowerCase()}`} accessibilityRole='link' onPress={() => router.push(href)}><Text style={styles.footerLink}>{label}</Text></Pressable>)}</View>
          <Text style={styles.footerCopy}>An independent fan project. Pokémon and character artwork belong to their respective owners. Trainer accounts, votes, and teams are a local device demo.</Text>
          <View style={[styles.row, { justifyContent: `space-between` }]}><Text style={styles.footerCopy}>{`© ${new Date().getFullYear()} Pokedex Database`}</Text><Pressable nativeID='footer-piratechs' accessibilityRole='link' onPress={() => void Linking.openURL(`https://piratechs.com/`)}><Text style={styles.footerLink}>Made by Piratechs ↗</Text></Pressable></View>
        </View>
      </ScrollView>
      <Animated.View pointerEvents={scrolled ? `auto` : `none`} style={[styles.scrollTop, { opacity: topVisibility, transform: [{ translateY: topVisibility.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}><Pressable nativeID='pokedex-scroll-top' accessibilityRole='button' accessibilityLabel='Scroll to top' style={{ width: 42, height: 42, alignItems: `center`, justifyContent: `center` }} onPress={jumpToTop}><Ionicons name='arrow-up-outline' size={19} color='#fff' /></Pressable></Animated.View>
      <View nativeID='pokedex-mobile-tabs' style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 11) }]}>
        {([
          { id: `home`, label: `Home`, icon: `home-outline`, action: () => router.push(`/`), active: !catalogOnly },
          { id: `pokedex`, label: `Pokédex`, icon: `scan-outline`, action: () => router.push(`/pokedex`), active: catalogOnly },
          { id: `teams`, label: `Teams`, icon: `people-outline`, action: () => openTrainer(`teams`), active: false },
          { id: `api`, label: `API`, icon: `code-slash-outline`, action: () => router.push(`/developers`), active: false },
        ] as const).map((tab) => (
          <Pressable key={tab.id} nativeID={`native-tab-${tab.id}`} accessibilityRole='button' accessibilityState={{ selected: tab.active }} style={styles.tab} onPress={tab.action}>
            <Ionicons name={tab.icon} size={21} color={tab.active ? palette.red : palette.muted} /><Text style={[styles.tabText, tab.active && styles.tabActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      <TrainerPanel view={panel} onClose={closePanel} onViewChange={setPanel} pendingPokemon={pendingPokemon} onAuthenticated={authenticated} />
      <Modal visible={detailId !== null} transparent animationType={reduced ? `none` : `slide`} onRequestClose={() => setDetailId(null)}>
        <Pressable nativeID='pokemon-detail-scrim' style={styles.modalScrim} onPress={() => setDetailId(null)}>
          <Pressable nativeID='pokemon-detail-sheet' style={[styles.detailSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => undefined}>
            <View style={styles.detailHeader}><Text style={styles.detailTitle}>{detail?.displayName ?? `Pokédex entry`}</Text><Pressable accessibilityRole='button' accessibilityLabel='Close Pokémon entry' style={styles.circleButton} onPress={() => setDetailId(null)}><Ionicons name='close-outline' size={22} color={palette.text} /></Pressable></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {detailLoading ? <Skeleton reduced={reduced} /> : detailError ? <View style={styles.feedback}><Text style={styles.feedbackBody}>{detailError}</Text><Pressable accessibilityRole='button' style={styles.outlineButton} onPress={() => setDetailRevision((value) => value + 1)}><Text style={styles.buttonText}>Try again</Text></Pressable></View> : detail && (
                <>
                  <Image source={pokemonArtworkImages[detail.id]?.default ?? { uri: detail.artwork.default ?? detail.artwork.sprite ?? `` }} accessibilityLabel={detail.displayName} style={styles.detailArtwork} />
                  <Text style={styles.detailDescription}>{detail.description}</Text>
                  <Text style={styles.detailSubtitle}>Base stats</Text>
                  {detail.stats.map((stat) => <View key={stat.name} nativeID={`detail-stat-${detail.id}-${stat.name}`} style={styles.statRow}><Text style={styles.statLabel}>{stat.name.replace(/-/g, ` `)}</Text><View style={styles.statTrack}><View style={[styles.statFill, { width: `${Math.min(stat.value / 255 * 100, 100)}%` }]} /></View><Text style={styles.statValue}>{stat.value}</Text></View>)}
                  <Text style={styles.detailSubtitle}>Evolution guide</Text>
                  {detail.evolutions.edges.length ? detail.evolutions.edges.map((edge) => (
                    <View key={`${edge.from}-${edge.to}`} nativeID={`evolution-${edge.from}-${edge.to}`} style={styles.evolution}>
                      <Text style={styles.evolutionName}>{`${detail.evolutions.nodes.find((node) => node.id === edge.from)?.displayName ?? `No. ${edge.from}`} → ${detail.evolutions.nodes.find((node) => node.id === edge.to)?.displayName ?? `No. ${edge.to}`}`}</Text>
                      {edge.methods.map((method, index) => <Text key={index} style={styles.evolutionMethod}>{[method.method, ...method.conditions].filter(Boolean).join(` · `)}</Text>)}
                    </View>
                  )) : <Text style={styles.detailDescription}>This Pokémon has no evolution in generations I–IV.</Text>}
                  {!!detail.evolutions.note && <Text style={styles.detailDescription}>{detail.evolutions.note}</Text>}
                  <Text style={styles.detailSubtitle}>Game descriptions</Text>
                  {detail.descriptions.map((description, index) => <View key={`${description.version}-${index}`} nativeID={`detail-description-${detail.id}-${index}`} style={styles.evolution}><Text style={[styles.evolutionName, { textTransform: `capitalize` }]}>{description.version.replace(/-/g, ` `)}</Text><Text style={styles.evolutionMethod}>{description.text}</Text></View>)}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      {loaderVisible && (
        <View nativeID='pokedex-opening-loader' accessibilityLabel='Opening Pokedex Database' style={styles.loader}>
          <Animated.View style={[styles.loaderTop, { transform: [{ translateY: opening.interpolate({ inputRange: [0, 1], outputRange: [0, -height * 0.57] }) }] }]}><Text style={styles.loaderBrand}>POKEDEX DATABASE</Text></Animated.View>
          <Animated.View style={[styles.loaderBottom, { transform: [{ translateY: opening.interpolate({ inputRange: [0, 1], outputRange: [0, height * 0.57] }) }] }]}><Text style={styles.loaderText}>OPENING YOUR ADVENTURE</Text></Animated.View>
          <Animated.View style={[styles.loaderButtonWrap, { opacity: opening.interpolate({ inputRange: [0, 0.45, 1], outputRange: [1, 0, 0] }), transform: [{ scale: opening.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }) }] }]}><View style={styles.loaderButton}><View style={styles.loaderLens} /></View></Animated.View>
        </View>
      )}
    </View>
  );
}
