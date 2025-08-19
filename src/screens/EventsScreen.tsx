import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { useEventStore } from '../store/eventStore';
import { Event } from '../types/Event';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Modal from 'react-native-modal';
import { EventForm } from '../components/Event/EventForm';
import { Ionicons } from '@expo/vector-icons';

export const EventsScreen: React.FC = () => {
  const { events, deleteEvent } = useEventStore();
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [events]);

  const renderItem = ({ item }: { item: Event }) => {
    const confirmDelete = () => {
      if (Platform.OS === 'web') {
        // RN Web ne supporte pas Alert multi-boutons: fallback navigateur
        const ok = typeof window !== 'undefined' && (window as any).confirm
          ? (window as any).confirm('Supprimer cet événement ?')
          : true;
        if (ok) { try { deleteEvent(item.id); } catch {} }
        return;
      }
      Alert.alert(
        'Supprimer',
        'Voulez-vous supprimer cet événement ? Cette action est définitive.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              try { deleteEvent(item.id); } catch {}
            },
          },
        ]
      );
    };
    return (
      <TouchableOpacity
        style={styles.eventItem}
        activeOpacity={0.8}
        onPress={() => {
          setSelectedEvent(item);
          setShowEventForm(true);
        }}
      >
        <View style={[styles.colorBar, { backgroundColor: item.color }]} />
        <View style={styles.eventContent}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.date}>
            {format(item.startDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
          <Text style={styles.time}>
            {format(item.startDate, 'HH:mm')} - {format(item.endDate, 'HH:mm')}
          </Text>
          {!!item.location && (
            <Text style={styles.location}>{item.location}</Text>
          )}
          <View style={styles.actionsRow}>
            <Text style={[styles.category, { color: item.category.color }]}>
              {item.category.name}
            </Text>
            <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash" size={18} color="#DB4437" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (sortedEvents.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}> 
          <Text style={styles.headerTitle}>Événements</Text>
        </View>
        <View style={styles.empty}> 
          <Text style={styles.emptyTitle}>Aucun événement</Text>
          <Text style={styles.emptySubtitle}>Ajoutez un événement depuis l’onglet Accueil (+)</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Événements</Text>
      </View>
      <FlatList
        data={sortedEvents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {/* Formulaire d'édition */}
      <Modal
        isVisible={showEventForm}
        style={{ margin: 0 }}
        onBackdropPress={() => setShowEventForm(false)}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <EventForm
          event={selectedEvent}
          onSave={() => {
            setShowEventForm(false);
            setSelectedEvent(undefined);
          }}
          onCancel={() => {
            setShowEventForm(false);
            setSelectedEvent(undefined);
          }}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4150',
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  colorBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  time: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(219,68,55,0.08)',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});


