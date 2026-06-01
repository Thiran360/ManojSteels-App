const Jimp = require('jimp');
const path = require('path');
const fs = require('fs');

const IMAGE_PATH = 'C:\\Users\\ADMIN\\.gemini\\antigravity\\brain\\debb910f-fd02-427d-af10-6afd745affe4\\media__1780204229060.jpg';
const RES_DIR = 'C:\\E-Com\\Cart_App\\android\\app\\src\\main\\res';

const SIZES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

async function generateIcons() {
  try {
    console.log('Loading image:', IMAGE_PATH);
    const image = await Jimp.read(IMAGE_PATH);

    for (const [density, size] of Object.entries(SIZES)) {
      const folderPath = path.join(RES_DIR, `mipmap-${density}`);
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      const iconPath = path.join(folderPath, 'ic_launcher.png');
      const roundIconPath = path.join(folderPath, 'ic_launcher_round.png');

      // Use cover instead of resize to crop the extra horizontal width without squishing!
      const squareImage = image.clone();
      squareImage.cover(size, size);
      await squareImage.writeAsync(iconPath);
      
      const roundImage = image.clone();
      roundImage.cover(size, size);
      roundImage.circle();
      await roundImage.writeAsync(roundIconPath);

      console.log(`Generated ${density} (${size}x${size})`);
    }

    console.log('Successfully generated all app icons!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
