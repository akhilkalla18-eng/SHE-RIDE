export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const placeholderImages: ImagePlaceholder[] = [
  {
    id: 'hero',
    description: 'Two women joyfully riding a scooter through a green, tree-lined street, representing freedom and safe companionship.',
    imageUrl: 'https://images.unsplash.com/photo-1599893952192-d698a58f4c28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw1fHx0d28lMjB3b21lbiUyMHJpZGluZyUyMHNjb290ZXJ8ZW58MHx8fHwxNzcxMDExNzM5fDA&ixlib=rb-4.0.3&q=80&w=1080',
    imageHint: 'women scooter journey'
  },
  {
    id: 'safety',
    description: 'A close-up shot of two women\'s hands clasped in a supportive gesture, symbolizing the trust and community at the heart of SheRide.',
    imageUrl: 'https://images.unsplash.com/photo-1556442621-b510034d31d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHx3b21hbiUyMGhlbHBpbmclMjB3b21hbnxlbnwwfHx8fDE3NzEwMTIwMTB8MA&ixlib=rb-4.0.3&q=80&w=1080',
    imageHint: 'women trust support'
  },
  {
    id: 'avatar1',
    description: 'Portrait of a smiling, professional Indian woman with glasses, representing a confident SheRide user.',
    imageUrl: 'https://images.unsplash.com/photo-1598122214434-0a3c2a0d1858?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB3b21hbiUyMHByb2Zlc3Npb25hbHxlbnwwfHx8fDE3NzEwMTIxNTF8MA&ixlib=rb-4.0.3&q=80&w=1080',
    imageHint: 'professional woman'
  },
  {
    id: 'avatar2',
    description: 'A young, modern Indian woman in a vibrant urban setting, looking thoughtfully into the distance.',
    imageUrl: 'https://images.unsplash.com/photo-1604514288429-2a4209569344?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw0fHx5b3VuZyUyMGluZGlhbiUyMHdvbWFufGVufDB8fHx8MTc3MTAxMjI1MHww&ixlib=rb-4.0.3&q=80&w=1080',
    imageHint: 'modern woman urban'
  },
  {
    id: 'avatar3',
    description: 'A cheerful Indian woman with a warm smile, embodying the friendly and welcoming spirit of the SheRide community.',
    imageUrl: 'https://images.unsplash.com/photo-1542623321-2a6279f08c35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxzbWlsaW5nJTIwaW5kaWFuJTIwd29tYW58ZW58MHx8fHwxNzY5MjU5ODg5fDA&ixlib=rb-4.0.3&q=80&w=1080',
    imageHint: 'cheerful woman portrait'
  },
  {
    id: 'auth',
    description: 'A stylish shot of a woman riding a scooter, seen from the side, representing independence and modern travel.',
    imageUrl: 'https://images.unsplash.com/photo-1671866604416-57a3fab71706?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHx3b21hbiUyMHJpZGluZyUyMHNjb290ZXJ8ZW58MHx8fHwxNzY5MTc1NTE3fDA&ixlib=rb-4.1.0&q=80&w=1080',
    imageHint: 'woman riding scooter'
  },
  {
    id: 'create-pickup-hero',
    description: 'A confident woman with a helmet standing next to her scooter, ready to offer a ride.',
    imageUrl: 'https://picsum.photos/seed/offerride/600/600',
    imageHint: 'woman scooter helmet'
  },
  {
    id: 'create-service-hero',
    description: 'Two women looking at a map on a phone, planning their journey together.',
    imageUrl: 'https://picsum.photos/seed/requestride/600/600',
    imageHint: 'women planning travel'
  },
  {
    id: 'suggestions-empty',
    description: 'An illustration of a map with two pins and a scooter route, representing an available ride suggestion.',
    imageUrl: 'https://picsum.photos/seed/suggestionsempty/400/300',
    imageHint: 'ride suggestion map'
  },
  {
    id: 'dashboard-empty',
    description: 'Illustration of a woman on a scooter waving, with a city skyline in the background.',
    imageUrl: 'https://picsum.photos/seed/dashboardempty/400/300',
    imageHint: 'woman scooter city'
  }
];
