import { AnyProbeVolumeJSON } from "../data"
import { AnyProbeVolume, IrradianceProbeVolume, ReflectionProbeVolume } from "../volume"
import { generateProbeGridCubemaps } from "./generateProbeGridCubemaps"
import { generateReflectionProbeCubemap } from "./generateReflectionProbeCubemap"


export class ProbeLoader {
  dir: string = './'
  constructor() {}

  async load(url: string, parrallelLoad = 4): Promise<AnyProbeVolume[]> {
    const probesJSON = await this.loadJSON(url)
    const images = await this.loadImages(probesJSON, parrallelLoad)

    const volumes: AnyProbeVolume[] = []

    for (let i = 0; i < probesJSON.length; i++) {
      const image = images[i]
      const json = probesJSON[i]

      switch (json.type) {
        case 'irradiance':
          const textures = generateProbeGridCubemaps(json, image)

          volumes.push(
            new IrradianceProbeVolume({
              ...json,
              textures,
            })
          )

          break

        case 'reflection':
          const texture = generateReflectionProbeCubemap(json, image)
          const volume = new ReflectionProbeVolume({
            ...json,
            textures: [texture],
          })
          console.log('volume',volume);
          volumes.push(volume)
          break

        default:
          // throw new Error('unknown probe type')

          break
      }
    }

    return volumes
  }

  loadJSON(url: string): Promise<AnyProbeVolumeJSON[]> {
    this.dir = url.replace(/[^/]+$/, '')
    return fetch(url).then((res) => res.json() as Promise<AnyProbeVolumeJSON[]>)
  }

  loadImages(
    probes: AnyProbeVolumeJSON[],
    parrallelLoad = 4
  ): Promise<HTMLImageElement[]> {
    const urls = probes.map((probe) => this.dir + probe.file)

    return new Promise((resolve, err) => {
      let indexLoading = 0
      let indexLoaded = 0
      const images: HTMLImageElement[] = []

      const loadNext = () => {
        const index = indexLoading++
        console.log('index', index)

        const img = new Image()
        img.src = urls[index]
        images.push(img)
        img.onload = () => {
          indexLoaded++

          if (indexLoaded === urls.length) {
            resolve(images)
            return
          }

          if (indexLoading < urls.length) {
            loadNext()
          }
        }

        img.onerror = (e) => {
          err(e)
        }
      }

      for (let i = 0; i < parrallelLoad && i < urls.length; i++) {
        loadNext()
      }
    })
  }
}
