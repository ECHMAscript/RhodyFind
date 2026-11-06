import type { ImageSourcePropType } from 'react-native';
import { RESTROOMS } from './locations';
import { PHOTOS, type Photo } from './photos';

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
  /** Where the photo's author and license are listed. */
  photoCreditUrl?: string;
  /** Where to see a photo when the app can't show one (no license to copy it). */
  photoLink?: { label: string; url: string };
  sources: { label: string; url: string }[];
};

const CLASSROOM_DIRECTORY = {
  label: 'URI classroom directory',
  url: 'https://web.uri.edu/registration-records/faculty-staff-advisors/classroom-directory/',
};

// Undated third-party accessibility review of several URI buildings.
const CRITIQUE_ACCESS = {
  label: 'Critique Access: URI Kingston (accessibility review)',
  url: 'https://critiqueaccess.com/university-of-rhode-island-kingston/',
};
const HISTORIC_DISTRICT = {
  label: 'URI News: campus core listed on the National Register (2018)',
  url: 'https://www.uri.edu/news/?p=73605',
};
const MU_DINE_AND_SHOP = {
  label: 'URI Memorial Union: Dine and Shop',
  url: 'https://web.uri.edu/memorialunion/dine-and-shop/',
};
const MU_HISTORY = { label: 'URI Memorial Union: History', url: 'https://web.uri.edu/memorialunion/history/' };
const HOPE_COMMONS_NEWS = {
  label: 'Food Service Director: URI opens Hope Commons (2007)',
  url: 'https://www.foodservicedirector.com/colleges-universities/the-university-of-rhode-island-has-opened-its-23-million-hope-commons-dining-center-prompting-long-lines-that-have-reduced-at-least-temporarily-the-participation-at-the-campuss-dozen-other-dining-outlets',
};
const OSM = { label: 'OpenStreetMap (address)', url: 'https://www.openstreetmap.org/' };

