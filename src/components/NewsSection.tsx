import Image from "next/image";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import UnderlineLink from "@/components/ui/UnderlineLink";
import type { SiteContent } from "@/types/content";

/**
 * Header row (label + h2 leading, the archive link bottom-trailing), then three
 * 382-wide cards with a 40px gap. Card: 382x400 image, 20px gap, a meta row
 * (date navy / author muted, space-between), a 1px navy rule and the title.
 */
export default function NewsSection({
  content,
  showArchiveLink = true,
}: {
  content: SiteContent["news"];
  /** Off on `/news`, where the link would point at the page you are on. */
  showArchiveLink?: boolean;
}) {
  return (
    <section
      id="news"
      className="mx-auto flex w-full max-w-[1520px] scroll-mt-24 flex-col items-start gap-8 px-5 pb-14 xl:px-25 xl:pb-[140px]"
    >
      <div className="flex w-full flex-col items-start justify-between gap-6 xl:flex-row xl:items-end">
        <div className="flex w-full flex-col items-start gap-4 xl:max-w-[434px]">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          <h2 className="t-h2">
            {content.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>
        {showArchiveLink ? (
          <div className="pb-2.5">
            <UnderlineLink href={content.linkHref}>{content.link}</UnderlineLink>
          </div>
        ) : null}
      </div>

      <div className="flex w-full flex-col items-center gap-6 xl:flex-row xl:gap-10">
        {content.items.map((post) => (
          <Link
            key={post.title}
            href={post.href}
            className="group flex w-full flex-col items-start gap-5 xl:w-[382px]"
          >
            <div className="relative h-[300px] w-full overflow-hidden xl:aspect-[382/400] xl:h-auto">
              <Image
                src={post.image}
                alt={post.title}
                fill
                sizes="(max-width: 1199px) 100vw, 382px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>

            <div className="flex w-full flex-col items-start gap-3.5">
              <div className="flex w-full items-start justify-between gap-4">
                <p className="font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy">
                  {post.date}
                </p>
                <p className="t-body text-end">{post.author}</p>
              </div>
              <div className="h-px w-full bg-navy" />
              <h4 className="t-h4">{post.title}</h4>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
