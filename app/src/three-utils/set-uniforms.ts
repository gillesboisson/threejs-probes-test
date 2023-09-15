import { IUniform } from 'three';


export function setUniforms(
  uniformObject: { [uniform: string]: IUniform; },
  params: any
): { [uniform: string]: IUniform; } {
  for (let paramName in params) {
    if (!uniformObject[paramName])
      uniformObject[paramName] = { value: undefined };
    uniformObject[paramName].value = params[paramName];
  }
  return uniformObject;
}
