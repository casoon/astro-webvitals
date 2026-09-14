declare module 'virtual:casoon-pages/config' {
  const config: import('./index').ResolvedConfig;
  export default config;
}

declare module 'virtual:casoon-pages/showcase' {
  export const examples: import('./lib/showcase').ShowcaseExample[];
}
