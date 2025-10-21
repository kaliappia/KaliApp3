import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import { Event, RSVPStatus } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, MessageCircle, Share2, MapPin, Calendar, Clock, CalendarPlus, Users, Car, Navigation, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export default function FeedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [feedEvents, setFeedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingEventId, setAddingEventId] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<Record<string, RSVPStatus>>({});
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [likedEvents, setLikedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (profile) {
      loadFeedEvents();
    } else {
      setFeedEvents([]);
      setLoading(false);
    }
  }, [profile]);

  const loadFeedEvents = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Get list of users I'm following
      const { data: followingData, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', profile.id);

      if (followError) throw followError;

      const followingIds = (followingData || []).map(f => f.following_id);

      if (followingIds.length === 0) {
        setFeedEvents([]);
        setLoading(false);
        return;
      }

      // Get public upcoming events from followed users
      const now = new Date().toISOString();
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('organizer_id', followingIds)
        .eq('visibility', 'public')
        .gte('start_date', now)
        .order('start_date', { ascending: true })
        .limit(50);

      if (eventsError) throw eventsError;


      const formattedEvents: Event[] = (eventsData || []).map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description || '',
        startDate: new Date(e.start_date),
        endDate: new Date(e.end_date),
        location: e.formatted_address || e.location,
        placeId: e.place_id,
        placeName: e.place_name,
        formattedAddress: e.formatted_address,
        lat: e.lat ?? undefined,
        lng: e.lng ?? undefined,
        city: e.city ?? undefined,
        countryCode: e.country_code ?? undefined,
        photoUrl: e.photo_url ?? undefined,
        organizerId: e.organizer_id,
        organizerName: e.organizer_name || 'Unknown',
        organizerAvatar: e.organizer_avatar || '',
        visibility: e.visibility as 'public' | 'private',
        attendees: e.attendees || [],
        category: e.category || 'general',
        comments: []
      }));

      setFeedEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading feed:', error);
      toast({
        title: 'Error',
        description: 'Failed to load feed',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCalendar = async (event: Event) => {
    if (!profile) return;

    setAddingEventId(event.id);
    try {
      // Check for duplicates
      const { data: existingEvents } = await supabase
        .from('events')
        .select('id, title, start_date')
        .eq('organizer_id', profile.id)
        .eq('title', event.title)
        .gte('start_date', new Date(event.startDate.getTime() - 3600000).toISOString())
        .lte('start_date', new Date(event.startDate.getTime() + 3600000).toISOString());

      if (existingEvents && existingEvents.length > 0) {
        toast({
          title: 'Already Added',
          description: 'This event is already in your calendar',
          variant: 'destructive'
        });
        return;
      }

      // Get user's calendar
      const { data: calendar } = await supabase
        .from('user_calendars')
        .select('id')
        .eq('user_id', profile.id)
        .single();

      // Get organizer username for attribution
      const { data: organizerProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', event.organizerId)
        .single();

      // Copy event to user's calendar
      const { error } = await supabase
        .from('events')
        .insert({
          user_id: profile.id,            // <-- OBLIGATOIRE pour que EventContext les voie
          calendar_id: calendar?.id,
          title: event.title,
          description: `${event.description}\n\n[Added from @${organizerProfile?.username || 'unknown'}]`,
          start_date: event.startDate.toISOString(),
          end_date: event.endDate.toISOString(),
          location: event.location,
          place_id: event.placeId,
          place_name: event.placeName,
          formatted_address: event.formattedAddress,
          lat: event.lat,
          lng: event.lng,
          city: event.city,
          country_code: event.countryCode,
          photo_url: event.photoUrl,
          visibility: 'private',
          attendees: [profile.id],
          category: event.category,
          organizer_id: profile.id,
          organizer_name: profile.display_name || profile.username
        });

      if (error) throw error;

      toast({
        title: 'Event Added',
        description: `${event.title} has been added to your calendar`,
        action: (
          <Button variant="outline" size="sm" onClick={() => navigate('/calendar')}>
            View in Calendar
          </Button>
        )
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add event',
        variant: 'destructive'
      });
    } finally {
      setAddingEventId(null);
    }
  };

  const handleRSVP = (eventId: string, status: RSVPStatus) => {
    setRsvpStatus(prev => ({ ...prev, [eventId]: status }));
    const statusText = status === 'going' ? t('feed.going') : status === 'maybe' ? t('feed.maybe') : t('feed.cantGo');
    toast({
      title: t('toast.rsvpUpdated'),
      description: `${t('feed.going')} - ${statusText}`,
    });
  };

  const handleLike = (eventId: string) => {
    setLikedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const handleShare = (event: Event) => {
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: event.description,
        url: window.location.href,
      });
    } else {
      toast({
        title: "Share",
        description: "Share functionality would open here",
      });
    }
  };

  function openUber(event: Event) {
    const lat = event.lat;
    const lng = event.lng;
    const address = event.formattedAddress || event.location || '';
    const name = event.placeName || event.title;
    if (lat && lng) {
      const url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(name)}`;
      window.open(url, '_blank');
    } else if (address) {
      const url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    }
  }

  function openBolt(event: Event) {
    const lat = event.lat;
    const lng = event.lng;
    const address = event.formattedAddress || event.location || '';

    if (lat && lng) {
      const appUrl = `bolt://ride?destination_lat=${lat}&destination_lng=${lng}`;
      window.location.href = appUrl;
      setTimeout(() => {
        const webUrl = `https://bolt.eu/en/ride/?destination_lat=${lat}&destination_lng=${lng}`;
        window.open(webUrl, '_blank');
      }, 1500);
    } else if (address) {
      const appUrl = `bolt://ride?destination=${encodeURIComponent(address)}`;
      window.location.href = appUrl;
      setTimeout(() => {
        const webUrl = `https://bolt.eu/en/ride/?destination=${encodeURIComponent(address)}`;
        window.open(webUrl, '_blank');
      }, 1500);
    }
  }

  const openAppleMaps = (event: Event) => {
    if (event.lat && event.lng) {
      const mapsUrl = `http://maps.apple.com/?daddr=${event.lat},${event.lng}&dirflg=d`;
      window.open(mapsUrl, '_blank');
    } else if (event.formattedAddress || event.location) {
      const address = encodeURIComponent(event.formattedAddress || event.location || '');
      const mapsUrl = `http://maps.apple.com/?daddr=${address}&dirflg=d`;
      window.open(mapsUrl, '_blank');
    }
  };

  const hasValidLocation = (event: Event) => {
    return (event.lat && event.lng) || event.formattedAddress || event.location;
  };

  if (loading) {
    return (
      <div className="bg-white min-h-screen pb-20">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
          <h1 className="text-2xl font-bold">{t('feed.title')}</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
        <h1 className="text-2xl font-bold">{t('feed.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {feedEvents.length > 0
            ? `${feedEvents.length} upcoming event${feedEvents.length !== 1 ? 's' : ''} from people you follow`
            : 'Follow users to see their public events here'}
        </p>
      </div>

      {/* Feed */}
      <div className="divide-y divide-gray-100">
        {feedEvents.length === 0 && (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No events yet. Follow users in Discover to see their public events here!
            </p>
            <Button onClick={() => navigate('/discover')}>
              Discover Users
            </Button>
          </div>
        )}

        {feedEvents.map((event) => (
          <Card key={event.id} className="rounded-none border-0 shadow-none">
            <div className="p-4 space-y-4">
              {/* Organizer Info */}
              <div className="flex items-center gap-3">
                <Avatar
                  className="h-10 w-10 cursor-pointer"
                  onClick={() => {
                    supabase
                      .from('profiles')
                      .select('username')
                      .eq('id', event.organizerId)
                      .single()
                      .then(({ data }) => {
                        if (data) navigate(`/profile/${data.username}`);
                      });
                  }}
                >
                  <AvatarImage src={event.organizerAvatar} />
                  <AvatarFallback>{event.organizerName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p
                    className="font-semibold text-sm cursor-pointer hover:underline"
                    onClick={() => {
                      supabase
                        .from('profiles')
                        .select('username')
                        .eq('id', event.organizerId)
                        .single()
                        .then(({ data }) => {
                          if (data) navigate(`/profile/${data.username}`);
                        });
                    }}
                  >
                    {event.organizerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(event.startDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="secondary">{event.category}</Badge>
              </div>

              {/* Event Details - Clickable */}
              <div
                className="space-y-2 cursor-pointer"
                onClick={() => setSelectedEvent(event)}
              >
                <h3 className="font-bold text-lg hover:text-primary transition-colors">
                  {event.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description.replace(/\[Added from @.*\]/, '').trim()}
                </p>
              </div>

              {/* Event Meta */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{format(event.startDate, 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {format(event.startDate, 'h:mm a')} - {format(event.endDate, 'h:mm a')}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Add to Calendar Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => handleAddToCalendar(event)}
                disabled={addingEventId === event.id}
              >
                {addingEventId === event.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4" />
                    {t('feed.addToCalendar')}
                  </>
                )}
              </Button>

              {/* RSVP Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={rsvpStatus[event.id] === 'going' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP(event.id, 'going')}
                >
                  {t('feed.going')}
                </Button>
                <Button
                  size="sm"
                  variant={rsvpStatus[event.id] === 'maybe' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP(event.id, 'maybe')}
                >
                  {t('feed.maybe')}
                </Button>
                <Button
                  size="sm"
                  variant={rsvpStatus[event.id] === 'not-going' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => handleRSVP(event.id, 'not-going')}
                >
                  {t('feed.cantGo')}
                </Button>
              </div>

              {/* Engagement Stats */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-4">
                  <button
                    className={`flex items-center gap-1 transition-colors ${likedEvents.has(event.id)
                      ? 'text-red-500'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                    onClick={() => handleLike(event.id)}
                  >
                    <Heart className={`h-5 w-5 ${likedEvents.has(event.id) ? 'fill-current' : ''}`} />
                    <span className="text-sm">
                      {event.attendees.length + (likedEvents.has(event.id) ? 1 : 0)}
                    </span>
                  </button>
                  <button
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span className="text-sm">{event.comments.length}</span>
                  </button>
                </div>
                <button
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => handleShare(event)}
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={selectedEvent.organizerAvatar} />
                    <AvatarFallback>{selectedEvent.organizerName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedEvent.organizerName}</p>
                    <p className="text-sm text-muted-foreground">{t('feed.organizer')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{t('feed.description')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.description.replace(/\[Added from @.*\]/, '').trim()}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(selectedEvent.startDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(selectedEvent.startDate, 'h:mm a')} - {format(selectedEvent.endDate, 'h:mm a')}
                    </span>
                  </div>
                  {selectedEvent.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedEvent.formattedAddress || selectedEvent.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.attendees.length} {t('feed.attending')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedEvent.category}</Badge>
                  <Badge variant="outline">{selectedEvent.visibility}</Badge>
                </div>

                {/* Transportation Shortcuts */}
                {hasValidLocation(selectedEvent) && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3 text-sm flex items-center gap-2">
                      <Navigation className="h-4 w-4" />
                      Get Directions
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col items-center gap-1 h-auto py-3"
                        onClick={() => openUber(selectedEvent)}
                      >
                        <Car className="h-5 w-5" />
                        <span className="text-xs font-semibold">Uber</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col items-center gap-1 h-auto py-3"
                        onClick={() => openBolt(selectedEvent)}
                      >
                        <Car className="h-5 w-5" />
                        <span className="text-xs font-semibold">Bolt</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex flex-col items-center gap-1 h-auto py-3"
                        onClick={() => openAppleMaps(selectedEvent)}
                      >
                        <MapPin className="h-5 w-5" />
                        <span className="text-xs font-semibold">Maps</span>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => {
                      handleAddToCalendar(selectedEvent);
                      setSelectedEvent(null);
                    }}
                    disabled={addingEventId === selectedEvent.id}
                  >
                    {addingEventId === selectedEvent.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      t('feed.addToCalendar')
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleShare(selectedEvent)}
                  >
                    Share
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}