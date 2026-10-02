import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Streaming } from './streaming';
import { ScriptLoader } from '../../services/script-loader.service';
import { StreamScheduleService } from '../../services/stream-schedule.service';
import { StreamSlot } from '../../models/stream-schedule';

// Made-up cards, so the tests prove the page shows whatever the schedule service derives (nothing hard-coded).
const SLOTS: StreamSlot[] = [
  { zoneName: 'Home Zone', time: '11:00 AM HZT', weekday: 'Funday', isLocal: false },
  { zoneName: 'Far Zone', time: '1:00 AM FZT', weekday: 'Moonday', isLocal: false },
  { zoneName: 'Visitor Zone', time: '4:00 PM VZT', weekday: 'Funday', isLocal: true },
];

describe('Streaming', () => {
  let fixture: ComponentFixture<Streaming>;
  // Resolves the fake Twitch script load when a test wants it to.
  let finishScriptLoad: () => void;

  beforeEach(async () => {
    // A fake script loader whose load the test finishes by hand, and a fake schedule with the made-up cards.
    const scriptLoader = { load: vi.fn(() => new Promise<void>((resolve) => (finishScriptLoad = resolve))) };
    const schedule = { slots: vi.fn(() => SLOTS) };

    // Render the real page in English with the fakes.
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Streaming],
      providers: [
        { provide: ScriptLoader, useValue: scriptLoader },
        { provide: StreamScheduleService, useValue: schedule },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Streaming);
    await fixture.whenStable();
  });

  afterEach(() => {
    // Put back any faked globals and timers, even when a test fails partway.
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  /** The page's rendered text. */
  function text(): string {
    return fixture.nativeElement.textContent;
  }

  /** A fake Twitch.Embed that records each player built, installed as the global the page reads. */
  function fakeTwitch() {
    // A mock constructor that records every call.
    const embed = vi.fn();

    // Install it where Twitch's script would put it.
    vi.stubGlobal('Twitch', { Embed: embed });
    return embed;
  }

  it('shows the translated hero, with its tagline and no buttons', () => {
    // Assert: the hero's own text, and nothing clickable inside it.
    const hero: HTMLElement = fixture.nativeElement.querySelector('app-hero');
    expect(hero.textContent).toContain('STREAMING');
    expect(hero.textContent).toContain('Twitch • Art Streams • Vtuber');
    expect(hero.querySelectorAll('a, button').length).toBe(0);
  });

  it('shows one schedule card per time zone, with the visitor’s own last and featured', () => {
    // Act: read the cards.
    const cards: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('article'));

    // Assert: three cards, only the last one featured.
    expect(cards.length).toBe(3);
    expect(cards.map((card) => card.classList.contains('card-on-section-light-special'))).toEqual([false, false, true]);

    // Each shows its zone (the visitor's as "Your time" plus the zone), its time, and "Every <weekday>".
    expect(cards[0].textContent).toContain('Home Zone');
    expect(cards[1].textContent).toContain('1:00 AM FZT');
    expect(cards[1].textContent).toContain('Every Moonday');
    expect(cards[2].textContent).toContain('Your time');
    expect(cards[2].textContent).toContain('Visitor Zone');
  });

  it('fills every section header, with nothing hard-coded in English', () => {
    // Assert: both sections' headings come from the locale files.
    expect(text()).toContain('Floofy Standard Time');
    expect(text()).toContain('Watch live');
    expect(text()).not.toContain('streaming.');
  });

  it('links to the Twitch channel beside the player', () => {
    // Act: find the Twitch chip.
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href="https://www.twitch.tv/summerfloofy"]');

    // Assert: it's there.
    expect(link).toBeTruthy();
  });

  it('builds the player once Twitch’s script has loaded, only for the allowed sites', async () => {
    // Arrange: Twitch's script will define Twitch.Embed.
    const embed = fakeTwitch();

    // Act: the script finishes loading.
    finishScriptLoad();
    await fixture.whenStable();

    // Assert: one player, for the channel, allowed only on the live site and local development.
    expect(embed).toHaveBeenCalledTimes(1);
    const [elementId, options] = embed.mock.calls[0];
    expect(elementId).toBe('twitch-embed');
    expect(options.channel).toBe('summerfloofy');
    expect(options.parent).toEqual(['localhost', '127.0.0.1', 'summerfloofy.com', 'www.summerfloofy.com']);
  });

  it('rebuilds the player once, after resizing settles, when the width changes', () => {
    // Arrange: a player built at 800px wide, and timers the test controls.
    vi.useFakeTimers();
    vi.stubGlobal('innerWidth', 800);
    const embed = fakeTwitch();
    fixture.componentInstance.loadEmbed();
    embed.mockClear();

    // Act: several resize events while widening the window, then the pause.
    vi.stubGlobal('innerWidth', 1100);
    fixture.componentInstance.onWindowResize();
    fixture.componentInstance.onWindowResize();
    vi.advanceTimersByTime(299);

    // Assert: nothing yet, then exactly one rebuild once resizing has settled.
    expect(embed).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(embed).toHaveBeenCalledTimes(1);
  });

  it('keeps the player when only the height changes (a phone’s toolbar sliding away)', () => {
    // Arrange: a player built at 400px wide.
    vi.useFakeTimers();
    vi.stubGlobal('innerWidth', 400);
    const embed = fakeTwitch();
    fixture.componentInstance.loadEmbed();
    embed.mockClear();

    // Act: the window gets taller but not wider, and resizing settles.
    vi.stubGlobal('innerHeight', 900);
    fixture.componentInstance.onWindowResize();
    vi.advanceTimersByTime(300);

    // Assert: the stream wasn't restarted.
    expect(embed).not.toHaveBeenCalled();
  });
});
