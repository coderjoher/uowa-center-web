import Image from "next/image";
import Link from "next/link";
import SectionLabel from "@/components/ui/SectionLabel";
import UnderlineLink from "@/components/ui/UnderlineLink";
import PhoneSlider from "@/components/ui/PhoneSlider";
import type { NewsPost, SiteContent } from "@/types/content";

/** How many stories the home page shows; the rest are on `/news`. */
const HOME_COUNT = 3;

/**
 * The news, in two forms.
 *
 * On the home page: the label and heading with the link to every story at
 * the end of the row, then the latest three stories side by side (a
 * swipeable slider below 1200px, see PhoneSlider).
 *
 * On `/news` (`archive`): every story in an even grid, three across from
 * 1200px, two from 768px, one on phones. The page header already names the
 * page, so the section's own heading is left out.
 *
 * A card is a 16:10 photo, the date and the issuing division over a navy
 * rule, then the title in full and, in the archive, the lead paragraph.
 */
export default function NewsSection({
  content,
  archive = false,
}: {
  content: SiteContent["news"];
  /** The `/news` page: every story in a grid, without the section heading. */
  archive?: boolean;
}) {
  if (archive) {
    return (
      <section id="news" className="mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 pb-14 xl:px-25 xl:pb-[112px]">
        <ul className="grid list-none grid-cols-1 gap-x-8 gap-y-12 p-0 md:grid-cols-2 xl:grid-cols-3 xl:gap-x-10 xl:gap-y-16">
          {content.items.map((post) => (
            <li key={post.slug}>
              <NewsCard post={post} withExcerpt />
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const heading = content.heading.filter(Boolean);

  return (
    <section
      id="news"
      className="mx-auto flex w-full max-w-[1520px] scroll-mt-24 flex-col items-start gap-8 px-5 pb-14 xl:gap-12 xl:px-25 xl:pb-[112px]"
    >
      <div className="flex w-full flex-col items-start justify-between gap-6 xl:flex-row xl:items-end">
        <div className="flex w-full flex-col items-start gap-4 xl:max-w-[560px]">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          {heading.length ? (
            <h2 className="t-h2">
              {heading.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h2>
          ) : null}
        </div>
        {content.link ? (
          <div className="pb-2.5">
            <UnderlineLink href={content.linkHref}>{content.link}</UnderlineLink>
          </div>
        ) : null}
      </div>

      <PhoneSlider prev={content.prev} next={content.next} className="xl:grid xl:grid-cols-3 xl:items-start xl:gap-10">
        {content.items.slice(0, HOME_COUNT).map((post) => (
          <li key={post.slug} className="w-[80vw] shrink-0 snap-center xl:w-auto">
            <NewsCard post={post} />
          </li>
        ))}
      </PhoneSlider>
    </section>
  );
}

function NewsCard({ post, withExcerpt = false }: { post: NewsPost; withExcerpt?: boolean }) {
  return (
    <Link href={post.href} className="group flex w-full flex-col items-start gap-4 xl:gap-5">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface">
        <Image
          src={post.image}
          alt={post.imageAlt || post.title}
          fill
          sizes="(max-width: 767px) 80vw, (max-width: 1199px) 50vw, 440px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex w-full flex-col items-start gap-3">
        <div className="flex w-full items-start justify-between gap-4 text-[14px] leading-6 xl:text-[15px]">
          <p className="shrink-0 whitespace-nowrap font-[family-name:var(--font-sans)] text-navy">{post.date}</p>
          <p className="truncate font-[family-name:var(--font-sans)] text-muted">{post.author}</p>
        </div>
        <div className="h-px w-full bg-navy/80" />
        <h3 className="t-h4 decoration-gold decoration-2 underline-offset-8 group-hover:underline">{post.title}</h3>
        {withExcerpt && post.excerpt ? <p className="t-body line-clamp-3">{post.excerpt}</p> : null}
      </div>
    </Link>
  );
}
