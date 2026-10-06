# Pokedex Database asset sources

Downloaded October 6, 2026 for this local app prototype. Native bundles use the matching files under `assets/`.

## Existing MyDex graphic

`pokeball.png` was copied from the user's `MyDex-Pokedex-Clone/assets/graphics/pokeball.png`. No new logo artwork was created.

`app-icon.svg` places that same unmodified raster graphic inside a square SVG viewport for the web app manifest.

## Pokémon artwork

Normal and shiny transparent PNGs are from the public [PokeAPI sprites repository](https://github.com/PokeAPI/sprites), under `sprites/pokemon/other/official-artwork/` and `sprites/pokemon/other/official-artwork/shiny/`. Bundled national IDs: 1, 4, 6, 7, 25, 133, 151, 152, 155, 158, 252, 255, 258, 387, 390, 393. Additional entries use URLs returned by the app's PokeAPI adapter. The repository credits DevMike123, JoseBaGra, and Pokétwo for its custom shiny artwork.

Base source: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/

## Original game trainer avatars

These are the canonical original game sprites publicly published by the [Smogon / Pokémon Showdown sprite repository](https://github.com/smogon/sprites), under `src/_uncategorized/canonical/trainers/`. They were selected from the canonical game folders rather than community sprite reinterpretations. Their source pixel dimensions are preserved.

| Local file | Trainer | Region | Original game asset source |
| --- | --- | --- | --- |
| trainers/red.png | Red | Kanto | [FireRed / LeafGreen](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen3/firered-leafgreen/Red.png) |
| trainers/leaf.png | Leaf | Kanto | [FireRed / LeafGreen](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen3/firered-leafgreen/Leaf.png) |
| trainers/ethan.png | Ethan | Johto | [HeartGold / SoulSilver](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen4/heartgold-soulsilver/Ethan.png) |
| trainers/lyra.png | Lyra | Johto | [HeartGold / SoulSilver](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen4/heartgold-soulsilver/Lyra.png) |
| trainers/brendan.png | Brendan | Hoenn | [Emerald](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen3/emerald/Brendan.png) |
| trainers/may.png | May | Hoenn | [Emerald](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen3/emerald/May.png) |
| trainers/lucas.png | Lucas | Sinnoh | [Platinum](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen4/platinum/Lucas.png) |
| trainers/dawn.png | Dawn | Sinnoh | [Platinum](https://raw.githubusercontent.com/smogon/sprites/master/src/_uncategorized/canonical/trainers/gen4/platinum/Dawn.png) |

Public full trainer illustrations were also researched on Bulbagarden Archives, but their asset host was unavailable to local download. The app uses the original game sprites above and does not include unpublished or leaked assets.

## Fonts

Space Grotesk and Inter are bundled variable fonts from the public [Google Fonts repository](https://github.com/google/fonts), distributed under the SIL Open Font License. The corresponding license texts are included beside the font files.

- [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk)
- [Inter](https://github.com/google/fonts/tree/main/ofl/inter)

Pokémon characters and original game artwork remain the intellectual property of Nintendo, Game Freak, Creatures, and The Pokémon Company. Public availability is not a commercial artwork license; review rights before commercial publication or API sale.
