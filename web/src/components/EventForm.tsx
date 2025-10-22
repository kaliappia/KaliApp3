import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mic, MicOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useEvents } from '@/contexts/EventContext';
import { useTranslation } from 'react-i18next';
import AddressAutocomplete, { AddressData } from '@/components/AddressAutocomplete';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { AlertTriangle, MapPin as MapPinIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

interface EventFormProps {
  onClose: () => void;
}

export default function EventForm({ onClose }: EventFormProps) {
  const { profile } = useAuth(); // Remplacez currentUser par profile
  const { t } = useTranslation();
  const { addEvent } = useEvents();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [extractedEvents, setExtractedEvents] = useState<any[]>([]);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCandidates, setSelectedCandidates] = useState<Record<number, number>>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null); // ⬅️ AJOUT
  const audioChunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string | undefined>(undefined);



  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.state !== 'inactive' &&
          mediaRecorderRef.current?.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
      } catch (error) {
        console.error('Error cleaning up media recorder:', error);
      }
    };
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    visibility: 'public',
    category: 'Other'
  });

  const handleVoiceToggle = async () => {
    console.log(`J'essaie de ${isRecording ? 'arrêter' : 'démarrer'} — isRecording=${isRecording}`);
    if (isRecording) {
      console.log('🛑 Stop clicked (print)');
      await stopRecording();
    } else {
      await startRecording();
    }
    // Note : setState est async, cette valeur peut ne pas refléter l'état final immédiatement
    console.log(`Après toggle — isRecording=${isRecording}`);
  };

  async function startRecording() {
    try {
      setError(null);
      setSuccessMessage(null);
      setTranscription('');
      setExtractedEvents([]);
      audioChunksRef.current = [];

      // Choisir un mime supporté par le navigateur
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
      ];
      const supported = candidates.find((t) =>
        (window as any).MediaRecorder?.isTypeSupported?.(t)
      );
      const options = supported ? { mimeType: supported } : undefined;
      mimeTypeRef.current = supported; // mémorise le type réellement utilisé
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mr = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };

      mr.onerror = (ev) => {
        console.error('MediaRecorder error:', ev);
        setError('Recording error occurred');
      };

      // On ne lance pas processAudio ici, on le fera dans stopRecording
      mr.onstop = () => {
        try {
          streamRef.current?.getTracks().forEach((t) => t.stop());
        } catch { }
      };

      // Timeslice: ramasse des chunks régulièrement
      mr.start(1000);
      console.log('🎙️ MediaRecorder started mon djo');
      setIsRecording(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
      toast({
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  }

  async function stopRecording() {
    const mr = mediaRecorderRef.current;

    if (!mr) {
      setIsRecording(false);
      return;
    }

    // Promesse qui se résout à l'arrêt (avec timeout de secours)
    const stopped = new Promise<void>((resolve) => {
      const prev = mr.onstop;
      mr.onstop = (e: Event) => {
        // stop physique des tracks
        try {
          streamRef.current?.getTracks().forEach((t) => t.stop());
        } catch { }
        if (prev) prev.call(mr, e as any);
        resolve();
      };
    });

    try {
      // Demander le dernier chunk avant d'arrêter
      try {
        mr.requestData();
      } catch { }
      if (mr.state !== 'inactive') mr.stop();
      console.log('🧹 MediaRecorder stopping…');
    } catch (e) {
      console.warn('mediaRecorder.stop threw:', e);
      try {
        streamRef.current?.getTracks().forEach((t) => t.stop());
      } catch { }
    }

    // garde-fou si onstop ne se déclenche pas
    const timeout = new Promise<void>((res) => setTimeout(res, 2000));
    await Promise.race([stopped, timeout]);

    setIsRecording(false);

    // Traite l'audio après avoir bien tout stoppé
    await processAudioSafe();

    // cleanup
    mediaRecorderRef.current = null;
    streamRef.current = null;
  }

  async function processAudioSafe() {
    try {
      await processAudio(); // ta fonction existante, inchangée
    } catch (e) {
      console.error('processAudio error:', e);
      setError('Audio processing failed.');
    }
  }

  const processAudio = async () => {
    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (!audioChunksRef.current.length) {
        throw new Error('No audio captured.');
      }

      const inferredType =
        mimeTypeRef.current ||
        audioChunksRef.current[0]?.type ||
        'audio/webm';

      const audioBlob = new Blob(audioChunksRef.current, { type: inferredType });
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      await new Promise((resolve) => {
        reader.onloadend = resolve;
      });

      const base64Audio = (reader.result as string).split(',')[1];
      const userLanguage = navigator.language.split('-')[0];

      // Get user location for better place verification
      let userLat, userLng;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        userLat = position.coords.latitude;
        userLng = position.coords.longitude;
      } catch {
        // Continue without location bias
      }

      // Call edge function with location
      const { data, error: functionError } = await supabase.functions.invoke(
        'supabase-functions-voice-to-events',
        {
          body: {
            audioBase64: base64Audio,
            language: userLanguage,
            userLat,
            userLng
          }
        }
      );

      if (functionError) throw functionError;

      setTranscription(data.transcription);
      setExtractedEvents(data.events || []);

      if (data.events && data.events.length > 0) {
        const eventCount = data.events.length;
        const verifiedCount = data.events.filter((e: any) => e.verified).length;
        const unverifiedCount = eventCount - verifiedCount;
        
        let message = `✅ ${eventCount} event${eventCount > 1 ? 's' : ''} detected`;
        if (verifiedCount > 0) {
          message += ` • ${verifiedCount} location${verifiedCount > 1 ? 's' : ''} verified`;
        }
        if (unverifiedCount > 0) {
          message += ` • ${unverifiedCount} unverified`;
        }
        
        setSuccessMessage(message);
      } else {
        setError('No events detected. Please try again with more details like dates, times, or activities.');
      }
    } catch (err: any) {
      console.error('Error processing audio:', err);
      const errorMsg = err.message || 'Failed to process voice recording. Please try again.';
      setError(errorMsg);
      toast({
        title: 'Processing Failed',
        description: errorMsg,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectCandidate = (eventIndex: number, candidateIndex: number, candidate: any) => {
    setSelectedCandidates(prev => ({ ...prev, [eventIndex]: candidateIndex }));
    
    // Update the event with selected candidate
    setExtractedEvents(prev => {
      const updated = [...prev];
      updated[eventIndex] = {
        ...updated[eventIndex],
        placeId: candidate.placeId,
        placeName: candidate.name,
        formattedAddress: candidate.formattedAddress,
        verified: true,
        candidates: undefined
      };
      return updated;
    });
  };

  const handleCreateAllEvents = async () => {
    if (extractedEvents.length === 0) return;

    // Vérifier que le profil existe
    if (!profile) {
      setError('User profile not found. Please log in again.');
      toast({
        title: 'Error',
        description: 'User profile not found. Please log in again.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      let createdCount = 0;

      for (const event of extractedEvents) {
        try {
          const [year, month, day] = event.date.split('-').map(Number);
          const [startHour, startMinute] = event.startTime.split(':').map(Number);
          const [endHour, endMinute] = event.endTime.split(':').map(Number);

          const startDate = new Date(year, month - 1, day, startHour, startMinute);
          const endDate = new Date(year, month - 1, day, endHour, endMinute);

          await addEvent({
            title: event.title,
            description: event.description,
            startDate,
            endDate,
            location: event.formattedAddress || event.originalLocation || '',
            placeId: event.placeId || undefined,
            placeName: event.placeName || undefined,
            formattedAddress: event.formattedAddress || undefined,
            lat: event.lat || undefined,
            lng: event.lng || undefined,
            city: event.city || undefined,
            countryCode: event.countryCode || undefined,
            organizerId: profile.id,
            organizerName: profile.display_name || profile.username,
            organizerAvatar: profile.avatar_url || '',
            visibility: 'public',
            attendees: [profile.id],
            comments: [],
            category: event.category
          });

          createdCount++;
        } catch (eventError) {
          console.error('Error creating individual event:', eventError);
        }
      }

      toast({
        title: '✅ Events Created',
        description: `${createdCount} event${createdCount > 1 ? 's' : ''} added to your calendar`,
        duration: 3000
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error creating events:', err);
      setError('Failed to create some events. Please check your calendar and try again if needed.');
      toast({
        title: 'Error',
        description: 'Failed to create events. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressData) return;
  
    if (!formData.date || !formData.startTime || !formData.endTime) {
      setError('Veuillez renseigner la date et les heures.');
      return;
    }
  
    // Dates
    const [year, month, day] = formData.date.split('-').map(Number);
    const [startHour, startMinute] = formData.startTime.split(':').map(Number);
    const [endHour, endMinute] = formData.endTime.split(':').map(Number);
    const startDate = new Date(year, month - 1, day, startHour, startMinute);
    const endDate = new Date(year, month - 1, day, endHour, endMinute);
  
    // Helpers : cast en number pour éviter les strings
    const toNum = (v: any) => (v === null || v === undefined ? undefined : Number(v));
  
    // Alignement avec "voix"
    const formattedAddress = addressData.formattedAddress || undefined;
    const placeName        = addressData.placeName || undefined;
    const placeId          = addressData.placeId || undefined;
    const lat              = toNum(addressData.lat);
    const lng              = toNum(addressData.lng);
    const city             = addressData.city || undefined;
    const countryCode      = addressData.countryCode || undefined;
  
    // Même fallback que le flux "voix"
    const location = formattedAddress || placeName || '';
  
    // On fournit aussi originalLocation (utilisé côté voix)

    await addEvent({
      title: formData.title,
      description: formData.description,
      startDate,
      endDate,
      // champs d'adresse harmonisés
      location,
      formattedAddress,
      placeName,
      placeId,
      lat,
      lng,
      city,
      countryCode,
      organizerId: profile.id,
      organizerName: profile.display_name || profile.username,
      organizerAvatar: profile.avatar_url || '',
      visibility: formData.visibility as 'private' | 'public' | 'friends',
      attendees: [profile.id],
      comments: [],
      category: formData.category,
    });
  
    onClose();
  };

  return (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">{t('eventForm.manual')}</TabsTrigger>
        <TabsTrigger value="voice">{t('eventForm.voice')}</TabsTrigger>
      </TabsList>

      <TabsContent value="manual" className="space-y-4 mt-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('eventForm.title')}</Label>
            <Input
              id="title"
              placeholder={t('eventForm.titlePlaceholder')}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('eventForm.description')}</Label>
            <Textarea
              id="description"
              placeholder={t('eventForm.descriptionPlaceholder')}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t('eventForm.date')}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('eventForm.category')}</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Music">{t('categories.music')}</SelectItem>
                  <SelectItem value="Sports">{t('categories.sports')}</SelectItem>
                  <SelectItem value="Technology">{t('categories.technology')}</SelectItem>
                  <SelectItem value="Food">{t('categories.food')}</SelectItem>
                  <SelectItem value="Work">{t('categories.work')}</SelectItem>
                  <SelectItem value="Other">{t('categories.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('eventForm.startTime')}</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{t('eventForm.endTime')}</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              />
            </div>
          </div>

          <AddressAutocomplete
            value={addressData}
            onChange={setAddressData}
            onValidationChange={setIsAddressValid}
            required
          />

          <div className="space-y-2">
            <Label htmlFor="visibility">{t('eventForm.visibility')}</Label>
            <Select value={formData.visibility} onValueChange={(v) => setFormData({ ...formData, visibility: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">{t('eventForm.private')}</SelectItem>
                <SelectItem value="friends">{t('eventForm.friends')}</SelectItem>
                <SelectItem value="public">{t('eventForm.public')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('eventForm.cancel')}
            </Button>
            <Button type="submit" className="flex-1" disabled={!isAddressValid}>
              {t('eventForm.create')}
            </Button>
          </div>
        </form>
      </TabsContent>

      <TabsContent value="voice" className="space-y-4 mt-4">
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className={`relative ${isRecording ? 'animate-pulse' : ''}`}>
            <Button
              size="lg"
              variant={isRecording ? 'destructive' : 'default'}
              className="h-24 w-24 rounded-full"
              onClick={handleVoiceToggle}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-10 w-10 animate-spin" />
              ) : isRecording ? (
                <MicOff className="h-10 w-10" />
              ) : (
                <Mic className="h-10 w-10" />
              )}
            </Button>
            {isRecording && (
              <div className="absolute inset-0 rounded-full border-4 border-destructive animate-ping pointer-events-none" />
            )}
          </div>

          <div className="text-center space-y-2">
            <p className="font-semibold text-lg">
              {isProcessing
                ? '🎙️ Processing your voice...'
                : isRecording
                  ? '🔴 Recording... Tap to stop'
                  : '🎤 Tap to start recording'}
            </p>
            <p className="text-sm text-muted-foreground max-w-md px-4">
              {isRecording
                ? 'Speak naturally in any language. Mention dates, times, places, and activities. You can describe multiple events!'
                : 'Example: "Tomorrow breakfast at Hôtel du Louvre at 9am, then meeting with Paul at 2pm in Le Marais, and dinner Friday night with Alice"'}
            </p>
          </div>

          {successMessage && (
            <div className="w-full p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="w-full p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {transcription && !isProcessing && (
            <div className="w-full space-y-4 pt-4 border-t">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span>📝</span>
                  <span>Transcription:</span>
                </h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg italic">
                  "{transcription}"
                </p>
              </div>

              {extractedEvents.length > 0 && (
                <>
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <span>📅</span>
                      <span>{extractedEvents.length} Event{extractedEvents.length > 1 ? 's' : ''} Detected:</span>
                    </h3>
                    <div className="space-y-3">
                      {extractedEvents.map((event, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 p-4 rounded-lg text-sm space-y-3">
                          <p className="font-semibold text-base">{event.title}</p>
                          {event.description && (
                            <p className="text-muted-foreground">{event.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="flex items-center gap-1">
                              <span>📅</span>
                              <span>{event.date}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>⏰</span>
                              <span>{event.startTime} - {event.endTime}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>🏷️</span>
                              <span>{event.category}</span>
                            </span>
                          </div>

                          {/* Location verification status */}
                          {event.originalLocation && (
                            <div className="space-y-2 pt-2 border-t">
                              {event.verified ? (
                                <div className="flex items-start gap-2 text-xs">
                                  <MapPinIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-medium text-green-700">
                                      {event.placeName || event.formattedAddress}
                                    </p>
                                    {event.placeName && event.formattedAddress && (
                                      <p className="text-muted-foreground">{event.formattedAddress}</p>
                                    )}
                                    <Badge variant="outline" className="mt-1 text-green-700 border-green-300">
                                      ✓ Verified
                                    </Badge>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 text-xs bg-yellow-50 p-2 rounded border border-yellow-200">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="font-medium text-yellow-800">
                                      Location not verified: {event.originalLocation}
                                    </p>
                                    <p className="text-yellow-700 mt-1">
                                      You can edit this location after creating the event
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Multiple candidates selection */}
                              {event.candidates && event.candidates.length > 1 && (
                                <div className="space-y-2 mt-2">
                                  <p className="text-xs font-medium text-muted-foreground">
                                    Multiple matches found. Select the correct location:
                                  </p>
                                  <div className="space-y-1">
                                    {event.candidates.map((candidate: any, candidateIndex: number) => (
                                      <button
                                        key={candidateIndex}
                                        type="button"
                                        onClick={() => handleSelectCandidate(index, candidateIndex, candidate)}
                                        className={`w-full text-left p-2 rounded border text-xs transition-colors ${
                                          selectedCandidates[index] === candidateIndex
                                            ? 'bg-blue-100 border-blue-300'
                                            : 'bg-white border-gray-200 hover:bg-gray-50'
                                        }`}
                                      >
                                        <p className="font-medium">{candidate.name}</p>
                                        <p className="text-muted-foreground">{candidate.formattedAddress}</p>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setTranscription('');
                        setExtractedEvents([]);
                        setSuccessMessage(null);
                        setSelectedCandidates({});
                      }}
                      className="flex-1"
                    >
                      🔄 Try Again
                    </Button>
                    <Button
                      onClick={handleCreateAllEvents}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        `✨ Create ${extractedEvents.length} Event${extractedEvents.length > 1 ? 's' : ''}`
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    💡 Events can be edited later in your calendar if any details need adjustment
                  </p>
                </>
              )}

              {extractedEvents.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    No events detected. Try including more details like:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Dates or day names (tomorrow, Monday, next Friday)</li>
                    <li>• Times (9am, 2pm, evening)</li>
                    <li>• Activities (breakfast, meeting, dinner)</li>
                    <li>• Places or people's names</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}