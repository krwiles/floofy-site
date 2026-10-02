import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { ScriptLoader } from './script-loader.service';

const SRC = 'https://example.test/widget.js';

describe('ScriptLoader', () => {
  let loader: ScriptLoader;
  let document: Document;

  beforeEach(() => {
    // A fresh loader per test (its cache lives on the instance), plus the document it writes into.
    TestBed.resetTestingModule();
    loader = TestBed.inject(ScriptLoader);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    // Remove every script tag a test added, so none leaks into later tests.
    document.querySelectorAll(`script[src="${SRC}"]`).forEach((script) => script.remove());
  });

  /** Every script tag on the page for the test URL. */
  function scripts(): HTMLScriptElement[] {
    return Array.from(document.querySelectorAll(`script[src="${SRC}"]`));
  }

  it('adds one async script tag, and resolves once it loads', async () => {
    // Act: ask for the script, then let the browser "finish" loading it.
    const loaded = loader.load(SRC);
    scripts()[0].dispatchEvent(new Event('load'));

    // Assert: one async tag, and the promise resolved.
    await expect(loaded).resolves.toBeUndefined();
    expect(scripts().length).toBe(1);
    expect(scripts()[0].async).toBe(true);
  });

  it('reuses the same load for a second request of the same URL', () => {
    // Act: ask twice.
    const first = loader.load(SRC);
    const second = loader.load(SRC);

    // Assert: one tag, one shared promise.
    expect(second).toBe(first);
    expect(scripts().length).toBe(1);
  });

  it('rejects when the script fails, and tries again on the next request', async () => {
    // Act: the first attempt fails.
    const failed = loader.load(SRC);
    scripts()[0].dispatchEvent(new Event('error'));

    // Assert: the promise rejects.
    await expect(failed).rejects.toThrow(SRC);

    // Act: ask again.
    const retry = loader.load(SRC);

    // Assert: a fresh attempt, with a new tag, rather than the cached failure.
    expect(retry).not.toBe(failed);
    expect(scripts().length).toBe(2);
  });
});
