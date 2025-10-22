import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import { Event, CalendarView } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus, ChevronLeft, ChevronRight, MapPin, Clock, Users, Car, Navigation } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EventForm from '@/components/EventForm';
import EventEditForm from '@/components/EventEditForm';
import { useEvents } from '@/contexts/EventContext';
import { useTranslation } from 'react-i18next';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function CalendarPage() {
  const { t, i18n } = useTranslation();
  const { events, deleteEvent } = useEvents();
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const weekDays = [
    t('days.sun'), t('days.mon'), t('days.tue'), 
    t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat')
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(event.startDate, day));
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handlePrevDay = () => setCurrentDate(addDays(currentDate, -1));
  const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));

  const handlePrev = () => {
    if (view === 'month') handlePrevMonth();
    else if (view === 'week') handlePrevWeek();
    else handlePrevDay();
  };

  const handleNext = () => {
    if (view === 'month') handleNextMonth();
    else if (view === 'week') handleNextWeek();
    else handleNextDay();
  };

  const getDateRangeText = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    setIsDeleting(true);
    try {
      await deleteEvent(selectedEvent.id);
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClose = () => {
    setIsEditMode(false);
    setSelectedEvent(null);
  };

  function getDestinationParts(event: Event) {
    const lat = typeof event.lat === 'number' ? event.lat : undefined;
    const lng = typeof event.lng === 'number' ? event.lng : undefined;
    const address = (event.formattedAddress || event.location || '').trim();
    const label =
      (event.placeName || event.title || address || 'Destination').trim();
  
    return { lat, lng, address, label };
  }

  function openUber(event: Event) {
    const lat = event.lat;
    const lng = event.lng;
    const address = event.formattedAddress || event.location || '';
    const name = event.placeName || event.title;

    if (lat && lng) {
      // Use coordinates - most reliable
      const url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(name)}`;
      window.open(url, '_blank');
    } else if (address) {
      // Fallback to address
      const url = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(address)}`;
      window.open(url, '_blank');
    } else {
      console.warn('No destination available for Uber');
    }
  }

  function openBolt(event: Event) {
    const lat = event.lat;
    const lng = event.lng;
    const address = event.formattedAddress || event.location || '';

    if (lat && lng) {
      // Try app deep link first
      const appUrl = `bolt://ride?destination_lat=${lat}&destination_lng=${lng}`;
      window.location.href = appUrl;
      
      // Fallback to web after delay
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
    } else {
      console.warn('No destination available for Bolt');
    }
  }

  const openAppleMaps = (event: Event) => {
    if (event.lat && event.lng) {
      // Use coordinates for better accuracy
      const mapsUrl = `http://maps.apple.com/?daddr=${event.lat},${event.lng}&dirflg=d`;
      window.open(mapsUrl, '_blank');
    } else if (event.formattedAddress || event.location) {
      // Fallback to address
      const address = encodeURIComponent(event.formattedAddress || event.location || '');
      const mapsUrl = `http://maps.apple.com/?daddr=${address}&dirflg=d`;
      window.open(mapsUrl, '_blank');
    }
  };

  const hasValidLocation = (event: Event) => {
    return (event.lat && event.lng) || event.formattedAddress || event.location;
  };

  return (
    <>
      <div className="bg-white min-h-screen pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 z-10">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold">{t('calendar.title')}</h1>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('calendar.newEvent')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('calendar.createEvent')}</DialogTitle>
                </DialogHeader>
                <EventForm onClose={() => setIsCreateDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* View Selector */}
          <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
            <TabsList className="w-full">
              <TabsTrigger value="day" className="flex-1">{t('calendar.day')}</TabsTrigger>
              <TabsTrigger value="week" className="flex-1">{t('calendar.week')}</TabsTrigger>
              <TabsTrigger value="month" className="flex-1">{t('calendar.month')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <Button variant="ghost" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold">
            {getDateRangeText()}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNext}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Month View */}
        {view === 'month' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentDay = isToday(day);

                return (
                  <Card
                    key={day.toISOString()}
                    className={`min-h-[80px] p-2 cursor-pointer hover:shadow-md transition-shadow ${
                      isCurrentDay ? 'border-primary border-2' : ''
                    }`}
                  >
                    <div className="flex flex-col h-full">
                      <span
                        className={`text-sm font-medium mb-1 ${
                          isCurrentDay
                            ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                            : ''
                        }`}
                      >
                        {format(day, 'd')}
                      </span>
                      <div className="flex-1 space-y-1">
                        {dayEvents.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded truncate cursor-pointer hover:bg-primary/20"
                            onClick={() => setSelectedEvent(event)}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Week View */}
        {view === 'week' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {daysInWeek.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentDay = isToday(day);

                return (
                  <Card key={day.toISOString()} className={`p-3 ${isCurrentDay ? 'border-primary border-2' : ''}`}>
                    <div className="text-center mb-3">
                      <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className={`text-lg font-semibold ${isCurrentDay ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs bg-primary/10 text-primary p-2 rounded cursor-pointer hover:bg-primary/20"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="font-semibold truncate">{event.title}</div>
                          <div className="text-[10px]">{format(event.startDate, 'h:mm a')}</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="p-4">
            <div className="space-y-3">
              {getEventsForDay(currentDate).length > 0 ? (
                getEventsForDay(currentDate).map((event) => (
                  <Card 
                    key={event.id} 
                    className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-primary/10 text-primary px-3 py-2 rounded font-semibold">
                        {format(event.startDate, 'h:mm a')}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{event.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {t('calendar.noEvents')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Event Details Dialog */}
        <Dialog open={!!selectedEvent && !isEditMode} onOpenChange={() => setSelectedEvent(null)}>
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

                  <div className="space-y-2">
                    <p className="text-sm">{selectedEvent.description}</p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
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

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setIsEditMode(true)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="flex-1"
                      onClick={() => setIsDeleteDialogOpen(true)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={isEditMode} onOpenChange={handleEditClose}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <EventEditForm event={selectedEvent} onClose={handleEditClose} />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this event? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteEvent}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <BottomNav />
    </>
  );
}