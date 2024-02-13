export function cleanObjectName(name: string): string {
  return name.replace(' ','_').replace(/[^a-zA-Z0-9_-]/g, '');

}
