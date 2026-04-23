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
  private readonly document = inject(DOCUMENT);

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
    const body = this.document.body;
    const root = this.document.documentElement;
    const scrollbarWidth = window.innerWidth - this.document.documentElement.clientWidth;
    root.style.setProperty('--scrollbar-compensation', `${Math.max(scrollbarWidth, 0)}px`);

    body.style.position = 'fixed';
    body.style.top = `-${this.scrollY}px`;
    body.style.width = '100%';

    // Compensate for removed scrollbar to prevent horizontal content shift.
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
  }

  closeImage() {
    this.showLightBox.set(false);
    this.selectedImage.set(null);

    // Unlock scroll
    const body = this.document.body;
    const root = this.document.documentElement;
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    body.style.paddingRight = '';
    root.style.removeProperty('--scrollbar-compensation');
    window.scrollTo(0, this.scrollY); // Restore scroll position
  }
}
