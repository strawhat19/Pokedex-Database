import type { ImageSourcePropType } from 'react-native';

export const pokemonArtworkImages: Record<number, { default: ImageSourcePropType; shiny: ImageSourcePropType }> = {
  1: { default: require('./1.png'), shiny: require('./1-shiny.png') },
  4: { default: require('./4.png'), shiny: require('./4-shiny.png') },
  6: { default: require('./6.png'), shiny: require('./6-shiny.png') },
  7: { default: require('./7.png'), shiny: require('./7-shiny.png') },
  25: { default: require('./25.png'), shiny: require('./25-shiny.png') },
  133: { default: require('./133.png'), shiny: require('./133-shiny.png') },
  151: { default: require('./151.png'), shiny: require('./151-shiny.png') },
  152: { default: require('./152.png'), shiny: require('./152-shiny.png') },
  155: { default: require('./155.png'), shiny: require('./155-shiny.png') },
  158: { default: require('./158.png'), shiny: require('./158-shiny.png') },
  252: { default: require('./252.png'), shiny: require('./252-shiny.png') },
  255: { default: require('./255.png'), shiny: require('./255-shiny.png') },
  258: { default: require('./258.png'), shiny: require('./258-shiny.png') },
  387: { default: require('./387.png'), shiny: require('./387-shiny.png') },
  390: { default: require('./390.png'), shiny: require('./390-shiny.png') },
  393: { default: require('./393.png'), shiny: require('./393-shiny.png') },
};
