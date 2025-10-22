import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Globe, Lock, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  calendar_visibility: 'public' | 'private';
  is_admin?: boolean;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      
      setResults((data || []).map(profile => ({
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        calendar_visibility: (profile.calendar_visibility === 'public' || profile.calendar_visibility === 'private') 
          ? profile.calendar_visibility 
          : 'public'
      })));
    } catch (error: any) {
      toast({
        title: 'Search Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="sticky top-0 bg-white pt-4 pb-2 z-10">
          <h1 className="text-2xl font-bold mb-4">Search Users</h1>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by @username or name..."
              value={query}
              onChange={(e) => handleSearch()}
              className="pl-10"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No users found matching "{query}"
          </div>
        )}

        <div className="space-y-2">
          {results.map((user) => (
            <Card
              key={user.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => navigate(`/profile/${user.username}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">
                        {user.display_name || `@${user.username}`}
                      </p>
                      {user.is_admin && (
                        <Badge variant="destructive" className="text-xs">Admin</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">@{user.username}</p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {user.bio}
                      </p>
                    )}
                  </div>

                  <Badge variant={user.calendar_visibility === 'public' ? 'default' : 'secondary'}>
                    {user.calendar_visibility === 'public' ? (
                      <><Globe className="h-3 w-3 mr-1" /> Public</>
                    ) : (
                      <><Lock className="h-3 w-3 mr-1" /> Private</>
                    )}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}