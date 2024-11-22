declare module '@shadcn/ui' {
  import { FC } from 'react';

  export const Button: FC<any>;
  export const Card: FC<any> & {
    Header: FC<any>;
    Content: FC<any>;
    Footer: FC<any>;
  };
  export const Progress: FC<any>;

  // Add other components as needed
} 