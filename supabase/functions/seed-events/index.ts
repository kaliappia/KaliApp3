import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Organizer {
  name: string;
  category: 'sports' | 'music' | 'nightlife' | 'art' | 'talks';
  bio: string;
  avatar_url: string;
}

const SEED_ORGANIZERS: Organizer[] = [
  { name: '8lines Running Club', category: 'sports', bio: 'Weekly sunrise runs through the city. All paces welcome.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8lines' },
  { name: 'Left Bank Cyclists', category: 'sports', bio: 'Exploring scenic routes on two wheels every weekend.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=leftbank' },
  { name: 'Urban Football League', category: 'sports', bio: 'Competitive 5v5 matches in the heart of the city.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=football' },
  { name: 'Basalt Records', category: 'music', bio: 'Underground electronic music label hosting intimate showcases.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=basalt' },
  { name: 'Canopy Sessions', category: 'music', bio: 'Acoustic performances in unique outdoor settings.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=canopy' },
  { name: 'Jazz Collective', category: 'music', bio: 'Live jazz every Thursday featuring local and touring artists.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jazz' },
  { name: 'Midnight Society', category: 'nightlife', bio: 'Curated late-night experiences for the nocturnal crowd.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=midnight' },
  { name: 'Neon Room', category: 'nightlife', bio: 'Techno and house music in an immersive light installation.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=neon' },
  { name: 'Velvet Lounge', category: 'nightlife', bio: 'Sophisticated cocktails and deep house vibes.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=velvet' },
  { name: 'Atelier 37', category: 'art', bio: 'Contemporary art gallery showcasing emerging artists.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=atelier' },
  { name: 'Street Canvas', category: 'art', bio: 'Urban art collective transforming public spaces.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=canvas' },
  { name: 'Gallery Noir', category: 'art', bio: 'Dark and provocative exhibitions pushing boundaries.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=noir' },
  { name: 'Urban Talks Paris', category: 'talks', bio: 'Thought-provoking discussions on city life and culture.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=urbantalks' },
  { name: 'Tech & Coffee', category: 'talks', bio: 'Casual meetups discussing the latest in technology.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=techcoffee' },
  { name: 'Founders Forum', category: 'talks', bio: 'Startup founders sharing lessons and building community.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=founders' },
];

const EVENT_TEMPLATES = {
  sports: [
    { title: 'Sunrise Run 10K', desc: 'Start your day with an energizing group run through scenic routes.' },
    { title: 'Weekend Cycling Tour', desc: 'Explore the countryside on a guided 50km cycling adventure.' },
    { title: 'Football Match Night', desc: 'Competitive 5v5 match under the lights. All skill levels welcome.' },
    { title: 'Morning Yoga in the Park', desc: 'Outdoor yoga session followed by healthy breakfast.' },
  ],
  music: [
    { title: 'Late Night House Set', desc: 'Deep house and techno from local DJs until sunrise.' },
    { title: 'Acoustic Evening', desc: 'Intimate acoustic performances in a cozy setting.' },
    { title: 'Jazz Night', desc: 'Live jazz quartet featuring classic and contemporary pieces.' },
    { title: 'Electronic Showcase', desc: 'Experimental electronic music from emerging producers.' },
  ],
  nightlife: [
    { title: 'Midnight Dance Party', desc: 'Dance until dawn with resident DJs spinning the best tracks.' },
    { title: 'Cocktail Masterclass', desc: 'Learn to craft signature cocktails from expert mixologists.' },
    { title: 'Rooftop Sunset Session', desc: 'Sunset drinks with panoramic city views and chill beats.' },
    { title: 'Underground Rave', desc: 'Secret location revealed 24h before. Bring your energy.' },
  ],
  art: [
    { title: 'Gallery Vernissage', desc: 'Opening night for our latest contemporary art exhibition.' },
    { title: 'Street Art Walking Tour', desc: 'Discover hidden murals and urban art installations.' },
    { title: 'Artist Talk & Workshop', desc: 'Meet the artist and participate in a hands-on workshop.' },
    { title: 'Photography Exhibition', desc: 'Stunning photography exploring urban landscapes.' },
  ],
  talks: [
    { title: 'Streetwear Drop Talk', desc: 'Discussion on the evolution of streetwear culture and fashion.' },
    { title: 'Startup Pitch Night', desc: 'Early-stage founders pitch their ideas to the community.' },
    { title: 'Design Thinking Workshop', desc: 'Interactive session on human-centered design principles.' },
    { title: 'Future of Cities Panel', desc: 'Urban planners discuss sustainable city development.' },
  ],
};

