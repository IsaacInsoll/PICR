import { describe, expect, test } from 'vitest';
import {
  escapeHtml,
  renderEscapedHtmlTemplate,
} from '../../backend/express/htmlTemplate.js';

describe('HTML template rendering', () => {
  test('escapes text and attribute delimiters', () => {
    expect(escapeHtml(`Client "A" & <script>alert('x')</script>`)).toBe(
      'Client &quot;A&quot; &amp; &lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;',
    );
  });

  test('escapes every substituted field in one pass', () => {
    const template =
      '<title>{title}</title><meta property="og:image" content="{image}" />';

    expect(
      renderEscapedHtmlTemplate(template, {
        title: 'Gallery {image} & friends',
        image: 'https://picr.test/image/1/name.jpg?x=1&y="unsafe"',
      }),
    ).toBe(
      '<title>Gallery {image} &amp; friends</title><meta property="og:image" content="https://picr.test/image/1/name.jpg?x=1&amp;y=&quot;unsafe&quot;" />',
    );
  });

  test('leaves unknown placeholders unchanged', () => {
    expect(
      renderEscapedHtmlTemplate('{known} {unknown}', { known: 'value' }),
    ).toBe('value {unknown}');
  });
});
