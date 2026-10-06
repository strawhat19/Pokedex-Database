import { StyleSheet } from 'react-native';
import type { ThemePalette } from '../../styles/theme/theme';

export const createInfoStyles = (palette: ThemePalette, fontsReady = true) => {
  const headingFont = fontsReady ? `SpaceGrotesk` : undefined;
  const bodyFont = fontsReady ? `Inter` : undefined;
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: palette.background },
    header: { minHeight: 64, paddingHorizontal: 22, paddingVertical: 12, flexDirection: `row`, alignItems: `center`, justifyContent: `space-between`, borderBottomWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
    homeLink: { flexDirection: `row`, alignItems: `center`, gap: 10, paddingVertical: 5 },
    homeLabel: { fontFamily: headingFont, fontSize: 13, fontWeight: `700`, color: palette.text },
    themeButton: { minHeight: 38, minWidth: 38, borderRadius: 19, alignItems: `center`, justifyContent: `center`, backgroundColor: palette.surfaceAlt },
    content: { paddingHorizontal: 24, paddingTop: 38, paddingBottom: 34, maxWidth: 720, width: `100%`, alignSelf: `center` },
    eyebrow: { fontFamily: bodyFont, fontSize: 10, fontWeight: `700`, lineHeight: 16, letterSpacing: 2, color: palette.muted },
    title: { marginTop: 14, fontFamily: headingFont, fontSize: 42, fontWeight: `700`, lineHeight: 47, letterSpacing: -1.9, color: palette.text },
    intro: { marginTop: 17, marginBottom: 29, fontFamily: bodyFont, fontSize: 14, lineHeight: 24, color: palette.muted },
    block: { marginBottom: 17, padding: 22, borderRadius: 17, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
    blockTitle: { fontFamily: headingFont, fontSize: 20, fontWeight: `700`, lineHeight: 27, color: palette.text },
    blockText: { marginTop: 10, fontFamily: bodyFont, fontSize: 13, lineHeight: 23, color: palette.muted },
    action: { minHeight: 48, marginTop: 6, marginBottom: 10, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 11, flexDirection: `row`, alignItems: `center`, justifyContent: `center`, gap: 10, backgroundColor: palette.red },
    actionLabel: { fontFamily: bodyFont, fontSize: 13, fontWeight: `700`, color: `#fff` },
    outlineAction: { minHeight: 45, marginTop: 17, paddingHorizontal: 17, paddingVertical: 12, borderWidth: 1, borderColor: palette.border, borderRadius: 10, flexDirection: `row`, alignItems: `center`, gap: 9, justifyContent: `center` },
    outlineLabel: { fontFamily: bodyFont, fontSize: 12, fontWeight: `600`, color: palette.text },
    regionCard: { minHeight: 148, marginBottom: 15, padding: 20, gap: 14, flexDirection: `row`, alignItems: `center`, borderWidth: 1, borderColor: palette.border, borderRadius: 19, backgroundColor: palette.surface },
    regionInfo: { flex: 1 },
    regionTitle: { marginTop: 7, fontFamily: headingFont, fontSize: 29, fontWeight: `700`, color: palette.text },
    regionMeta: { marginTop: 5, fontFamily: bodyFont, fontSize: 11, lineHeight: 18, color: palette.muted },
    regionImage: { width: 105, height: 108, resizeMode: `contain` },
    regionLink: { marginTop: 12, flexDirection: `row`, gap: 7, alignItems: `center` },
    regionLinkText: { fontFamily: bodyFont, fontSize: 11, fontWeight: `700`, color: palette.red },
    apiCard: { padding: 20, marginTop: 3, marginBottom: 18, borderRadius: 18, backgroundColor: palette.surfaceAlt },
    endpoint: { paddingVertical: 14, borderBottomWidth: 1, borderColor: palette.border },
    endpointLine: { flexDirection: `row`, gap: 11, alignItems: `flex-start` },
    method: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 5, fontFamily: bodyFont, fontSize: 9, fontWeight: `700`, color: `#244a2c`, backgroundColor: palette.green },
    endpointPath: { flex: 1, paddingTop: 2, fontFamily: headingFont, fontSize: 12, lineHeight: 20, color: palette.text },
    endpointCopy: { marginTop: 8, fontFamily: bodyFont, fontSize: 11, lineHeight: 19, color: palette.muted },
    code: { marginTop: 17, marginBottom: 15, padding: 17, borderRadius: 12, fontFamily: headingFont, fontSize: 11, lineHeight: 20, color: `#b7e4ac`, backgroundColor: `#18251e` },
    connectionNote: { marginTop: 12, fontFamily: bodyFont, fontSize: 12, lineHeight: 21, color: palette.muted },
    feedback: { marginTop: 10, marginBottom: 14, fontFamily: bodyFont, fontSize: 12, lineHeight: 20, color: palette.red },
    footer: { paddingTop: 28, marginTop: 27, gap: 19, borderTopWidth: 1, borderColor: palette.border },
    footerLinks: { flexDirection: `row`, flexWrap: `wrap`, gap: 20 },
    footerLink: { fontFamily: bodyFont, fontSize: 11, color: palette.muted },
    footerCopy: { fontFamily: bodyFont, fontSize: 10, lineHeight: 17, color: palette.muted },
    footerBottom: { flexDirection: `row`, gap: 12, flexWrap: `wrap`, alignItems: `center`, justifyContent: `space-between` },
  });
};