const SAMPLE_PLACES = [
  { name: 'Central Park', address: '123 Park Avenue, City Center', lat: 48.8566, lng: 2.3522 },
  { name: 'The Warehouse', address: '45 Industrial Street, East District', lat: 48.8606, lng: 2.3376 },
  { name: 'Riverside Cafe', address: '78 River Road, Waterfront', lat: 48.8584, lng: 2.2945 },
  { name: 'Urban Gallery', address: '12 Art Lane, Cultural Quarter', lat: 48.8629, lng: 2.3469 },
  { name: 'Tech Hub', address: '90 Innovation Drive, Business Park', lat: 48.8499, lng: 2.3469 },
  { name: 'Rooftop Lounge', address: '56 Sky Tower, Downtown', lat: 48.8738, lng: 2.2950 },
  { name: 'Community Center', address: '34 Main Street, Old Town', lat: 48.8534, lng: 2.3488 },
  { name: 'Sports Complex', address: '88 Athletic Way, Sports District', lat: 48.8467, lng: 2.3770 },
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomDate(daysFromNow: number, maxDaysAhead: number): Date {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  const end = new Date();
  end.setDate(end.getDate() + maxDaysAhead);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomTime(): { hour: number; minute: number } {
  const hour = Math.floor(Math.random() * 14) + 8; // 8am to 10pm
  const minute = Math.random() > 0.5 ? 0 : 30;
  return { hour, minute };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    if (action === 'seed') {
      // Check if organizers already exist
      const { data: existingOrganizers } = await supabase
        .from('organizers')
        .select('id')
        .limit(1);

      if (existingOrganizers && existingOrganizers.length > 0) {
        return new Response(
          JSON.stringify({ message: 'Organizers already seeded' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert organizers
      const { data: organizers, error: orgError } = await supabase
        .from('organizers')
        .insert(SEED_ORGANIZERS)
        .select();

      if (orgError) throw orgError;

      // Create 3-6 events for each organizer
      const events = [];
      for (const organizer of organizers!) {
        const numEvents = Math.floor(Math.random() * 4) + 3; // 3-6 events
        const templates = EVENT_TEMPLATES[organizer.category as keyof typeof EVENT_TEMPLATES];

        for (let i = 0; i < numEvents; i++) {
          const template = getRandomElement(templates);
          const place = getRandomElement(SAMPLE_PLACES);
          const startDate = getRandomDate(1, 30);
          const startTime = getRandomTime();
          startDate.setHours(startTime.hour, startTime.minute, 0, 0);
          
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 3) + 1); // 1-3 hours

          events.push({
            organizer_id: organizer.id,
            title: template.title,
            description: template.desc,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            place_name: place.name,
            formatted_address: place.address,
            lat: place.lat,
            lng: place.lng,
            photo_url: `https://images.unsplash.com/photo-${1492684223066 + i}?w=800&q=80`,
            category: organizer.category,
            organizer_name: organizer.name,
            organizer_avatar: organizer.avatar_url,
            organizer_id: 'system',
            visibility: 'public',
            attendees: []
          });
        }
      }

      const { error: eventsError } = await supabase
        .from('events')
        .insert(events);

      if (eventsError) throw eventsError;

      return new Response(
        JSON.stringify({ 
          message: 'Seed completed', 
          organizers: organizers!.length, 
          events: events.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'daily_refresh') {
      // Get all organizers
      const { data: organizers } = await supabase
        .from('organizers')
        .select('*');

      if (!organizers || organizers.length === 0) {
        return new Response(
          JSON.stringify({ message: 'No organizers found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create 2-5 new events
      const numNewEvents = Math.floor(Math.random() * 4) + 2;
      const events = [];

      for (let i = 0; i < numNewEvents; i++) {
        const organizer = getRandomElement(organizers);
        const templates = EVENT_TEMPLATES[organizer.category as keyof typeof EVENT_TEMPLATES];
        const template = getRandomElement(templates);
        const place = getRandomElement(SAMPLE_PLACES);
        
        const startDate = getRandomDate(1, 30);
        const startTime = getRandomTime();
        startDate.setHours(startTime.hour, startTime.minute, 0, 0);
        
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + Math.floor(Math.random() * 3) + 1);

        // Check for duplicates
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('organizer_id', organizer.id)
          .eq('title', template.title)
          .gte('start_date', new Date().toISOString())
          .limit(1);

        if (existing && existing.length > 0) continue;

        events.push({
          organizer_id: organizer.id,
          title: template.title,
          description: template.desc,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          place_name: place.name,
          formatted_address: place.address,
          lat: place.lat,
          lng: place.lng,
          photo_url: `https://images.unsplash.com/photo-${Date.now() + i}?w=800&q=80`,
          category: organizer.category,
          organizer_name: organizer.name,
          organizer_avatar: organizer.avatar_url,
          organizer_id: 'system',
          visibility: 'public',
          attendees: []
        });
      }

      if (events.length > 0) {
        await supabase.from('events').insert(events);
      }

      // Delete events older than 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      await supabase
        .from('events')
        .delete()
        .lt('end_date', sevenDaysAgo.toISOString());

      return new Response(
        JSON.stringify({ 
          message: 'Daily refresh completed', 
          newEvents: events.length 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});