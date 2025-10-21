import { Event, Organizer, User } from '@/types';

// Mock current user
export const currentUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  interests: ['Music', 'Sports', 'Technology', 'Food']
};

// Mock organizers
export const mockOrganizers: Organizer[] = [
  {
    id: 'org-1',
    name: 'TechHub Events',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechHub',
    bio: 'Leading technology events and conferences',
    followers: 15420,
    categories: ['Technology', 'Networking']
  },
  {
    id: 'org-2',
    name: 'Music Collective',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Music',
    bio: 'Live music performances and festivals',
    followers: 8930,
    categories: ['Music', 'Entertainment']
  },
  {
    id: 'org-3',
    name: 'Fitness First',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fitness',
    bio: 'Community fitness events and marathons',
    followers: 12100,
    categories: ['Sports', 'Health']
  }
];

// Mock events
export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'Summer Music Festival',
    description: 'Join us for an amazing outdoor music festival featuring local and international artists.',
    startDate: new Date(2024, 6, 15, 18, 0),
    endDate: new Date(2024, 6, 15, 23, 0),
    location: 'Central Park Amphitheater',
    organizerId: 'org-2',
    organizerName: 'Music Collective',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Music',
    visibility: 'public',
    attendees: ['user-1', 'user-2', 'user-3'],
    comments: [],
    category: 'Music'
  },
  {
    id: 'evt-2',
    title: 'Tech Conference 2024',
    description: 'Annual technology conference with keynotes from industry leaders.',
    startDate: new Date(2024, 6, 20, 9, 0),
    endDate: new Date(2024, 6, 20, 17, 0),
    location: 'Convention Center',
    organizerId: 'org-1',
    organizerName: 'TechHub Events',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TechHub',
    visibility: 'public',
    attendees: ['user-1'],
    comments: [],
    category: 'Technology'
  },
  {
    id: 'evt-3',
    title: 'Morning Yoga Session',
    description: 'Start your day with a refreshing yoga session in the park.',
    startDate: new Date(2024, 6, 18, 7, 0),
    endDate: new Date(2024, 6, 18, 8, 30),
    location: 'Riverside Park',
    organizerId: 'org-3',
    organizerName: 'Fitness First',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fitness',
    visibility: 'public',
    attendees: [],
    comments: [],
    category: 'Sports'
  },
  {
    id: 'evt-4',
    title: 'Team Lunch',
    description: 'Monthly team lunch at the new Italian restaurant.',
    startDate: new Date(2024, 6, 12, 12, 0),
    endDate: new Date(2024, 6, 12, 13, 30),
    location: 'Bella Italia',
    organizerId: 'user-1',
    organizerName: 'Alex Johnson',
    organizerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    visibility: 'friends',
    attendees: ['user-1'],
    comments: [],
    category: 'Food'
  }
];
