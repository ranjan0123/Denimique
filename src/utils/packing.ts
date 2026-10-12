export interface PackageItemInput {
  quantity: number;
  weightKg?: number;
  lengthCm?: number;
  breadthCm?: number;
  heightCm?: number;
}

export interface PackageDefaults {
  weight: number;
  length: number;
  breadth: number;
  height: number;
}

const roundToTwo = (value: number) => Math.round(value * 100) / 100;

const normalizePositiveNumber = (value: unknown, fallback: number) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : fallback;
};

const getNumericEnv = (key: string, fallback: number) => {
  const value = Number(process.env[key]?.trim());
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const getDefaultPackageDetails = (): PackageDefaults => ({
  weight: getNumericEnv("DEFAULT_PACKAGE_WEIGHT_KG", 0.5),
  length: getNumericEnv("DEFAULT_PACKAGE_LENGTH_CM", 20),
  breadth: getNumericEnv("DEFAULT_PACKAGE_BREADTH_CM", 15),
  height: getNumericEnv("DEFAULT_PACKAGE_HEIGHT_CM", 10),
});

export const computePackageDetails = (
  items: PackageItemInput[],
  defaults: PackageDefaults,
) => {
  let totalWeight = 0;
  let maxLength = 0;
  let maxBreadth = 0;
  let totalHeight = 0;

  for (const item of items) {
    const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;

    const length = normalizePositiveNumber(item.lengthCm, defaults.length);
    const breadth = normalizePositiveNumber(item.breadthCm, defaults.breadth);
    const height = normalizePositiveNumber(item.heightCm, defaults.height);
    const weight = normalizePositiveNumber(item.weightKg, defaults.weight);

    totalWeight += weight * quantity;
    maxLength = Math.max(maxLength, length);
    maxBreadth = Math.max(maxBreadth, breadth);
    totalHeight += height * quantity;
  }

  return {
    weight: roundToTwo(totalWeight || defaults.weight),
    length: roundToTwo(maxLength || defaults.length),
    breadth: roundToTwo(maxBreadth || defaults.breadth),
    height: roundToTwo(totalHeight || defaults.height),
  };
};
