import { Injectable } from '@angular/core';
import { GalleryImage } from '../models/gallery-image';

@Injectable({
  providedIn: 'root',
})
export class GalleryImageService {
  galleryImages: GalleryImage[] = [
    GalleryImage.fromObject({
      srcFull: '/assets/G-Ewq9pagAA7Z-b.jpeg',
      srcThumbnail: '/assets/G-Ewq9pagAA7Z-b.jpeg',
      alt: 'G-Ewq9pagAA7Z-b',
      widthFull: 1442,
      heightFull: 2048,
      widthThumbnail: 1442,
      heightThumbnail: 2048,
    }),
    GalleryImage.fromObject({
      srcFull: '/assets/G-lXyxKbQAMHkV_.jpeg',
      srcThumbnail: '/assets/G-lXyxKbQAMHkV_.jpeg',
      alt: 'G-lXyxKbQAMHkV_',
      widthFull: 1080,
      heightFull: 1350,
      widthThumbnail: 1080,
      heightThumbnail: 1350,
    }),
    GalleryImage.fromObject({
      srcFull: '/assets/G8oM0YEasAAWxIg.jpeg',
      srcThumbnail: '/assets/G8oM0YEasAAWxIg.jpeg',
      alt: 'G8oM0YEasAAWxIg',
      widthFull: 999,
      heightFull: 1332,
      widthThumbnail: 999,
      heightThumbnail: 1332,
    }),
    GalleryImage.fromObject({
      srcFull: '/assets/G8s5y4ZakAA0XN9.jpeg',
      srcThumbnail: '/assets/G8s5y4ZakAA0XN9.jpeg',
      alt: 'G8s5y4ZakAA0XN9',
      widthFull: 1080,
      heightFull: 1350,
      widthThumbnail: 1080,
      heightThumbnail: 1350,
    }),
    GalleryImage.fromObject({
      srcFull: '/assets/G_CQjK1XkAALluE.jpeg',
      srcThumbnail: '/assets/G_CQjK1XkAALluE.jpeg',
      alt: 'G_CQjK1XkAALluE',
      widthFull: 1200,
      heightFull: 1800,
      widthThumbnail: 1200,
      heightThumbnail: 1800,
    }),
    GalleryImage.fromObject({
      srcFull: '/assets/G_Xl1MobAAAVbNn.jpeg',
      srcThumbnail: '/assets/G_Xl1MobAAAVbNn.jpeg',
      alt: 'G_Xl1MobAAAVbNn',
      widthFull: 1080,
      heightFull: 1080,
      widthThumbnail: 1080,
      heightThumbnail: 1080,
    }),
  ];
}
