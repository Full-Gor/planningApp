export interface Event {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  category: EventCategory;
  color: string;
  isAllDay: boolean;
  reminder?: ReminderSettings;
  recurrence?: RecurrenceSettings;
  participants?: Participant[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isPrivate: boolean;
  tags: string[];
  attachments?: string[];
  weather?: WeatherInfo;
}

export interface EventCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface ReminderSettings {
  enabled: boolean;
  minutes: number[];
  sound: boolean;
  vibration: boolean;
}

export interface RecurrenceSettings {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  exceptions?: Date[];
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined' | 'tentative';
  isOrganizer: boolean;
}

export interface WeatherInfo {
  temperature: number;
  condition: string;
  icon: string;
  humidity: number;
  windSpeed: number;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  isVisible: boolean;
  isOwner: boolean;
  permissions: CalendarPermissions;
  sharedWith: string[];
}

export interface CalendarPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export type ViewMode = 'day' | 'week' | 'month' | 'year' | 'agenda';

export interface TimeSlot {
  start: Date;
  end: Date;
  isAvailable: boolean;
  events: Event[];
}