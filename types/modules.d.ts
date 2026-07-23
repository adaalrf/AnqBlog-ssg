/**
 * Type declarations for modules without type definitions.
 */

declare module 'jsdom' {
  export class JSDOM {
    constructor(html: string, options?: unknown);
    window: {
      document: Document;
    };
  }
}

declare module 'html-truncate' {
  function truncate(html: string, maxLength: number, options?: { ellipsis?: string }): string;
  export = truncate;
}
