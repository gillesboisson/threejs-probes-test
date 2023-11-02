import {
  CubeTexture,
  DataTexture,
  DataTextureLoader,
  DefaultLoadingManager,
  LoadingManager,
  PMREMGenerator,
  Renderer,
  Scene,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { ProbeVolumeHandler } from '../ProbeVolumeHandler'
import { AnyProbeVolumeJSON, GlobalEnvJSON } from '../data'
import {
  AnyProbeVolume,
  IrradianceProbeVolume,
  ReflectionProbeVolume,
} from '../volume'
import { generateProbeGridCubemaps } from './generateProbeGridCubemaps'
import { generateReflectionProbeCubemap } from './generateReflectionProbeCubemap'
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader'
import { CubemapWrapper } from './CubemapsWrapper'
import { Probe } from '../Probe'
import { GlobalEnvVolume } from '../volume/GlobalEnvVolume'

export class ProbeLoader {
  dir: string = './'
  protected cubemapWrapper: CubemapWrapper
  constructor(
    readonly renderer: WebGLRenderer,
    readonly loadManager: LoadingManager = DefaultLoadingManager
  ) {
    this.cubemapWrapper = new CubemapWrapper(renderer)
  }

  async load(url: string): Promise<ProbeVolumeHandler> {
    const sourceData = await this.loadJSON(url)

    // Load probes
    const probesJSON = sourceData.filter(
      (probe) => probe.type !== 'global'
    ) as AnyProbeVolumeJSON[]

    const sourceTextures = await this.loadTextures(
      probesJSON.map((probe) => this.dir + probe.file)
    )

    const volumes: AnyProbeVolume[] = []
    const gen = new PMREMGenerator(this.renderer)

    const cubemapWrapper = new CubemapWrapper(this.renderer)

    for (let i = 0; i < probesJSON.length; i++) {
      const sourceTexture = sourceTextures[i]
      const json = probesJSON[i]

      switch (json.type) {
        case 'irradiance':
          

          const nbCubes =
            json.data.resolution[0] *
            json.data.resolution[1] *
            json.data.resolution[2]

          const irradianceLayouts = CubemapWrapper.gridLayout(
            sourceTexture.image.width,
            sourceTexture.image.height,
            json.cubemap_size,
            nbCubes
          )

          // const textures: CubeTexture[] = []
          const textures: CubeTexture[] =
            cubemapWrapper.wrapCubeCollectionFromTexture(
              sourceTexture,
              json.cubemap_size,
              irradianceLayouts
            )

          volumes.push(
            new IrradianceProbeVolume({
              ...json,
              textures,
            })
          )

          break

        case 'reflection':
          

          const reflectionLayouts = CubemapWrapper.lodLayout(
            json.cubemap_size,
            json.data.nb_levels
          )

          const texture = cubemapWrapper.wrapCubeLodFromTexture(
            sourceTexture,
            json.cubemap_size,
            reflectionLayouts
          )

          // const texture = generateReflectionProbeCubemap(json, image)
          const volume = new ReflectionProbeVolume({
            ...json,
            textures: [texture],
          })
          volumes.push(volume)
          break

        default:
          throw new Error('unknown probe type')

          break
      }
    }

    gen.dispose()

    let globalEnv: GlobalEnvVolume

    const envsJSON = sourceData.filter(
      (probe) => probe.type === 'global'
    ) as GlobalEnvJSON[]

    if (envsJSON.length > 1) {
      throw new Error('Only one global environment is supported')
    }


    if (envsJSON.length === 0) {
      console.warn('No global environment found')
    } else {
      const envJSON = envsJSON[0]
      const { data, irradiance_file, reflectance_file: reflection_file } = envJSON
      const textures = await this.loadTextures([
        this.dir + irradiance_file,
        this.dir + reflection_file,
      ])
      const irradianceSourceTexture = textures[0]

      const irradianceLayouts = CubemapWrapper.gridLayout(
        irradianceSourceTexture.image.width,
        irradianceSourceTexture.image.height,
        data.irradiance_export_map_size
      )

      const irradianceCubeTexture =
        cubemapWrapper.wrapCubeCollectionFromTexture(
          irradianceSourceTexture,
          data.irradiance_export_map_size,
          irradianceLayouts
        )[0]


      const reflectionSourceTexture = textures[1]

      const reflectionLayouts = CubemapWrapper.lodLayout(
        data.reflectance_export_map_size,
        data.reflectance_nb_levels
      )

      const reflectionCubeTexture = cubemapWrapper.wrapCubeLodFromTexture(
        reflectionSourceTexture,
        data.reflectance_export_map_size,
        reflectionLayouts
      )

      globalEnv = new GlobalEnvVolume(envJSON, {
        irradianceCubeTexture,
        reflectionCubeTexture,
      })
    }

    return new ProbeVolumeHandler(volumes, globalEnv)
  }

  loadJSON(url: string): Promise<Array<AnyProbeVolumeJSON | GlobalEnvJSON>> {
    this.dir = url.replace(/[^/]+$/, '')
    return fetch(url).then(
      (res) => res.json() as Promise<Array<AnyProbeVolumeJSON | GlobalEnvJSON>>
    )
  }

  loadTextures(urls: string[]): Promise<Array<Texture>> {
    // const urls = probes.map((probe) => this.dir + probe.file)
    return new Promise((resolve, err) => {
      let indexLoading = 0
      let indexLoaded = 0
      const images: Array<Texture> = []

      const rgbeLoader = new RGBELoader(this.loadManager)
      const exrLoader = new EXRLoader(this.loadManager)

      const loadNext = () => {
        indexLoaded++
        if (indexLoaded === urls.length) {
          resolve(images)
        } else {
          loadImage()
        }
      }

      const loadImage = () => {
        const url = urls[indexLoading++]

        const extension = url.split('.').pop().toLowerCase()

        switch (extension.toLowerCase()) {
          case 'exr':
            exrLoader.load(
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
            return
          case 'hdr':
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
            return
          default:
            const textureLoader = new TextureLoader()
            textureLoader.load(
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
            return
        }
      }

      loadImage()
    })
  }
}
