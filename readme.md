# Three JS probes volumes

This project is a implementation test of probes volumes in three js. The goal is to be able to have robust probes volumes in three js that can be used for lighting and reflections. 

It inspired from Blender eevee probes volumes and it is made to be integrated with [this blender plugin](https://github.com/gillesboisson/blender-probes-export) which allow to bake probes based on eevee volumes. Radiance and relfection baking is separated in different probes based on these methods :

- Irradiance : [https://learnopengl.com/PBR/IBL/Diffuse-irradiance](https://learnopengl.com/PBR/IBL/Diffuse-irradiance)
- Specular : [https://learnopengl.com/PBR/IBL/Specular-IBL](https://learnopengl.com/PBR/IBL/Specular-IBL)

The current version is rough as is still in progress. It is not optimized and it is not integrated with three js. 

### Demo

![Demo](./doc/screen-2023-10-27.png)

Only probe debug is supported, central sphere represebt interpolated probes data at its position.

Demo visible at [https://three-probes.dotify.eu/](https://three-probes.dotify.eu/)

### Roadmap

- [x] Volumes structure and scene integration
- [x] Probes interpolation with objects
- [x] Preview debug tools
- [x] Global probes
- [x] HDR Support
- [ ] Three js materials extension
- [ ] Optimisation, class renames, code cleaning
- [ ] Integration test with three js framework
- [ ] Dead probes detection & or occlusion between probes
- [ ] integration with other baking method ( based on blender baking tools )
- [ ] Three JS baking tools (for now is based on blender plugin exported data)

### Features

- [ ] specular cubemaps volume
  - [x] box area
  - [x] sphere area
  - [ ] parallax correction

- [ ] irradiance
  - [x] grid volume
  - [ ] detect dead probes or occlusion between probes
  - [ ] other volume shapes TBD


- [x] volume data structure
  - [x] volume interpolation
  - [x] global environment as fallback
  - [x] cubemap based probes
  - [x] irradiance based probes
  - [x] object solver (brute force : octo tree implementation)
  

- [ ] baking
  - [x] data schema based on blender plugin (details [blender plugin on doc](https://github.com/gillesboisson/blender-probes-export))
  - [x] data loader 
  - [x] SDR texture wrapper
  - [x] HDR texture wrapper
  - [ ] three js baking tools (based on data schema)

- [ ] material
  - [ ] shader helper
  - [ ] standard material extension
  - [ ] physical material extension
  

- [ ] others
  - [x] debugging tools


### Three JS integration

For now it is made as an external app based on three js. The ultimate goal is to integrate it with three js as a plugin.

Notes of what is different from three js :

- !Specular / irradiance cubemap is not separated in three JS
- !Three JS probes extends light class, this lib has its own light class
- !Some app feature mimic three js features rather than using three js classes, some refactoring is needed

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