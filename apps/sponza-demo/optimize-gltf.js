// get glt path for args

const fs = require('fs');
const sharp = require('sharp');


const args = process.argv.slice(2);

if (args.length < 1) {
  console.error('Usage: node optimize-gltf.js <gltf-path>');
  process.exit(1);
}

const gltfPath = args[0];

if (!fs.existsSync(gltfPath)) {
  console.error('File not found:', gltfPath);
  process.exit(1);
}

const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));

// get textures images url list

const images = gltf.images || [];

const textures = gltf.textures || [];

const imageRefs = images.map((image) => {
  return [image, 'uri', image.uri];
});

// get probes texture url and lightmaps texture url

const scenes = gltf.scenes || [];

for (let scene of scenes) {
  probes = scene.extras?.bake_gi_export_json?.probes;

  if (probes) {
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

  if (lightmaps) {
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

const gltfDirSplit = gltfPath.split('/').slice(0, -1);
const gltfDirName = gltfDirSplit[gltfDirSplit.length - 1];
const gltfDirPath = gltfDirSplit.join('/');



let promisesStack = Promise.resolve();

const supportedExtensions = ['jpg', 'jpeg', 'png', 'webp'];


const finalDirectory = './build/gltf';

for (let imageRef of imageRefs) {
  const ref = imageRef[0];
  const key = imageRef[1];
  const url = imageRef[2];

  // console.log(imageRef);

  const relativeUrl = url.split(gltfDirName + '/').pop();
  const relativeUrlSplit = relativeUrl.split('/');
  const destUrlSplit = [...relativeUrlSplit];
  if (destUrlSplit.length > 1) {
    destUrlSplit[0] += '-small';
  } else {
    destUrlSplit.splice(0, 0, 'small');
  }

  const path = gltfDirPath + '/' + url;
  const destPath = gltfDirPath + '/' + destUrlSplit.join('/');

  const distDirectory = destPath.split('/').slice(0, -1).join('/');

  const relativeDestUrl = destUrlSplit.join('/');

  // create dir if not exists

  if (!fs.existsSync(distDirectory)) {
    fs.mkdirSync(distDirectory, { recursive: true });
  }

  divideFactor = 2;

  if (fs.existsSync(path)) {
    const relativeUrl = url.split(gltfDirName + '/').pop();

    const image = sharp(path);
    const extension = relativeUrl.split('.').pop().toLowerCase();

    if (supportedExtensions.includes(extension)) {
      promisesStack = promisesStack.then(() =>
        image.metadata().then((metadata) => {
          console.log("Divide image: ", path.split('/').pop(),metadata.width, metadata.height, divideFactor)
          // console.log(metadata.width,metadata.height);
          return image
            .resize(
              Math.round(metadata.width / divideFactor),
              Math.round(metadata.height / divideFactor)
            )
            .toFile(destPath);
        })
      );
    } else {
      console.log("Divide image not supported: ", path.split('/').pop())
      promisesStack = promisesStack.then(
        () =>
          new Promise((resolve, reject) => {
            fs.copyFile(path, destPath, (err) => {
              if (err) {
                // console.error('Error copying file:', path, 'to:', destPath);
                reject(err);
              } else {
                resolve();
              }
            });
          })
      );
    }

    promisesStack = promisesStack.then(() => {
      ref[key] = relativeDestUrl;
    });
  } else {
    console.error('Texture File not found:', url);
  }
}



promisesStack.then(() => {
  const tempGltfPath = gltfPath.replace('.gltf', '-small.gltf');
  fs.writeFileSync(tempGltfPath, JSON.stringify(gltf, null, 2));

  
  const finalFilepath = gltfPath.replace('.gltf', '-compressed.gltf');
  // const finalFilepath = finalDirectory+'/'+ finalFilename;

  const exec = require('child_process').exec;

  const command = `yarn gltfpack -cc -ke -i ${tempGltfPath} -o ${finalFilepath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
  });

});
