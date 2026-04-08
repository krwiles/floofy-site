import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  readonly heroImageLoaded = signal(false);

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
