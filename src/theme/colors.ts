export const lightColors = {
  // Couleurs principales
  primary: '#4285F4',
  secondary: '#6c757d',
  success: '#0F9D58',
  warning: '#F4B400',
  error: '#DB4437',
  
  // Couleurs de fond
  background: '#ffffff',
  surface: '#f8f9fa',
  card: '#ffffff',
  
  // Couleurs de texte
  text: '#2d4150',
  textSecondary: '#6c757d',
  textDisabled: '#d9e1e8',
  
  // Couleurs de bordure
  border: '#e9ecef',
  borderLight: '#f1f3f4',
  
  // Couleurs d'accent
  accent: '#e3f2fd',
  accentLight: '#f8f9fa',
  
  // Couleurs de statut
  selected: '#4285F4',
  selectedText: '#ffffff',
  today: '#4285F4',
  
  // Couleurs d'événement
  eventDot: '#00adf5',
  eventSelectedDot: '#ffffff',
};

export const darkColors = {
  // Couleurs principales
  primary: '#64B5F6',
  secondary: '#9E9E9E',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  
  // Couleurs de fond
  background: '#121212',
  surface: '#1E1E1E',
  card: '#2D2D2D',
  
  // Couleurs de texte
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textDisabled: '#666666',
  
  // Couleurs de bordure
  border: '#333333',
  borderLight: '#404040',
  
  // Couleurs d'accent
  accent: '#1A237E',
  accentLight: '#2D2D2D',
  
  // Couleurs de statut
  selected: '#64B5F6',
  selectedText: '#FFFFFF',
  today: '#64B5F6',
  
  // Couleurs d'événement
  eventDot: '#64B5F6',
  eventSelectedDot: '#FFFFFF',
};

export type ColorScheme = typeof lightColors;

export const getColors = (isDarkMode: boolean): ColorScheme => {
  return isDarkMode ? darkColors : lightColors;
};

