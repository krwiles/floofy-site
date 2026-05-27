import { Injectable } from '@angular/core';
import { GalleryImage } from '../models/gallery-image';
import { CarouselImage } from '../models/carousel-image.model';

@Injectable({
  providedIn: 'root',
})
export class GalleryImageService {
  galleryImages: GalleryImage[] = [
    GalleryImage.fromObject({
      srcFull: 'assets/G-Ewq9pagAA7Z-b.jpeg',
      srcThumbnail: 'assets/G-Ewq9pagAA7Z-b.jpeg',
      alt: 'G-Ewq9pagAA7Z-b',
      widthFull: 1442,
      heightFull: 2048,
      widthThumbnail: 1442,
      heightThumbnail: 2048,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/G-lXyxKbQAMHkV_.jpeg',
      srcThumbnail: 'assets/G-lXyxKbQAMHkV_.jpeg',
      alt: 'G-lXyxKbQAMHkV_',
      widthFull: 1080,
      heightFull: 1350,
      widthThumbnail: 1080,
      heightThumbnail: 1350,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/G8oM0YEasAAWxIg.jpeg',
      srcThumbnail: 'assets/G8oM0YEasAAWxIg.jpeg',
      alt: 'G8oM0YEasAAWxIg',
      widthFull: 999,
      heightFull: 1332,
      widthThumbnail: 999,
      heightThumbnail: 1332,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/G8s5y4ZakAA0XN9.jpeg',
      srcThumbnail: 'assets/G8s5y4ZakAA0XN9.jpeg',
      alt: 'G8s5y4ZakAA0XN9',
      widthFull: 1080,
      heightFull: 1350,
      widthThumbnail: 1080,
      heightThumbnail: 1350,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/G_CQjK1XkAALluE.jpeg',
      srcThumbnail: 'assets/G_CQjK1XkAALluE.jpeg',
      alt: 'G_CQjK1XkAALluE',
      widthFull: 1200,
      heightFull: 1800,
      widthThumbnail: 1200,
      heightThumbnail: 1800,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/HFT6u19bsAAQG-z.jpeg',
      srcThumbnail: 'assets/HFT6u19bsAAQG-z.jpeg',
      alt: 'HFT6u19bsAAQG-z',
      widthFull: 900,
      heightFull: 1200,
      widthThumbnail: 900,
      heightThumbnail: 1200,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/HFImiOIbkAAPgg6.jpeg',
      srcThumbnail: 'assets/HFImiOIbkAAPgg6.jpeg',
      alt: 'HFImiOIbkAAPgg6',
      widthFull: 900,
      heightFull: 1200,
      widthThumbnail: 900,
      heightThumbnail: 1200,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/HGl6r3xbcAAy7uU.jpeg',
      srcThumbnail: 'assets/HGl6r3xbcAAy7uU.jpeg',
      alt: 'HGl6r3xbcAAy7uU',
      widthFull: 1500,
      heightFull: 2000,
      widthThumbnail: 1500,
      heightThumbnail: 2000,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/G9bdIEcbEAAFxwd.jpeg',
      srcThumbnail: 'assets/G9bdIEcbEAAFxwd.jpeg',
      alt: 'G9bdIEcbEAAFxwd',
      widthFull: 1080,
      heightFull: 1440,
      widthThumbnail: 1080,
      heightThumbnail: 1440,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/Floofy_Illustration_T03.png',
      srcThumbnail: 'assets/Floofy_Illustration_T03.png',
      alt: 'Floofy_Illustration_T03',
      widthFull: 1080,
      heightFull: 1861,
      widthThumbnail: 1080,
      heightThumbnail: 1861,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/G0iHCdnaIAA5IDY.jpg',
      srcThumbnail: 'assets/G0iHCdnaIAA5IDY.jpg',
      alt: 'G0iHCdnaIAA5IDY',
      widthFull: 1500,
      heightFull: 2000,
      widthThumbnail: 1500,
      heightThumbnail: 2000,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/G1yNfrpbAAAEPTp.jfif',
      srcThumbnail: 'assets/G1yNfrpbAAAEPTp.jfif',
      alt: 'G1yNfrpbAAAEPTp',
      widthFull: 1200,
      heightFull: 1600,
      widthThumbnail: 1200,
      heightThumbnail: 1600,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/GyfSzJfaIAAn9qh.jfif',
      srcThumbnail: 'assets/GyfSzJfaIAAn9qh.jfif',
      alt: 'GyfSzJfaIAAn9qh',
      widthFull: 900,
      heightFull: 1200,
      widthThumbnail: 900,
      heightThumbnail: 1200,
    }),
    GalleryImage.fromObject({
      srcFull: 'assets/HJLDmNTbgAAbNwI.jfif',
      srcThumbnail: 'assets/HJLDmNTbgAAbNwI.jfif',
      alt: 'HJLDmNTbgAAbNwI',
      widthFull: 1090,
      heightFull: 1600,
      widthThumbnail: 1090,
      heightThumbnail: 1600,
    }),
  ];

  emoteImages: CarouselImage[] = [
    {
      src: 'assets/emote1.webp',
      alt: 'emote1',
      width: 400,
      height: 400,
    },
    {
      src: 'assets/emote2.webp',
      alt: 'emote2',
      width: 512,
      height: 512,
    },
    {
      src: 'assets/emote3.webp',
      alt: 'emote3',
      width: 323,
      height: 340,
    },
    {
      src: 'assets/emote4.webp',
      alt: 'emote4',
      width: 500,
      height: 500,
    },
    {
      src: 'assets/emote5.webp',
      alt: 'emote5',
      width: 512,
      height: 512,
    },
  ];

  chibiImages: CarouselImage[] = [
    {
      src: 'assets/chibi1.webp',
      alt: 'chibi1',
      width: 1080,
      height: 1080,
    },
    {
      src: 'assets/chibi2.webp',
      alt: 'chibi2',
      width: 1080,
      height: 1080,
    },
    {
      src: 'assets/chibi3.webp',
      alt: 'chibi3',
      width: 1080,
      height: 1080,
    },
    {
      src: 'assets/chibi4.jfif',
      alt: 'chibi4',
      width: 1080,
      height: 1080,
    },
  ];

  illustrationImages: CarouselImage[] = [
    {
      src: 'assets/G9bdIEcbEAAFxwd.jpeg',
      alt: 'G9bdIEcbEAAFxwd',
      width: 1080,
      height: 1440,
    },
    {
      src: 'assets/HFT6u19bsAAQG-z.jpeg',
      alt: 'HFT6u19bsAAQG-z',
      width: 900,
      height: 1200,
    },
    {
      src: 'assets/G0iHCdnaIAA5IDY.jpg',
      alt: 'G0iHCdnaIAA5IDY',
      width: 1500,
      height: 2000,
    },
    {
      src: 'assets/GyfSzJfaIAAn9qh.jfif',
      alt: 'GyfSzJfaIAAn9qh',
      width: 1090,
      height: 1600,
    },
  ];
}
