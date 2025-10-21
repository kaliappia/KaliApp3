import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  place_id: string;
  name?: string;
  formatted_address: string;
  geometry: {
    location: google.maps.LatLng; // <-- AU LIEU DE { lat: number; lng: number; }
  };
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface AddressData {
  placeId: string;
  placeName?: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  city?: string;
  countryCode?: string;
}

interface AddressAutocompleteProps {
  value?: AddressData | null;
  onChange: (address: AddressData | null) => void;
  onValidationChange?: (isValid: boolean) => void;
  required?: boolean;
}

const GOOGLE_PLACES_API_KEY = 'AIzaSyBmiA3che_nAi_wbU4Mkq1lXckKC439S5Y';

export default function AddressAutocomplete({ 
  value, 
  onChange, 
  onValidationChange,
  required = false 
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const debounceTimer = useRef<NodeJS.Timeout>();
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize Google Places API
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places&language=${navigator.language || 'en'}`;
    script.async = true;
    script.onload = () => {
      if (window.google) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const div = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(div);
      }
    };
    script.onerror = () => {
      setError('Failed to load Google Places API');
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Get user location for biasing results
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Silently fail if user denies location
        }
      );
    }
  }, []);

  // Set initial value
  useEffect(() => {
    if (value?.formattedAddress) {
      setInputValue(value.placeName || value.formattedAddress);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notify parent of validation state
  useEffect(() => {
    const isValid = !required || !!value || (showManualEntry && !!manualAddress);
    onValidationChange?.(isValid);
  }, [value, manualAddress, showManualEntry, required, onValidationChange]);

  const fetchPredictions = async (input: string) => {
    if (!input || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const request: any = {
        input,
        // Include both establishments (restaurants, hotels, etc.) and addresses
        types: ['establishment', 'geocode'],
        // Enable language-specific results
        language: navigator.language || 'en'
      };

      // Bias results to user's location if available
      if (userLocation) {
        request.location = new window.google.maps.LatLng(userLocation.lat, userLocation.lng);
        request.radius = 50000; // 50km radius for better local results
      }

      autocompleteService.current.getPlacePredictions(
        request,
        (results: PlacePrediction[] | null, status: string) => {
          setIsLoading(false);
          if (status === 'OK' && results) {
            setPredictions(results.slice(0, 10));
            setShowDropdown(true);
          } else if (status === 'ZERO_RESULTS') {
            setPredictions([]);
            setShowDropdown(false);
          } else {
            setError('Failed to fetch address suggestions');
            setPredictions([]);
          }
        }
      );
    } catch (err) {
      setIsLoading(false);
      setError('Error fetching predictions');
      setPredictions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(null); // Clear selection when typing

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Reduced debounce for instant suggestions
    debounceTimer.current = setTimeout(() => {
      fetchPredictions(newValue);
    }, 200);
  };

  const fetchPlaceDetails = (placeId: string) => {
    if (!placesService.current) return;
  
    setIsLoading(true);
    placesService.current.getDetails(
      {
        placeId,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'address_components',
          'types',
        ],
      },
      (place: PlaceDetails | null, status: string) => {
        setIsLoading(false);
        if (status === 'OK' && place && place.geometry?.location) {
          // .lat() / .lng() (méthodes), pas des propriétés
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
  
          // Ville & pays (avec petits fallbacks courants)
          const ac = place.address_components ?? [];
          const city =
            ac.find(c => c.types.includes('locality'))?.long_name ||
            ac.find(c => c.types.includes('postal_town'))?.long_name ||
            ac.find(c => c.types.includes('administrative_area_level_2'))?.long_name ||
            ac.find(c => c.types.includes('administrative_area_level_1'))?.long_name;
  
          const countryCode = ac.find(c => c.types.includes('country'))?.short_name;
  
          const addressData: AddressData = {
            placeId: place.place_id,
            placeName: place.name || place.formatted_address,
            formattedAddress: place.formatted_address,
            lat,
            lng,
            city,
            countryCode,
          };
  
          onChange(addressData);
          onValidationChange?.(true); // <-- valide l’adresse
          setInputValue(place.name || place.formatted_address);
          setShowDropdown(false);
          setError(null);
        } else {
          setError('Failed to fetch place details');
        }
      }
    );
  };

  const handleSelectPrediction = (prediction: PlacePrediction) => {
    fetchPlaceDetails(prediction.place_id);
  };

  const handleManualEntry = () => {
    if (manualAddress.trim()) {
      onChange({
        placeId: '',
        formattedAddress: manualAddress,
        lat: 0,
        lng: 0
      });
      setInputValue(manualAddress);
      setShowManualEntry(false);
    }
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label htmlFor="address">
        Address {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          id="address"
          placeholder="Enter street address or place name..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          required={required && !showManualEntry}
          className="pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-start gap-3 border-b last:border-b-0"
                onClick={() => handleSelectPrediction(prediction)}
              >
                <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {prediction.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {prediction.structured_formatting.secondary_text}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {value && value.formattedAddress && (
        <div className="bg-muted p-3 rounded-md text-sm space-y-1">
          {value.placeName && (
            <p className="font-medium">{value.placeName}</p>
          )}
          <p className="text-muted-foreground flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{value.formattedAddress}</span>
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!showManualEntry && !value && (
        <button
          type="button"
          onClick={() => setShowManualEntry(true)}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Enter address manually
        </button>
      )}

      {showManualEntry && (
        <div className="space-y-2 p-3 border rounded-md bg-muted/50">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Couldn't verify this address. Location features may not work properly.
            </AlertDescription>
          </Alert>
          <Input
            placeholder="Enter address manually..."
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setShowManualEntry(false);
                setManualAddress('');
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleManualEntry}
              className="text-sm font-medium hover:underline"
              disabled={!manualAddress.trim()}
            >
              Use this address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}