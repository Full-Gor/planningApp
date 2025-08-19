import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../store/eventStore';
import { SupabaseService } from '../services/SupabaseService';
import { ExportService } from '../services/ExportService';
import { NotificationService } from '../services/NotificationService';
import { getColors } from '../theme/colors';

export const SettingsScreen: React.FC = () => {
  const { 
    events, 
    calendars, 
    categories, 
    userId, 
    isDarkMode,
    signIn, 
    signUp, 
    signOut, 
    syncToCloud, 
    fetchFromCloud,
    toggleDarkMode
  } = useEventStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [weekStartsOnMonday, setWeekStartsOnMonday] = useState(true);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);

  const handleExportICS = async () => {
    try {
      await ExportService.exportToICS(events);
      Alert.alert('Succès', 'Calendrier exporté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter le calendrier');
    }
  };

  const handleExportCSV = async () => {
    try {
      await ExportService.exportToCSV(events);
      Alert.alert('Succès', 'Événements exportés avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les événements');
    }
  };

  const handleExportJSON = async () => {
    try {
      await ExportService.exportToJSON(events);
      Alert.alert('Succès', 'Données exportées avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'exporter les données');
    }
  };

  const handleClearAllNotifications = async () => {
    Alert.alert(
      'Confirmer',
      'Voulez-vous vraiment supprimer toutes les notifications programmées ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await NotificationService.cancelAllNotifications();
            Alert.alert('Succès', 'Toutes les notifications ont été supprimées');
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, { backgroundColor: colors.accent }]}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      ))}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card, shadowColor: colors.text }]}>
        {children}
      </View>
    </View>
  );

  const colors = getColors(isDarkMode);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Paramètres</Text>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        {/* Notifications */}
        {renderSection('Notifications', (
          <>
            {renderSettingItem(
              'Notifications',
              'Recevoir des rappels pour les événements',
              'notifications',
              undefined,
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            )}
            {renderSettingItem(
              'Son',
              'Jouer un son pour les notifications',
              'volume-high',
              undefined,
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                disabled={!notificationsEnabled}
              />
            )}
            {renderSettingItem(
              'Vibration',
              'Vibrer lors des notifications',
              'phone-portrait',
              undefined,
              <Switch
                value={vibrationEnabled}
                onValueChange={setVibrationEnabled}
                disabled={!notificationsEnabled}
              />
            )}
            {renderSettingItem(
              'Supprimer toutes les notifications',
              'Annuler toutes les notifications programmées',
              'trash',
              handleClearAllNotifications
            )}
          </>
        ))}

        {/* Affichage */}
        {renderSection('Affichage', (
          <>
            {renderSettingItem(
              'Mode sombre',
              'Utiliser le thème sombre',
              'moon',
              undefined,
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
              />
            )}
            {renderSettingItem(
              'Semaine commence le lundi',
              'Premier jour de la semaine',
              'calendar',
              undefined,
              <Switch
                value={weekStartsOnMonday}
                onValueChange={setWeekStartsOnMonday}
              />
            )}
            {renderSettingItem(
              'Numéros de semaine',
              'Afficher les numéros de semaine',
              'list',
              undefined,
              <Switch
                value={showWeekNumbers}
                onValueChange={setShowWeekNumbers}
              />
            )}
          </>
        ))}

        {/* Compte & Synchro */}
        {renderSection('Compte', (
          <>
            {!userId ? (
              <>
                {renderSettingItem('Connexion', 'Se connecter à un compte', 'log-in', async () => {
                  try {
                    await signIn(email || 'demo@example.com', password || 'password-demo');
                    Alert.alert('Connecté', 'Connexion réussie');
                  } catch (e) {
                    Alert.alert('Erreur', 'Connexion échouée');
                  }
                })}
                {renderSettingItem('Inscription', 'Créer un compte', 'person-add', async () => {
                  try {
                    await signUp(email || 'demo@example.com', password || 'password-demo');
                    Alert.alert('Créé', 'Compte créé, vérifiez vos emails');
                  } catch (e) {
                    Alert.alert('Erreur', 'Inscription échouée');
                  }
                })}
              </>
            ) : (
              <>
                {renderSettingItem('Synchroniser maintenant', 'Sauvegarder sur le cloud', 'cloud-upload', async () => {
                  try { await syncToCloud(); Alert.alert('Succès', 'Synchronisation réussie'); } catch { Alert.alert('Erreur', 'Échec de la synchro'); }
                })}
                {renderSettingItem('Récupérer du cloud', 'Charger vos événements', 'cloud-download', async () => {
                  try { await fetchFromCloud(); Alert.alert('Succès', 'Récupération réussie'); } catch { Alert.alert('Erreur', 'Échec de la récupération'); }
                })}
                {renderSettingItem('Déconnexion', 'Se déconnecter du compte', 'log-out', async () => {
                  await signOut();
                  Alert.alert('Déconnecté', 'Vous êtes déconnecté');
                })}
              </>
            )}
          </>
        ))}

        {/* Export/Import */}
        {renderSection('Export/Import', (
          <>
            {renderSettingItem(
              'Exporter en iCal',
              'Exporter le calendrier au format .ics',
              'download',
              handleExportICS
            )}
            {renderSettingItem(
              'Exporter en CSV',
              'Exporter les événements au format .csv',
              'document-text',
              handleExportCSV
            )}
            {renderSettingItem(
              'Exporter en JSON',
              'Exporter toutes les données au format .json',
              'code-download',
              handleExportJSON
            )}
          </>
        ))}

        {/* Statistiques */}
        {renderSection('Informations', (
          <>
            {renderSettingItem(
              'Événements',
              `${events.length} événement${events.length !== 1 ? 's' : ''} au total`,
              'calendar',
              undefined,
              <Text style={styles.statValue}>{events.length}</Text>
            )}
            {renderSettingItem(
              'Calendriers',
              `${calendars.length} calendrier${calendars.length !== 1 ? 's' : ''}`,
              'albums',
              undefined,
              <Text style={styles.statValue}>{calendars.length}</Text>
            )}
            {renderSettingItem(
              'Catégories',
              `${categories.length} catégorie${categories.length !== 1 ? 's' : ''}`,
              'pricetags',
              undefined,
              <Text style={styles.statValue}>{categories.length}</Text>
            )}
          </>
        ))}

        {/* À propos */}
        {renderSection('À propos', (
          <>
            {renderSettingItem(
              'Version',
              '1.0.0',
              'information-circle',
              undefined,
              <Text style={styles.versionText}>1.0.0</Text>
            )}
            {renderSettingItem(
              'Aide et support',
              'Obtenir de l\'aide',
              'help-circle',
              () => Alert.alert('Aide', 'Contactez-nous à support@planningapp.com')
            )}
            {renderSettingItem(
              'Conditions d\'utilisation',
              'Lire les conditions',
              'document',
              () => Alert.alert('Conditions', 'Conditions d\'utilisation')
            )}
            {renderSettingItem(
              'Politique de confidentialité',
              'Lire la politique',
              'shield-checkmark',
              () => Alert.alert('Confidentialité', 'Politique de confidentialité')
            )}
          </>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    fontSize: 14,
  },
});