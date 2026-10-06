import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { trainerImages } from '../../../assets/trainers';
import { trainerModels } from '../../shared/trainers';
import { useTheme } from '../../shared/themeContext/useTheme';
import { TeamCapacity } from '../../types/types';
import { TrainerPanelProps } from './types';
import { useTrainerPanel } from './useTrainerPanel';
import { createTrainerStyles } from './styles.native';

const titles = { signin: `Welcome back, Trainer.`, signup: `Your journey starts here.`, profile: `Your Trainer Passport.`, teams: `A team for every adventure.` };

const TrainerPanel = (props: TrainerPanelProps) => {
  const panel = useTrainerPanel(props);
  const { palette } = useTheme();
  const styles = createTrainerStyles(palette);
  const showName = panel.view === `signup` || panel.view === `profile`;
  const showTrainerPicker = panel.view === `signin` || panel.view === `signup` || panel.view === `profile`;
  const profileView = panel.view === `profile`;
  const teamsView = panel.view === `teams`;
  const primary = (id: string, label: string, onPress: () => void, disabled = false) => <Pressable nativeID={id} accessibilityRole="button" accessibilityState={{ disabled }} accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.primary, disabled && styles.disabled]}><Text style={styles.primaryText}>{label}</Text></Pressable>;

  return (
    <Modal visible={Boolean(props.view)} transparent animationType="slide" onRequestClose={props.onClose} accessibilityViewIsModal>
      <View nativeID="trainer-panel-overlay" style={styles.backdrop}>
        <KeyboardAvoidingView behavior={Platform.OS === `ios` ? `padding` : undefined} style={styles.keyboard}>
          <SafeAreaView nativeID="trainer-panel-dialog" edges={[`bottom`]} style={styles.safe}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View nativeID="trainer-panel-header" style={styles.header}><Text style={styles.eyebrow}>● TRAINER ACCESS</Text><Pressable nativeID="trainer-panel-close" style={styles.close} accessibilityRole="button" accessibilityLabel="Close trainer panel" onPress={props.onClose}><Text style={styles.closeText}>×</Text></Pressable></View>
              <Text nativeID="trainer-panel-title" accessibilityRole="header" style={styles.title}>{panel.view ? titles[panel.view] : ``}</Text>
              <Text style={styles.intro}>{teamsView ? props.pendingPokemon ? `Choose a home for ${props.pendingPokemon.name}.` : `Save your favorites. Build your next winning lineup.` : profileView ? `Choose your character and make this Pokédex yours.` : `Keep your teams, favorite Pokémon, and votes together.`}</Text>
              {panel.user && <View nativeID="trainer-panel-tabs" style={styles.tabs}><Pressable nativeID="trainer-profile-tab" accessibilityRole="tab" accessibilityState={{ selected: profileView }} onPress={() => panel.changeView(`profile`)} style={[styles.tab, profileView && styles.activeTab]}><Text style={styles.tabLabel}>◉ Profile</Text></Pressable><Pressable nativeID="trainer-teams-tab" accessibilityRole="tab" accessibilityState={{ selected: teamsView }} onPress={() => panel.changeView(`teams`)} style={[styles.tab, teamsView && styles.activeTab]}><Text style={styles.tabLabel}>⊞ My Teams · {panel.teams.length}</Text></Pressable></View>}
              {(panel.failure || panel.notice || panel.error) && <View nativeID="trainer-panel-feedback" accessibilityLiveRegion="polite" style={styles.feedback}><Text style={[styles.feedbackText, (Boolean(panel.failure) || Boolean(panel.error)) && styles.error]}>{panel.failure || panel.error || `✓ ${panel.notice}`}</Text></View>}
              {panel.loading && <Text style={styles.muted}>Loading Trainer Data…</Text>}
              {(teamsView || profileView) && panel.loading ? <View nativeID="trainer-private-loading" accessibilityLabel="Loading trainer account" accessibilityState={{ busy: true }}><View style={styles.skeletonLine} /><View style={styles.skeletonLine} /><View style={styles.skeletonLine} /></View> : teamsView && panel.user ? <View nativeID="trainer-teams-content">
                {props.pendingPokemon && <View style={styles.pending}><Image source={{ uri: props.pendingPokemon.image }} accessibilityLabel={props.pendingPokemon.name} style={styles.pokemonImage} resizeMode="contain" /><View><Text style={styles.eyebrow}>READY TO ADD</Text><Text style={styles.pendingName}>{props.pendingPokemon.name}</Text></View></View>}
                <Text style={styles.label}>Team Name</Text><TextInput nativeID="trainer-team-name" accessibilityLabel="Team name" value={panel.teamName} placeholder="My Kanto team" placeholderTextColor={palette.muted} maxLength={40} onChangeText={panel.setTeamName} style={styles.input} />
                <Text style={styles.label}>Team Size</Text><View nativeID="trainer-team-capacity" style={styles.capacityRow}>{([3, 6, 10] as TeamCapacity[]).map((capacity) => <Pressable nativeID={`trainer-team-capacity-${capacity}`} accessibilityRole="radio" accessibilityState={{ checked: panel.capacity === capacity }} onPress={() => panel.setCapacity(capacity)} key={capacity} style={[styles.capacity, panel.capacity === capacity && styles.selectedCapacity]}><Text style={styles.textButton}>{capacity} Pokémon</Text></Pressable>)}</View>
                {primary(`trainer-create-team`, panel.busy ? `Saving…` : `＋ Create Team`, () => void panel.createTeam(), panel.busy)}
                {!panel.teams.length && !panel.loading && <View style={styles.empty}><Text style={styles.emptyTitle}>Your adventure needs a team.</Text><Text style={styles.muted}>Create your first team above, then add Pokémon from the Pokédex.</Text></View>}
                {panel.teams.map((team) => <View nativeID={`trainer-team-${team.id}`} key={team.id} style={styles.team}>
                  <View style={styles.teamHeader}><View><Text style={styles.teamName}>{team.name}</Text><Text style={styles.muted}>{team.pokemon.length} / {team.capacity} Pokémon</Text></View><Pressable nativeID={`trainer-delete-team-${team.id}`} accessibilityRole="button" accessibilityLabel={`Delete ${team.name}`} disabled={panel.busy} onPress={() => void panel.deleteSavedTeam(team.id)}><Text style={styles.muted}>× Delete</Text></Pressable></View>
                  <View style={styles.slots}>{Array.from({ length: team.capacity }, (_, index) => {
                    const pokemon = team.pokemon[index];
                    return <View nativeID={`trainer-team-slot-${team.id}-${index}`} key={index} style={styles.slot}>{pokemon ? <><Image source={{ uri: pokemon.image }} accessibilityLabel={pokemon.name} style={styles.slotImage} resizeMode="contain" /><Text style={styles.slotName} numberOfLines={1}>{pokemon.name}</Text><Pressable nativeID={`trainer-remove-${team.id}-${pokemon.id}`} accessibilityRole="button" accessibilityLabel={`Remove ${pokemon.name} from ${team.name}`} disabled={panel.busy} onPress={() => void panel.removeFromTeam(team.id, pokemon.id)} style={styles.remove}><Text style={styles.removeText}>×</Text></Pressable></> : <Text style={styles.slotPlus}>＋</Text>}</View>;
                  })}</View>
                  {props.pendingPokemon && primary(`trainer-add-to-${team.id}`, team.pokemon.some((entry) => entry.id === props.pendingPokemon?.id) ? `Already On This Team` : team.pokemon.length >= team.capacity ? `Team Full` : `＋ Add ${props.pendingPokemon.name}`, () => void panel.addToTeam(team.id), panel.busy || team.pokemon.length >= team.capacity || team.pokemon.some((entry) => entry.id === props.pendingPokemon?.id))}
                </View>)}
              </View> : (teamsView || profileView) && !panel.user && !panel.loading ? <View style={styles.empty}><Text style={styles.emptyTitle}>Sign in to view this.</Text><Text style={styles.muted}>Your Trainer Passport and teams are waiting.</Text>{primary(`trainer-private-signin`, `→ Sign In`, () => panel.changeView(`signin`))}<Pressable nativeID="trainer-private-signup" accessibilityRole="button" onPress={() => panel.changeView(`signup`)}><Text style={styles.textButton}>＋ Become A Trainer</Text></Pressable></View> : <View nativeID="trainer-account-form">
                {showName && <><Text style={styles.label}>Trainer Name</Text><TextInput nativeID="trainer-display-name" accessibilityLabel="Trainer name" value={panel.name} autoComplete="nickname" placeholder="Your trainer name" placeholderTextColor={palette.muted} maxLength={32} onChangeText={panel.setName} style={styles.input} /></>}
                <Text style={styles.label}>Email</Text><TextInput nativeID="trainer-email" accessibilityLabel="Email address" value={panel.email} keyboardType="email-address" autoComplete="email" autoCapitalize="none" autoCorrect={false} placeholder="trainer@example.com" placeholderTextColor={palette.muted} editable={!profileView} maxLength={254} onChangeText={panel.setEmail} style={[styles.input, profileView && styles.readonly]} />
                {!profileView && <><Text style={styles.label}>Password</Text><TextInput nativeID="trainer-password" accessibilityLabel="Password" value={panel.password} secureTextEntry autoComplete={panel.view === `signup` ? `new-password` : `current-password`} autoCapitalize="none" autoCorrect={false} placeholder={panel.view === `signup` ? `At least 8 characters` : `Your password`} placeholderTextColor={palette.muted} maxLength={128} onChangeText={panel.setPassword} style={styles.input} /></>}
                {showTrainerPicker && <View nativeID="trainer-character-picker"><View style={styles.rosterHeading}><Text style={styles.label}>Choose Your Trainer</Text><Text style={styles.muted}>Generations I–IV</Text></View><View style={styles.roster}>{trainerModels.map((trainer) => <Pressable nativeID={`trainer-character-${trainer.id}`} accessibilityRole="radio" accessibilityLabel={`${trainer.name}, ${trainer.game}`} accessibilityState={{ checked: panel.trainerId === trainer.id }} onPress={() => panel.setTrainerId(trainer.id)} key={trainer.id} style={[styles.trainer, panel.trainerId === trainer.id && styles.selectedTrainer]}><Image source={trainerImages[trainer.id]} style={styles.trainerImage} resizeMode="contain" /><Text style={styles.trainerName}>{trainer.name}</Text><Text style={styles.trainerGen}>GEN {trainer.generation}</Text>{panel.trainerId === trainer.id && <Text style={styles.selectedMark}>✓</Text>}</Pressable>)}</View><Text style={styles.rosterNote}>Original FireRed, LeafGreen, HeartGold, SoulSilver, Emerald, and Platinum game sprites.</Text></View>}
                {primary(`trainer-account-submit`, panel.busy ? `Saving…` : profileView ? `✓ Save Trainer Profile` : panel.view === `signup` ? `＋ Become A Trainer` : `→ Sign In`, () => void panel.submitAccount(), panel.busy)}
                {!profileView && <View style={styles.switch}><Text style={styles.muted}>{panel.view === `signup` ? `Already a Trainer?` : `New to the adventure?`}</Text><Pressable nativeID="trainer-auth-switch" accessibilityRole="button" onPress={() => panel.changeView(panel.view === `signup` ? `signin` : `signup`)}><Text style={styles.textButton}>{panel.view === `signup` ? `Sign In` : `Become A Trainer`}</Text></Pressable></View>}
              </View>}
              <View nativeID="trainer-panel-footer" style={styles.footer}><Text style={styles.footerText}>⌁ Device demo · Trainer accounts, teams, and votes stay on this device. Profiles start private.</Text>{panel.user && <Pressable nativeID="trainer-signout" accessibilityRole="button" disabled={panel.busy} onPress={() => void panel.signOut()}><Text style={styles.textButton}>↪ Sign Out</Text></Pressable>}</View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export default TrainerPanel;
export type { TrainerPanelProps, TrainerPanelView } from './types';
