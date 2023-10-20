import {
  DataTexture,
  DefaultLoadingManager,
  ImageLoader,
  LoadingManager,
  PMREMGenerator,
  Renderer,
  Scene,
  Texture,
  WebGLRenderer,
} from 'three'

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { ProbesScene } from '../ProbesScene'
import { AnyProbeVolumeJSON } from '../data'
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from '../volume'
import { generateProbeGridCubemaps } from './generateProbeGridCubemaps'
import { generateReflectionProbeCubemap } from './generateReflectionProbeCubemap'

export class ProbeLoader {
  dir: string = './'
  constructor(
    readonly renderer: WebGLRenderer,
    readonly loadManager: LoadingManager = DefaultLoadingManager,
    
  ) {}

  async load(url: string): Promise<ProbesScene> {
    const probesJSON = await this.loadJSON(url)
    const images = await this.loadImages(probesJSON)

    const volumes: AnyProbeVolume[] = []
    const gen = new PMREMGenerator(this.renderer)
    
    let hdrTexture: Texture;

    for (let i = 0; i < probesJSON.length; i++) {
      const image = images[i]
      const json = probesJSON[i]

      switch (json.type) {
        case 'irradiance':
          if (image instanceof DataTexture) {
            throw new Error('DataTexture not supported for irradiance probes')
          }

          const textures = generateProbeGridCubemaps(json, image)

          volumes.push(
            new IrradianceProbeVolume({
              ...json,
              textures,
            })
          )

          break

        case 'reflection':
          if (image instanceof DataTexture) {
            throw new Error('DataTexture not supported for reflection probes')
          }

          const texture = generateReflectionProbeCubemap(json, image)
          const volume = new ReflectionProbeVolume({
            ...json,
            textures: [texture],
          })
          console.log('volume', volume)
          volumes.push(volume)
          break

        case 'global':
          if (image instanceof HTMLImageElement) {
            throw new Error('HTMLImageElement not supported for global probes')
          }

          hdrTexture = gen.fromEquirectangular(image).texture;

          break

        default:
          // throw new Error('unknown probe type')

          break
      }
    }

    gen.dispose();

    return new ProbesScene(volumes, hdrTexture)
  }

  loadJSON(url: string): Promise<Array<AnyProbeVolumeJSON>> {
    this.dir = url.replace(/[^/]+$/, '')
    return fetch(url).then((res) => res.json() as Promise<AnyProbeVolumeJSON[]>)
  }

  loadImages(
    probes: AnyProbeVolumeJSON[]
  ): Promise<Array<HTMLImageElement | DataTexture>> {
    const urls = probes.map((probe) => this.dir + probe.file)
    const t = new ImageLoader()
    return new Promise((resolve, err) => {
      let indexLoading = 0
      let indexLoaded = 0
      const images: Array<HTMLImageElement | DataTexture> = []

      const imagerLoader = new ImageLoader(this.loadManager)
      const rgbeLoader = new RGBELoader(this.loadManager)

      const loadNext = () => {
        indexLoaded++
        if (indexLoaded === urls.length) {
          resolve(images)
        }else{
          loadImage();
        }
      }

      const loadImage = () => {
        const url = urls[indexLoading++]

        const extension = url.split('.').pop().toLowerCase()

        if (extension !== 'hdr') {
          imagerLoader.load(
            url,
            (image) => {
              images.push(image)
              loadNext()
            },
            undefined,
            (e) => {
              err(e)
            }
          )
        } else {
          rgbeLoader.load(
            url,
            (image) => {
              images.push(image)
              loadNext()
            },
            undefined,
            (e) => {
              err(e)
            }
          )
        }
      }

      loadImage()
    })
  }
}
