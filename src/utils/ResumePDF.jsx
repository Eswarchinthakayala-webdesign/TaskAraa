// utils/ResumePDF.jsx
import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Link,
  Font,
} from "@react-pdf/renderer";

/**
 * =============================================================================
 * Font Strategy (No external fetches; avoids "font not registered" errors)
 * =============================================================================
 * We DO NOT register web fonts here. Instead we map user-styled font families
 * to the PDF core fonts: Helvetica, Times-Roman, Courier.
 *
 * Why?
 * - @react-pdf will try to fetch fonts if you register using remote URLs, which
 *   can fail (e.g., 404 from fonts.gstatic.com), causing "Unknown font" errors.
 * - Core fonts are always available in PDFKit and do not require network.
 *
 * Mapping examples:
 * - "Inter", "Poppins", "Arial", "System"  -> Helvetica
 * - "Times New Roman", "Times", "Georgia"  -> Times-Roman
 * - "Consolas", "Courier New"              -> Courier
 *
 * We also map (bold, italic) to the correct face:
 *   Helvetica:       Regular, Bold, Oblique, BoldOblique
 *   Times-Roman:     Regular, Bold, Italic, BoldItalic
 *   Courier:         Regular, Bold, Oblique, BoldOblique
 *
 * Face selection is done by getCoreFontFace(base, bold, italic).
 * =============================================================================
 */

/** Normalize incoming font family names from templates/sections */
const normalizeFontName = (name = "") => (name || "").toLowerCase().trim();

/** Map arbitrary font family names to a base PDF core font. */
const resolveBaseCoreFont = (requested) => {
  const n = normalizeFontName(requested);
  if (!n) return "Helvetica";

  // Sans → Helvetica
  if (
    n.includes("inter") ||
    n.includes("poppins") ||
    n.includes("arial") ||
    n.includes("system") ||
    n.includes("ui") ||
    n.includes("roboto") // be forgiving
  ) {
    return "Helvetica";
  }

  // Serif → Times-Roman
  if (
    n.includes("times") ||
    n.includes("georgia") ||
    n.includes("garamond") ||
    n.includes("serif")
  ) {
    return "Times-Roman";
  }

  // Mono → Courier
  if (
    n.includes("consolas") ||
    n.includes("monospace") ||
    n.includes("courier")
  ) {
    return "Courier";
  }

  // Default
  return "Helvetica";
};

/** Return actual face name for the selected core family + bold/italic flags. */
const getCoreFontFace = (base, bold = false, italic = false) => {
  const b = !!bold;
  const i = !!italic;

  switch (base) {
    case "Times-Roman":
      if (b && i) return "Times-BoldItalic";
      if (b) return "Times-Bold";
      if (i) return "Times-Italic";
      return "Times-Roman";

    case "Courier":
      if (b && i) return "Courier-BoldOblique";
      if (b) return "Courier-Bold";
      if (i) return "Courier-Oblique";
      return "Courier";

    case "Helvetica":
    default:
      if (b && i) return "Helvetica-BoldOblique";
      if (b) return "Helvetica-Bold";
      if (i) return "Helvetica-Oblique";
      return "Helvetica";
  }
};

/**
 * Build a style object with correct font face and underline (if requested).
 * We do NOT set fontWeight/fontStyle because we are switching the face itself.
 */
const fontStyleFromSection = (style = {}) => {
  const base = resolveBaseCoreFont(style.fontFamily);
  const face = getCoreFontFace(base, style.bold, style.italic);
  const textDecoration = style.underline ? "underline" : "none";
  return { fontFamily: face, textDecoration };
};

/**
 * =============================================================================
 * Helpers (links, alignment, safety utils)
 * =============================================================================
 */
const extractLinksFromText = (text) => {
  if (!text) return [];
  const re = /(https?:\/\/[^\s)]+)|(\bwww\.[^\s)]+)/gi;
  return [...text.matchAll(re)].map((m) =>
    m[0].startsWith("http") ? m[0] : `https://${m[0]}`
  );
};

const shortenLabel = (url = "") => {
  const u = (url || "").toLowerCase();
  if (u.includes("linkedin")) return "LinkedIn";
  if (u.includes("github")) return "GitHub";
  if (u.includes("gitlab")) return "GitLab";
  if (u.includes("behance")) return "Behance";
  if (u.includes("dribbble")) return "Dribbble";
  if (u.includes("medium")) return "Medium";
  if (u.includes("dev.to")) return "Dev.to";
  if (u.includes("hashnode")) return "Hashnode";
  if (u.includes("stackoverflow")) return "StackOverflow";
  if (u.includes("vercel") || u.includes("netlify") || u.includes("portfolio"))
    return "Portfolio";
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "Link";
  }
};

