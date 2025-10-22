import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Settings, Lock, Globe, UserPlus, UserCheck, ArrowLeft } from 'lucide-react';

interface ProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  calendar_visibility: 'public' | 'private';
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
  is_admin?: boolean;
}

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { profile: currentProfile, updateProfile } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [calendarVisibility, setCalendarVisibility] = useState<'public' | 'private'>('public');

  const [followStatus, setFollowStatus] = useState<'none' | 'following' | 'pending'>('none');
  const [canViewCalendar, setCanViewCalendar] = useState(false);

  const isOwnProfile = currentProfile?.username === username;

  const checkCalendarAccess = async (profileData: ProfileData) => {
    if (!currentProfile) {
      setCanViewCalendar(profileData.calendar_visibility === 'public');
      return;
    }

    // Admin can view all calendars
    if (currentProfile.is_admin) {
      setCanViewCalendar(true);
      return;
    }

    // Public calendars are accessible to all
    if (profileData.calendar_visibility === 'public') {
      setCanViewCalendar(true);
      return;
    }

    // Private calendars require mutual follow
    const { data: mutualFollow } = await supabase
      .from('user_follows')
      .select('*')
      .or(`and(follower_id.eq.${currentProfile.id},following_id.eq.${profileData.id}),and(follower_id.eq.${profileData.id},following_id.eq.${currentProfile.id})`)
      .limit(2);

    setCanViewCalendar(mutualFollow && mutualFollow.length === 2);
  };

  const loadProfile = async () => {
    if (!username) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (error) throw error;

      const profileData: ProfileData = {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        avatar_url: data.avatar_url,
        bio: data.bio,
        calendar_visibility: (data.calendar_visibility === 'public' || data.calendar_visibility === 'private') 
          ? data.calendar_visibility 
          : 'public',
        email: data.email,
        phone: data.phone,
        created_at: data.created_at,
        updated_at: data.updated_at,
        is_admin: data.is_admin
      };

      setProfile(profileData);
      setCalendarVisibility(profileData.calendar_visibility);

      // Check calendar access
      await checkCalendarAccess(profileData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username]);

  const checkFollowStatus = async (targetId: string) => {
    if (!currentProfile) return;

    const { data } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', currentProfile.id)
      .eq('following_id', targetId)
      .single();

    if (data) {
      setFollowStatus('following');
    } else {
      const { data: requestData } = await supabase
        .from('follow_requests')
        .select('*')
        .eq('requester_id', currentProfile.id)
        .eq('target_id', targetId)
        .eq('status', 'pending')
        .single();

      setFollowStatus(requestData ? 'pending' : 'none');
    }
  };

  const handleFollow = async () => {
    if (!currentProfile || !profile) return;

    try {
      if (profile.calendar_visibility === 'public') {
        // Direct follow for public profiles
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: currentProfile.id,
            following_id: profile.id
          });

        if (error) throw error;
        setFollowStatus('following');
        toast({ title: 'Following', description: `You are now following @${username}` });
      } else {
        // Request for private profiles
        const { error } = await supabase
          .from('follow_requests')
          .insert({
            requester_id: currentProfile.id,
            target_id: profile.id,
            status: 'pending'
          });

        if (error) throw error;
        setFollowStatus('pending');
        toast({ title: 'Request Sent', description: 'Waiting for approval' });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleUnfollow = async () => {
    if (!currentProfile || !profile) return;

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', currentProfile.id)
        .eq('following_id', profile.id);

      if (error) throw error;
      setFollowStatus('none');
      toast({ title: 'Unfollowed', description: `You unfollowed @${username}` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSave = async () => {
    if (!isOwnProfile) return;

    setSaving(true);
    try {
      await updateProfile({
        display_name: displayName || undefined,
        bio: bio || undefined,
        avatar_url: avatarUrl || undefined,
        calendar_visibility: calendarVisibility
      });

      toast({
        title: 'Profile Updated',
        description: 'Your changes have been saved'
      });

      setEditing(false);
      await loadProfile();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">User not found</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">
                    {profile.display_name || `@${profile.username}`}
                  </CardTitle>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={profile.calendar_visibility === 'public' ? 'default' : 'secondary'}>
                      {profile.calendar_visibility === 'public' ? (
                        <><Globe className="h-3 w-3 mr-1" /> Public</>
                      ) : (
                        <><Lock className="h-3 w-3 mr-1" /> Private</>
                      )}
                    </Badge>
                    {profile.is_admin && (
                      <Badge variant="destructive">Admin</Badge>
                    )}
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(!editing)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {editing ? 'Cancel' : 'Edit'}
                </Button>
              )}

              {!isOwnProfile && currentProfile && (
                <div>
                  {followStatus === 'none' && (
                    <Button onClick={handleFollow} size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {profile.calendar_visibility === 'public' ? 'Follow' : 'Request Access'}
                    </Button>
                  )}
                  {followStatus === 'pending' && (
                    <Button variant="outline" size="sm" disabled>
                      Pending
                    </Button>
                  )}
                  {followStatus === 'following' && (
                    <Button variant="outline" size="sm" onClick={handleUnfollow}>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Following
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your display name"
                  />
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="avatarUrl">Avatar URL</Label>
                  <Input
                    id="avatarUrl"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="visibility">Calendar Visibility</Label>
                    <p className="text-sm text-muted-foreground">
                      {calendarVisibility === 'public' 
                        ? 'Anyone can view your calendar' 
                        : 'Only approved followers can view'}
                    </p>
                  </div>
                  <Switch
                    id="visibility"
                    checked={calendarVisibility === 'public'}
                    onCheckedChange={(checked) => 
                      setCalendarVisibility(checked ? 'public' : 'private')
                    }
                  />
                </div>

                <Button onClick={handleSave} className="w-full" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </>
            ) : (
              <>
                {profile.bio && (
                  <div>
                    <Label>Bio</Label>
                    <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>
                  </div>
                )}

                {canViewCalendar ? (
                  <Button
                    onClick={() => navigate(`/calendar?user=${profile.username}`)}
                    className="w-full"
                  >
                    View Calendar
                  </Button>
                ) : (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      This calendar is private. Follow to request access.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}