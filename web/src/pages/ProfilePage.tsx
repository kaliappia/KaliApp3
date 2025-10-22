import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Bell, Calendar, Users, ChevronRight, X, Globe } from 'lucide-react';
import { useEvents } from '@/contexts/EventContext';
import { Organizer } from '@/types';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useOrganizers } from '@/contexts/OrganizerContext';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];

type Followed = Organizer & {
  id: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  category?: string;
  followers?: number;
  categories?: string[];
  username?: string;
};

export default function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { refreshDaily, seedData } = useOrganizers();
  const { toast } = useToast();
  const { events } = useEvents();

  const [notifications, setNotifications] = useState({
    eventUpdates: true,
    friendActivity: true,
    reminders: true,
    newFollowers: false,
  });
  const [showAllEvents, setShowAllEvents] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // ⬇️ Remplace les mocks par un vrai état + chargement Supabase
  const [followedOrganizers, setFollowedOrganizers] = useState<Followed[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Même logique pour mes events
  const myEvents = events; // EventContext est déjà scoping par user_id


  // Charge les follows depuis Supabase au mount / changement d’utilisateur
  useEffect(() => {
    const loadFollowing = async () => {
      if (!profile?.id) {
        setFollowedOrganizers([]);
        return;
      }
      setLoadingFollowing(true);
      try {
        // 1) ids suivis
        const { data: fData, error: fErr } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', profile.id);

        if (fErr) throw fErr;

        const ids = (fData ?? []).map((r) => r.following_id);
        if (ids.length === 0) {
          setFollowedOrganizers([]);
          return;
        }

        // 2) profils suivis
        const { data: pData, error: pErr } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, bio')
          .in('id', ids);

        if (pErr) throw pErr;

        // 3) map vers Organizer-like
        const list: Followed[] =
          (pData ?? []).map((p) => ({
            id: p.id,
            name: p.display_name || p.username,
            avatar: p.avatar_url || undefined,
            bio: p.bio || '',
            category: 'general',
            categories: ['general'],
            followers: 0,
            username: p.username,
            createdAt: new Date(),
          }));

        // Conserver l'ordre original des follows
        const order = new Map(ids.map((v, i) => [v, i]));
        list.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

        setFollowedOrganizers(list);
      } finally {
        setLoadingFollowing(false);
      }
    };

    loadFollowing();
  }, [profile?.id]);

  const handleUnfollow = async (organizerId: string) => {
    if (!profile?.id) return;

    // UI optimiste
    const prev = followedOrganizers;
    setFollowedOrganizers((curr) => curr.filter((o) => o.id !== organizerId));

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .match({ follower_id: profile.id, following_id: organizerId });

    if (error) {
      // rollback si besoin
      setFollowedOrganizers(prev);
      toast({
        title: t('error') || 'Error',
        description: error.message || 'Failed to unfollow',
        variant: 'destructive',
      });
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    toast({
      title: t('toast.languageChanged'),
      description: t('toast.languageChangedDesc'),
    });
  };

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  const handleRefreshEvents = async () => {
    try {
      await refreshDaily();
      toast({
        title: 'Events Refreshed',
        description: 'New events have been added to Explore',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh events',
        variant: 'destructive',
      });
    }
  };

  const handleSeedData = async () => {
    try {
      await seedData();
      toast({
        title: 'Data Seeded',
        description: 'Organizers and events have been created',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to seed data',
        variant: 'destructive',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
      });
      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout>
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground px-4 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-20 w-20 border-4 border-white">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback>
                {(profile?.username)?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile?.display_name || profile?.username}
              </h1>
              <p className="text-sm opacity-90">@{profile?.username || 'user'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate(`/profile/${profile?.username}`)}
            >
              <User className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{myEvents.length}</p>
              <p className="text-xs opacity-90">{t('profile.events')}</p>
            </div>
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setShowFollowing(true)}
            >
              <p className="text-2xl font-bold">{followedOrganizers.length}</p>
              <p className="text-xs opacity-90">{t('profile.following')}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs opacity-90">{t('profile.attended')}</p>
            </div>
          </div>
        </div>

        {/* My Events */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('profile.myEvents')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowAllEvents(true)}>
              {t('profile.viewAll')}
            </Button>
          </div>
          <div className="space-y-2">
            {myEvents.slice(0, 3).map((event) => (
              <Card key={event.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground">{event.category}</p>
                  </div>
                  <Badge variant="outline">{event.visibility}</Badge>
                </div>
              </Card>
            ))}
            {myEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('profile.noEventsCreated')}
              </p>
            )}
          </div>
        </div>

        {/* Following */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('profile.following')}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setShowFollowing(true)}>
              {t('profile.viewAll')}
            </Button>
          </div>
          <div className="space-y-2">
            {loadingFollowing ? (
              <p className="text-sm text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
            ) : followedOrganizers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('profile.notFollowing')}
              </p>
            ) : (
              followedOrganizers.slice(0, 2).map((organizer) => (
                <Card
                  key={organizer.id}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() =>
                    organizer.username && navigate(`/profile/${organizer.username}`)
                  }
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={organizer.avatar} />
                      <AvatarFallback>{organizer.name?.[0] ?? '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{organizer.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {(organizer.followers || 0).toLocaleString()} {t('discover.followers')}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Language Settings */}
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5" />
            {t('profile.language')}
          </h2>
          <div className="flex items-center justify-between">
            <Label className="flex-1">
              <div>
                <p className="font-medium">{t('profile.language')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.languageDesc')}</p>
              </div>
            </Label>
            <Select value={i18n.language} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue>
                  <span className="flex items-center gap-2">
                    <span>{currentLanguage.flag}</span>
                    <span>{currentLanguage.name}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5" />
            {t('profile.notifications')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="event-updates" className="flex-1">
                <div>
                  <p className="font-medium">{t('profile.eventUpdates')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.eventUpdatesDesc')}</p>
                </div>
              </Label>
              <Switch
                id="event-updates"
                checked={notifications.eventUpdates}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, eventUpdates: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="friend-activity" className="flex-1">
                <div>
                  <p className="font-medium">{t('profile.friendActivity')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.friendActivityDesc')}</p>
                </div>
              </Label>
              <Switch
                id="friend-activity"
                checked={notifications.friendActivity}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, friendActivity: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="reminders" className="flex-1">
                <div>
                  <p className="font-medium">{t('profile.reminders')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.remindersDesc')}</p>
                </div>
              </Label>
              <Switch
                id="reminders"
                checked={notifications.reminders}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, reminders: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="new-followers" className="flex-1">
                <div>
                  <p className="font-medium">{t('profile.newFollowers')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.newFollowersDesc')}</p>
                </div>
              </Label>
              <Switch
                id="new-followers"
                checked={notifications.newFollowers}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, newFollowers: checked })
                }
              />
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <Card className="p-4">
          <h2 className="font-semibold text-lg mb-4">Admin Actions</h2>
          <div className="space-y-2">
            <Button variant="outline" className="w-full" onClick={handleSeedData}>
              Seed Organizers & Events
            </Button>
            <Button variant="outline" className="w-full" onClick={handleRefreshEvents}>
              Refresh Daily Events
            </Button>
          </div>
        </Card>

        {/* Account Actions */}
        <div className="p-4 space-y-2">

          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {t('profile.logout') || 'Logout'}
          </Button>
        </div>

        {/* Settings */}
        <div className="p-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <Settings className="h-5 w-5" />
            {t('profile.settings')}
            <ChevronRight className="h-5 w-5 ml-auto" />
          </Button>
        </div>

        {/* All Events Dialog */}
        <Dialog open={showAllEvents} onOpenChange={setShowAllEvents}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('profile.myEvents')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {myEvents.map((event) => (
                <Card key={event.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">{event.title}</h3>
                      <p className="text-xs text-muted-foreground">{event.category}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.startDate.toLocaleDateString(i18n.language)}
                      </p>
                    </div>
                    <Badge variant="outline">{event.visibility}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Following Dialog */}
        <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('profile.following')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {loadingFollowing ? (
                <p className="text-sm text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
              ) : (
                followedOrganizers.map((organizer) => (
                  <Card key={organizer.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={organizer.avatar} />
                        <AvatarFallback>{organizer.name?.[0] ?? '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold">{organizer.name}</h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {(organizer.followers || 0).toLocaleString()} {t('discover.followers')}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">{organizer.bio}</p>
                        <div className="flex flex-wrap gap-1">
                          {(organizer.categories || [organizer.category]).map((category) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnfollow(organizer.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}