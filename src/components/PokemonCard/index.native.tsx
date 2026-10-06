import React, { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import { typeColors, createCardStyles } from './styles.native';
import { useTheme } from '../../shared/themeContext/useTheme';
import { pokemonArtworkImages } from '../../../assets/pokemon';
import type { PokemonCard as PokemonRecord } from '../../shared/pokemon/types';

export interface PokemonCardProps {
  pokemon: PokemonRecord;
  shinyMode: boolean;
  disabled?: boolean;
  vote?: number;
  voteTotal?: number;
  onOpen: (id: number) => void;
  onAdd: (pokemon: PokemonRecord, shiny: boolean) => void;
  onVote: (id: number, value: 1 | -1) => void;
}

export default function PokemonCard({ pokemon, shinyMode, disabled = false, vote, voteTotal = 0, onOpen, onAdd, onVote }: PokemonCardProps) {
  const { palette } = useTheme();
  const [shiny, setShiny] = useState(shinyMode);
  const [descriptionIndex, setDescriptionIndex] = useState(0);
  const styles = useMemo(() => createCardStyles(palette), [palette]);
  useEffect(() => setShiny(shinyMode), [shinyMode]);
  const description = pokemon.descriptions?.[descriptionIndex];
  const color = typeColors[pokemon.types[0]] ?? palette.green;
  const image = shiny ? pokemon.artwork.shiny ?? pokemon.artwork.shinySprite : pokemon.artwork.default ?? pokemon.artwork.sprite;
  const source = pokemonArtworkImages[pokemon.id]?.[shiny ? `shiny` : `default`] ?? (image ? { uri: image } : require('../../../assets/pokeball.png'));

  return (
    <View nativeID={`pokemon-card-${pokemon.id}`} style={styles.card}>
      <View nativeID={`pokemon-card-top-${pokemon.id}`} style={styles.top}>
        <Text style={styles.number}>{`NO. ${String(pokemon.id).padStart(3, `0`)}`}</Text>
        <Pressable
          nativeID={`pokemon-shiny-${pokemon.id}`}
          accessibilityRole='button'
          accessibilityLabel={`${shiny ? `Show standard` : `Show shiny`} ${pokemon.displayName}`}
          accessibilityState={{ selected: shiny }}
          style={[styles.shinyButton, shiny && styles.shinySelected]}
          onPress={() => setShiny((value) => !value)}
        >
          <Ionicons name='sparkles-outline' size={12} color={shiny ? palette.red : palette.muted} />
          <Text style={styles.shinyText}>{shiny ? `Shiny` : `Standard`}</Text>
        </Pressable>
      </View>
      <Pressable
        nativeID={`pokemon-art-${pokemon.id}`}
        accessibilityRole='button'
        accessibilityLabel={`Open ${pokemon.displayName} Pokédex entry`}
        style={styles.artField}
        onPress={() => onOpen(pokemon.id)}
      >
        <View style={[styles.artCircle, { backgroundColor: color }]} />
        <Image source={source} accessibilityLabel={`${shiny ? `Shiny ` : ``}${pokemon.displayName}`} style={styles.artwork} />
      </Pressable>
      <Text style={styles.name}>{pokemon.displayName}</Text>
      <Text style={styles.category}>{pokemon.category}</Text>
      <View style={styles.types}>
        {pokemon.types.map((type) => (
          <View key={type} nativeID={`pokemon-type-${pokemon.id}-${type}`} style={[styles.type, { backgroundColor: typeColors[type] }]}>
            <Text style={styles.typeText}>{type}</Text>
          </View>
        ))}
      </View>
      <View style={styles.descriptionHeader}>
        <Text style={styles.descriptionLabel}>Field notes</Text>
        <Pressable
          nativeID={`pokemon-description-${pokemon.id}`}
          accessibilityRole='button'
          accessibilityLabel={`Change ${pokemon.displayName} game description`}
          disabled={pokemon.descriptions.length < 2}
          style={styles.versionButton}
          onPress={() => setDescriptionIndex((value) => (value + 1) % pokemon.descriptions.length)}
        >
          <Text numberOfLines={1} style={styles.versionLabel}>{(description?.version ?? `Pokédex`).replace(/-/g, ` `)}</Text>
          <Ionicons name='swap-horizontal-outline' size={12} color={palette.muted} />
        </Pressable>
      </View>
      <Text style={styles.description}>{description?.text ?? pokemon.description}</Text>
      <View style={styles.measures}>
        <View style={styles.measure}><Text style={styles.measureValue}>{`${pokemon.heightMeters} m`}</Text><Text style={styles.measureLabel}>Height</Text></View>
        <View style={styles.measure}><Text style={styles.measureValue}>{`${pokemon.weightKg} kg`}</Text><Text style={styles.measureLabel}>Weight</Text></View>
        <View style={styles.measure}><Text style={styles.measureValue}>{`Gen ${pokemon.generation}`}</Text><Text style={styles.measureLabel}>Generation</Text></View>
      </View>
      <View style={styles.footer}>
        <View style={styles.votes}>
          <Pressable
            nativeID={`pokemon-upvote-${pokemon.id}`}
            disabled={disabled}
            accessibilityRole='button'
            accessibilityLabel={`Upvote ${pokemon.displayName}`}
            accessibilityState={{ selected: vote === 1 }}
            style={[styles.voteButton, vote === 1 && styles.voteSelected]}
            onPress={() => onVote(pokemon.id, 1)}
          ><Ionicons name='arrow-up-outline' size={16} color={vote === 1 ? `#233827` : palette.muted} /></Pressable>
          <Text accessibilityLabel={`${voteTotal} votes`} style={styles.score}>{voteTotal}</Text>
          <Pressable
            nativeID={`pokemon-downvote-${pokemon.id}`}
            disabled={disabled}
            accessibilityRole='button'
            accessibilityLabel={`Downvote ${pokemon.displayName}`}
            accessibilityState={{ selected: vote === -1 }}
            style={[styles.voteButton, vote === -1 && { backgroundColor: palette.red }]}
            onPress={() => onVote(pokemon.id, -1)}
          ><Ionicons name='arrow-down-outline' size={16} color={vote === -1 ? `#fff` : palette.muted} /></Pressable>
        </View>
        <Pressable nativeID={`pokemon-add-team-${pokemon.id}`} disabled={disabled} accessibilityRole='button' style={styles.addButton} onPress={() => onAdd(pokemon, shiny)}>
          <Ionicons name='add-outline' size={15} color={palette.surface} /><Text style={styles.addText}>Add to team</Text>
        </Pressable>
      </View>
      <Pressable nativeID={`pokemon-open-${pokemon.id}`} accessibilityRole='button' style={styles.detailButton} onPress={() => onOpen(pokemon.id)}>
        <Text style={styles.detailText}>Full entry & evolution</Text><Ionicons name='arrow-forward-outline' size={13} color={palette.muted} />
      </Pressable>
    </View>
  );
}
