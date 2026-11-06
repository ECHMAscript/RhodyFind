import type { ImageSourcePropType } from 'react-native';

/**
 * What the "Learn more" page shows for a place. Every fact here comes from a
 * listed source; anything not confirmed is left out (undefined) and the page
 * shows it as "Not confirmed yet" rather than guessing.
 */
export type PlaceDetails = {
  /** A few sentences about the building. */
  about: string;
  address: string;
  /** e.g. "1961" */
  built?: string;
  /** Total number of floors. */
  floors?: string;
  /** Where the classrooms are, e.g. "2nd and 3rd floors". */
  classrooms?: string;
  bathrooms?: string;
  /** Elevators, accessible entrances. */
  accessibility?: string;
  /** Other things worth knowing (auditorium, lobby features). */
  highlights?: string[];
  /** A photo of the building: require('@/assets/places/<id>.jpg'). */
  photo?: ImageSourcePropType;
  photoCredit?: string;
  /** Where to see a photo when the app can't show one (no license to copy it). */
  photoLink?: { label: string; url: string };
  sources: { label: string; url: string }[];
};

const CLASSROOM_DIRECTORY = {
  label: 'URI classroom directory',
  url: 'https://web.uri.edu/registration-records/faculty-staff-advisors/classroom-directory/',
};

export const PLACE_DETAILS: Record<string, PlaceDetails> = {
  'swan-hall': {
    about:
      'Swan Hall is home to the humanities: English, Modern and Classical Languages and Literatures, and Film Media ' +
      'are based here, and many history, language and social science classes meet here. It opened in 1961 as ' +
      'Independence Hall and was renamed in 2008 for M. Beverly Swan, a URI alumna who became a linguistics professor ' +
      'and later provost. A $9 million renovation, finished in 2006, gutted the 56,000 sq ft building to its frame and ' +
      'rebuilt it with new classrooms, offices, a lecture hall and an enclosed lobby.',
    address: '60 Upper College Road, Kingston, RI 02881',
    built: '1961 (rebuilt inside 2004–2006)',
    floors: 'At least 3: rooms on the 1st (e.g. 154), 2nd and 3rd floors. Basement not confirmed.',
    classrooms: '18 in all. The general classrooms are on the 2nd floor (rooms 201–215) and 3rd floor (305–313), 24 to 48 seats each',
    highlights: [
      'Swan Auditorium seats 231',
      'Language Center in room 301, plus a language lab and a film screening room',
      'A metal swan in the lobby honors M. Beverly Swan',
      'Right behind Edwards Auditorium',
    ],
    photoLink: { label: 'See a photo of Swan Hall on URI Events', url: 'https://events.uri.edu/swan_hall' },
    sources: [
      { label: 'The Good 5¢ Cigar: Building on History: Swan Hall', url: 'https://rhodycigar.com/?p=37520' },
      {
        label: 'URI News: URI dedicates Swan building (2008)',
        url: 'https://www.uri.edu/news/2008/05/uri-dedicates-swan-building-to-honor-long-serving-provost/',
      },
      { label: 'E. Turgeon Construction: Swan Hall renovation', url: 'https://www.eturgeon.com/uri-swan-independence-hall' },
      { label: 'URI Events: Swan Hall', url: 'https://events.uri.edu/swan_hall' },
      CLASSROOM_DIRECTORY,
      {
        label: 'R.I. Gen. Laws § 22-7.4-106 (naming)',
        url: 'https://law.justia.com/codes/rhode-island/2022/title-22/chapter-22-7-4/section-22-7-4-106/',
      },
    ],
  },
  'pastore-hall': {
    about:
      'Pastore Hall (the Pastore Chemical Laboratory and Annex) opened in 1953 as URI’s chemistry building, built for ' +
      '800 students. Chemistry has since moved to the Beaupre Center. Pastore still holds classrooms, including a ' +
      '198-seat lecture hall, and in 2022 it was renovated to give the art program space while the Fine Arts Center ' +
      'is rebuilt.',
    address: '51 Lower College Road, Kingston, RI 02881',
    built: '1953',
    floors: 'At least 3: classrooms on the 1st, 2nd and 3rd floors. Basement not confirmed.',
    classrooms: '1st floor (rooms 122–124), 2nd floor (201–259) and 3rd floor (305–350), 30 to 198 seats',
    bathrooms: 'Gender-inclusive restroom on the 1st floor, room 114A (URI list, 2021)',
    highlights: [
      'Room 124 is a 198-seat lecture hall',
      'Temporary home of URI’s art program during the Fine Arts Center renovation (2022)',
      'Pastore Annex is the building next door',
    ],
    photoLink: { label: 'See a photo of Pastore Hall on URI Events', url: 'https://events.uri.edu/pastore_hall' },
    sources: [
      CLASSROOM_DIRECTORY,
      { label: 'URI Events: Pastore Hall', url: 'https://events.uri.edu/pastore_hall' },
      {
        label: 'The Independent: URI details plans for Fine Arts Center (2022)',
        url: 'https://www.independentri.com/news/article_48a73d38-81de-11ed-8e73-170e7bb1ae48.html',
      },
      { label: 'URI News: chemistry center replaces Pastore Hall', url: 'https://www.uri.edu/news/?p=59591' },
      { label: 'URI Gender & Sexuality Center (restroom list, 2021)', url: 'https://web.uri.edu/gender-sexuality/' },
    ],
  },
};
