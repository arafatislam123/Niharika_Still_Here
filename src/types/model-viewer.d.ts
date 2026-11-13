// JSX typing for the <model-viewer> custom element (attributes we use).
import type { CSSProperties, ReactNode } from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        src: string;
        alt?: string;
        'camera-controls'?: string;
        'auto-rotate'?: string;
        'touch-action'?: string;
        'shadow-intensity'?: string;
        exposure?: string;
        ar?: string;
        'ar-modes'?: string;
        'ar-scale'?: string;
        style?: CSSProperties;
        children?: ReactNode;
      };
    }
  }
}
