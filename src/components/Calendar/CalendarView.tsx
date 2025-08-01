import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Calendar, CalendarList, Agenda } from 'react-native-calendars';
import { useEventStore } from '../../store/eventStore';
import { Event, ViewMode } from '../../types/Event';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CalendarViewProps {
  onEventPress: (event: Event) => void;
  onDatePress: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  onEventPress,
  onDatePress,
}) => {
  const {
    events,
    currentView,
    selectedDate,
    setSelectedDate,
    getEventsByDate,
    getEventsByDateRange,
  } = useEventStore();

  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    updateMarkedDates();
  }, [events, selectedDate]);

  const updateMarkedDates = () => {
    const marked: any = {};
    
    events.forEach(event => {
      const dateKey = format(event.startDate, 'yyyy-MM-dd');
      if (!marked[dateKey]) {
        marked[dateKey] = { dots: [] };
      }
      marked[dateKey].dots.push({
        color: event.color,
        selectedDotColor: event.color,
      });
    });

    // Marquer la date sélectionnée
    const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
    if (marked[selectedDateKey]) {
      marked[selectedDateKey].selected = true;
      marked[selectedDateKey].selectedColor = '#4285F4';
    } else {
      marked[selectedDateKey] = {
        selected: true,
        selectedColor: '#4285F4',
      };
    }

    setMarkedDates(marked);
  };

  const renderMonthView = () => (
    <Calendar
      current={format(selectedDate, 'yyyy-MM-dd')}
      onDayPress={(day) => {
        const date = new Date(day.timestamp);
        setSelectedDate(date);
        onDatePress(date);
      }}
      markingType="multi-dot"
      markedDates={markedDates}
      theme={{
        backgroundColor: '#ffffff',
        calendarBackground: '#ffffff',
        textSectionTitleColor: '#b6c1cd',
        selectedDayBackgroundColor: '#4285F4',
        selectedDayTextColor: '#ffffff',
        todayTextColor: '#4285F4',
        dayTextColor: '#2d4150',
        textDisabledColor: '#d9e1e8',
        dotColor: '#00adf5',
        selectedDotColor: '#ffffff',
        arrowColor: '#4285F4',
        disabledArrowColor: '#d9e1e8',
        monthTextColor: '#2d4150',
        indicatorColor: '#4285F4',
        textDayFontFamily: 'System',
        textMonthFontFamily: 'System',
        textDayHeaderFontFamily: 'System',
        textDayFontWeight: '300',
        textMonthFontWeight: 'bold',
        textDayHeaderFontWeight: '300',
        textDayFontSize: 16,
        textMonthFontSize: 16,
        textDayHeaderFontSize: 13,
      }}
      firstDay={1}
      hideExtraDays={true}
      showWeekNumbers={false}
      enableSwipeMonths={true}
    />
  );

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekEvents = getEventsByDateRange(weekStart, weekEnd);

    return (
      <View style={styles.weekView}>
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.weekDay,
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.selectedWeekDay,
              ]}
              onPress={() => {
                setSelectedDate(day);
                onDatePress(day);
              }}
            >
              <Text style={styles.weekDayName}>
                {format(day, 'EEE', { locale: fr })}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') && styles.selectedWeekDayNumber,
              ]}>
                {format(day, 'd')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <ScrollView style={styles.weekEventsContainer}>
          {weekEvents.map((event, index) => (
            <TouchableOpacity
              key={event.id}
              style={[styles.weekEvent, { backgroundColor: event.color + '20', borderLeftColor: event.color }]}
              onPress={() => onEventPress(event)}
            >
              <Text style={styles.weekEventTime}>
                {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
              </Text>
              <Text style={styles.weekEventTitle}>{event.title}</Text>
              {event.location && (
                <Text style={styles.weekEventLocation}>{event.location}</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderDayView = () => {
    const dayEvents = getEventsByDate(selectedDate);
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <View style={styles.dayView}>
        <View style={styles.dayHeader}>
          <Text style={styles.dayTitle}>
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
        </View>
        
        <ScrollView style={styles.dayEventsContainer}>
          {hours.map(hour => (
            <View key={hour} style={styles.hourSlot}>
              <Text style={styles.hourLabel}>{hour.toString().padStart(2, '0')}:00</Text>
              <View style={styles.hourContent}>
                {dayEvents
                  .filter(event => event.startDate.getHours() === hour)
                  .map(event => (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.dayEvent, { backgroundColor: event.color + '20', borderLeftColor: event.color }]}
                      onPress={() => onEventPress(event)}
                    >
                      <Text style={styles.dayEventTitle}>{event.title}</Text>
                      <Text style={styles.dayEventTime}>
                        {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
                      </Text>
                      {event.location && (
                        <Text style={styles.dayEventLocation}>{event.location}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderAgendaView = () => {
    const agendaItems: any = {};
    
    events.forEach(event => {
      const dateKey = format(event.startDate, 'yyyy-MM-dd');
      if (!agendaItems[dateKey]) {
        agendaItems[dateKey] = [];
      }
      agendaItems[dateKey].push(event);
    });

    return (
      <Agenda
        items={agendaItems}
        selected={format(selectedDate, 'yyyy-MM-dd')}
        renderItem={(item) => (
          <TouchableOpacity
            style={[styles.agendaItem, { backgroundColor: item.color + '20', borderLeftColor: item.color }]}
            onPress={() => onEventPress(item)}
          >
            <Text style={styles.agendaItemTitle}>{item.title}</Text>
            <Text style={styles.agendaItemTime}>
              {format(item.startDate, 'HH:mm')} - {format(item.endDate, 'HH:mm')}
            </Text>
            {item.location && (
              <Text style={styles.agendaItemLocation}>{item.location}</Text>
            )}
          </TouchableOpacity>
        )}
        renderEmptyDate={() => (
          <View style={styles.emptyDate}>
            <Text style={styles.emptyDateText}>Aucun événement</Text>
          </View>
        )}
        rowHasChanged={(r1, r2) => r1.id !== r2.id}
        theme={{
          backgroundColor: '#ffffff',
          calendarBackground: '#ffffff',
          textSectionTitleColor: '#b6c1cd',
          selectedDayBackgroundColor: '#4285F4',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#4285F4',
          dayTextColor: '#2d4150',
          textDisabledColor: '#d9e1e8',
          dotColor: '#00adf5',
          selectedDotColor: '#ffffff',
          arrowColor: '#4285F4',
          disabledArrowColor: '#d9e1e8',
          monthTextColor: '#2d4150',
          indicatorColor: '#4285F4',
          agendaDayTextColor: '#2d4150',
          agendaDayNumColor: '#2d4150',
          agendaTodayColor: '#4285F4',
          agendaKnobColor: '#4285F4',
        }}
      />
    );
  };

  const renderYearView = () => {
    const currentYear = selectedDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));

    return (
      <ScrollView style={styles.yearView}>
        <Text style={styles.yearTitle}>{currentYear}</Text>
        <View style={styles.monthsGrid}>
          {months.map((month, index) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthEvents = getEventsByDateRange(monthStart, monthEnd);
            
            return (
              <TouchableOpacity
                key={index}
                style={styles.yearMonth}
                onPress={() => {
                  setSelectedDate(month);
                  onDatePress(month);
                }}
              >
                <Text style={styles.yearMonthName}>
                  {format(month, 'MMMM', { locale: fr })}
                </Text>
                <Text style={styles.yearMonthEvents}>
                  {monthEvents.length} événement{monthEvents.length !== 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      case 'year':
        return renderYearView();
      case 'agenda':
        return renderAgendaView();
      default:
        return renderMonthView();
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  weekView: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  selectedWeekDay: {
    backgroundColor: '#4285F4',
  },
  weekDayName: {
    fontSize: 12,
    color: '#6c757d',
    textTransform: 'uppercase',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d4150',
    marginTop: 2,
  },
  selectedWeekDayNumber: {
    color: '#ffffff',
  },
  weekEventsContainer: {
    flex: 1,
    padding: 16,
  },
  weekEvent: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  weekEventTime: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  weekEventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  weekEventLocation: {
    fontSize: 12,
    color: '#6c757d',
  },
  dayView: {
    flex: 1,
  },
  dayHeader: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d4150',
    textAlign: 'center',
  },
  dayEventsContainer: {
    flex: 1,
  },
  hourSlot: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  hourLabel: {
    width: 60,
    padding: 8,
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  hourContent: {
    flex: 1,
    padding: 4,
  },
  dayEvent: {
    padding: 8,
    marginBottom: 4,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  dayEventTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 2,
  },
  dayEventTime: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  dayEventLocation: {
    fontSize: 12,
    color: '#6c757d',
  },
  agendaItem: {
    backgroundColor: '#ffffff',
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    marginTop: 17,
    borderLeftWidth: 4,
  },
  agendaItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 4,
  },
  agendaItemTime: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  agendaItemLocation: {
    fontSize: 12,
    color: '#6c757d',
  },
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 30,
  },
  emptyDateText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  yearView: {
    flex: 1,
    padding: 16,
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d4150',
    textAlign: 'center',
    marginBottom: 20,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  yearMonth: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  yearMonthName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  yearMonthEvents: {
    fontSize: 12,
    color: '#6c757d',
  },
});