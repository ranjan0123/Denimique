export type HeroIconName = "Truck" | "ShieldCheck" | "Leaf";

export interface HeroTrustItem {
  icon: HeroIconName;
  label: string;
}

export interface HeroHeadlineLine {
  text: string;
  color?: string;
}

export interface HeroContent {
  badgeText: string;
  headlinePrefix: string;
  headlineLines: Array<string | HeroHeadlineLine>;
  description: string;
  startingPrice: number | string;
  ctaLabel: string;
  ctaHref: string;
  trustItems: HeroTrustItem[];
  sliderImages: string[];
  isActive?: boolean;
}

export interface HeroRecord extends HeroContent {
  _id?: string;
  createdAt?: string;
  updatedAt?: string;
}
