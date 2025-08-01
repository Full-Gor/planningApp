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
import { ExportService } from '../services/ExportService';
import { NotificationService } from '../services/NotificationService';

export const SettingsScreen: React.FC = () => {
  const { events, calendars, categories } = useEventStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
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
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#4285F4" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {rightComponent || (onPress && (
        <Ionicons name="chevron-forward" size={20} color="#6c757d" />
      ))}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Paramètres</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4150',
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
    color: '#2d4150',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
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
    borderBottomColor: '#f1f3f4',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
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
    color: '#2d4150',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6c757d',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4285F4',
  },
  versionText: {
    fontSize: 14,
    color: '#6c757d',
  },
});