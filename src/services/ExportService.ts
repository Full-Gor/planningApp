import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Event } from '../types/Event';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export class ExportService {
  static async exportToICS(events: Event[], filename: string = 'calendar.ics'): Promise<void> {
    try {
      const icsContent = this.generateICSContent(events);
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, icsContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/calendar',
          dialogTitle: 'Exporter le calendrier',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export ICS:', error);
      throw error;
    }
  }

  static async exportToCSV(events: Event[], filename: string = 'events.csv'): Promise<void> {
    try {
      const csvContent = this.generateCSVContent(events);
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exporter les événements',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      throw error;
    }
  }

  static async exportToJSON(events: Event[], filename: string = 'events.json'): Promise<void> {
    try {
      const jsonContent = JSON.stringify(events, null, 2);
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter les données',
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      throw error;
    }
  }

  private static generateICSContent(events: Event[]): string {
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PlanningApp//Calendar//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ];

    events.forEach(event => {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.id}@planningapp.com`);
      lines.push(`DTSTART:${this.formatDateForICS(event.startDate)}`);
      lines.push(`DTEND:${this.formatDateForICS(event.endDate)}`);
      lines.push(`SUMMARY:${this.escapeICSText(event.title)}`);
      
      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICSText(event.description)}`);
      }
      
      if (event.location) {
        lines.push(`LOCATION:${this.escapeICSText(event.location)}`);
      }
      
      lines.push(`CREATED:${this.formatDateForICS(event.createdAt)}`);
      lines.push(`LAST-MODIFIED:${this.formatDateForICS(event.updatedAt)}`);
      lines.push(`CATEGORIES:${event.category.name}`);
      
      if (event.recurrence) {
        lines.push(this.generateRRULE(event.recurrence));
      }
      
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  private static generateCSVContent(events: Event[]): string {
    const headers = [
      'Titre',
      'Description',
      'Date de début',
      'Date de fin',
      'Lieu',
      'Catégorie',
      'Toute la journée',
      'Privé',
      'Tags',
      'Créé le',
      'Modifié le'
    ];

    const rows = events.map(event => [
      this.escapeCSVField(event.title),
      this.escapeCSVField(event.description || ''),
      format(event.startDate, 'dd/MM/yyyy HH:mm', { locale: fr }),
      format(event.endDate, 'dd/MM/yyyy HH:mm', { locale: fr }),
      this.escapeCSVField(event.location || ''),
      this.escapeCSVField(event.category.name),
      event.isAllDay ? 'Oui' : 'Non',
      event.isPrivate ? 'Oui' : 'Non',
      this.escapeCSVField(event.tags.join(', ')),
      format(event.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr }),
      format(event.updatedAt, 'dd/MM/yyyy HH:mm', { locale: fr }),
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  private static formatDateForICS(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }

  private static escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  private static escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private static generateRRULE(recurrence: any): string {
    let rrule = 'RRULE:';
    
    switch (recurrence.type) {
      case 'daily':
        rrule += `FREQ=DAILY;INTERVAL=${recurrence.interval}`;
        break;
      case 'weekly':
        rrule += `FREQ=WEEKLY;INTERVAL=${recurrence.interval}`;
        if (recurrence.daysOfWeek) {
          const days = recurrence.daysOfWeek.map((day: number) => 
            ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][day]
          ).join(',');
          rrule += `;BYDAY=${days}`;
        }
        break;
      case 'monthly':
        rrule += `FREQ=MONTHLY;INTERVAL=${recurrence.interval}`;
        if (recurrence.dayOfMonth) {
          rrule += `;BYMONTHDAY=${recurrence.dayOfMonth}`;
        }
        break;
      case 'yearly':
        rrule += `FREQ=YEARLY;INTERVAL=${recurrence.interval}`;
        break;
    }
    
    if (recurrence.endDate) {
      rrule += `;UNTIL=${this.formatDateForICS(recurrence.endDate)}`;
    }
    
    return rrule;
  }

  static async importFromICS(fileUri: string): Promise<Event[]> {
    try {
      const content = await FileSystem.readAsStringAsync(fileUri);
      return this.parseICSContent(content);
    } catch (error) {
      console.error('Erreur lors de l\'import ICS:', error);
      throw error;
    }
  }

  private static parseICSContent(content: string): Event[] {
    const events: Event[] = [];
    const lines = content.split(/\r?\n/);
    let currentEvent: any = null;

    for (const line of lines) {
      if (line.startsWith('BEGIN:VEVENT')) {
        currentEvent = {
          id: '',
          title: '',
          startDate: new Date(),
          endDate: new Date(),
          category: { id: '1', name: 'Importé', color: '#4285F4', icon: 'event' },
          color: '#4285F4',
          isAllDay: false,
          createdBy: 'import',
          createdAt: new Date(),
          updatedAt: new Date(),
          isPrivate: false,
          tags: [],
        };
      } else if (line.startsWith('END:VEVENT') && currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      } else if (currentEvent) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':');

        switch (key) {
          case 'UID':
            currentEvent.id = value.split('@')[0];
            break;
          case 'SUMMARY':
            currentEvent.title = this.unescapeICSText(value);
            break;
          case 'DESCRIPTION':
            currentEvent.description = this.unescapeICSText(value);
            break;
          case 'LOCATION':
            currentEvent.location = this.unescapeICSText(value);
            break;
          case 'DTSTART':
            currentEvent.startDate = this.parseICSDate(value);
            break;
          case 'DTEND':
            currentEvent.endDate = this.parseICSDate(value);
            break;
        }
      }
    }

    return events;
  }

  private static unescapeICSText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  private static parseICSDate(dateString: string): Date {
    // Format: YYYYMMDDTHHMMSSZ
    const year = parseInt(dateString.substr(0, 4));
    const month = parseInt(dateString.substr(4, 2)) - 1;
    const day = parseInt(dateString.substr(6, 2));
    const hour = parseInt(dateString.substr(9, 2));
    const minute = parseInt(dateString.substr(11, 2));
    const second = parseInt(dateString.substr(13, 2));

    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }
}