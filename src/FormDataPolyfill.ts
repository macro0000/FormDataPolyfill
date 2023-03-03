export default interface FormDataPolyfill<T> {
  append: (name: string, value: string | number) => T
  appendFile: (name: string, path: string, fileName?: string) => T
  generate: () => [ArrayBufferLike, string]
}