import { Injectable } from '@angular/core';
import { ImageAsset } from '../models/image-asset';

@Injectable({
  providedIn: 'root',
})
export class GalleryImageService {
  galleryImages: ImageAsset[] = [
    { src: 'assets/G-Ewq9pagAA7Z-b.jpeg', alt: 'G-Ewq9pagAA7Z-b', width: 1442, height: 2048 },
    { src: 'assets/G-lXyxKbQAMHkV_.jpeg', alt: 'G-lXyxKbQAMHkV_', width: 1080, height: 1350 },
    { src: 'assets/G8oM0YEasAAWxIg.jpeg', alt: 'G8oM0YEasAAWxIg', width: 999, height: 1332 },
    { src: 'assets/G8s5y4ZakAA0XN9.jpeg', alt: 'G8s5y4ZakAA0XN9', width: 1080, height: 1350 },
    { src: 'assets/G_CQjK1XkAALluE.jpeg', alt: 'G_CQjK1XkAALluE', width: 1200, height: 1800 },
    { src: 'assets/HFT6u19bsAAQG-z.jpeg', alt: 'HFT6u19bsAAQG-z', width: 900, height: 1200 },
    { src: 'assets/HFImiOIbkAAPgg6.jpeg', alt: 'HFImiOIbkAAPgg6', width: 900, height: 1200 },
    { src: 'assets/HGl6r3xbcAAy7uU.jpeg', alt: 'HGl6r3xbcAAy7uU', width: 1500, height: 2000 },
    { src: 'assets/G9bdIEcbEAAFxwd.jpeg', alt: 'G9bdIEcbEAAFxwd', width: 1080, height: 1440 },
    { src: 'assets/Floofy_Illustration_T03.png', alt: 'Floofy_Illustration_T03', width: 1080, height: 1861 },
    { src: 'assets/G0iHCdnaIAA5IDY.jpg', alt: 'G0iHCdnaIAA5IDY', width: 1500, height: 2000 },
    { src: 'assets/G1yNfrpbAAAEPTp.jfif', alt: 'G1yNfrpbAAAEPTp', width: 1200, height: 1600 },
    { src: 'assets/GyfSzJfaIAAn9qh.jfif', alt: 'GyfSzJfaIAAn9qh', width: 900, height: 1200 },
    { src: 'assets/HJLDmNTbgAAbNwI.jfif', alt: 'HJLDmNTbgAAbNwI', width: 1090, height: 1600 },
  ];

  emoteImages: ImageAsset[] = [
    { src: 'assets/emote1.webp', alt: 'emote1', width: 400, height: 400 },
    { src: 'assets/emote2.webp', alt: 'emote2', width: 512, height: 512 },
    { src: 'assets/emote3.webp', alt: 'emote3', width: 323, height: 340 },
    { src: 'assets/emote4.webp', alt: 'emote4', width: 500, height: 500 },
    { src: 'assets/emote5.webp', alt: 'emote5', width: 512, height: 512 },
  ];

  chibiImages: ImageAsset[] = [
    { src: 'assets/chibi1.webp', alt: 'chibi1', width: 1080, height: 1080 },
    { src: 'assets/chibi2.webp', alt: 'chibi2', width: 1080, height: 1080 },
    { src: 'assets/chibi3.webp', alt: 'chibi3', width: 1080, height: 1080 },
    { src: 'assets/chibi4.jfif', alt: 'chibi4', width: 1080, height: 1080 },
  ];

  illustrationImages: ImageAsset[] = [
    { src: 'assets/G9bdIEcbEAAFxwd.jpeg', alt: 'G9bdIEcbEAAFxwd', width: 1080, height: 1440 },
    { src: 'assets/HFT6u19bsAAQG-z.jpeg', alt: 'HFT6u19bsAAQG-z', width: 900, height: 1200 },
    { src: 'assets/G0iHCdnaIAA5IDY.jpg', alt: 'G0iHCdnaIAA5IDY', width: 1500, height: 2000 },
    { src: 'assets/GyfSzJfaIAAn9qh.jfif', alt: 'GyfSzJfaIAAn9qh', width: 900, height: 1200 },
  ];
}
