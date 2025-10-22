export interface User {
  id: string;
  name: string;
  avatar: string;
  interests: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  placeId?: string;
  placeName?: string;
  formattedAddress?: string;
  lat?: number;
  lng?: number;
  city?: string;
  countryCode?: string;
  photoUrl?: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar: string;
  visibility: 'private' | 'public' | 'friends';
  attendees: string[];
  comments: Comment[];
  category: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

export interface Organizer {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  category: 'sports' | 'music' | 'nightlife' | 'art' | 'talks' | 'general';
  categories?: string[];
  followers?: number;
  createdAt: Date;
}

export type CalendarView = 'day' | 'week' | 'month';
export type RSVPStatus = 'going' | 'maybe' | 'not-going' | null;