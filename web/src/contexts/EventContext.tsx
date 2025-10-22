import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Event, Comment } from '@/types';
import { supabase } from '@/lib/supabase';

interface EventContextType {
  events: Event[];
  addEvent: (event: Omit<Event, 'id'>) => Promise<void>;
  updateEvent: (id: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addEventToCalendar: (event: Event) => void;
  loading: boolean;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events from Supabase on mount
  useEffect(() => {
    loadEvents();
    
    // Subscribe to realtime changes
    const channel = supabase
      .channel('events-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_comments (*)
        `)
        .order('start_date', { ascending: true });

      if (error) throw error;

      const formattedEvents: Event[] = (data || []).map((event: any) => ({
        id: event.id,
        title: event.title,
        description: event.description || '',
        startDate: new Date(event.start_date),
        endDate: new Date(event.end_date),
        location: event.location,
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
        comments: (event.event_comments || []).map((comment: any) => ({
          id: comment.id,
          userId: comment.user_id,
          userName: comment.user_name,
          userAvatar: comment.user_avatar || '',
          text: comment.text,
          createdAt: new Date(comment.created_at)
        }))
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      console.log('🔵 Adding event to database:', eventData);
      
      const { data, error } = await supabase
        .from('events')
        .insert({
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.startDate.toISOString(),
          end_date: eventData.endDate.toISOString(),
          location: eventData.location,
          place_id: eventData.placeId,
          place_name: eventData.placeName,
          formatted_address: eventData.formattedAddress,
          lat: eventData.lat,
          lng: eventData.lng,
          city: eventData.city,
          country_code: eventData.countryCode,
          photo_url: eventData.photoUrl,
          organizer_id: eventData.organizerId,
          organizer_name: eventData.organizerName,
          organizer_avatar: eventData.organizerAvatar,
          visibility: eventData.visibility,
          attendees: eventData.attendees,
          category: eventData.category
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding event:', error);
        throw error;
      }

      console.log('✅ Event added successfully:', data);
      await loadEvents();
      console.log('✅ Events reloaded');
    } catch (error) {
      console.error('❌ Error in addEvent:', error);
      throw error;
    }
  };

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const updateData: any = {};
      
      if (eventData.title !== undefined) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.startDate !== undefined) updateData.start_date = eventData.startDate.toISOString();
      if (eventData.endDate !== undefined) updateData.end_date = eventData.endDate.toISOString();
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.placeId !== undefined) updateData.place_id = eventData.placeId;
      if (eventData.placeName !== undefined) updateData.place_name = eventData.placeName;
      if (eventData.formattedAddress !== undefined) updateData.formatted_address = eventData.formattedAddress;
      if (eventData.lat !== undefined) updateData.lat = eventData.lat;
      if (eventData.lng !== undefined) updateData.lng = eventData.lng;
      if (eventData.city !== undefined) updateData.city = eventData.city;
      if (eventData.countryCode !== undefined) updateData.country_code = eventData.countryCode;
      if (eventData.photoUrl !== undefined) updateData.photo_url = eventData.photoUrl;
      if (eventData.visibility !== undefined) updateData.visibility = eventData.visibility;
      if (eventData.attendees !== undefined) updateData.attendees = eventData.attendees;
      if (eventData.category !== undefined) updateData.category = eventData.category;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  const addEventToCalendar = (event: Event) => {
    const exists = events.some(e => e.id === event.id);
    if (!exists) {
      setEvents(prev => [...prev, event]);
    }
  };

  return (
    <EventContext.Provider value={{ events, addEvent, updateEvent, deleteEvent, addEventToCalendar, loading }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within EventProvider');
  }
  return context;
}