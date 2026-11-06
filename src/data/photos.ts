import type { ImageSourcePropType } from 'react-native';

export type Photo = {
  source: ImageSourcePropType;
  /** Shown under the photo: "Photo: <author>, <license>". */
  credit: string;
  /** The file's page on Wikimedia Commons (author, license, original). */
  url: string;
};

// Campus photos from Wikimedia Commons, used under their free licenses with
// credit. Resized for the web; the originals are at each `url`.
export const PHOTOS = {
  quad: {
    source: require('../../assets/campus/quad.jpg'),
    credit: 'Wasted Time R, copyrighted free use',
    url: 'https://commons.wikimedia.org/wiki/File:URIQuad.jpg',
  },
  aerial: {
    source: require('../../assets/campus/aerial.jpg'),
    credit: 'Quintin Soloviev, CC BY 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:University_of_Rhode_Island_campus_aerial_view.jpg',
  },
  greenHall: {
    source: require('../../assets/campus/green-hall.jpg'),
    credit: 'Tnricci, CC BY-SA 3.0',
    url: 'https://commons.wikimedia.org/wiki/File:GreenHall_URI.JPG',
  },
  carothers: {
    source: require('../../assets/campus/carothers.jpg'),
    credit: 'Kenneth C. Zirkel, CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:URI_Carothers_Library.jpg',
  },
  memorialUnion: {
    source: require('../../assets/campus/memorial-union.jpg'),
    credit: 'Kenneth C. Zirkel, CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:URI_Memorial_Student_Union.jpg',
  },
  washburn: {
    source: require('../../assets/campus/washburn.jpg'),
    credit: 'Kenneth C. Zirkel, CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:URI_East_Hall_and_Washburn_Hall.jpg',
  },
  engineering: {
    source: require('../../assets/campus/engineering.jpg'),
    credit: 'Tnricci, CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:URI_Engineering_Pano.jpg',
  },
  edwards1928: {
    source: require('../../assets/campus/edwards-1928.jpg'),
    credit: 'University of Rhode Island (1928), CC BY-SA 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Edwards_Hall_(1928).jpg',
  },
} satisfies Record<string, Photo>;
