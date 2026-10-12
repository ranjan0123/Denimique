import Settings, { ISettings } from "../models/Settings";

export const getStoreSettings = async (): Promise<ISettings> => {
  const existing = await Settings.findOne();
  if (existing) {
    return existing;
  }

  return Settings.create({
    codEnabled: true,
    freeShippingEnabled: false,
    freeShippingMinAmount: 0,
    flatShippingFee: 79,
  });
};

export const updateStoreSettings = async (
  updates: Partial<
    Pick<
      ISettings,
      "codEnabled" | "freeShippingEnabled" | "freeShippingMinAmount" | "flatShippingFee"
    >
  >,
): Promise<ISettings> =>
  Settings.findOneAndUpdate({}, updates, {
    returnDocument: "after",
    upsert: true,
    setDefaultsOnInsert: true,
  });
