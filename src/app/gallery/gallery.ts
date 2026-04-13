import { Component, inject, signal } from '@angular/core';
import { GalleryImageService } from '../services/gallery-image.service';
import { GalleryImage } from '../models/gallery-image';
import { DOCUMENT } from '@angular/common';
import { I18nService } from '../services/i18n.service';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  i18n = inject(I18nService);
  galleryImageService = inject(GalleryImageService);
  selectedImage = signal<GalleryImage | null>(null);
  showLightBox = signal<boolean>(false);
  scrollY = 0;

    showImage(image: GalleryImage) {
      this.selectedImage.set(image);
      this.showLightBox.set(true);

      // Lock scroll
      this.scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${this.scrollY}px`;
      document.body.style.width = '100%';
    }
    
    closeImage() {
      this.showLightBox.set(false);
      this.selectedImage.set(null);

      // Unlock scroll
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, this.scrollY); // Restore scroll position
    }
}
