import * as Notifications from 'expo-notifications';
import { Event, ReminderSettings } from '../types/Event';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  static async scheduleEventReminder(event: Event): Promise<string[]> {
    if (!event.reminder?.enabled || !event.reminder.minutes.length) {
      return [];
    }

    const notificationIds: string[] = [];
    
    for (const minutes of event.reminder.minutes) {
      const triggerDate = new Date(event.startDate.getTime() - minutes * 60 * 1000);
      
      if (triggerDate > new Date()) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Rappel: ${event.title}`,
            body: `Dans ${minutes} minutes - ${event.location || 'Aucun lieu spécifié'}`,
            data: { eventId: event.id },
            sound: event.reminder.sound,
          },
          trigger: {
            date: triggerDate,
          },
        });
        
        notificationIds.push(id);
      }
    }
    
    return notificationIds;
  }

  static async cancelEventReminders(notificationIds: string[]): Promise<void> {
    await Notifications.cancelScheduledNotificationsAsync(notificationIds);
  }

  static async scheduleRecurringReminders(event: Event): Promise<void> {
    if (!event.recurrence || !event.reminder?.enabled) return;

    // Logique pour programmer les rappels récurrents
    // Cette implémentation dépend du type de récurrence
    const { type, interval, endDate } = event.recurrence;
    
    let nextDate = new Date(event.startDate);
    const maxOccurrences = 100; // Limite pour éviter trop de notifications
    let occurrenceCount = 0;

    while (occurrenceCount < maxOccurrences && (!endDate || nextDate <= endDate)) {
      if (nextDate > new Date()) {
        await this.scheduleEventReminder({
          ...event,
          startDate: nextDate,
          endDate: new Date(nextDate.getTime() + (event.endDate.getTime() - event.startDate.getTime())),
        });
      }

      // Calculer la prochaine occurrence
      switch (type) {
        case 'daily':
          nextDate.setDate(nextDate.getDate() + interval);
          break;
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + interval);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + interval);
          break;
      }

      occurrenceCount++;
    }
  }

  static async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
}