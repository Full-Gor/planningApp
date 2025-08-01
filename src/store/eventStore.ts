import { create } from 'zustand';
import { Event, Calendar, ViewMode, EventCategory } from '../types/Event';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EventStore {
  events: Event[];
  calendars: Calendar[];
  categories: EventCategory[];
  currentView: ViewMode;
  selectedDate: Date;
  isLoading: boolean;
  searchQuery: string;
  
  // Actions
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  setCurrentView: (view: ViewMode) => void;
  setSelectedDate: (date: Date) => void;
  setSearchQuery: (query: string) => void;
  loadEvents: () => Promise<void>;
  saveEvents: () => Promise<void>;
  getEventsByDate: (date: Date) => Event[];
  getEventsByDateRange: (startDate: Date, endDate: Date) => Event[];
  searchEvents: (query: string) => Event[];
  addCalendar: (calendar: Calendar) => void;
  updateCalendar: (id: string, calendar: Partial<Calendar>) => void;
  deleteCalendar: (id: string) => void;
  addCategory: (category: EventCategory) => void;
  updateCategory: (id: string, category: Partial<EventCategory>) => void;
  deleteCategory: (id: string) => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  calendars: [
    {
      id: '1',
      name: 'Personnel',
      color: '#4285F4',
      isVisible: true,
      isOwner: true,
      permissions: {
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
      },
      sharedWith: [],
    },
    {
      id: '2',
      name: 'Travail',
      color: '#DB4437',
      isVisible: true,
      isOwner: true,
      permissions: {
        canView: true,
        canEdit: true,
        canDelete: true,
        canShare: true,
      },
      sharedWith: [],
    },
  ],
  categories: [
    { id: '1', name: 'Réunion', color: '#4285F4', icon: 'people' },
    { id: '2', name: 'Personnel', color: '#0F9D58', icon: 'person' },
    { id: '3', name: 'Voyage', color: '#F4B400', icon: 'flight' },
    { id: '4', name: 'Santé', color: '#DB4437', icon: 'local-hospital' },
  ],
  currentView: 'month',
  selectedDate: new Date(),
  isLoading: false,
  searchQuery: '',

  addEvent: (event) => {
    set((state) => ({
      events: [...state.events, event],
    }));
    get().saveEvents();
  },

  updateEvent: (id, eventUpdate) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...eventUpdate, updatedAt: new Date() } : event
      ),
    }));
    get().saveEvents();
  },

  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }));
    get().saveEvents();
  },

  setCurrentView: (view) => {
    set({ currentView: view });
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  loadEvents: async () => {
    try {
      set({ isLoading: true });
      const storedEvents = await AsyncStorage.getItem('events');
      const storedCalendars = await AsyncStorage.getItem('calendars');
      const storedCategories = await AsyncStorage.getItem('categories');
      
      if (storedEvents) {
        const events = JSON.parse(storedEvents).map((event: any) => ({
          ...event,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        }));
        set({ events });
      }
      
      if (storedCalendars) {
        set({ calendars: JSON.parse(storedCalendars) });
      }
      
      if (storedCategories) {
        set({ categories: JSON.parse(storedCategories) });
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  saveEvents: async () => {
    try {
      const { events, calendars, categories } = get();
      await AsyncStorage.setItem('events', JSON.stringify(events));
      await AsyncStorage.setItem('calendars', JSON.stringify(calendars));
      await AsyncStorage.setItem('categories', JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  },

  getEventsByDate: (date) => {
    const { events } = get();
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  },

  getEventsByDateRange: (startDate, endDate) => {
    const { events } = get();
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return eventStart <= endDate && eventEnd >= startDate;
    });
  },

  searchEvents: (query) => {
    const { events } = get();
    if (!query.trim()) return events;
    
    const lowercaseQuery = query.toLowerCase();
    return events.filter((event) =>
      event.title.toLowerCase().includes(lowercaseQuery) ||
      event.description?.toLowerCase().includes(lowercaseQuery) ||
      event.location?.toLowerCase().includes(lowercaseQuery) ||
      event.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  },

  addCalendar: (calendar) => {
    set((state) => ({
      calendars: [...state.calendars, calendar],
    }));
    get().saveEvents();
  },

  updateCalendar: (id, calendarUpdate) => {
    set((state) => ({
      calendars: state.calendars.map((calendar) =>
        calendar.id === id ? { ...calendar, ...calendarUpdate } : calendar
      ),
    }));
    get().saveEvents();
  },

  deleteCalendar: (id) => {
    set((state) => ({
      calendars: state.calendars.filter((calendar) => calendar.id !== id),
    }));
    get().saveEvents();
  },

  addCategory: (category) => {
    set((state) => ({
      categories: [...state.categories, category],
    }));
    get().saveEvents();
  },

  updateCategory: (id, categoryUpdate) => {
    set((state) => ({
      categories: state.categories.map((category) =>
        category.id === id ? { ...category, ...categoryUpdate } : category
      ),
    }));
    get().saveEvents();
  },

  deleteCategory: (id) => {
    set((state) => ({
      categories: state.categories.filter((category) => category.id !== id),
    }));
    get().saveEvents();
  },
}));