// Type declarations for CSS imports used by the web target (Metro CSS interop).
declare module "*.css";

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
