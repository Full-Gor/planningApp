import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEventStore } from '../store/eventStore';
import { Event } from '../types/Event';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const SearchScreen: React.FC = () => {
  const { events, searchQuery, setSearchQuery, searchEvents } = useEventStore();
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('all');

  useEffect(() => {
    filterEvents();
  }, [searchQuery, selectedCategory, selectedTimeRange, events]);

  const filterEvents = () => {
    let filtered = searchEvents(searchQuery);

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category.id === selectedCategory);
    }

    // Filtrer par période
    const now = new Date();
    if (selectedTimeRange === 'today') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === now.toDateString();
      });
    } else if (selectedTimeRange === 'week') {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= now && eventDate <= weekFromNow;
      });
    } else if (selectedTimeRange === 'month') {
      const monthFromNow = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= now && eventDate <= monthFromNow;
      });
    }

    setFilteredEvents(filtered);
  };

  const renderEventItem = ({ item }: { item: Event }) => (
    <TouchableOpacity style={styles.eventItem}>
      <View style={[styles.eventColor, { backgroundColor: item.color }]} />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>
          {format(item.startDate, 'EEEE d MMMM yyyy', { locale: fr })}
        </Text>
        <Text style={styles.eventTime}>
          {format(item.startDate, 'HH:mm')} - {format(item.endDate, 'HH:mm')}
        </Text>
        {item.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#6c757d" />
            <Text style={styles.eventLocation}>{item.location}</Text>
          </View>
        )}
        <View style={styles.categoryRow}>
          <Ionicons name={item.category.icon as any} size={14} color={item.category.color} />
          <Text style={[styles.eventCategory, { color: item.category.color }]}>
            {item.category.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const categories = [
    { id: 'all', name: 'Toutes', icon: 'apps' },
    { id: '1', name: 'Réunion', icon: 'people' },
    { id: '2', name: 'Personnel', icon: 'person' },
    { id: '3', name: 'Voyage', icon: 'airplane' },
    { id: '4', name: 'Santé', icon: 'medical' },
  ];

  const timeRanges = [
    { id: 'all', name: 'Toutes' },
    { id: 'today', name: 'Aujourd\'hui' },
    { id: 'week', name: 'Cette semaine' },
    { id: 'month', name: 'Ce mois' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recherche</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher des événements..."
            placeholderTextColor="#6c757d"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#6c757d" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres par catégorie */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Catégories</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedCategory === item.id && styles.selectedFilterChip,
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Ionicons
                  name={item.icon as any}
                  size={16}
                  color={selectedCategory === item.id ? '#ffffff' : '#6c757d'}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    selectedCategory === item.id && styles.selectedFilterChipText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Filtres par période */}
        <View style={styles.filtersContainer}>
          <Text style={styles.filterTitle}>Période</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={timeRanges}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedTimeRange === item.id && styles.selectedFilterChip,
                ]}
                onPress={() => setSelectedTimeRange(item.id)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedTimeRange === item.id && styles.selectedFilterChipText,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* Résultats */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {filteredEvents.length} résultat{filteredEvents.length !== 1 ? 's' : ''}
        </Text>
        
        {filteredEvents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={48} color="#e9ecef" />
            <Text style={styles.emptyTitle}>Aucun événement trouvé</Text>
            <Text style={styles.emptySubtitle}>
              Essayez de modifier vos critères de recherche
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEventItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.eventsList}
          />
        )}
      </View>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d4150',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2d4150',
    marginLeft: 12,
  },
  filtersContainer: {
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  selectedFilterChip: {
    backgroundColor: '#4285F4',
    borderColor: '#4285F4',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6c757d',
    marginLeft: 4,
  },
  selectedFilterChipText: {
    color: '#ffffff',
  },
  resultsContainer: {
    flex: 1,
    padding: 16,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 16,
  },
  eventsList: {
    paddingBottom: 20,
  },
  eventItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventColor: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  eventTime: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventCategory: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4150',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});