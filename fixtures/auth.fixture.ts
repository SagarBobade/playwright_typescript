import { test as base } from '@playwright/test';

export const test = base.extend({
  // auth session fixture will come here
});

export { expect } from '@playwright/test';
