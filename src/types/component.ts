import { ReactNode } from 'react';

export type ComponentWithChildren<Props = {}> = Props & {
  children?: ReactNode;
}; 