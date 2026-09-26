import { Injectable } from '@angular/core';
import { ImageAsset } from '../models/image-asset';

@Injectable({
  providedIn: 'root',
})
export class GalleryImageService {
  galleryImages: ImageAsset[] = [
    { src: 'assets/artwork/fauna-01.jpeg', alt: 'G-Ewq9pagAA7Z-b', width: 1442, height: 2048 },
    { src: 'assets/artwork/kronii-01.jpeg', alt: 'G-lXyxKbQAMHkV_', width: 1080, height: 1350 },
    { src: 'assets/artwork/fauna-02.jpeg', alt: 'G8oM0YEasAAWxIg', width: 999, height: 1332 },
    { src: 'assets/artwork/nimi-01.jpeg', alt: 'G8s5y4ZakAA0XN9', width: 1080, height: 1350 },
    { src: 'assets/artwork/kiara-01.jpeg', alt: 'G_CQjK1XkAALluE', width: 1200, height: 1800 },
    { src: 'assets/artwork/nimi-04.jpeg', alt: 'HFT6u19bsAAQG-z', width: 900, height: 1200 },
    { src: 'assets/artwork/roka-01.jpeg', alt: 'HFImiOIbkAAPgg6', width: 900, height: 1200 },
    { src: 'assets/artwork/nimi-05.jpeg', alt: 'HGl6r3xbcAAy7uU', width: 1500, height: 2000 },
    { src: 'assets/artwork/nimi-02.jpeg', alt: 'G9bdIEcbEAAFxwd', width: 1080, height: 1440 },
    { src: 'assets/artwork/floofy-01.png', alt: 'Floofy_Illustration_T03', width: 1080, height: 1861 },
    { src: 'assets/artwork/cecilia-01.jpg', alt: 'G0iHCdnaIAA5IDY', width: 1500, height: 2000 },
    { src: 'assets/artwork/shiori-01.jfif', alt: 'G1yNfrpbAAAEPTp', width: 1200, height: 1600 },
    { src: 'assets/artwork/nimi-03.jfif', alt: 'GyfSzJfaIAAn9qh', width: 900, height: 1200 },
    { src: 'assets/artwork/nimi-06.jfif', alt: 'HJLDmNTbgAAbNwI', width: 1090, height: 1600 },
  ];

  emoteImages: ImageAsset[] = [
    { src: 'assets/artwork/otomo-emote-01.webp', alt: 'emote1', width: 400, height: 400 },
    { src: 'assets/artwork/emote-01.webp', alt: 'emote2', width: 512, height: 512 },
    { src: 'assets/artwork/duckie-emote-01.webp', alt: 'emote3', width: 323, height: 340 },
    { src: 'assets/artwork/oko-emote-01.webp', alt: 'emote4', width: 500, height: 500 },
    { src: 'assets/artwork/emote-02.webp', alt: 'emote5', width: 512, height: 512 },
  ];

  chibiImages: ImageAsset[] = [
    { src: 'assets/artwork/fauna-chibi-01.webp', alt: 'chibi1', width: 1080, height: 1080 },
    { src: 'assets/artwork/nimi-chibi-01.webp', alt: 'chibi2', width: 1080, height: 1080 },
    { src: 'assets/artwork/fauna-chibi-02.webp', alt: 'chibi3', width: 1080, height: 1080 },
    { src: 'assets/artwork/raora-chibi-01.jfif', alt: 'chibi4', width: 1080, height: 1080 },
  ];

  illustrationImages: ImageAsset[] = [
    { src: 'assets/artwork/nimi-02.jpeg', alt: 'G9bdIEcbEAAFxwd', width: 1080, height: 1440 },
    { src: 'assets/artwork/nimi-04.jpeg', alt: 'HFT6u19bsAAQG-z', width: 900, height: 1200 },
    { src: 'assets/artwork/cecilia-01.jpg', alt: 'G0iHCdnaIAA5IDY', width: 1500, height: 2000 },
    { src: 'assets/artwork/nimi-03.jfif', alt: 'GyfSzJfaIAAn9qh', width: 900, height: 1200 },
  ];
}
