import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { Contact } from './contact';
import { expectNoAxeViolations } from '../../../testing/expect-no-axe-violations';
import { ApiService } from '../../services/api.service';
import { CreateContactResponse } from '../../models/contact.model';

describe('Contact', () => {
  let component: Contact;
  let fixture: ComponentFixture<Contact>;
  // The reply to the contact POST, sent by hand in each test.
  let reply: Subject<CreateContactResponse>;

  beforeEach(async () => {
    // A fake ApiService whose submitContact waits until the test replies.
    reply = new Subject<CreateContactResponse>();
    const api = { submitContact: vi.fn(() => reply) };

    // Render the real page once per test, with the fake API.
    await TestBed.configureTestingModule({
      imports: [Contact],
      providers: [{ provide: ApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(Contact);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  /** Type a value into a control, the way a visitor does. */
  function type(selector: string, value: string): void {
    const control = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    control.value = value;
    control.dispatchEvent(new Event('input'));
  }

  /** The form's submit button. */
  function submitButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[type="submit"]');
  }

  it('should create', () => {
    // Assert: the page builds.
    expect(component).toBeTruthy();
  });

  it('disables the submit button while a message is sending, then enables it again', async () => {
    // Arrange: fill in a valid message.
    type('input[type="text"]', 'Robin');
    type('input[type="email"]', 'robin@example.com');
    type('textarea', 'Hello!');

    // Act: submit it.
    submitButton().click();
    await fixture.whenStable();

    // Assert: the button is disabled while the request is in flight.
    expect(submitButton().disabled).toBe(true);

    // Act: the reply arrives.
    reply.next({ code: 'ok' });
    reply.complete();

    // Let Signal Forms finish its submit (it clears submitting() a few promise steps later), then re-render.
    await new Promise((resolve) => setTimeout(resolve));
    await fixture.whenStable();

    // Assert: the button can be used again.
    expect(submitButton().disabled).toBe(false);
  });

  it('moves focus to the first empty field when submitted blank', async () => {
    // Act: submit without filling anything in.
    submitButton().click();
    await fixture.whenStable();

    // Assert: the visitor lands on the name field, now marked invalid.
    const name = fixture.nativeElement.querySelector('input[type="text"]') as HTMLInputElement;
    expect(document.activeElement).toBe(name);
    expect(name.getAttribute('aria-invalid')).toBe('true');
  });

  it('has no accessibility violations in its form, before and after a blank submit', async () => {
    // Arrange: the form as rendered.
    const form = fixture.nativeElement.querySelector('form');

    // Assert: clean before anything happens.
    await expectNoAxeViolations(form);

    // Act: submit blank, showing every error.
    submitButton().click();
    await fixture.whenStable();

    // Assert: still clean with the errors showing.
    await expectNoAxeViolations(form);
  });
});
