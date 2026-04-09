import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { Carousel } from "../components/carousel/carousel";

@Component({
  selector: 'app-home',
  imports: [Carousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class Home implements OnInit {
  readonly heroImageLoaded = signal(false);
  readonly parallaxY = signal(0);
  readonly parallaxStrength = 0.30; // Adjust this value to increase/decrease the parallax effect

  onWindowScroll(): void {
    this.parallaxY.set(window.scrollY * this.parallaxStrength);
  }

  ngOnInit(): void {
    const image = new Image();
    image.src = '/G8s5y4ZakAA0XN9.jpeg';

    if (image.decode) {
      image
        .decode()
        .then(() => this.heroImageLoaded.set(true))
        .catch(() => this.heroImageLoaded.set(true));
      return;
    }

    image.onload = () => this.heroImageLoaded.set(true);
    image.onerror = () => this.heroImageLoaded.set(true);
  }
}
