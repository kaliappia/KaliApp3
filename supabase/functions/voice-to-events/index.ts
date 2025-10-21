import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_PLACES_API_KEY = 'AIzaSyBmiA3che_nAi_wbU4Mkq1lXckKC439S5Y';

interface VerifiedLocation {
  placeId: string;
  placeName?: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  city?: string;
  countryCode?: string;
  verified: boolean;
  candidates?: Array<{
    placeId: string;
    name: string;
    formattedAddress: string;
  }>;
}

async function verifyLocationWithGooglePlaces(
  locationText: string,
  userLat?: number,
  userLng?: number
): Promise<VerifiedLocation> {
  if (!locationText || locationText.trim() === '') {
    return {
      placeId: '',
      formattedAddress: '',
      lat: 0,
      lng: 0,
      verified: false
    };
  }

  try {
    // Build request URL with location bias if available
    let url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(locationText)}&inputtype=textquery&fields=place_id,name,formatted_address,geometry&key=${GOOGLE_PLACES_API_KEY}`;
    
    if (userLat && userLng) {
      url += `&locationbias=circle:50000@${userLat},${userLng}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      const topCandidate = data.candidates[0];
      
      // Get detailed place information
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${topCandidate.place_id}&fields=place_id,name,formatted_address,geometry,address_components&key=${GOOGLE_PLACES_API_KEY}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();

      if (detailsData.status === 'OK' && detailsData.result) {
        const place = detailsData.result;
        
        const city = place.address_components?.find((c: any) => 
          c.types.includes('locality') || c.types.includes('administrative_area_level_1')
        )?.long_name;
        
        const countryCode = place.address_components?.find((c: any) => 
          c.types.includes('country')
        )?.short_name;

        // Prepare candidates if multiple matches
        const candidates = data.candidates.slice(0, 3).map((c: any) => ({
          placeId: c.place_id,
          name: c.name || '',
          formattedAddress: c.formatted_address || ''
        }));

        return {
          placeId: place.place_id,
          placeName: place.name,
          formattedAddress: place.formatted_address,
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          city,
          countryCode,
          verified: true,
          candidates: data.candidates.length > 1 ? candidates : undefined
        };
      }
    }

    // No match found - return unverified
    return {
      placeId: '',
      formattedAddress: locationText,
      lat: 0,
      lng: 0,
      verified: false
    };
  } catch (error) {
    console.error('Google Places verification error:', error);
    // Return unverified on error
    return {
      placeId: '',
      formattedAddress: locationText,
      lat: 0,
      lng: 0,
      verified: false
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    const { audioBase64, language = 'en', userLat, userLng } = await req.json();

    if (!audioBase64) {
      throw new Error('Audio data is required');
    }

    // Step 1: Transcribe audio using Whisper
    const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });
    
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    if (language && language !== 'auto') {
      formData.append('language', language);
    }

    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Whisper API error: ${error}`);
    }

    const { text: transcription } = await transcriptionResponse.json();

    // Step 2: Extract events using GPT-4o
    const systemPrompt = `You are an AI assistant that extracts calendar events from natural language text in ANY language.

Extract ALL events mentioned in the text, even if there are multiple events across different days or weeks.

CRITICAL RULES:
1. Create an event even if information is incomplete or partial
2. If time is missing, use reasonable defaults based on context
3. If date is missing but day name is mentioned, calculate the next occurrence
4. If location is just a place name (e.g., "Hôtel du Louvre"), keep it as-is
5. Always create the event - never skip it due to missing information

For each event, extract:
- title: A concise event title (REQUIRED - create from context if needed)
- description: Additional details about the event (can be empty)
- date: ISO date string (YYYY-MM-DD). Calculate from day names
- startTime: 24-hour format (HH:MM). Defaults: breakfast=08:00, lunch=12:00, dinner=19:00, meeting=14:00, morning=09:00, afternoon=14:00, evening=18:00
- endTime: 24-hour format (HH:MM). Default to 1-2 hours after start
- location: Place name or address if mentioned (can be empty)
- category: One of: Music, Sports, Technology, Food, Work, Other

Return ONLY a valid JSON object with an "events" array. No markdown, no code blocks.`;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Today is ${todayStr} (${dayOfWeek}). Extract ALL events from this transcription:\n\n"${transcription}"` }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      }),
    });

    if (!gptResponse.ok) {
      const error = await gptResponse.text();
      throw new Error(`GPT API error: ${error}`);
    }

    const gptData = await gptResponse.json();
    const eventsText = gptData.choices[0].message.content;
    
    let events = [];
    try {
      const parsed = JSON.parse(eventsText);
      events = parsed.events || [];
      
      // Ensure all events have required fields
      events = events.map((event: any) => ({
        title: event.title || 'Untitled Event',
        description: event.description || '',
        date: event.date || todayStr,
        startTime: event.startTime || '09:00',
        endTime: event.endTime || '10:00',
        location: event.location || '',
        category: event.category || 'Other'
      }));
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError);
      events = [];
    }

    // Step 3: Verify all locations with Google Places
    const eventsWithVerifiedLocations = await Promise.all(
      events.map(async (event: any) => {
        if (event.location && event.location.trim() !== '') {
          const verifiedLocation = await verifyLocationWithGooglePlaces(
            event.location,
            userLat,
            userLng
          );
          
          return {
            ...event,
            ...verifiedLocation,
            originalLocation: event.location
          };
        }
        return {
          ...event,
          verified: true,
          placeId: '',
          formattedAddress: '',
          lat: 0,
          lng: 0
        };
      })
    );

    return new Response(
      JSON.stringify({
        transcription,
        events: eventsWithVerifiedLocations,
        success: events.length > 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        transcription: '',
        events: [],
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});