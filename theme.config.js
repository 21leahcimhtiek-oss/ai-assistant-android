/** @type {const} */
const themeColors = {
  primary: { light: '#6B9BD1', dark: '#7DAEE0' }, // Brighter in dark mode for better visibility
  background: { light: '#F8FAFE', dark: '#000000' }, // Pure black for OLED
  surface: { light: '#FFFFFF', dark: '#0D1117' }, // Very dark gray for cards
  foreground: { light: '#1A2138', dark: '#F0F2F5' }, // Higher contrast white text
  muted: { light: '#6B7280', dark: '#B0B8C4' }, // Brighter muted text for readability
  border: { light: '#E5E7EB', dark: '#1F2937' }, // Subtle borders in dark mode
  success: { light: '#10B981', dark: '#4ADE80' }, // Brighter success green
  warning: { light: '#F59E0B', dark: '#FCD34D' }, // Brighter warning yellow
  error: { light: '#EF4444', dark: '#FB7185' }, // Brighter error red
  crisis: { light: '#FF6B6B', dark: '#FF8A8A' }, // Brighter crisis red
  // Mood colors (enhanced for dark mode)
  moodGreat: { light: '#52C41A', dark: '#73D13D' },
  moodGood: { light: '#A8D5BA', dark: '#B7EB8F' },
  moodOkay: { light: '#FFD93D', dark: '#FFE58F' },
  moodLow: { light: '#FFA07A', dark: '#FFB088' },
  moodBad: { light: '#FF6B6B', dark: '#FF8A8A' },
};

module.exports = { themeColors };