export const PLACE_DETAILS: Record<string, PlaceDetails> = {
  // ---------------------------------------------------------------- Landmarks
  quad: {
    about:
      'The Quad is the historic heart of the Kingston campus: a grassy, tree-lined lawn framed by the university’s oldest ' +
      'buildings, most of them built of granite quarried on campus. Its layout follows plans drawn in the mid-1890s by the ' +
      'landscape architects Olmsted, Olmsted & Eliot. In 2018 the National Park Service listed about 29 acres around it as ' +
      'the University of Rhode Island Historic District.',
    address: 'Between Upper and Lower College Roads, Kingston, RI 02881',
    built: 'Laid out in the 1890s',
    highlights: [
      'Listed on the National Register of Historic Places (2018)',
      'Surrounded by granite buildings such as Lippitt Hall (1897), Washburn Hall (1921) and Green Hall (1937)',
      'The district’s oldest building is the Oliver Watson Farmhouse, from about 1796',
    ],
    sources: [
      HISTORIC_DISTRICT,
      { label: 'PBN: URI’s central campus added to National Register', url: 'https://pbn.com/uris-central-campus-added-national-register-historic-places/' },
      { label: 'Wikipedia: University of Rhode Island', url: 'https://en.wikipedia.org/wiki/University_of_Rhode_Island' },
    ],
  },
  'memorial-union': {
    about:
      'The Memorial Union is URI’s student union. It was dedicated on November 13, 1954, in memory of the 187 alumni, ' +
      'students and faculty who died in World War II and the Korean War. Additions and renovations followed in 1964 and ' +
      '1992, adding meeting space, a bigger campus store, accessibility improvements and better dining in the Ram’s Den.',
    address: '50 Lower College Road, Kingston, RI 02881',
    built: '1954 (additions 1964 and 1992)',
    bathrooms: 'Accessible restrooms throughout (Critique Access review)',
    accessibility: 'Elevators connect all floors (Critique Access review)',
    highlights: [
      'Ram’s Den food court and Dunkin’ on the main floor',
      'URI Campus Store on the first floor',
      'Campus ID & Dining Office across from the info desk',
      '193 Coffeehouse, the student-run café, in room 200 on the 2nd floor',
    ],
    sources: [MU_HISTORY, MU_DINE_AND_SHOP, CRITIQUE_ACCESS, OSM],
  },
  emporium: {
    about:
      'The Emporium is in the Memorial Union. An older third-party guide describes it as a food-court-style area whose ' +
      'eateries include a Dunkin’ café. URI’s own pages don’t use the name, so its exact spot inside the Union isn’t ' +
      'confirmed; the URI Campus Store is on the Union’s first floor.',
    address: 'Memorial Union, 50 Lower College Road, Kingston, RI 02881',
    accessibility: 'Elevators connect all floors of the Memorial Union (Critique Access review)',
    sources: [
      {
        label: 'Journeum: Kingston places to eat (third-party guide)',
        url: 'https://journeum.com/dst/North%20America/USA/New%20England/Rhode%20Island/South%20County/South%20Kingstown/Kingston/Eat',
      },
      MU_DINE_AND_SHOP,
      CRITIQUE_ACCESS,
    ],
  },
  'welcome-center': {
    about:
      'The Robert J. Higgins Welcome Center is the starting point for campus tours and visits by prospective students. ' +
      'It opened in August 2018, replacing a building about a twelfth of its size, and is built for about 50,000 visitors ' +
      'a year. It is named for alumnus Robert J. Higgins ’67; his widow Mary’s $2 million gift funded the building.',
    address: '45 Upper College Road, Kingston, RI 02881',
    built: '2018',
    bathrooms: 'Accessible restrooms throughout (Critique Access review)',
    accessibility: 'Push-button accessible front door; 10 accessible parking spaces out front (Critique Access review)',
    highlights: ['11,000 square feet', 'Rhody the Ram statue out front'],
    sources: [
      { label: 'URI News: Welcome Center announcement (2018)', url: 'https://www.uri.edu/news/?p=74088' },
      { label: 'PBN: URI begins construction of new Welcome Center', url: 'https://pbn.com/uri-begins-construction-new-facility-razing-welcome-center/' },
      { label: 'URI Visit: Higgins Welcome Center', url: 'https://web.uri.edu/visit/higgins-welcome-center' },
      CRITIQUE_ACCESS,
    ],
  },
  'rhody-statue': {
    about:
      'A statue of Rhody the Ram, URI’s mascot, stands in front of the Higgins Welcome Center, a popular photo stop for ' +
      'visitors. URI’s first ram statue went up in front of the Memorial Union in 1958.',
    address: 'In front of the Higgins Welcome Center, 45 Upper College Road',
    highlights: ['Free to visit any time'],
    sources: [
      { label: 'URI Student Involvement: Rhody the Ram', url: 'https://web.uri.edu/studentinvolvement/rhody-the-ram/' },
      { label: 'URI Visit', url: 'https://web.uri.edu/visit/' },
    ],
  },
  'engineering-quad': {
    about:
      'The Engineering Quadrangle is the outdoor courtyard of URI’s engineering complex, with a patio and seating areas. ' +
      'It is bordered by the Fascitelli Center for Advanced Engineering, which replaced five older engineering buildings, ' +
      'and by historic Bliss Hall (1928), which received a $25 million renovation and a four-story addition.',
    address: 'Off East Alumni Avenue and Lippitt Road, Kingston, RI 02881',
    highlights: [
      'Bliss Hall classrooms: 1st floor (110, 190) and 2nd floor (210–290), 48–60 seats',
      'Kirk Center for Advanced Technology nearby has a 155-seat auditorium',
    ],
    sources: [
      { label: 'URI Engineering: Collaborative Student Spaces', url: 'https://web.uri.edu/engineering/student-resources/collaborative-student-spaces/' },
      { label: 'Construction Equipment Guide: URI engineering complex', url: 'https://www.constructionequipmentguide.com/uri-engineering-complex-to-be-a-commanding-presence/43834' },
      CLASSROOM_DIRECTORY,
    ],
  },

  // ----------------------------------------------------------------- Academic
  'green-hall': {
    about:
      'Green Hall is a three-story granite building finished in 1937 and named for Governor Theodore Francis Green. It was ' +
      'built as the library and administration building of Rhode Island State College, and a 1965 renovation turned it ' +
      'into the home of Undergraduate Admissions. It is part of the campus historic district.',
    address: '6 Rhody Ram Way (35 Campus Avenue), Kingston, RI 02881',
    built: '1937',
    floors: '3',
    highlights: ['36,000 square feet', 'Enrollment Services main office (URI directory)', 'On the National Register of Historic Places'],
    sources: [
      { label: 'The Good 5¢ Cigar: Building on History: Green Hall', url: 'https://rhodycigar.com/?p=33386' },
      { label: 'URI Magazine: What’s the story (2024)', url: 'https://www.uri.edu/magazine/issues/fall-2024/whats-the-story/' },
      { label: 'Living New Deal: Green Hall', url: 'https://livingnewdeal.org/?p=37067' },
      { label: 'URI directory', url: 'https://directory.uri.edu/index.php?letter=E' },
      HISTORIC_DISTRICT,
    ],
  },
  ballentine: {
    about:
      'Ballentine Hall is home to the College of Business, the state’s oldest business college. It reopened in 2003 after ' +
      'a $10.9 million renovation and expansion, and a privately funded renovation and expansion is now planned, with ' +
      'a business analytics and AI center, a student success center and a prototyping lab.',
    address: '7 Lippitt Road, Kingston, RI 02881',
    built: 'Renovated and expanded 2003',
    floors: '3 (Critique Access review)',
    classrooms: '1st floor (rooms 101–115), 44 to 67 seats',
    accessibility: 'Push-button front and rear doors; one elevator serves all three floors (Critique Access review)',
    sources: [
      { label: 'URI News: Ballentine Hall reopens (2003)', url: 'https://www.uri.edu/news/?p=70953' },
      { label: 'URI News: Steenecks’ gift to the College of Business', url: 'https://www.uri.edu/news/?p=76491' },
      CLASSROOM_DIRECTORY,
      CRITIQUE_ACCESS,
    ],
  },
  chafee: {
    about:
      'The Chafee Social Science Center is an eight-story concrete tower, the only high-rise on campus. It was dedicated ' +
      'in 1972 and named for John Chafee, governor when it was planned. About 175 faculty and staff work here, and ' +
      'thousands of students have classes here each day.',
    address: '142 Flagg Road, Kingston, RI 02881',
    built: 'Dedicated 1972',
    floors: '8',
    classrooms: '2nd floor (rooms 219–277), 28 to 500 seats',
    highlights: ['Room 271 is a 500-seat lecture hall, one of the biggest on campus'],
    sources: [{ label: 'URI News: Chafee building', url: 'https://www.uri.edu/news/?p=70672' }, CLASSROOM_DIRECTORY, OSM],
  },
  tyler: {
    about: 'Tyler Hall is the home of URI’s Department of Computer Science and Statistics and its data science program.',
    address: '9 Greenhouse Road, Kingston, RI 02881',
    floors: 'At least 2: classrooms on the 1st floor, department offices on the 2nd',
    classrooms: '1st floor (rooms 106 and 108), 30 to 32 seats',
    highlights: ['Department office: room 264'],
    sources: [
      { label: 'URI Computer Science and Statistics: Contact', url: 'https://web.uri.edu/cs/contact/' },
      CLASSROOM_DIRECTORY,
    ],
  },
  'fascitelli-eng': {
    about:
      'The Fascitelli Center for Advanced Engineering opened in 2019 as the largest construction project in URI’s history. ' +
      'Its lower floors hold active-learning labs and classrooms and its upper floors are interdisciplinary research labs. ' +
      'It replaced five older engineering buildings totaling 98,000 square feet.',
    address: '2 East Alumni Avenue, Kingston, RI 02881',
    built: '2019',
    floors: '6 (URI; one source says 5)',
    classrooms: 'Lower level (010C–045) and 2nd floor (264), 25 to 72 seats',
    highlights: ['About 190,000 square feet', 'Overlooks the Engineering Quadrangle'],
    sources: [
      { label: 'URI: Fascitelli Center for Advanced Engineering', url: 'https://www.uri.edu/features/fascitelli-center-for-advanced-engineering/' },
      { label: 'URInformed, Fall 2019', url: 'https://web.uri.edu/wp-content/uploads/sites/158/URInformed-Fall-2019.pdf' },
      CLASSROOM_DIRECTORY,
    ],
  },
  cbls: {
    about:
      'The Center for Biotechnology and Life Sciences opened on January 26, 2009, at the time the largest classroom and ' +
      'research building project in URI’s history. It holds teaching and research labs for the life sciences and some of ' +
      'the biggest lecture halls on campus.',
    address: '120 Flagg Road, Kingston, RI 02881',
    built: '2009',
    classrooms: 'Lower level (010), 1st floor (100, 152) and 2nd floor (252), 32 to 319 seats',
    highlights: ['About 140,000 square feet', 'Room 100 seats 319'],
    sources: [
      { label: 'NEREJ: Ribbon cutting for URI’s 140,000 s/f CBLS', url: 'https://nerej.com/gilbane-and-payette-celebrate-ribbon-cutting-for-uri-s-140-000-s-f-cbls-building' },
      { label: 'URI Quadangles: CBLS grand opening', url: 'https://web.uri.edu/quadangles/?p=1115' },
      CLASSROOM_DIRECTORY,
    ],
  },
  beaupre: {
    about:
      'The Richard E. Beaupre Center for Chemical and Forensic Sciences opened in September 2016 as the new home of the ' +
      'Chemistry department, replacing Pastore Hall. It cost about $68 million, mostly from a bond voters approved in 2010, ' +
      'and has about three times Pastore’s teaching lab space.',
    address: '140 Flagg Road, Kingston, RI 02881',
    built: '2016',
    floors: '4',
    classrooms: '1st floor (100, 105) and 2nd floor (215), 32 to 243 seats',
    highlights: ['About 134,600 square feet', 'Room 100 seats 243'],
    sources: [
      { label: 'URI Chemistry: Beaupre Center', url: 'https://web.uri.edu/chemistry/beaupre-center/' },
      { label: 'Agostini: URI opens new $68-million chemistry building', url: 'https://agostiniconstruction.com/about-agostini/recent-news/2016/11/21/uri-opens-new-68-million-chemistry-building' },
      CLASSROOM_DIRECTORY,
    ],
  },
  avedisian: {
    about:
      'Avedisian Hall is the home of the College of Pharmacy and the largest academic building on the Kingston campus. ' +
      'The $75 million building opened in 2012 and was named in 2017 for alumnus Paramaz Avedisian ’54.',
    address: '7 Greenhouse Road, Kingston, RI 02881',
    built: '2012',
    floors: '5 (URI; an accessibility review counts 4 floors served by the elevator)',
    classrooms: '1st floor (105, 170) and 2nd floor (240), 30 to 161 seats',
    accessibility: 'Push-button doors at the entrance and on labs and lecture rooms; elevator to every floor (Critique Access review)',
    highlights: ['About 144,000 square feet'],
    sources: [
      { label: 'URI Pharmacy: Avedisian Hall', url: 'https://web.uri.edu/pharmacy/facilities/building/' },
      { label: 'The Day: URI’s new pharmacy building to formally open (2012)', url: 'https://www.theday.com/local-news/20120830/uris-new-pharmacy-building-to-formally-open/' },
      CLASSROOM_DIRECTORY,
      CRITIQUE_ACCESS,
    ],
  },
  'white-hall': {
    about:
      'White Hall has been the home of the College of Nursing since 1976. It is a three-story masonry building, and its ' +
      'first major renovation added the White Hall Nursing Commons.',
    address: '39 Butterfield Road, Kingston, RI 02881',
    built: 'About 1976–1977',
    floors: '3',
    classrooms: '1st floor (113) and 2nd floor (202–220), 20 to 154 seats',
    highlights: ['About 49,000 square feet'],
    sources: [
      { label: 'URI News: White Hall renovation', url: 'https://www.uri.edu/news/?p=67542' },
      { label: 'ConstructConnect: White Hall project listing', url: 'https://projects.constructconnect.com/details/6973836-academic-mep-urimep-university-of-rhode-island&find_loc=rhode-island-02881' },
      CLASSROOM_DIRECTORY,
    ],
  },
  'fine-arts': {
    about:
      'The Fine Arts Center is the home of art, music and theatre at URI. A $99 million project renovated the original ' +
      '1960s center and added a new three-story academic building; URI cut the ribbon on September 14, 2026. It now has ' +
      'a theatre lobby, three art galleries, digital art and media spaces, and a choral room named for Senate President ' +
      'Dominick J. Ruggerio.',
    address: '105 Upper College Road, Kingston, RI 02881',
    built: '1960s; renovated and expanded 2026',
    floors: '3 in the new academic wing',
    highlights: ['More than 166,000 square feet of new and renovated space', 'Concert and recital halls and a theatre'],
    sources: [
      { label: 'TurnTo10: URI cuts ribbon on renovated Fine Arts Center (2026)', url: 'https://turnto10.com/news/local/uri-cuts-ribbon-newly-renovated-fine-arts-center-university-of-rhode-island-september-14-2026' },
      { label: 'URI News: Fine Arts Center milestone (2024)', url: 'https://uri.edu/news/2024/09/uri-to-celebrate-milestone-in-fine-arts-center-renovation' },
    ],
  },
  washburn: {
    about:
      'Washburn Hall is one of the granite buildings framing the Quad, built in 1921. It houses the History and Political ' +
      'Science departments and is part of the campus historic district.',
    address: '80 Upper College Road, Kingston, RI 02881',
    built: '1921',
    floors: 'At least 3: classrooms on the 1st, 2nd and 3rd floors',
    classrooms: '1st floor (111–133), 2nd floor (208–220) and 3rd floor (308–316), 35 to 48 seats',
    sources: [HISTORIC_DISTRICT, { label: 'URI News: historic district', url: 'https://www.uri.edu/news/?p=72690' }, CLASSROOM_DIRECTORY],
  },
  lippitt: {
    about:
      'Lippitt Hall, from 1897, is among the oldest buildings on campus and the third granite building on the Quad. It is ' +
      'named for Governor Charles W. Lippitt and is known for the Tudor-style dormers on its north and south sides. It ' +
      'reopened after a historic restoration.',
    address: '5 Lippitt Road, Kingston, RI 02881',
    built: '1897',
    highlights: ['On the National Register of Historic Places, as part of the campus historic district'],
    sources: [
      { label: 'URI Quadangles: Historic Lippitt Hall reopens', url: 'https://web.uri.edu/quadangles/?p=12660' },
      HISTORIC_DISTRICT,
    ],
  },
  quinn: {
    about:
      'Quinn Hall was built in 1936–37 of Westerly granite, one of three campus buildings put up by the federal Public ' +
      'Works Administration. It began as the home economics building, is named for Governor Robert E. Quinn, and is now ' +
      'home to the College of Health Sciences.',
    address: '55 Lower College Road, Kingston, RI 02881',
    built: '1936–1937',
    floors: '3',
    classrooms: 'Auditorium (168 seats), 1st floor (103, 104), 2nd floor (209–219) and 3rd floor (314)',
    bathrooms: 'Accessible restrooms with push-button doors on the 1st floor (Critique Access review)',
    accessibility: 'Two push-button exterior doors; an elevator connects all three floors (Critique Access review)',
    sources: [
      { label: 'The Good 5¢ Cigar: Building on History: Quinn Hall', url: 'https://rhodycigar.com/?p=35286' },
      { label: 'Living New Deal: Quinn Hall', url: 'https://livingnewdeal.org/?p=37065' },
      CLASSROOM_DIRECTORY,
      CRITIQUE_ACCESS,
    ],
  },
  edwards: {
    about:
      'Edwards Hall opened in 1928 and is named for Howard Edwards, president of Rhode Island State College from 1906 to ' +
      '1930. Its auditorium is the biggest on campus and hosts concerts, lectures and performances. A later renovation ' +
      'restored the lobby and auditorium toward their original look.',
    address: '64 Upper College Road, Kingston, RI 02881',
    built: '1928',
    classrooms: 'Edwards Auditorium seats 920',
    highlights: ['Built of the same granite as the older Quad buildings', 'Opened with 1,000 seats, replaced in 1988'],
    sources: [
      { label: 'The Good 5¢ Cigar: Building on History: Edwards Hall', url: 'https://rhodycigar.com/?p=38724' },
      CLASSROOM_DIRECTORY,
      HISTORIC_DISTRICT,
    ],
  },
  carlotti: {
    about:
      'The Carlotti Administration Building was built in 1958–59 on the site of the old South Hall, and holds many of the ' +
      'university’s administrative offices.',
    address: '75 Lower College Road, Kingston, RI 02881',
    built: '1958–1959',
    sources: [{ label: 'URI Digital Commons: Carlotti Administration Building', url: 'https://digitalcommons.uri.edu/photographs/28' }, OSM],
  },
  'coastal-institute': {
    about:
      'The Coastal Institute building opened in 2001 for URI’s environmental and coastal research. It includes an ' +
      'auditorium, labs, offices and a Policy Simulation Laboratory for studying the effects of environmental and ' +
      'economic policies.',
    address: '1 Greenhouse Road, Kingston, RI 02881',
    built: '2001',
    floors: '3',
    classrooms: 'Auditorium, 125 seats',
    highlights: ['About 50,000 square feet (URI)'],
    sources: [{ label: 'URI: Coastal Institute building opening', url: 'https://www.uri.edu/?p=12428' }, CLASSROOM_DIRECTORY],
  },

  // ---------------------------------------------------------------- Libraries
  carothers: {
    about:
      'The Robert L. Carothers Library and Learning Commons is URI’s main library, with study spaces, collections and ' +
      'research help. A 24-hour study room is open every night of the academic year.',
    address: '15 Lippitt Road, Kingston, RI 02881',
    floors: 'Lower level plus several floors above; study carrels on the 2nd and 3rd floors',
    classrooms: 'Room 166, 54 seats',
    bathrooms: 'Accessible restrooms throughout (Critique Access review)',
    accessibility: 'Push-button accessible doors; elevators connect all floors (Critique Access review)',
    highlights: ['24-hour study room: enter through the after-hours door on the 1st floor with your student ID'],
    sources: [
      { label: 'URI Libraries: 24-hour study room', url: 'https://uri.libguides.com/circulation/24hourroom' },
      { label: 'URI Libraries: floor directory', url: 'https://uri.libguides.com/start/floordirectory' },
      CLASSROOM_DIRECTORY,
      CRITIQUE_ACCESS,
    ],
  },
  'kingston-library': {
    about:
      'The Kingston Free Library is a public library in a building put up in 1775–76 as the Kings County Courthouse. It ' +
      'was one of the five places where Rhode Island’s General Assembly met until 1791, and served as a courthouse until ' +
      'the 1890s before becoming a library.',
    address: '2605 Kingstown Road, Kingston, RI 02881',
    built: '1775–1776 (interior renovated 1994)',
    floors: '2: library on the 1st floor, meeting hall in the former 2nd-floor courtroom',
    highlights: ['On the National Register of Historic Places (1974)', 'Part of the South Kingstown Public Library'],
    sources: [
      { label: 'South Kingstown Public Library: The Court House Years', url: 'https://www.skpl.org/1410/The-Court-House-Years-1800-1891' },
      { label: 'TurnTo10: Kingston Free Library celebrates 250 years', url: 'https://turnto10.com/news/local/kingstown-free-library-celebrates-250-years' },
    ],
  },

  // ------------------------------------------------------------------- Dining
  'hope-commons': {
    about:
      'Hope Commons is a two-story dining building in the heart of the residence halls, opened in 2007. It replaced the ' +
      'old Hope and Roger Williams dining halls, and holds the Mainfare dining hall and the Rhody Market café.',
    address: '19 Butterfield Road, Kingston, RI 02881',
    built: '2007',
    floors: '2',
    highlights: ['About 47,000 square feet', 'Mainfare: about 600 seats', 'Rhody Market late-night café upstairs'],
    sources: [HOPE_COMMONS_NEWS, { label: 'URI Dining', url: 'https://www.uri.edu/campus-life/dining/' }],
  },
  mainfare: {
    about:
      'Mainfare is URI’s all-you-care-to-eat dining hall inside Hope Commons, with about 600 seats. When it opened it had ' +
      'two salad bars, cook-to-order Asian and pasta stations, and deli, burger and home-style stations.',
    address: 'Hope Commons, 19 Butterfield Road, Kingston, RI 02881',
    built: '2007',
    highlights: ['Meal plans accepted', 'Check URI Dining for this semester’s hours'],
    sources: [HOPE_COMMONS_NEWS, { label: 'URI Dining', url: 'https://www.uri.edu/campus-life/dining/' }],
  },
  butterfield: {
    about:
      'Butterfield Dining Hall is one of URI’s two all-you-care-to-eat dining halls. It closed in December 2014 for a ' +
      'renovation and reopened eight months later with 7,500 more square feet and room for about 200 more diners.',
    address: 'Butterfield Road, Kingston, RI 02881',
    built: 'Renovated 2015',
    highlights: ['Fall 2026: open weekdays for breakfast, lunch and dinner; closed weekends'],
    sources: [
      { label: 'URI Dining: Butterfield Dining Hall', url: 'https://web.uri.edu/dining/butterfield/' },
      { label: 'DiPrete Engineering: URI dining hall expansion', url: 'https://diprete-eng.com/engineering-news/uri-dining-hall-expansion/' },
    ],
  },
  'rams-den': {
    about:
      'The Ram’s Den is the food court on the main floor of the Memorial Union, serving meals and snacks. It takes Ram ' +
      'Account, meal plans, Dining Dollars, cash and credit cards.',
    address: 'Memorial Union, 50 Lower College Road, Kingston, RI 02881',
    accessibility: 'Elevators connect all floors of the Memorial Union (Critique Access review)',
    highlights: ['Flex plan value meals available'],
    sources: [{ label: 'URI Dining: Ram’s Den', url: 'https://web.uri.edu/dining/ramsden/' }, MU_DINE_AND_SHOP, CRITIQUE_ACCESS],
  },
  'rhody-market': {
    about:
      'Rhody Market is a small late-night café and bistro on the upper level of Hope Commons, with coffee, pizza, ' +
      'smoothies and frozen treats. It is one of URI’s award-winning retail dining spots.',
    address: 'Hope Commons, 19 Butterfield Road, Kingston, RI 02881',
    highlights: ['Grab-and-go meals', 'Check URI Dining for this semester’s hours'],
    sources: [HOPE_COMMONS_NEWS, { label: 'URI Dining', url: 'https://www.uri.edu/campus-life/dining/' }],
  },
  '193-coffee': {
    about:
      'The 193 Coffeehouse is a student-run cooperative café that has served low-priced coffee in the Memorial Union since ' +
      'the mid-1990s. It also hosts free open mics, band nights and other student events.',
    address: 'Memorial Union, room 200 (2nd floor), 50 Lower College Road',
    highlights: ['Events posted on Instagram: @193coffeehouse', 'Was cash-only and open weekdays 8 a.m.–8 p.m. as of 2021'],
    sources: [
      { label: 'The Good 5¢ Cigar: 193 Student Coffeehouse', url: 'https://rhodycigar.com/?p=21444' },
      { label: 'The Good 5¢ Cigar: Fresh pot of events at 193 Coffeehouse', url: 'https://rhodycigar.com/?p=38357' },
      MU_DINE_AND_SHOP,
    ],
  },
  'dunkin-union': {
    about: 'A Dunkin’ café and deli in the Memorial Union, next to the Ram’s Den.',
    address: 'Memorial Union, 50 Lower College Road, Kingston, RI 02881',
    accessibility: 'Reachable by an outside ramp (student review)',
    sources: [MU_DINE_AND_SHOP, { label: 'The Good 5¢ Cigar: How’s the coffee?', url: 'https://rhodycigar.com/?p=9926' }],
  },
  'bru-ri': {
    about: 'Bru Coffee Bar is a coffee shop in Kingston near campus, known for its breakfast sandwiches.',
    address: '56 Fortin Road, Kingston, RI 02881',
    highlights: ['Listed hours: 8 a.m.–4 p.m. (call ahead to check)'],
    sources: [{ label: 'Wanderlog: Bru Coffee Bar', url: 'https://wanderlog.com/place/details/10645478/bru-coffee-bar' }, OSM],
  },
  'kingston-pizza': {
    about: 'Kingston Pizza is a long-running pizzeria near campus, in business since 1984, serving pizza, grinders, calzones, salads and Italian dinners.',
    address: '63 Briar Lane, Kingston, RI 02881',
    highlights: ['Listed hours: 11 a.m.–midnight (call ahead to check)'],
    sources: [{ label: 'Yext: Kingston Pizza', url: 'https://directory.yext.com/en/kingston-pizza-505925043' }, OSM],
  },

  // ------------------------------------------------------------------- Stores
  'four-seasons': {
    about:
      'A convenience store near campus. We couldn’t find public information about it online yet, so its name and details ' +
      'still need to be checked in person.',
    address: 'Kingston, RI 02881 (exact address not confirmed)',
    sources: [OSM],
  },
  'kingston-mart': {
    about: 'Kingston Mart is a small convenience store near campus.',
    address: '100 Fortin Road, Kingston, RI 02881',
    sources: [{ label: 'NAICS List: Kingston Mart, Inc.', url: 'https://naicslist.com/company-profile/kingston-mart-inc-kingston-ri-02881' }, OSM],
  },
  cvs: {
    about: 'The CVS Pharmacy closest to campus, with a pharmacy and everyday essentials.',
    address: '99 Fortin Road, Suite 27, Kingston, RI 02881',
    highlights: ['Phone: (401) 783-9440', 'Listed hours: 7 a.m.–10 p.m. daily (pharmacy hours may differ)'],
    sources: [{ label: 'CVS: Kingston store #868', url: 'https://www.cvs.com/store-locator/details-directions/868' }],
  },
  'post-office': {
    about: 'The Kingston branch of the U.S. Postal Service, close to campus.',
    address: '101 Briar Lane, Kingston, RI 02881',
    highlights: ['Check usps.com for hours'],
    sources: [{ label: 'USPS: Find locations', url: 'https://tools.usps.com/locations/' }, OSM],
  },

  // --------------------------------------------------------------- Recreation
  'anna-fascitelli': {
    about:
      'The Anna Fascitelli Fitness and Wellness Center is URI’s main student gym. The $11 million center opened in 2013 ' +
      'in the renovated 1969 Roger Williams Dining Hall, plus a new entrance wing, and is named for the late mother of ' +
      'alumnus Michael Fascitelli.',
    address: '18 Butterfield Road, Kingston, RI 02881',
    built: '2013',
    floors: '2',
    bathrooms: 'Men’s and women’s locker rooms and an all-gender shower room',
    accessibility: 'Fully accessible, with wheelchair access to both levels',
    highlights: [
      'About 33,000 square feet, LEED Gold',
      'Cardio, strength, circuit and functional training areas',
      'Spin, group exercise and yoga/Pilates studios',
    ],
    sources: [
      { label: 'URI Campus Rec: Anna Fascitelli Fitness & Wellness Center', url: 'https://web.uri.edu/campusrec/facilities/anna-fascitelli-fitness-wellness-center/' },
      { label: 'URI News: dedication (2013)', url: 'https://www.uri.edu/news/?p=61463' },
      { label: 'Kite Architects: Wellness & Fitness Center', url: 'https://kitearchitects.com/portfolio/wellness-fitness-center' },
    ],
  },
  'keaney-gym': {
    about:
      'Keaney Gymnasium opened in 1953 and was home to Rams basketball until the Ryan Center opened in 2002; it is now ' +
      'home to URI volleyball. It is named for Frank Keaney, URI’s legendary coach and athletic director, and once hosted ' +
      'concerts by Bruce Springsteen, the Beach Boys, Bob Dylan and others.',
    address: '85 Keaney Road, Kingston, RI 02881',
    built: '1953',
    highlights: ['Seats 3,385', 'Hosted NCAA tournament games from 1967 to 1969'],
    sources: [{ label: 'Wikipedia: Keaney Gymnasium', url: 'https://en.wikipedia.org/wiki/Keaney_Gymnasium' }],
  },
  mackal: {
    about:
      'Mackal Field House opened in 1991 with a six-lane, 200-meter indoor track, plus fitness, weight and basketball ' +
      'space. It hosts the Atlantic 10 indoor track and field championships each year.',
    address: '75 Keaney Road, Kingston, RI 02881',
    built: '1991 (new track surface 2011)',
    sources: [{ label: 'URI Campus Rec: Mackal Field House', url: 'https://web.uri.edu/campusrec/facilities/mackal-field-house/' }],
  },
  tootell: {
    about:
      'The Tootell Aquatic Center holds URI’s pool. It is part of the Tootell Physical Education Center, which the Ryan ' +
      'Center adjoins at one corner, next to Keaney Gymnasium and Mackal Field House.',
    address: '105 Keaney Road, Kingston, RI 02881',
    sources: [
      { label: 'Wikipedia: Ryan Center', url: 'https://en.wikipedia.org/wiki/Ryan_Center' },
      { label: 'URI Campus Rec', url: 'https://web.uri.edu/campusrec/' },
      OSM,
    ],
  },
  'boss-arena': {
    about:
      'The Bradford R. Boss Arena opened on September 15, 2002, and is home to URI’s club ice hockey teams. It also hosts ' +
      'high school and youth hockey, figure skating and public skating, and is open year-round. It is named for Brad ' +
      'Boss, the alumnus who founded URI’s first men’s hockey club.',
    address: '1 Keaney Road, Kingston, RI 02881',
    built: '2002',
    highlights: ['Seats 2,500', 'NHL-size rink: 200 by 85 feet', 'Built for about $12 million'],
    sources: [
      { label: 'Wikipedia: Bradford R. Boss Arena', url: 'https://en.wikipedia.org/wiki/Bradford_R._Boss_Arena' },
      { label: 'URI News: construction bid (2001)', url: 'https://www.uri.edu/news/2001/05/uri-awards-construction-bid-for-12-million-ice-rink-facility/' },
    ],
  },
  'ryan-center': {
    about:
      'The Ryan Center is an 8,000-seat arena that opened in 2002 as the home of URI basketball, replacing Keaney ' +
      'Gymnasium. It also hosts concerts and other events. Its three corner towers are modeled on Rhode Island ' +
      'lighthouses. It is named for Thomas M. Ryan ’75, former CEO of CVS and the arena’s lead donor.',
    address: '1 Lincoln Almond Plaza, Kingston, RI 02881',
    built: '2002',
    highlights: [
      'About 200,000 square feet and 86 feet tall',
      'Luxury boxes look over both the basketball court and Meade Stadium',
    ],
    sources: [{ label: 'Wikipedia: Ryan Center', url: 'https://en.wikipedia.org/wiki/Ryan_Center' }],
  },
  'meade-stadium': {
    about:
      'Meade Stadium is home to URI football. It opened in 1928 as Meade Field, named for alumnus John E. “Jack” Meade, ' +
      'and took its current name in 1978 when the steel east grandstand went up. New west stands next to the Ryan Center ' +
      'opened in 2006, and lights and field turf were added in 2019.',
    address: '25 West Alumni Avenue, Kingston, RI 02881',
    built: '1928',
    highlights: ['Seats 6,555'],
    sources: [{ label: 'Wikipedia: Meade Stadium', url: 'https://en.wikipedia.org/wiki/Meade_Stadium' }],
  },
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
    ],
  },
};

