"use client";

import Image from "@/components/ui/AppImage";
import Link from "next/link";
import { IBlogContent, IInternalLink } from "@/types/blog";
import { resolveApiAssetUrl } from "@/lib/api";

interface BlogContentRendererProps {
  content: IBlogContent[];
  internalLinks?: IInternalLink[];
}

export default function BlogContentRenderer({
  content,
  internalLinks = [],
}: BlogContentRendererProps) {
  const renderContent = (item: IBlogContent, index: number) => {
    switch (item.type) {
      case "heading":
        const HeadingTag = (
          item.heading?.level || "h2"
        ) as keyof React.JSX.IntrinsicElements;
        const headingClasses = {
          h1: "text-4xl font-bold text-gray-900 mt-8 mb-4",
          h2: "text-3xl font-bold text-gray-900 mt-6 mb-3",
          h3: "text-2xl font-bold text-gray-900 mt-5 mb-2",
        };

        return (
          <HeadingTag
            key={index}
            className={headingClasses[item.heading?.level || "h2"]}
          >
            {item.heading?.text}
          </HeadingTag>
        );

      case "text":
        // Replace internal links in the text with actual Link components
        const linkRegex =
          /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(item.value)) !== null) {
          parts.push(item.value.substring(lastIndex, match.index));
          parts.push(
            <Link
              key={match.index}
              href={match[2]}
              className="text-blue-600 hover:text-blue-700 underline transition-colors"
            >
              {match[1]}
            </Link>,
          );
          lastIndex = match.index + match[0].length;
        }
        parts.push(item.value.substring(lastIndex));

        return (
          <p key={index} className="text-gray-700 text-lg leading-relaxed mb-4">
            {parts}
          </p>
        );

      case "image":
        return (
          <figure
            key={index}
            className="my-6 rounded-lg overflow-hidden shadow-md"
          >
            <div className="relative w-full h-96">
              <Image
                src={resolveApiAssetUrl(item.value)}
                alt={item.imageAlt || "Blog image"}
                fill
                className="object-cover"
              />
            </div>
            {item.imageAlt && (
              <figcaption className="bg-gray-50 px-4 py-2 text-sm text-gray-600 italic">
                {item.imageAlt}
              </figcaption>
            )}
          </figure>
        );

      case "list":
        if (!item.listItems || item.listItems.length === 0) {
          return null;
        }

        if (item.isList) {
          return (
            <ul key={index} className="list-disc list-inside mb-4 space-y-2">
              {item.listItems.map((listItem, itemIndex) => (
                <li
                  key={itemIndex}
                  className="text-gray-700 text-lg leading-relaxed"
                >
                  {listItem}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <ol key={index} className="list-decimal list-inside mb-4 space-y-2">
            {item.listItems.map((listItem, itemIndex) => (
              <li
                key={itemIndex}
                className="text-gray-700 text-lg leading-relaxed"
              >
                {listItem}
              </li>
            ))}
          </ol>
        );

      default:
        return null;
    }
  };

  return (
    <div className="prose prose-lg max-w-none">
      {content && content.length > 0 ? (
        content.map((item, index) => renderContent(item, index))
      ) : (
        <p className="text-gray-600">No content available</p>
      )}
    </div>
  );
}
