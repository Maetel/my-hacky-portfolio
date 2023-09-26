export const parsePx = (basePx: number, length: number | string) => {
  if (typeof length === "number") {
    return basePx * length;
  }
  if (typeof length === "string") {
    const combo = parseIfCombo(basePx, length);
    // console.log({ combo });
    if (combo !== null) {
      return combo;
    }

    const px = parseIfPixel(length);
    if (px !== null) {
      return px;
    }
    const percent = parseIfPercent(length);
    if (percent !== null) {
      return basePx * percent * 0.01;
    }
  }
  throw new Error(`length is not valid. [length] = [${length}]`);
};
export const isPx = (string: string) =>
  string.trim().endsWith("px") && !string.includes("%");
export const isPercent = (string: string) =>
  string.trim().endsWith("%") && !string.includes("px");
export const parseIfPixel = (string: string) => {
  if (isPx(string)) {
    return Number(string.replaceAll(" ", "").replace("px", ""));
  }
  return null;
};
export const parseIfPercent = (string: string) => {
  if (isPercent(string)) {
    return Number(string.replaceAll(" ", "").replace("%", ""));
  }
  return null;
};
// 100% - 30px
export const parseIfCombo = (basePx: number, str: string) => {
  const trimmed = str.trim();
  if (!str.includes("%") || !str.includes("px")) {
    return null;
  }
  const splitted = trimmed.split("%");
  const percent = Number(splitted[0]);
  const px = Number(splitted[1].replaceAll(" ", "").replace("px", ""));
  // console.log({ percent, px });
  if (isNaN(percent) || isNaN(px)) {
    throw new Error("Failed to parse combo : " + str);
  }
  const percentInPx = basePx * percent * 0.01;
  return percentInPx + px;
};
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

// export const synthImageData = (
//   width: number,
//   height: number,
//   data: RenderData[]
// ) => {
//   const retval = new ImageData(width, height, { colorSpace: "srgb" });

//   // horizontally
//   data.forEach((datum, i) => {
//     copyImageData(datum.data, retval, datum.dx, datum.dy);
//   });

//   return retval;
// };

type NullCheckOption = {
  allowEmptyString?: boolean;
  allowEmptyArray?: boolean;
  allowEmptyObject?: boolean;
};
export const isNullish = (
  val: any,
  options: NullCheckOption = {
    allowEmptyString: false,
    allowEmptyArray: false,
    allowEmptyObject: false,
  }
) => {
  if (val === undefined || val === null) {
    return true;
  }

  if (typeof val === "string" && !options.allowEmptyString) {
    return val === "";
  }

  const isArray = Array.isArray(val);
  if (isArray && !options.allowEmptyArray) {
    return val.length === 0;
  }

  if (!isArray && typeof val === "object" && !options.allowEmptyObject) {
    return Object.keys(val).length === 0;
  }

  return false;
};

export const hasNullish = (
  vals: any,
  options: NullCheckOption = {
    allowEmptyString: false,
    allowEmptyArray: false,
    allowEmptyObject: false,
  }
) => {
  const isArray = Array.isArray(vals);
  if (isArray) {
    return vals.some((val) => isNullish(val, options));
  }
  if (!isArray && typeof vals === "object") {
    return Object.values(vals).some((val) => isNullish(val, options));
  }

  return isNullish(vals, options);
};

export const notNullish = (
  val: any,
  options: NullCheckOption = {
    allowEmptyString: false,
    allowEmptyArray: false,
    allowEmptyObject: false,
  }
) => !isNullish(val, options);

export const simpleHash = (inputString: string): number => {
  let hashValue = 0;

  for (let i = 0; i < inputString.length; i++) {
    const char = inputString.charCodeAt(i) << i % 8;
    hashValue += char;
    hashValue = hashValue << i;
    hashValue = (hashValue % 851549) + i;
  }

  return hashValue;
};

export const toPx = (number) => `${number}px`;

export function deepCopy(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj; // Return primitive values as is
  }

  if (Array.isArray(obj)) {
    const newArray = [];
    for (let i = 0; i < obj.length; i++) {
      newArray[i] = deepCopy(obj[i]);
    }
    return newArray;
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      newObj[key] = deepCopy(obj[key]);
    }
  }
  return newObj;
}

export const clientWidth = () => document.documentElement.clientWidth;
export const clientHeight = () => document.documentElement.clientHeight;
