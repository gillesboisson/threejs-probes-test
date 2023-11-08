import {
  Renderer,
  Scene,
  PerspectiveCamera,
  Color,
  WebGLRenderer,
  Camera,
  Sphere,
  Object3D,
  Mesh,
  SphereGeometry,
  MeshLambertMaterial,
  AmbientLight,
  PointLight,
  BoxHelper,
} from 'three'
import { createScanner } from 'typescript'
import { App } from './app';
// import Ammo from "../types/ammo";


window.addEventListener('load',async () => {

  const app = new App();
  await app.init();
  app.start();

});
