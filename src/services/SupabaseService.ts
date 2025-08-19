import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Event } from '../types/Event';

type DatabaseEvent = Omit<Event, 'startDate' | 'endDate' | 'createdAt' | 'updatedAt' | 'category' | 'weather'> & {
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  weatherJson?: any;
};

class SupabaseServiceClass {
  private client: SupabaseClient | null = null;

  private readConfig(): { url?: string; key?: string } {
    const envUrl = (process as any)?.env?.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
    const envKey = (process as any)?.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined;
    const extra = (Constants as any).expoConfig?.extra || (Constants as any).manifest?.extra || {};
    const extraUrl = extra?.supabaseUrl as string | undefined;
    const extraKey = extra?.supabaseAnonKey as string | undefined;
    const url = envUrl || extraUrl;
    const key = envKey || extraKey;
    return { url, key };
  }

  private ensureClient(): SupabaseClient | null {
    if (this.client) return this.client;
    const { url, key } = this.readConfig();
    if (!url || !key || !/^https?:\/\//.test(url)) {
      // Configuration manquante ou invalide → ne pas crasher
      return null;
    }
    this.client = createClient(url, key);
    return this.client;
  }

  getClient(): SupabaseClient | null {
    return this.ensureClient();
  }

  async signInWithEmail(email: string, password: string) {
    const client = this.ensureClient();
    if (!client) throw new Error('Supabase non configuré');
    return await client.auth.signInWithPassword({ email, password });
  }

  async signUpWithEmail(email: string, password: string) {
    const client = this.ensureClient();
    if (!client) throw new Error('Supabase non configuré');
    return await client.auth.signUp({ email, password });
  }

  async signOut() {
    const client = this.ensureClient();
    if (!client) throw new Error('Supabase non configuré');
    return await client.auth.signOut();
  }

  async syncEvents(userId: string, events: Event[]) {
    // colonnes en base créées en minuscules (non-quotées)
    const payload = events.map(ev => ({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? null,
      startdate: ev.startDate.toISOString(),
      enddate: ev.endDate.toISOString(),
      location: ev.location ?? null,
      color: ev.color,
      isallday: ev.isAllDay,
      reminder: (ev.reminder as any) ?? null,
      recurrence: (ev.recurrence as any) ?? null,
      participants: (ev.participants as any) ?? [],
      createdby: userId,
      createdat: ev.createdAt.toISOString(),
      updatedat: ev.updatedAt.toISOString(),
      isprivate: ev.isPrivate,
      tags: ev.tags ?? [],
      attachments: (ev.attachments as any) ?? [],
      categoryid: ev.category.id,
      categoryname: ev.category.name,
      categorycolor: ev.category.color,
      categoryicon: ev.category.icon,
      weatherjson: ev.weather ?? null,
    }));

    const client = this.ensureClient();
    if (!client) return; // pas de cloud → ignorer silencieusement
    const { error } = await client.from('events').upsert(payload as any, { onConflict: 'id' });
    if (error) throw error;
  }

  async fetchEvents(userId: string): Promise<Event[]> {
    const client = this.ensureClient();
    if (!client) return [];
    const { data, error } = await client
      .from('events')
      .select('*')
      .eq('createdby', userId)
      .order('startdate', { ascending: true });
    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? undefined,
      startDate: new Date(row.startdate ?? row.startDate),
      endDate: new Date(row.enddate ?? row.endDate),
      location: row.location ?? undefined,
      category: {
        id: row.categoryid ?? row.categoryId,
        name: row.categoryname ?? row.categoryName,
        color: row.categorycolor ?? row.categoryColor,
        icon: row.categoryicon ?? row.categoryIcon,
      },
      color: row.color,
      isAllDay: row.isallday ?? row.isAllDay,
      reminder: row.reminder ?? undefined,
      recurrence: row.recurrence ?? undefined,
      participants: row.participants ?? [],
      createdBy: row.createdby ?? row.createdBy,
      createdAt: new Date(row.createdat ?? row.createdAt),
      updatedAt: new Date(row.updatedat ?? row.updatedAt),
      isPrivate: row.isprivate ?? row.isPrivate,
      tags: row.tags ?? [],
      attachments: row.attachments ?? [],
      weather: row.weatherjson ?? row.weatherJson ?? undefined,
    }));
  }
}

export const SupabaseService = new SupabaseServiceClass();

