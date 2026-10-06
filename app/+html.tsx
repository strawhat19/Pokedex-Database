import type { PropsWithChildren } from 'react';

export default function Html({ children }: PropsWithChildren) {
  return (
    <html lang='en'>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1, viewport-fit=cover' />
        <meta name='theme-color' content='#eaf4ed' />
        <meta name='description' content='Your next adventure starts here. Discover 493 Pokémon, explore their evolutions, and build your dream team across Kanto, Johto, Hoenn and Sinnoh.' />
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <link rel='manifest' href='/manifest.webmanifest' />
        <link rel='apple-touch-icon' href='/media/pokeball.png' />
      </head>
      <body>{children}</body>
    </html>
  );
}
