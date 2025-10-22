import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Event, Organizer } from '@/types';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Calendar, Users, TrendingUp, CalendarPlus, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEvents } from '@/contexts/EventContext';
import { useOrganizers } from '@/contexts/OrganizerContext';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';

export default function DiscoverPage() {
  const { t } = useTranslation();
  const { events, addEvent } = useEvents();
  const { 
    organizers, 
    followOrganizer, 
    unfollowOrganizer, 
    isFollowing,
    seedData,
    refreshDaily,
    loading: organizersLoading 
  } = useOrganizers();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedOrganizer, setSelectedOrganizer] = useState<Organizer | null>(null);
  const [organizerEvents, setOrganizerEvents] = useState<Event[]>([]);

  // Auto-seed on first load
  useEffect(() => {
    if (!organizersLoading && organizers.length === 0) {
      seedData().catch(console.error);
    }
  }, [organizersLoading, organizers.length]);

  // Load organizer events when viewing profile
  useEffect(() => {
    if (selectedOrganizer) {
      loadOrganizerEvents(selectedOrganizer.id);
    }
  }, [selectedOrganizer]);

  const loadOrganizerEvents = async (organizerId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', organizerId)
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
        photoUrl: event.photo_url,
        organizerId: event.organizer_id,
        organizerName: event.organizer_name,
        organizerAvatar: event.organizer_avatar || '',
        visibility: event.visibility as 'private' | 'public' | 'friends',
        attendees: event.attendees || [],
        category: event.category,
        comments: []
      }));

      setOrganizerEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading organizer events:', error);
    }
  };

  const handleFollow = async (organizerId: string) => {
    try {
      if (isFollowing(organizerId)) {
        await unfollowOrganizer(organizerId);
        toast({
          title: t('toast.unfollowed'),
          description: t('toast.unfollowedDesc'),
        });
      } else {
        await followOrganizer(organizerId);
        toast({
          title: t('toast.followingNow'),
          description: t('toast.followingDesc'),
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update follow status',
        variant: 'destructive'
      });
    }
  };

  const handleAddToCalendar = async (event: Event) => {
    try {
      // Copy event to user's personal calendar
      await addEvent({
        title: event.title,
        description: event.description,
        startDate: event.startDate,
        endDate: event.endDate,
        location: event.formattedAddress || event.location,
        placeId: event.placeId,
        placeName: event.placeName,
        formattedAddress: event.formattedAddress,
        lat: event.lat,
        lng: event.lng,
        photoUrl: event.photoUrl,
        organizerId: 'current-user',
        organizerName: 'Me',
        organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=me',
        visibility: 'private',
        attendees: ['current-user'],
        comments: [],
        category: event.category
      });
      
      toast({
        title: t('toast.addedToCalendar'),
        description: `${event.title} ${t('toast.eventAdded')}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add event to calendar',
        variant: 'destructive'
      });
    }
  };

  // Get all public events from organizers
  const allOrganizerEvents = events.filter(e => 
    e.visibility === 'public' && 
    e.organizerId !== 'current-user' &&
    new Date(e.startDate) > new Date()
  );

  const filteredEvents = allOrganizerEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredOrganizers = organizers.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || org.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'sports', 'music', 'nightlife', 'art', 'talks'];

  return (
    <AppLayout>
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
          <h1 className="text-2xl font-bold mb-3">{t('discover.title')}</h1>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('discover.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="events" className="flex-1">{t('discover.events')}</TabsTrigger>
            <TabsTrigger value="organizers" className="flex-1">{t('discover.organizers')}</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-0">
            {/* Category Filters */}
            <div className="px-4 py-3 border-b overflow-x-auto">
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap capitalize"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Trending Events */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">{t('discover.trending')}</h2>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => refreshDaily()}
                >
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {filteredEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <Avatar className="h-16 w-16 rounded-lg">
                          <AvatarImage src={event.photoUrl} />
                          <AvatarFallback>{event.title[0]}</AvatarFallback>
                        </Avatar>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                          <Badge variant="secondary" className="flex-shrink-0">{event.category}</Badge>
                        </div>
                        
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {event.description}
                        </p>
                        
                        <div className="space-y-1 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{format(event.startDate, 'MMM d, yyyy')}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{event.attendees.length} {t('feed.attending')}</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCalendar(event);
                          }}
                        >
                          <CalendarPlus className="h-4 w-4" />
                          {t('discover.addToCalendar')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredEvents.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {organizersLoading ? 'Loading events...' : t('discover.noEvents')}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="organizers" className="mt-0">
            {/* Category Filters */}
            <div className="px-4 py-3 border-b overflow-x-auto">
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    className="cursor-pointer whitespace-nowrap capitalize"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-4">
              <h2 className="font-semibold text-lg mb-4">{t('discover.popular')}</h2>
              
              <div className="space-y-3">
                {filteredOrganizers.map((organizer) => (
                  <Card 
                    key={organizer.id} 
                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedOrganizer(organizer)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={organizer.avatar} />
                        <AvatarFallback>{organizer.name[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold">{organizer.name}</h3>
                            <Badge variant="secondary" className="text-xs capitalize mt-1">
                              {organizer.category}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant={isFollowing(organizer.id) ? 'outline' : 'default'}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFollow(organizer.id);
                            }}
                          >
                            {isFollowing(organizer.id) ? t('discover.following') : t('discover.follow')}
                          </Button>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">
                          {organizer.bio}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredOrganizers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    {organizersLoading ? 'Loading organizers...' : 'No organizers found'}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Event Details Dialog */}
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-md">
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

                  <p className="text-sm">{selectedEvent.description}</p>

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
                        <span>{selectedEvent.location}</span>
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

                  <Button
                    className="w-full gap-2"
                    onClick={() => {
                      handleAddToCalendar(selectedEvent);
                      setSelectedEvent(null);
                    }}
                  >
                    <CalendarPlus className="h-4 w-4" />
                    {t('discover.addToCalendar')}
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Organizer Profile Dialog */}
        <Dialog open={!!selectedOrganizer} onOpenChange={() => setSelectedOrganizer(null)}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            {selectedOrganizer && (
              <>
                <DialogHeader>
                  <DialogTitle>Organizer Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={selectedOrganizer.avatar} />
                      <AvatarFallback>{selectedOrganizer.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{selectedOrganizer.name}</h3>
                      <Badge variant="secondary" className="capitalize mt-1">
                        {selectedOrganizer.category}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm">{selectedOrganizer.bio}</p>

                  <Button
                    className="w-full"
                    variant={isFollowing(selectedOrganizer.id) ? 'outline' : 'default'}
                    onClick={() => handleFollow(selectedOrganizer.id)}
                  >
                    {isFollowing(selectedOrganizer.id) ? t('discover.following') : t('discover.follow')}
                  </Button>

                  <div>
                    <h4 className="font-semibold mb-3">Upcoming Events</h4>
                    <div className="space-y-2">
                      {organizerEvents.map((event) => (
                        <Card key={event.id} className="p-3">
                          <h5 className="font-medium text-sm mb-1">{event.title}</h5>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3" />
                            <span>{format(event.startDate, 'MMM d, h:mm a')}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => handleAddToCalendar(event)}
                          >
                            <CalendarPlus className="h-3 w-3" />
                            Add to Calendar
                          </Button>
                        </Card>
                      ))}
                      {organizerEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No upcoming events
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}