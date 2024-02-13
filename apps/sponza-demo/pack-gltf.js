// get glt path for args

const fs = require('fs');
const sharp = require('sharp');

const args = process.argv.slice(2);

const defaultConfig = {
  divideFactor: 2,
  maxSize: 1024,
  minSize: 512,
  optimiseImage: true,
  optimiseProbes: true,
  optimiseLightmaps: true,
  verbose: false,
  compressionLevel: 9,
  forceUByte: false,
};

if (args.length < 2 || args[0] === '-h' || args[0] === '--help') {
  console.error(
    `Usage: node optimize-gltf.js <source-path> <destination-path> [config]\n\n eg. config : ${JSON.stringify(
      defaultConfig
    )}`
  );
  process.exit(1);
}

const gltfSourcePath = args.shift();
const gltfDestination = args.shift();

const config = {
  ...defaultConfig,
  ...(args.length ? JSON.parse(args.shift()) : undefined),
};

const {
  // suffix,
  divideFactor,
  maxSize,
  minSize,
  optimiseImage,
  optimiseProbes,
  optimiseLightmaps,
  verbose,
  compressionLevel,
  forceUByte,
} = config;

const gltfSourcePathSpl = gltfSourcePath.split('/');
const gltfSourceFilename = gltfSourcePathSpl.pop();
const gltfSourceDirName = gltfSourcePathSpl[gltfSourcePathSpl.length - 1];
const gltfSourceDirPath = gltfSourcePathSpl.join('/');

const gltfDestinationPathSpl = gltfDestination.split('/').slice(0, -1);
const gltDestinationDirName =
  gltfDestinationPathSpl[gltfDestinationPathSpl.length - 1];
const gltfDestinationDirPath = gltfDestinationPathSpl.join('/');

if (verbose) {
  console.log(
    'Optimise ' + gltfSourceFilename + ' with config ' + JSON.stringify(config)
  );
}

if (!fs.existsSync(gltfSourcePath)) {
  console.error('File not found:', gltfSourcePath);
  process.exit(1);
}

if (minSize > maxSize) {
  const t = minSize;
  minSize = maxSize;
  maxSize = t;
}

const gltf = JSON.parse(fs.readFileSync(gltfSourcePath, 'utf8'));

const images = gltf.images || [];

const imageRefs = optimiseImage
  ? images.map((image) => {
      return [image, 'uri', image.uri];
    })
  : [];

const scenes = gltf.scenes || [];

for (let scene of scenes) {
  probes = scene.extras?.bake_gi_export_json?.probes;

  if (probes && optimiseProbes) {
    for (let probe of probes) {
      if (probe.irradiance_file) {
        imageRefs.push([probe, 'irradiance_file', probe.irradiance_file]);
      }

      if (probe.reflection_file) {
        imageRefs.push([probe, 'reflection_file', probe.reflection_file]);
      }

      if (probe.file) {
        imageRefs.push([probe, 'file', probe.file]);
      }
    }
  }

  lightmaps = scene.extras?.bake_gi_export_json?.baked_maps;

  if (lightmaps && optimiseLightmaps) {
    for (let lightmap of lightmaps) {
      if (lightmap.maps && lightmap.maps.length > 0) {
        lightmap.maps.forEach((map) => {
          imageRefs.push([map, 'filename', map.filename]);
        });
      }
    }
  }
}

// map urls to relative url

let promisesStack = Promise.resolve();

const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

for (let imageRef of imageRefs) {
  const ref = imageRef[0];
  const key = imageRef[1];
  const url = imageRef[2];

  const relativeUrl = url.split(gltfSourceDirName + '/').pop();

  const sourcePath = gltfSourceDirPath + '/' + url;
  const destPath = gltfDestinationDirPath + '/' + url;

  const sourceRelativeDirSplit = sourcePath.split('/');
  const sourceFilename = sourceRelativeDirSplit.pop();

  const destRelativeDirSplit = destPath.split('/').slice(0, -1);
  const distDirectory = destRelativeDirSplit.join('/');
  if (!fs.existsSync(distDirectory)) {
    fs.mkdirSync(distDirectory, { recursive: true });
  }

  if (fs.existsSync(sourcePath)) {
    // const sourceBaseFilename = sourceFilename.split('.').slice(0, -1).join('.');
    // const sourceDirectory = sourceRelativeDirSplit.join('/');

    let image = sharp(sourcePath);
    const extension = relativeUrl.split('.').pop().toLowerCase();

    if (supportedExtensions.includes(extension)) {
      promisesStack = promisesStack.then(() =>
        image.metadata().then((metadata) => {
          minImageSize = Math.min(metadata.width, metadata.height);
          maxImageSize = Math.max(metadata.width, metadata.height);

          let newDivideFactor = divideFactor;

          dividedMinSize = minImageSize / newDivideFactor;
          dividedMaxSize = maxImageSize / newDivideFactor;

          if (dividedMaxSize > maxSize) {
            newDivideFactor = Math.ceil(maxImageSize / maxSize);
          }

          if (dividedMinSize < minSize) {
            newDivideFactor = Math.floor(minImageSize / minSize);
          }

          if (newDivideFactor < 1) {
            newDivideFactor = 1;
          }

          const filename = relativeUrl.split('/').pop();

          const finalWidth = Math.round(metadata.width / newDivideFactor);
          const finalHeight = Math.round(metadata.height / newDivideFactor);

          const use16BitsColorDepth = metadata?.depth === 'ushort';

          if (verbose) {
            console.log(
              'Resize image : ' +
                filename +
                ' : ' +
                metadata.width +
                'x' +
                metadata.height +
                ' -> ' +
                finalWidth +
                'x' +
                finalHeight,
              ' [/' + newDivideFactor + ']'
            );
          }


          if(use16BitsColorDepth && !forceUByte) {
            image = image.toColourspace( metadata.space === 'srgb' ? 'srgb16' : 'rgb16')
          }

          return image
            .png({
              compressionLevel,
            })
            .resize(finalWidth, finalHeight)
            .toFile(destPath);
          // }
        })
      );
    } else {
      if (verbose) {
        console.log(
          '! sharp does not support supported :',
          sourcePath.split('/').pop()
        );
      }
      promisesStack = promisesStack.then(
        () =>
          new Promise((resolve, reject) => {
            fs.copyFile(sourcePath, destPath, (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          })
      );
    }
  } else {
    console.error('Texture File not found:', url);
  }
}

promisesStack.then(() => {
  // const tempGltfPath = gltfSourcePath.replace('.gltf', suffix + '.gltf');

  const binUris = gltf.buffers.map((buffer) => buffer.uri);

  binUris.forEach((binUri) => {
    const relativePath = binUri.split(gltfSourceDirName + '/').pop();

    const sourcePath = gltfSourceDirPath + '/' + binUri;
    const destPath = gltfDestinationDirPath + '/' + relativePath;

    fs.copyFileSync(sourcePath, destPath);
  });

  fs.writeFileSync(gltfDestination, JSON.stringify(gltf, null, 2));
});
