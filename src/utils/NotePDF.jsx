// utils/NotePDF.jsx
import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

/**
 * =============================================================================
 * Helpers
 * =============================================================================
 */
const parseInlineCode = (text) => {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={i} style={styles.inlineCode}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
};

/**
 * =============================================================================
 * Styles
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
  noteBlock: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#f9fafb",
  },
  noteTitle: {
    fontSize: 13,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 4,
  },
  codeBlock: {
    fontFamily: "Courier",
    fontSize: 10,
    backgroundColor: "#e5e7eb",
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  inlineCode: {
    fontFamily: "Courier",
    backgroundColor: "#e5e7eb",
    paddingHorizontal: 2,
  },
});

/**
 * =============================================================================
 * NoteBlock
 * =============================================================================
 */
const NoteBlock = ({ note }) => {
  const lines = (note?.content || "").split("\n");

  let blocks = [];
  let insideCode = false;
  let codeLines = [];

  lines.forEach((line, i) => {
    if (line.startsWith("```")) {
      if (insideCode) {
        // end code block
        blocks.push(
          <View key={`code-${i}`} style={styles.codeBlock}>
            {codeLines.map((c, ci) => (
              <Text key={ci}>{c}</Text>
            ))}
          </View>
        );
        codeLines = [];
        insideCode = false;
      } else {
        insideCode = true;
      }
    } else if (insideCode) {
      codeLines.push(line);
    } else if (line.trim().length) {
      blocks.push(
        <Text key={`p-${i}`} style={styles.paragraph}>
          {parseInlineCode(line)}
        </Text>
      );
    }
  });

  return (
    <View style={styles.noteBlock} wrap>
      {note?.title && <Text style={styles.noteTitle}>{note.title}</Text>}
      {blocks}
    </View>
  );
};

/**
 * =============================================================================
 * PDF Document
 * =============================================================================
 */
export const NotePDF = ({ notes = [] }) => (
  <Document>
    <Page size="A4" style={styles.page} wrap>
      {Array.isArray(notes) && notes.length > 0 ? (
        notes.map((n) => (
          <NoteBlock key={n.id || n.title || Math.random()} note={n} />
        ))
      ) : (
        <Text>No notes available</Text>
      )}

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

/**
 * =============================================================================
 * Helpers for download
 * =============================================================================
 */
export const downloadNotePDF = async (note) => {
  const blob = await pdf(<NotePDF notes={[note]} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${note.title || "note"}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadMultipleNotesPDF = async (notes, fileName = "notes.pdf") => {
  const blob = await pdf(<NotePDF notes={notes} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export default NotePDF;