// URI's list of gender-inclusive restrooms (2021, archived copy; the page has
// since been taken down).
const RESTROOM_LIST = {
  label: 'URI Gender & Sexuality Center: gender-inclusive restrooms (2021, archived)',
  url: 'https://web.archive.org/web/20260908195923/https://web.uri.edu/gender-sexuality/restrooms/',
};
for (const [id, where] of Object.entries(RESTROOMS)) {
  const d = PLACE_DETAILS[id];
  if (!d) continue;
  const listed = `Gender-inclusive: ${where} (URI list, 2021)`;
  d.bathrooms = d.bathrooms ? `${d.bathrooms}. ${listed}` : listed;
  d.sources.push(RESTROOM_LIST);
}

// Free-license photos of buildings (credits in data/photos.ts).
const BUILDING_PHOTOS: Record<string, Photo> = {
  quad: PHOTOS.quad,
  'green-hall': PHOTOS.greenHall,
  carothers: PHOTOS.carothers,
  'memorial-union': PHOTOS.memorialUnion,
  washburn: PHOTOS.washburn,
  'engineering-quad': PHOTOS.engineering,
  edwards: PHOTOS.edwards1928,
};
for (const [id, photo] of Object.entries(BUILDING_PHOTOS)) {
  const d = PLACE_DETAILS[id];
  if (!d) continue;
  d.photo = photo.source;
  d.photoCredit = `Photo: ${photo.credit}${id === 'edwards' ? ' · Edwards Hall in 1928' : ''}`;
  d.photoCreditUrl = photo.url;
}
