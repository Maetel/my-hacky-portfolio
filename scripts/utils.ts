import { RenderData } from "./types";

export const strPercentToFloat = (percentString: string) => {
  const retval = parseFloat(percentString.split("%")[0]);
  if (isNaN(retval)) {
    throw new Error("Falied to parse number : " + percentString);
  }
  return retval * 0.01;
};

export const strPxToFloat = (pxString: string) => {
  const retval = parseFloat(pxString.split("px")[0]);
  if (isNaN(retval)) {
    throw new Error("Falied to parse number : " + pxString);
  }
  return retval;
};

export const myround = (n: number, digit = 3) =>
  Math.round(n * 10 ** digit) / 10 ** digit;

export const uuid = () => {
  const s4 = () =>
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export function isMobileDevice(): boolean {
  const userAgent = navigator.userAgent.toLowerCase();

  // Check for common keywords in mobile user agents
  const mobileKeywords = [
    "android",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
  ];
  for (const keyword of mobileKeywords) {
    if (userAgent.includes(keyword)) {
      return true; // It's a mobile device
    }
  }

  // Check for tablets (some tablets have "mobile" in the user agent)
  if (userAgent.includes("tablet")) {
    return true; // It's a tablet
  }

  // If none of the above conditions are met, assume it's a desktop
  return false;
}

export const concatImageDataVertically = (imageData1, imageData2) => {
  if (imageData1.width !== imageData2.width) {
    console.error("ImageData objects must have the same width.");
    return null;
  }

  const combinedHeight = imageData1.height + imageData2.height;
  const combinedImageData = new ImageData(imageData1.width, combinedHeight);

  combinedImageData.data.set(imageData1.data);

  const offset = imageData1.width * imageData1.height * 4;
  combinedImageData.data.set(imageData2.data, offset);

  return combinedImageData;
};

function copyImageData(source, destination, xOffset, yOffset) {
  const sourceData = source.data;
  const destData = destination.data;
  const sourceWidth = source.width;
  const destWidth = destination.width;
  const sourceHeight = source.height;

  for (let y = 0; y < sourceHeight; y++) {
    for (let x = 0; x < sourceWidth; x++) {
      const sourceIndex = (y * sourceWidth + x) * 4; // 4 channels (RGBA)
      const destIndex = ((y + yOffset) * destWidth + (x + xOffset)) * 4;

      // Copy RGBA values from source to destination
      for (let i = 0; i < 4; i++) {
        destData[destIndex + i] = sourceData[sourceIndex + i];
      }
    }
  }
}

export const synthImageData = (
  width: number,
  height: number,
  data: RenderData[]
) => {
  const retval = new ImageData(width, height, { colorSpace: "srgb" });

  // horizontally
  data.forEach((datum, i) => {
    copyImageData(datum.data, retval, datum.dx, datum.dy);
  });

  return retval;
};
