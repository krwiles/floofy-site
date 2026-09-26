import { Component, HostListener, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { GalleryImageService } from '../services/gallery-image.service';
import { ImageAsset } from '../models/image-asset';
import { DOCUMENT } from '@angular/common';
import { NgOptimizedImage } from '@angular/common';
import { Hero } from '../components/hero/hero';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { SectionDivider } from '../components/section-divider/section-divider';
import { Section } from '../components/section/section';

@Component({
  selector: 'app-gallery',
  imports: [NgOptimizedImage, Hero, TranslatePipe, SectionDivider, Section],
  templateUrl: './gallery.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './gallery.css',
})
export class Gallery {
  private readonly document = inject(DOCUMENT);

  galleryImageService = inject(GalleryImageService);
  selectedImage = signal<ImageAsset | null>(null);
  showLightBox = signal<boolean>(false);
  scrollY = 0;

  showImage(image: ImageAsset) {
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

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.showLightBox()) this.closeImage();
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
