import type { ReactNode } from 'react';
import { GLOSSARY_TERM } from '../../lib/text';
import { GlossaryTerm } from './GlossaryTerm';

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(GLOSSARY_TERM)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    parts.push(<GlossaryTerm key={index} slug={match[1]} display={match[2]} />);
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/** Content text: blank lines split paragraphs, `[[term]]` becomes a glossary button. */
export function RichText({ text, inline = false }: { text: string; inline?: boolean }) {
  if (inline) return <>{renderInline(text)}</>;
  return (
    <>
      {text.split(/\n\s*\n/).map((paragraph, i) => (
        <p key={i}>{renderInline(paragraph.trim())}</p>
      ))}
    </>
  );
}
