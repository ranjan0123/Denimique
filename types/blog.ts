export interface IHeading {
  level: "h1" | "h2" | "h3";
  text: string;
}

export interface IInternalLink {
  url: string;
  text: string;
}

export interface IBlogContent {
  type: "text" | "heading" | "image" | "list";
  value: string;
  heading?: IHeading;
  imageAlt?: string;
  isList?: boolean;
  listItems?: string[];
}

export interface IBlog {
  _id: string;
  title: string;
  slug: string;
  content: IBlogContent[];
  excerpt: string;
  featuredImage: string;
  imageAlt: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  category: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  internalLinks: IInternalLink[];
  isPublished: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IBlogListResponse {
  blogs: IBlog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ICategoryWithCount {
  name: string;
  count: number;
}

export interface ITagWithCount {
  name: string;
  count: number;
}
