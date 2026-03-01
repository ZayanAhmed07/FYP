/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import type * as React from 'react';

  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}





