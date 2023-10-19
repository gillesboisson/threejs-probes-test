# Three JS probes volumes

This project is a implementation test of probes volumes in three js. The goal is to be able to have robust probes volumes in three js that can be used for lighting and reflections. 

It inspired from Blender eevee probes volumes and it is made to be integrated with [this blender plugin](https://github.com/gillesboisson/blender-probes-export) which allow to bake probes based on eevee volumes. 

The current version is rough as is still in progress. It is not yet ready to be integrated directly in three js, but the final goal is to have a full integration with three js render pipeline.



## Targets

### Demo

Demo visible at [https://three-probes.dotify.eu/](https://three-probes.dotify.eu/)

### Roadmap

- [x] Volumes structure and scene integration
- [x] Probes interpolation with objects
- [x] Preview debug tools
- [ ] Three js materials extension
- [ ] Integration test with three js framework
- [ ] Dead probes detection & or occlusion between probes
- [ ] integration with other baking method (based on blender baking tools )
- [ ] Three JS baking tools (for now is based on blender plugin exported data)


### Features



- [ ] reflection cubemaps volume
  - [ ] multilevel roughness texture
    - [x] roughness > texture lod
    - [ ] material > texture lod
  - [ ] parallax correction

- [ ] irradiance grid
  - [ ] detect dead probes
    
- [ ] ponderation
    - [x] Reflection box area ponderation
    - [x] Reflection sphere area ponderation
    - [ ] Occlusion test between probes
    - [ ] global fallback mipmap (interpolation only if there is only one probe and have a global ratio of 1)


- per vertex probe ponderation
    - !! not supported with webgl2 : cubemaps not available on threejs / Webgl2



### Three js integration
- integrate volumes ponderation with three js scene sorting (octo tree ?)
- integrate probes with three js probes (extends three js probes ?)
- extends three js PBR materials to support probes volume between irradiance and reflection


## How to build / run the project

This is typescript project, it use lerna to manage multiple packages.

```bash

# build all
yarn
yarn build:dev

# dev app
cd ./app
yarn serve
# or
yarn build:dev
```