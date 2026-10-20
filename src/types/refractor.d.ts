declare module "refractor/all" {
  export const refractor: {
    registered: (language: string) => boolean
  }
}
