import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organizer, Event } from '@/types';
import { supabase } from '@/lib/supabase';

interface OrganizerContextType {
  organizers: Organizer[];
  followedOrganizers: Set<string>;
  followedEvents: Event[];
  followOrganizer: (organizerId: string) => Promise<void>;
  unfollowOrganizer: (organizerId: string) => Promise<void>;
  isFollowing: (organizerId: string) => boolean;
  loading: boolean;
  seedData: () => Promise<void>;
  refreshDaily: () => Promise<void>;
}

const OrganizerContext = createContext<OrganizerContextType | undefined>(undefined);

const CURRENT_USER_ID = 'current-user'; // In production, get from auth

export function OrganizerProvider({ children }: { children: ReactNode }) {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [followedOrganizers, setFollowedOrganizers] = useState<Set<string>>(new Set());
  const [followedEvents, setFollowedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizers();
    loadFollows();
    
    // Subscribe to realtime changes
    const orgChannel = supabase
      .channel('organizers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'organizers' }, () => {
        loadOrganizers();
      })
      .subscribe();

    const followsChannel = supabase
      .channel('follows-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => {
        loadFollows();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(orgChannel);
      supabase.removeChannel(followsChannel);
    };
  }, []);

  useEffect(() => {
    if (followedOrganizers.size > 0) {
      loadFollowedEvents();
    } else {
      setFollowedEvents([]);
    }
  }, [followedOrganizers]);

  const loadOrganizers = async () => {
    try {
      const { data, error } = await supabase
        .from('organizers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrganizers: Organizer[] = (data || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        avatar: org.avatar_url,
        bio: org.bio,
        category: org.category,
        createdAt: new Date(org.created_at)
      }));

      setOrganizers(formattedOrganizers);
    } catch (error) {
      console.error('Error loading organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFollows = async () => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('organizer_id')
        .eq('user_id', CURRENT_USER_ID);

      if (error) throw error;

      const followedIds = new Set((data || []).map((f: any) => f.organizer_id));
      setFollowedOrganizers(followedIds);
    } catch (error) {
      console.error('Error loading follows:', error);
    }
  };

  const loadFollowedEvents = async () => {
    try {
      const organizerIds = Array.from(followedOrganizers);
      if (organizerIds.length === 0) return;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('organizer_id', organizerIds)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (error) throw error;

      const formattedEvents: Event[] = (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
        location: event.formatted_address || event.location,
        placeId: event.place_id,
        placeName: event.place_name,
        formattedAddress: event.formatted_address,
        lat: event.lat,
        lng: event.lng,
        city: event.city,
        countryCode: event.country_code,
        photoUrl: event.photo_url,
        organizerId: event.organizer_id,
        organizerName: event.organizer_name,
        organizerAvatar: event.organizer_avatar || '',
        visibility: event.visibility as 'private' | 'public' | 'friends',
        attendees: event.attendees || [],
        category: event.category,
        comments: []
      }));

      setFollowedEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading followed events:', error);
    }
  };

  const followOrganizer = async (organizerId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .upsert({ user_id: CURRENT_USER_ID, organizer_id: organizerId });

      if (error) throw error;

      setFollowedOrganizers(prev => new Set([...prev, organizerId]));
    } catch (error) {
      console.error('Error following organizer:', error);
      throw error;
    }
  };

  const unfollowOrganizer = async (organizerId: string) => {
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('user_id', CURRENT_USER_ID)
        .eq('organizer_id', organizerId);

      if (error) throw error;

      setFollowedOrganizers(prev => {
        const newSet = new Set(prev);
        newSet.delete(organizerId);
        return newSet;
      });
    } catch (error) {
      console.error('Error unfollowing organizer:', error);
      throw error;
    }
  };

  const isFollowing = (organizerId: string) => {
    return followedOrganizers.has(organizerId);
  };

  const seedData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-events', {
        body: { action: 'seed' }
      });

      if (error) throw error;
      
      await loadOrganizers();
      return data;
    } catch (error) {
      console.error('Error seeding data:', error);
      throw error;
    }
  };

  const refreshDaily = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('supabase-functions-seed-events', {
        body: { action: 'daily_refresh' }
      });

      if (error) throw error;
      
      await loadOrganizers();
      if (followedOrganizers.size > 0) {
        await loadFollowedEvents();
      }
      return data;
    } catch (error) {
      console.error('Error refreshing data:', error);
      throw error;
    }
  };

  return (
    <OrganizerContext.Provider value={{ 
      organizers, 
      followedOrganizers, 
      followedEvents,
      followOrganizer, 
      unfollowOrganizer, 
      isFollowing, 
      loading,
      seedData,
      refreshDaily
    }}>
      {children}
    </OrganizerContext.Provider>
  );
}

export function useOrganizers() {
  const context = useContext(OrganizerContext);
  if (!context) {
    throw new Error('useOrganizers must be used within OrganizerProvider');
  }
  return context;
}