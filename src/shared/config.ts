/** Switch this off when a production authentication and persistence adapter is connected. */
export const useLocalStorage = true;
export const storageVersion = 1;
export const sessionLifetimeMs = 7 * 24 * 60 * 60 * 1000;
export const storagePrefix = `pokedex-database:v1`;
