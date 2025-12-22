import { builder, Builder } from '@builder.io/react';

// Initialize Builder with your public API key
// Get the API key from environment variables
const BUILDER_PUBLIC_API_KEY = import.meta.env.VITE_BUILDER_PUBLIC_API_KEY;

// Guard against missing API key
if (!BUILDER_PUBLIC_API_KEY) {
  console.error('Builder.io API key is missing. Please set VITE_BUILDER_PUBLIC_API_KEY in your environment variables.');
} else {
  // Initialize Builder
  builder.init(BUILDER_PUBLIC_API_KEY);
}

// Configure Builder for your site - allow dynamic content for editing
Builder.isStatic = false;

export { builder, Builder };
