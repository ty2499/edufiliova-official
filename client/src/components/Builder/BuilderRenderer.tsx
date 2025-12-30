import { BuilderComponent, builder } from '@builder.io/react';
import { ReactNode } from 'react';

interface BuilderRendererProps {
  model: string;
  url?: string;
  entry?: string;
  children?: ReactNode;
}

export const BuilderRenderer = ({ 
  model, 
  url, 
  entry,
  children 
}) => {
  return (
    <BuilderComponent 
      model={model}
      url={url}
      entry={entry}
    >
      {/* Fallback content when Builder.io content is not available */}
      {children}
    </BuilderComponent>
  );
};
