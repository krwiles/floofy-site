import { TestBed } from '@angular/core/testing';

import { TranslatePipe } from './translate.pipe';
import { I18nService } from '../../services/i18n.service';

describe('TranslatePipe', () => {
  it('create an instance', () => {
    // Arrange: a stub I18nService that echoes keys.
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

    // Act and assert: the pipe builds inside an injection context (it uses inject()).
    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe).toBeTruthy();
  });
});
