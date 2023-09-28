# Three JS probes volumes

This project is a implementation test of probes volumes in three js. The goal is to be able to have robust probes volumes in three js that can be used for lighting and reflections. 

It inspired from Blender eevee probes volumes and it is made to be integrated with [this blender plugin](https://github.com/gillesboisson/blender-probes-export) which allow to bake probes based on eevee volumes. 

The current version is rough as is still in progress. It is not yet ready to be integrated directly in three js, but the final goal is to have a full integration with three js render pipeline.

## Getting started

This is typescript project, it use lerna to manage multiple packages.

```bash

# build all
yarn
yarn build:dev

# dev app
cd ./app
yarn serve
```