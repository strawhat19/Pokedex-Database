export interface TrainerModel {
  id: string;
  name: string;
  game: string;
  generation: 1 | 2 | 3 | 4;
  image: string;
}

/** Original game trainer sprites, kept locally for reliable device rendering. */
export const trainerModels: TrainerModel[] = [
  { id: `red`, name: `Red`, game: `FireRed / LeafGreen`, generation: 1, image: `/media/trainers/red.png` },
  { id: `leaf`, name: `Leaf`, game: `FireRed / LeafGreen`, generation: 1, image: `/media/trainers/leaf.png` },
  { id: `ethan`, name: `Ethan`, game: `HeartGold / SoulSilver`, generation: 2, image: `/media/trainers/ethan.png` },
  { id: `lyra`, name: `Lyra`, game: `HeartGold / SoulSilver`, generation: 2, image: `/media/trainers/lyra.png` },
  { id: `brendan`, name: `Brendan`, game: `Emerald`, generation: 3, image: `/media/trainers/brendan.png` },
  { id: `may`, name: `May`, game: `Emerald`, generation: 3, image: `/media/trainers/may.png` },
  { id: `lucas`, name: `Lucas`, game: `Platinum`, generation: 4, image: `/media/trainers/lucas.png` },
  { id: `dawn`, name: `Dawn`, game: `Platinum`, generation: 4, image: `/media/trainers/dawn.png` },
];

export const getTrainerModel = (id?: string) => trainerModels.find((trainer) => trainer.id === id) ?? trainerModels[0];
