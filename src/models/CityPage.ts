import mongoose, { Document, Schema } from "mongoose";

export interface ICitySection {
  title: string;
  body: string;
}

export interface ICityFaq {
  question: string;
  answer: string;
}

export interface ICityStat {
  label: string;
  value: string;
}

export interface ICityLink {
  label: string;
  href: string;
}

export interface ICityDeliveryTimeline {
  label: string;
  estimate: string;
}

export interface ICityGeoPoint {
  latitude: number;
  longitude: number;
}

export interface ICityLocalProof {
  name: string;
  businessType: string;
  quote: string;
}

export interface ICityPage extends Document {
  city: string;
  state?: string;
  slug: string;
  canonicalUrl?: string;
  businessName?: string;
  phone?: string;
  email?: string;
  serviceType?: string;
  areaServed: string[];
  geo?: ICityGeoPoint;
  heroTitle: string;
  heroSubtitle: string;
  intro: string;
  citySeoContent: string;
  metaTitle: string;
  metaDescription: string;
  highlights: string[];
  stats: ICityStat[];
  serviceAreas: string[];
  deliveryTimelines: ICityDeliveryTimeline[];
  productRange: string[];
  deliveryNotes: string[];
  certifications: string[];
  useCases: string[];
  sections: ICitySection[];
  faqs: ICityFaq[];
  internalLinks: ICityLink[];
  nearbyCitiesLinks: ICityLink[];
  localProof?: ICityLocalProof;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const citySectionSchema = new Schema<ICitySection>(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
  },
  { _id: false },
);

const cityFaqSchema = new Schema<ICityFaq>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false },
);

const cityStatSchema = new Schema<ICityStat>(
  {
    label: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const cityLinkSchema = new Schema<ICityLink>(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
  },
  { _id: false },
);

const cityDeliveryTimelineSchema = new Schema<ICityDeliveryTimeline>(
  {
    label: { type: String, required: true },
    estimate: { type: String, required: true },
  },
  { _id: false },
);

const cityGeoPointSchema = new Schema<ICityGeoPoint>(
  {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const cityLocalProofSchema = new Schema<ICityLocalProof>(
  {
    name: { type: String, default: "" },
    businessType: { type: String, default: "" },
    quote: { type: String, default: "" },
  },
  { _id: false },
);

const cityPageSchema = new Schema<ICityPage>(
  {
    city: { type: String, required: true },
    state: { type: String, default: "" },
    slug: { type: String, required: true, unique: true },
    canonicalUrl: { type: String, default: "" },
    businessName: { type: String, default: "Denimique" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    serviceType: { type: String, default: "Wholesale and bulk fashion apparel supply" },
    areaServed: { type: [String], default: [] },
    geo: { type: cityGeoPointSchema, default: null },
    heroTitle: { type: String, required: true },
    heroSubtitle: { type: String, required: true },
    intro: { type: String, required: true },
    citySeoContent: { type: String, required: true },
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true },
    highlights: { type: [String], default: [] },
    stats: { type: [cityStatSchema], default: [] },
    serviceAreas: { type: [String], default: [] },
    deliveryTimelines: { type: [cityDeliveryTimelineSchema], default: [] },
    productRange: { type: [String], default: [] },
    deliveryNotes: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    useCases: { type: [String], default: [] },
    sections: { type: [citySectionSchema], default: [] },
    faqs: { type: [cityFaqSchema], default: [] },
    internalLinks: { type: [cityLinkSchema], default: [] },
    nearbyCitiesLinks: { type: [cityLinkSchema], default: [] },
    localProof: { type: cityLocalProofSchema, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

cityPageSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model<ICityPage>("CityPage", cityPageSchema);
