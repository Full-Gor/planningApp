import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { CalendarView } from '../components/Calendar/CalendarView';
import { EventForm } from '../components/Event/EventForm';
import { useEventStore } from '../store/eventStore';
import { Event, ViewMode } from '../types/Event';
import { NotificationService } from '../services/NotificationService';
import Modal from 'react-native-modal';

export const HomeScreen: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    selectedDate,
    loadEvents,
    isLoading,
  } = useEventStore();

  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>();
  const [showViewPicker, setShowViewPicker] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Demander les permissions de notification
    await NotificationService.requestPermissions();
    
    // Charger les événements
    await loadEvents();
  };

  const viewModes: { mode: ViewMode; label: string; icon: string }[] = [
    { mode: 'day', label: 'Jour', icon: 'today' },
    { mode: 'week', label: 'Semaine', icon: 'calendar' },
    { mode: 'month', label: 'Mois', icon: 'calendar-outline' },
    { mode: 'year', label: 'Année', icon: 'calendar-sharp' },
    { mode: 'agenda', label: 'Agenda', icon: 'list' },
  ];

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setShowEventForm(true);
  };

  const handleDatePress = (date: Date) => {
    // Logique pour gérer la sélection de date
    console.log('Date sélectionnée:', date);
  };

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setShowEventForm(true);
  };

  const handleSaveEvent = (event: Event) => {
    setShowEventForm(false);
    setSelectedEvent(undefined);
    
    // Programmer les notifications si nécessaire
    if (event.reminder?.enabled) {
      NotificationService.scheduleEventReminder(event);
    }
  };

  const handleCancelEvent = () => {
    setShowEventForm(false);
    setSelectedEvent(undefined);
  };

  const getCurrentViewLabel = () => {
    const viewMode = viewModes.find(v => v.mode === currentView);
    return viewMode?.label || 'Mois';
  };

  const getCurrentViewIcon = () => {
    const viewMode = viewModes.find(v => v.mode === currentView);
    return viewMode?.icon || 'calendar-outline';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => setShowViewPicker(true)}
        >
          <Ionicons name={getCurrentViewIcon() as any} size={20} color="#4285F4" />
          <Text style={styles.viewButtonText}>{getCurrentViewLabel()}</Text>
          <Ionicons name="chevron-down" size={16} color="#6c757d" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Planning</Text>

        <TouchableOpacity style={styles.addButton} onPress={handleAddEvent}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Calendar View */}
      <CalendarView
        onEventPress={handleEventPress}
        onDatePress={handleDatePress}
      />

      {/* View Picker Modal */}
      <Modal
        isVisible={showViewPicker}
        onBackdropPress={() => setShowViewPicker(false)}
        style={styles.modal}
      >
        <View style={styles.viewPickerContainer}>
          <Text style={styles.viewPickerTitle}>Choisir la vue</Text>
          {viewModes.map((viewMode) => (
            <TouchableOpacity
              key={viewMode.mode}
              style={[
                styles.viewOption,
                currentView === viewMode.mode && styles.selectedViewOption,
              ]}
              onPress={() => {
                setCurrentView(viewMode.mode);
                setShowViewPicker(false);
              }}
            >
              <Ionicons
                name={viewMode.icon as any}
                size={20}
                color={currentView === viewMode.mode ? '#4285F4' : '#6c757d'}
              />
              <Text
                style={[
                  styles.viewOptionText,
                  currentView === viewMode.mode && styles.selectedViewOptionText,
                ]}
              >
                {viewMode.label}
              </Text>
              {currentView === viewMode.mode && (
                <Ionicons name="checkmark" size={20} color="#4285F4" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Event Form Modal */}
      <Modal
        isVisible={showEventForm}
        style={styles.fullScreenModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <EventForm
          event={selectedEvent}
          onSave={handleSaveEvent}
          onCancel={handleCancelEvent}
        />
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6c757d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? Math.max((Constants.statusBarHeight || 0) - 8, 0) : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#2d4150',
    marginHorizontal: 6,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4150',
  },
  addButton: {
    backgroundColor: '#4285F4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  fullScreenModal: {
    margin: 0,
  },
  viewPickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  viewPickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    marginBottom: 20,
    textAlign: 'center',
  },
  viewOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedViewOption: {
    backgroundColor: '#e3f2fd',
  },
  viewOptionText: {
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 12,
    flex: 1,
  },
  selectedViewOptionText: {
    color: '#4285F4',
    fontWeight: '600',
  },
});