const pickHeaderIndex = (sections = []) => {
  let idx = sections.findIndex(
    (s) => s?.id === "header" || /header/i.test(s?.title || "")
  );
  if (idx < 0) idx = 0;
  return Math.max(0, idx);
};

const getTextAlign = (align) => {
  switch ((align || "").toLowerCase()) {
    case "center":
    case "right":
    case "justify":
      return align.toLowerCase();
    default:
      return "left";
  }
};

const getFlexJustifyFromAlign = (align) => {
  const a = getTextAlign(align);
  if (a === "center") return "center";
  if (a === "right") return "flex-end";
  if (a === "justify") return "space-between";
  return "flex-start"; // left
};

const safeNumber = (val, fallback) =>
  typeof val === "number" && Number.isFinite(val) ? val : fallback;

const clamp = (num, min, max) =>
  Number.isFinite(num) ? Math.min(max, Math.max(min, num)) : min;

/**
 * =============================================================================
 * Base Styles (defaults; section styles override at render)
 * =============================================================================
 */
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
    color: "#111827",
  },

  footer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    color: "#6b7280",
  },

  // Header
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  name: {
    fontSize: 22,
  },
  role: {
    fontSize: 12,
    marginTop: 2,
  },
  contact: {
    fontSize: 10,
    marginTop: 6,
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
    flexWrap: "wrap",
  },
  linkPill: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  linkText: {
    fontSize: 10,
    textDecoration: "none",
  },

  // Sections
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    marginBottom: 6,
    textTransform: "uppercase",
  },

  paragraph: {
    fontSize: 11,
    marginBottom: 3,
  },

  // Lists
  listItemRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  discBullet: {
    width: 12,
    textAlign: "center",
  },
  dashBullet: {
    width: 12,
    textAlign: "center",
  },
  numberBullet: {
    width: 16,
    textAlign: "right",
    paddingRight: 4,
  },
  listText: {
    fontSize: 11,
    flexGrow: 1,
    flexShrink: 1,
  },

  // Chips
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: 4,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
    minHeight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: 9,
    lineHeight: 1.2,
    textAlign: "center",
  },

  // Section link pills
  sectionLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },
  sectionLinkPill: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 6,
    marginBottom: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionLinkText: {
    fontSize: 8,
    textDecoration: "none",
  },
});

/**
 * =============================================================================
 * Header Block
 * =============================================================================
 */
