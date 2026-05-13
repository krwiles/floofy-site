import { TestBed } from '@angular/core/testing';

import { TranslatePipe } from './translate.pipe';
import { I18nService } from '../services/i18n.service';

describe('TranslatePipe', () => {
  it('create an instance', () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: (key: string) => key,
          },
        },
      ],
    });

    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe).toBeTruthy();
  });
});
