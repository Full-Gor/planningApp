import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useEventStore } from '../store/eventStore';
import { Event } from '../types/Event';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface StatsData {
  totalEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  categoryStats: { name: string; count: number; color: string }[];
  weeklyStats: { day: string; count: number }[];
  monthlyStats: { month: string; count: number }[];
  timeDistribution: { hour: number; count: number }[];
}

export const StatsScreen: React.FC = () => {
  const { events } = useEventStore();
  const [stats, setStats] = useState<StatsData>({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    categoryStats: [],
    weeklyStats: [],
    monthlyStats: [],
    timeDistribution: [],
  });

  useEffect(() => {
    calculateStats();
  }, [events]);

  const calculateStats = () => {
    const now = new Date();
    
    // Statistiques générales
    const totalEvents = events.length;
    const upcomingEvents = events.filter(event => new Date(event.startDate) > now).length;
    const completedEvents = events.filter(event => new Date(event.endDate) < now).length;

    // Statistiques par catégorie
    const categoryMap = new Map<string, { count: number; color: string; name: string }>();
    events.forEach(event => {
      const key = event.category.id;
      if (categoryMap.has(key)) {
        categoryMap.get(key)!.count++;
      } else {
        categoryMap.set(key, {
          count: 1,
          color: event.category.color,
          name: event.category.name,
        });
      }
    });
    const categoryStats = Array.from(categoryMap.values());

    // Statistiques hebdomadaires (7 derniers jours)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    const weeklyStats = weekDays.map(day => {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === day.toDateString();
      });
      
      return {
        day: format(day, 'EEE', { locale: fr }),
        count: dayEvents.length,
      };
    });

    // Statistiques mensuelles (6 derniers mois)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.getMonth() === month.getMonth() && 
               eventDate.getFullYear() === month.getFullYear();
      });
      
      monthlyStats.push({
        month: format(month, 'MMM', { locale: fr }),
        count: monthEvents.length,
      });
    }

    // Distribution par heure
    const hourMap = new Map<number, number>();
    events.forEach(event => {
      const hour = new Date(event.startDate).getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });
    
    const timeDistribution = Array.from(hourMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour - b.hour);

    setStats({
      totalEvents,
      upcomingEvents,
      completedEvents,
      categoryStats,
      weeklyStats,
      monthlyStats,
      timeDistribution,
    });
  };

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(45, 65, 80, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4285F4',
    },
  };

  const renderStatCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statCardContent}>
        <View style={styles.statCardHeader}>
          <Ionicons name={icon as any} size={24} color={color} />
          <Text style={styles.statCardValue}>{value}</Text>
        </View>
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
    </View>
  );

  const renderCategoryChart = () => {
    if (stats.categoryStats.length === 0) return null;

    const data = stats.categoryStats.map((category, index) => ({
      name: category.name,
      population: category.count,
      color: category.color,
      legendFontColor: '#2d4150',
      legendFontSize: 12,
    }));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Répartition par catégorie</Text>
        <PieChart
          data={data}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          center={[10, 10]}
          absolute
        />
      </View>
    );
  };

  const renderWeeklyChart = () => {
    if (stats.weeklyStats.length === 0) return null;

    const data = {
      labels: stats.weeklyStats.map(stat => stat.day),
      datasets: [
        {
          data: stats.weeklyStats.map(stat => stat.count),
          color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Événements cette semaine</Text>
        <LineChart
          data={data}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderMonthlyChart = () => {
    if (stats.monthlyStats.length === 0) return null;

    const data = {
      labels: stats.monthlyStats.map(stat => stat.month),
      datasets: [
        {
          data: stats.monthlyStats.map(stat => stat.count),
        },
      ],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Évolution mensuelle</Text>
        <BarChart
          data={data}
          width={width - 32}
          height={220}
          chartConfig={chartConfig}
          style={styles.chart}
          yAxisLabel=""
          yAxisSuffix=""
          showValuesOnTopOfBars
        />
      </View>
    );
  };

  const renderTimeDistribution = () => {
    if (stats.timeDistribution.length === 0) return null;

    const topHours = stats.timeDistribution
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Heures les plus actives</Text>
        <View style={styles.timeDistributionContainer}>
          {topHours.map((item, index) => (
            <View key={item.hour} style={styles.timeDistributionItem}>
              <Text style={styles.timeDistributionHour}>
                {item.hour.toString().padStart(2, '0')}:00
              </Text>
              <View style={styles.timeDistributionBar}>
                <View
                  style={[
                    styles.timeDistributionFill,
                    {
                      width: `${(item.count / topHours[0].count) * 100}%`,
                      backgroundColor: '#4285F4',
                    },
                  ]}
                />
              </View>
              <Text style={styles.timeDistributionCount}>{item.count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Statistiques</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cartes de statistiques */}
        <View style={styles.statsGrid}>
          {renderStatCard('Total', stats.totalEvents, 'calendar', '#4285F4')}
          {renderStatCard('À venir', stats.upcomingEvents, 'time', '#0F9D58')}
          {renderStatCard('Terminés', stats.completedEvents, 'checkmark-circle', '#DB4437')}
        </View>

        {/* Graphiques */}
        {renderCategoryChart()}
        {renderWeeklyChart()}
        {renderMonthlyChart()}
        {renderTimeDistribution()}

        {/* Insights */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Insights</Text>
          
          {stats.categoryStats.length > 0 && (
            <View style={styles.insightItem}>
              <Ionicons name="trending-up" size={20} color="#4285F4" />
              <Text style={styles.insightText}>
                Votre catégorie la plus utilisée est "{stats.categoryStats.sort((a, b) => b.count - a.count)[0]?.name}" 
                avec {stats.categoryStats.sort((a, b) => b.count - a.count)[0]?.count} événements.
              </Text>
            </View>
          )}

          {stats.weeklyStats.length > 0 && (
            <View style={styles.insightItem}>
              <Ionicons name="calendar" size={20} color="#0F9D58" />
              <Text style={styles.insightText}>
                Votre jour le plus chargé cette semaine est le {
                  stats.weeklyStats.sort((a, b) => b.count - a.count)[0]?.day
                } avec {stats.weeklyStats.sort((a, b) => b.count - a.count)[0]?.count} événements.
              </Text>
            </View>
          )}

          {stats.upcomingEvents > 0 && (
            <View style={styles.insightItem}>
              <Ionicons name="time" size={20} color="#F4B400" />
              <Text style={styles.insightText}>
                Vous avez {stats.upcomingEvents} événement{stats.upcomingEvents > 1 ? 's' : ''} à venir.
              </Text>
            </View>
          )}
        </View>
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statCardContent: {
    alignItems: 'center',
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d4150',
    marginLeft: 8,
  },
  statCardTitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  timeDistributionContainer: {
    paddingVertical: 8,
  },
  timeDistributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeDistributionHour: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4150',
    width: 50,
  },
  timeDistributionBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginHorizontal: 12,
  },
  timeDistributionFill: {
    height: '100%',
    borderRadius: 4,
  },
  timeDistributionCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4150',
    width: 30,
    textAlign: 'right',
  },
  insightsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4150',
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 14,
    color: '#2d4150',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});