const HeaderBlock = ({ headerSection }) => {
  let name = "Your Name";
  let role = "";
  let contact = "email@example.com · +91-00000-00000 · City, Country";
  let linkList = [];
  const hs = headerSection?.style || {};

  // Resolve colors with fallbacks
  const nameColor = hs.headingColor || "#1f2937";
  const roleColor = hs.textColor || "#374151";
  const contactColor = hs.textColor || "#374151";

  // Resolve font face for header text lines
  const headerFont = fontStyleFromSection(hs);

  if (headerSection?.content) {
    const raw = headerSection.content.split("\n").filter((l) => l.trim().length);
    const allLinks = extractLinksFromText(headerSection.content);
    linkList = allLinks.map((u) => ({ url: u, label: shortenLabel(u) }));

    if (raw.length > 0) name = raw[0];
    if (raw.length > 1) role = raw[1];

    if (raw.length > 2) {
      const urlRegex = /(https?:\/\/[^\s)]+)|(\bwww\.[^\s)]+)/gi;
      contact = raw[2].replace(urlRegex, "").replace(/\s{2,}/g, " ").trim();
      if (!contact)
        contact = "email@example.com · +91-00000-00000 · City, Country";
    }
  }

  // alignment for header
  const align = getTextAlign(hs.align);

  // compute dynamic font sizes (respect user style but clamp sensible range)
  const nameSize = clamp(safeNumber(hs.fontSize, 22), 14, 32);
  const roleSize = clamp(Math.round(nameSize * 0.55), 9, 18);
  const contactSize = clamp(Math.round(nameSize * 0.48), 8, 16);

  return (
    <View style={[styles.header, { textAlign: align }]}>
      <Text
        style={[
          styles.name,
          headerFont,
          { color: nameColor, fontSize: nameSize },
        ]}
      >
        {name}
      </Text>

      {role ? (
        <Text
          style={[
            styles.role,
            headerFont,
            { color: roleColor, padding: 6, fontSize: roleSize },
          ]}
        >
          {role}
        </Text>
      ) : null}

      <Text
        style={[
          styles.contact,
          headerFont,
          { color: contactColor, fontSize: contactSize },
        ]}
      >
        {contact}
      </Text>

      {linkList.length > 0 ? (
        <View
          style={[
            styles.linkRow,
            { justifyContent: getFlexJustifyFromAlign(align) },
          ]}
        >
          {linkList.map((l, i) => (
            <View key={`${l.url}-${i}`} style={styles.linkPill}>
              <Link
                src={l.url}
                style={[
                  styles.linkText,
                  headerFont,
                  { color: roleColor, textDecoration: "none" },
                ]}
              >
                {l.label}
              </Link>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

/**
 * =============================================================================
 * Chips (skills) — respects section alignment, font size, and font family
 * =============================================================================
 */
const Chips = ({ lines, textColor, align, fontSize, styleObj }) => {
  const chipFontSize = clamp(
    Math.round(safeNumber(fontSize, 11) * 0.85),
    7,
    14
  );
  const justify = getFlexJustifyFromAlign(align);
  const fontFace = fontStyleFromSection(styleObj);

  return (
    <View style={[styles.chipsRow, { justifyContent: justify }]}>
      {lines.map((l, i) => {
        const label = l.replace(/^•\s?/, "").trim();
        if (!label) return null;
        return (
          <View key={`${label}-${i}`} style={styles.chip}>
            <Text
              style={[
                styles.chipText,
                fontFace,
                { color: textColor || "#111827", fontSize: chipFontSize },
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

/**
 * =============================================================================
 * BulletList — uses section font face, font size/line height, and color
 * =============================================================================
 */
const BulletList = ({
  lines,
  variant = "disc",
  textColor,
  fontSize,
  lineHeight,
  styleObj,
}) => {
  const fs = clamp(safeNumber(fontSize, 11), 8, 18);
  const lh = clamp(safeNumber(lineHeight, 1.5), 1.1, 2.0);
  const fontFace = fontStyleFromSection(styleObj);

  return (
    <View>
      {lines.map((raw, i) => {
        const line = raw.replace(/^•\s?/, "").trim();
        if (!line) return null;

        if (variant === "number") {
          return (
            <View key={`${i}-${line}`} style={styles.listItemRow}>
              <Text
                style={[
                  styles.numberBullet,
                  fontFace,
                  { fontSize: fs, lineHeight: lh, color: textColor },
                ]}
              >
                {i + 1}.
              </Text>
              <Text
                style={[
                  styles.listText,
                  fontFace,
                  { color: textColor, fontSize: fs, lineHeight: lh },
                ]}
              >
                {line}
              </Text>
            </View>
          );
        }

        if (variant === "dash") {
          return (
            <View key={`${i}-${line}`} style={styles.listItemRow}>
              <Text
                style={[
                  styles.dashBullet,
                  fontFace,
                  { fontSize: fs, lineHeight: lh, color: textColor },
                ]}
              >
                –
              </Text>
              <Text
                style={[
                  styles.listText,
                  fontFace,
                  { color: textColor, fontSize: fs, lineHeight: lh },
                ]}
              >
                {line}
              </Text>
            </View>
          );
        }

        // disc
        return (
          <View key={`${i}-${line}`} style={styles.listItemRow}>
            <Text
              style={[
                styles.discBullet,
                fontFace,
                { fontSize: fs, lineHeight: lh, color: textColor },
              ]}
            >
              •
            </Text>
            <Text
              style={[
                styles.listText,
                fontFace,
                { color: textColor, fontSize: fs, lineHeight: lh },
              ]}
            >
              {line}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

/**
 * =============================================================================
 * SectionBlock — mirrors preview styles (fontFamily, bold/italic/underline,
 *                fontSize, lineHeight, alignment, colors)
 * =============================================================================
 */
const SectionBlock = ({ s }) => {
  const styleObj = s?.style || {};
  const headingColor = styleObj.headingColor || "#374151";
  const textColor = styleObj.textColor || "#111827";
  const align = getTextAlign(styleObj.align);
  const fs = clamp(safeNumber(styleObj.fontSize, 11), 8, 18);
  const lh = clamp(safeNumber(styleObj.lineHeight, 1.5), 1.1, 2.0);

  const lines = (s?.content || "")
    .split("\n")
    // Preserve multiple spaces (like preview)
    .map((l) => l.replace(/ {2,}/g, "\u00A0\u00A0"))
    .filter((l) => l.trim().length);

  const bullet = (styleObj?.bullet || "none").toLowerCase();
  const hasLinks = Array.isArray(s?.links) && s.links.length > 0;

  // Font for heading and body
  const headingFont = fontStyleFromSection({
    ...styleObj,
    // typically headings are bold by default — respect if already set
    bold: styleObj.bold ?? true,
  });
  const bodyFont = fontStyleFromSection(styleObj);

  // Title size scaled from fs
  const titleSize = clamp(Math.round(fs * 1.1), 10, 22);

  return (
    <View style={styles.section} wrap>
      {s?.title ? (
        <Text
          style={[
            styles.sectionTitle,
            headingFont,
            { color: headingColor, textAlign: align, fontSize: titleSize },
          ]}
        >
          {s.title}
        </Text>
      ) : null}

      {bullet === "chips" ? (
        <Chips
          lines={lines}
          textColor={textColor}
          align={align}
          fontSize={fs}
          styleObj={styleObj}
        />
      ) : bullet === "disc" ? (
        <BulletList
          lines={lines}
          variant="disc"
          textColor={textColor}
          fontSize={fs}
          lineHeight={lh}
          styleObj={styleObj}
        />
      ) : bullet === "dash" ? (
        <BulletList
          lines={lines}
          variant="dash"
          textColor={textColor}
          fontSize={fs}
          lineHeight={lh}
          styleObj={styleObj}
        />
      ) : bullet === "number" ? (
        <BulletList
          lines={lines}
          variant="number"
          textColor={textColor}
          fontSize={fs}
          lineHeight={lh}
          styleObj={styleObj}
        />
      ) : (
        lines.map((l, i) => (
          <Text
            key={`${i}-${l.slice(0, 12)}`}
            style={[
              styles.paragraph,
              bodyFont,
              {
                color: textColor,
                textAlign: align,
                fontSize: fs,
                lineHeight: lh,
              },
            ]}
          >
            {l}
          </Text>
        ))
      )}

      {hasLinks ? (
        <View
          style={[
            styles.sectionLinksRow,
            { justifyContent: getFlexJustifyFromAlign(align) },
          ]}
        >
          {s.links.map((lnk, i) => (
            <View key={`${lnk.url}-${i}`} style={styles.sectionLinkPill}>
              <Link
                src={lnk.url}
                style={[
                  styles.sectionLinkText,
                  bodyFont,
                  { color: textColor, textDecoration: "none" },
                ]}
              >
                {lnk.label}
              </Link>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
};

/**
 * =============================================================================
 * Main
 * =============================================================================
 */
const ResumePDF = ({ sections = [] }) => {
  if (!Array.isArray(sections) || sections.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>No content</Text>
        </Page>
      </Document>
    );
  }

  const headerIdx = pickHeaderIndex(sections);
  const headerSection = sections[headerIdx];
  const otherSections = sections.filter((_, i) => i !== headerIdx);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <HeaderBlock headerSection={headerSection} />

        {otherSections.map((s) => (
          <SectionBlock key={s.id || s.title || Math.random()} s={s} />
        ))}

        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export default ResumePDF;

/**
 * =============================================================================
 * Notes for Custom Fonts (Optional)
 * =============================================================================
 * If later you want to use *real* Inter/Poppins/etc:
 * 1) Put .ttf files in your `public/fonts` folder (or importable path).
 * 2) Register like:
 *
 *   Font.register({
 *     family: "Inter",
 *     fonts: [
 *       { src: "/fonts/Inter-Regular.ttf", fontWeight: "normal" },
 *       { src: "/fonts/Inter-Italic.ttf", fontStyle: "italic" },
 *       { src: "/fonts/Inter-Bold.ttf", fontWeight: "bold" },
 *       { src: "/fonts/Inter-BoldItalic.ttf", fontWeight: "bold", fontStyle: "italic" },
 *     ],
 *   });
 *
 * 3) Then change `resolveBaseCoreFont` to return "Inter" if available, or
 *    fall back to core fonts when missing.
 *
 * Until then, this file maps fonts to core faces so there are ZERO fetches,
 * and no "unknown / not registered" font errors.
 * =============================================================================
 */
