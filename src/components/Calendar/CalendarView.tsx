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
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { getColors } from '../../theme/colors';

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
    selectedDateAnimationTick,
    isDarkMode,
  } = useEventStore();

  const [markedDates, setMarkedDates] = useState<any>({});
  const colors = getColors(isDarkMode);

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
      marked[selectedDateKey].selectedColor = colors.selected;
    } else {
      marked[selectedDateKey] = {
        selected: true,
        selectedColor: colors.selected,
      };
    }

    setMarkedDates(marked);
  };

  // Animation 360° pour le jour sélectionné
  const rotationDeg = useSharedValue(0);
  useEffect(() => {
    if (!selectedDateAnimationTick) return;
    rotationDeg.value = 0;
    rotationDeg.value = withSequence(withTiming(360, { duration: 600 }));
  }, [selectedDateAnimationTick]);

  const animatedSelectedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotationDeg.value}deg` },
    ],
  }));

  const renderMonthView = () => (
    <Calendar
      current={format(selectedDate, 'yyyy-MM-dd')}
      onDayPress={(day) => {
        const date = new Date(day.timestamp);
        setSelectedDate(date);
        onDatePress(date);
      }}
      dayComponent={({ date, state, marking }) => {
        const dateObj = (date as any)?.timestamp ? new Date((date as any).timestamp) : new Date((date as any).dateString);
        const isSelected = format(dateObj, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
        const Wrapper = isSelected ? Animated.View : View;
        return (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setSelectedDate(dateObj);
              onDatePress(dateObj);
            }}
            style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 2 }}
          >
            <Wrapper style={isSelected ? animatedSelectedStyle : undefined}>
                                <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? colors.selected : 'transparent',
                  }}>
                    <Text style={{
                      color: isSelected ? colors.selectedText : state === 'disabled' ? colors.textDisabled : colors.text,
                      fontWeight: '600',
                    }}>
                      {(date as any).day}
                    </Text>
                  </View>
            </Wrapper>
            {!!marking?.dots?.length && (
              <View style={{ flexDirection: 'row', marginTop: 2, justifyContent: 'center' }}>
                {marking.dots.slice(0, 3).map((d: any, idx: number) => (
                  <View key={idx} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: d.color, marginHorizontal: 1 }} />
                ))}
                {marking.dots.length > 3 && (
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#999', marginHorizontal: 1 }} />
                )}
              </View>
            )}
          </TouchableOpacity>
        );
      }}
      theme={{
        backgroundColor: colors.background,
        calendarBackground: colors.background,
        textSectionTitleColor: colors.textSecondary,
        selectedDayBackgroundColor: colors.selected,
        selectedDayTextColor: colors.selectedText,
        todayTextColor: colors.today,
        dayTextColor: colors.text,
        textDisabledColor: colors.textDisabled,
        dotColor: colors.eventDot,
        selectedDotColor: colors.eventSelectedDot,
        arrowColor: colors.primary,
        disabledArrowColor: colors.textDisabled,
        monthTextColor: colors.text,
        indicatorColor: colors.primary,
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
      style={{ backgroundColor: colors.background }}
      firstDay={1}
      hideExtraDays={true}
      showWeekNumbers={false}
      enableSwipeMonths={true}
      markingType="multi-dot"
      markedDates={markedDates}
    />
  );

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekEvents = getEventsByDateRange(weekStart, weekEnd);

    return (
      <View style={[styles.weekView, { backgroundColor: colors.background }]}>
        <View style={[styles.weekHeader, { backgroundColor: colors.accentLight, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.weekNavButton, { backgroundColor: colors.card }]}
            onPress={() => {
              const prevWeek = addDays(selectedDate, -7);
              setSelectedDate(prevWeek);
            }}
          >
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>

          <View style={styles.weekDaysContainer}>
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
                <Text style={[styles.weekDayName, { color: colors.textSecondary }]}>
                  {format(day, 'EEE', { locale: fr })}
                </Text>
                <Animated.View style={
                  format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? animatedSelectedStyle : undefined
                }>
                  <View style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? colors.selected : 'transparent',
                  }}>
                    <Text style={[
                      styles.weekDayNumber,
                      { color: format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') ? colors.selectedText : colors.text },
                    ]}>
                      {format(day, 'd')}
                    </Text>
                  </View>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.weekNavButton, { backgroundColor: colors.card }]}
            onPress={() => {
              const nextWeek = addDays(selectedDate, 7);
              setSelectedDate(nextWeek);
            }}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={[styles.weekEventsContainer, { backgroundColor: colors.background }]}>
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
      <View style={[styles.dayView, { backgroundColor: colors.background }]}>
        <View style={[styles.dayHeader, { backgroundColor: colors.accentLight, borderBottomColor: colors.border }]}>
          <Text style={[styles.dayTitle, { color: colors.text }]}>
            {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
          </Text>
        </View>
        
        <ScrollView style={[styles.dayEventsContainer, { backgroundColor: colors.background }]}>
          {hours.map(hour => (
            <View key={hour} style={[styles.hourSlot, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.hourLabel, { color: colors.textSecondary }]}>{hour.toString().padStart(2, '0')}:00</Text>
              <View style={styles.hourContent}>
                {dayEvents
                  .filter(event => event.startDate.getHours() === hour)
                  .map(event => (
                    <TouchableOpacity
                      key={event.id}
                      style={[styles.dayEvent, { backgroundColor: event.color + '20', borderLeftColor: event.color }]}
                      onPress={() => onEventPress(event)}
                    >
                              <Text style={[styles.dayEventTitle, { color: colors.text }]}>{event.title}</Text>
        <Text style={[styles.dayEventTime, { color: colors.textSecondary }]}>
          {format(event.startDate, 'HH:mm')} - {format(event.endDate, 'HH:mm')}
        </Text>
        {event.location && (
          <Text style={[styles.dayEventLocation, { color: colors.textSecondary }]}>{event.location}</Text>
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
        style={{ backgroundColor: colors.background }}
        items={agendaItems}
        selected={format(selectedDate, 'yyyy-MM-dd')}
        renderItem={(item: any) => {
          const ev = item as Event;
          return (
            <TouchableOpacity
              style={[styles.agendaItem, { backgroundColor: ev.color + '20', borderLeftColor: ev.color }]}
              onPress={() => onEventPress(ev)}
            >
              <Text style={styles.agendaItemTitle}>{ev.title}</Text>
              <Text style={styles.agendaItemTime}>
                {format(ev.startDate, 'HH:mm')} - {format(ev.endDate, 'HH:mm')}
              </Text>
              {ev.location && (
                <Text style={styles.agendaItemLocation}>{ev.location}</Text>
              )}
            </TouchableOpacity>
          );
        }}
        renderEmptyDate={() => (
          <View style={styles.emptyDate}>
            <Text style={styles.emptyDateText}>Aucun événement</Text>
          </View>
        )}
        rowHasChanged={(r1: any, r2: any) => (r1 as Event).id !== (r2 as Event).id}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.background,
          textSectionTitleColor: colors.textSecondary,
          selectedDayBackgroundColor: colors.selected,
          selectedDayTextColor: colors.selectedText,
          todayTextColor: colors.today,
          dayTextColor: colors.text,
          textDisabledColor: colors.textDisabled,
          dotColor: colors.eventDot,
          selectedDotColor: colors.eventSelectedDot,
          arrowColor: colors.primary,
          disabledArrowColor: colors.textDisabled,
          monthTextColor: colors.text,
          indicatorColor: colors.primary,
          agendaDayTextColor: colors.text,
          agendaDayNumColor: colors.text,
          agendaTodayColor: colors.today,
          agendaKnobColor: colors.primary,
        }}
      />
    );
  };

  const renderYearView = () => {
    const currentYear = selectedDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1));

    return (
      <ScrollView style={[styles.yearView, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.yearHeader, { backgroundColor: colors.accentLight }]}>
          <TouchableOpacity
            style={[styles.yearNavButton, { backgroundColor: colors.card }]}
            onPress={() => {
              const prevYear = new Date(currentYear - 1, 0, 1);
              setSelectedDate(prevYear);
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.yearTitle, { color: colors.text }]}>{currentYear}</Text>
          
          <TouchableOpacity
            style={[styles.yearNavButton, { backgroundColor: colors.card }]}
            onPress={() => {
              const nextYear = new Date(currentYear + 1, 0, 1);
              setSelectedDate(nextYear);
            }}
          >
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.monthsGrid}>
          {months.map((month, index) => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthEvents = getEventsByDateRange(monthStart, monthEnd);
            const isCurrentMonth = month.getMonth() === new Date().getMonth() && month.getFullYear() === new Date().getFullYear();
            const isSelectedMonth = month.getMonth() === selectedDate.getMonth() && month.getFullYear() === selectedDate.getFullYear();
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.yearMonth,
                  { backgroundColor: colors.card },
                  isCurrentMonth && { backgroundColor: colors.accent, borderColor: colors.primary, borderWidth: 2 },
                  isSelectedMonth && { backgroundColor: colors.selected },
                ]}
                onPress={() => {
                  setSelectedDate(month);
                  // Changer automatiquement vers la vue mois quand on sélectionne un mois
                  const { setCurrentView } = useEventStore.getState();
                  setCurrentView('month');
                  onDatePress(month);
                }}
              >
                <Text style={[
                  styles.yearMonthName,
                  { color: colors.text },
                  isCurrentMonth && { color: colors.primary, fontWeight: 'bold' },
                  isSelectedMonth && { color: colors.selectedText, fontWeight: 'bold' },
                ]}>
                  {format(month, 'MMM', { locale: fr })}
                </Text>
                <View style={styles.yearMonthEventsContainer}>
                  {monthEvents.length > 0 ? (
                    <View style={styles.yearMonthEventsDots}>
                      {monthEvents.slice(0, 3).map((event, eventIndex) => (
                        <View
                          key={eventIndex}
                          style={[
                            styles.yearMonthEventDot,
                            { backgroundColor: event.color }
                          ]}
                        />
                      ))}
                      {monthEvents.length > 3 && (
                        <Text style={[styles.yearMonthEventsCount, { color: colors.textSecondary }]}>
                          +{monthEvents.length - 3}
                        </Text>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.yearMonthNoEvents, { color: colors.textSecondary }]}>Aucun événement</Text>
                  )}
                </View>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderCurrentView()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  weekView: {
    flex: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  weekNavButton: {
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  weekDaysContainer: {
    flex: 1,
    flexDirection: 'row',
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
    textTransform: 'uppercase',
  },
  weekDayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
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
    borderBottomWidth: 1,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dayEventsContainer: {
    flex: 1,
  },
  hourSlot: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
  },
  hourLabel: {
    width: 60,
    padding: 8,
    fontSize: 12,
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
    marginBottom: 2,
  },
  dayEventTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  dayEventLocation: {
    fontSize: 12,
  },
  agendaItem: {
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
    marginBottom: 4,
  },
  agendaItemTime: {
    fontSize: 12,
    marginBottom: 2,
  },
  agendaItemLocation: {
    fontSize: 12,
  },
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 30,
  },
  emptyDateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  yearView: {
    flex: 1,
    padding: 16,
  },
  yearTitle: {
    fontSize: 24,
    fontWeight: 'bold',
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
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  yearMonthName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  yearMonthEvents: {
    fontSize: 12,
  },
  yearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  yearNavButton: {
    padding: 8,
    borderRadius: 8,
  },
  currentYearMonth: {
    borderWidth: 2,
  },
  selectedYearMonth: {
  },
  currentYearMonthName: {
    fontWeight: 'bold',
  },
  selectedYearMonthName: {
    fontWeight: 'bold',
  },
  yearMonthEventsContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  yearMonthEventsDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearMonthEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 1,
  },
  yearMonthEventsCount: {
    fontSize: 10,
    marginLeft: 4,
  },
  yearMonthNoEvents: {
    fontSize: 10,
    fontStyle: 'italic',
  },
});