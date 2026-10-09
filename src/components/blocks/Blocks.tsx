import Image from "next/image";
import Link from "next/link";
import RichText from "@/components/ui/RichText";
import SolidButton from "@/components/ui/SolidButton";
import CircuitPattern from "@/components/ui/CircuitPattern";
import { ArrowUpRightIcon, CalendarIcon, ChevronDownIcon } from "@/components/icons";
import type { Block } from "@/types/content";

/**
 * Renders the blocks editors compose in the admin (on their own pages and on
 * the home page), one section per block, laid out by the block's `type`.
 * Empty items are skipped, so a half-filled block never shows blank cards.
 */
export default function Blocks({ blocks }: { blocks: Block[] | undefined }) {
  if (!blocks?.length) return null;
  return (
    <>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </>
  );
}

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/.test(href) || href.startsWith("/media/");

function SmartLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  if (isExternal(href)) {
    const newTab = /^https?:/.test(href) || href.startsWith("/media/");
    return (
      <a href={href} className={className} {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function Section({ title, intro, children, tone = "white" }: { title?: string; intro?: string; children: React.ReactNode; tone?: "white" | "surface" }) {
  return (
    <section className={tone === "surface" ? "bg-surface" : ""}>
      <div className="mx-auto w-full max-w-[1520px] px-5 py-10 xl:px-25 xl:py-16">
        {title ? (
          <div className="mb-6 flex flex-col gap-3 xl:mb-10">
            <span aria-hidden className="block h-0.5 w-10 bg-gold" />
            <h2 className="t-h2">{title}</h2>
            {intro ? <p className="t-body-lg max-w-[760px]">{intro}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "text":
      return (
        <Section title={block.title}>
          <div className="flex max-w-[860px] flex-col gap-4">
            <RichText value={block.content} className="t-body-lg" />
          </div>
        </Section>
      );

    case "cards": {
      const items = block.items.filter((c) => c.title || c.text);
      if (!items.length) return null;
      return (
        <Section title={block.title} intro={block.intro}>
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-4 xl:gap-6">
            {items.map((card, i) => {
              const inner = (
                <>
                  {card.image ? (
                    <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface">
                      <Image src={card.image} alt="" fill sizes="(max-width: 639px) 100vw, (max-width: 1199px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </span>
                  ) : (
                    <span aria-hidden className="block h-1 w-full bg-gold" />
                  )}
                  <span className="flex flex-1 flex-col gap-2 p-5">
                    <span className="t-h4">{card.title}</span>
                    {card.text ? <span className="t-body">{card.text}</span> : null}
                    {card.href ? (
                      <ArrowUpRightIcon className="mt-auto h-5 w-5 text-navy transition-transform duration-200 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                    ) : null}
                  </span>
                </>
              );
              const cls = "group flex h-full flex-col border border-border-soft bg-white transition-colors duration-200 hover:border-navy";
              return (
                <li key={i}>
                  {card.href ? (
                    <SmartLink href={card.href} className={cls}>
                      {inner}
                    </SmartLink>
                  ) : (
                    <div className={cls}>{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Section>
      );
    }

    case "links": {
      const items = block.items.filter((l) => l.title && (l.file || l.href));
      if (!items.length) return null;
      return (
        <Section title={block.title} intro={block.intro}>
          <ul className="flex list-none flex-col border-t border-navy p-0">
            {items.map((item, i) => (
              <li key={i} className="border-b border-border-soft">
                <SmartLink href={(item.file || item.href) as string} className="group flex items-center gap-4 py-4 xl:py-5">
                  <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center bg-surface text-[11px] font-bold uppercase text-navy">
                    {item.file ? (item.file.split(".").pop() ?? "").slice(0, 4) : "↗"}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="t-h5 text-navy">{item.title}</span>
                    {item.description ? <span className="t-body">{item.description}</span> : null}
                  </span>
                  <ArrowUpRightIcon className="h-5 w-5 shrink-0 text-navy transition-transform duration-200 group-hover:-translate-y-0.5 rtl:-scale-x-100" />
                </SmartLink>
              </li>
            ))}
          </ul>
        </Section>
      );
    }

    case "accordion": {
      const items = block.items.filter((q) => q.question);
      if (!items.length) return null;
      return (
        <Section title={block.title} tone="surface">
          <div className="flex max-w-[960px] flex-col">
            {items.map((item, i) => (
              <details key={i} className="group border-b border-navy/30 py-4 first:border-t xl:py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <span className="t-h5 text-navy">{item.question}</span>
                  <ChevronDownIcon className="h-4 w-4 shrink-0 text-navy transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  <RichText value={item.answer} className="t-body" />
                </div>
              </details>
            ))}
          </div>
        </Section>
      );
    }

    case "stats": {
      const items = block.items.filter((s) => s.value || s.label);
      if (!items.length) return null;
      return (
        <section className="relative isolate overflow-hidden bg-navy">
          <CircuitPattern className="absolute inset-0 -z-10 h-full w-full opacity-40" />
          <div className="mx-auto w-full max-w-[1520px] px-5 py-10 xl:px-25 xl:py-16">
            {block.title ? <h2 className="t-h2 mb-8 text-white">{block.title}</h2> : null}
            <dl className="grid grid-cols-2 gap-6 xl:grid-cols-4 xl:gap-10">
              {items.map((s, i) => (
                <div key={i} className="flex flex-col gap-2 border-s-2 border-gold ps-4">
                  <dd className="font-[family-name:var(--font-heading)] text-[34px] font-bold leading-tight text-white xl:text-[48px]">{s.value}</dd>
                  <dt className="t-body text-[#ccdce6]">{s.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>
      );
    }

    case "announcements": {
      const items = block.items.filter((a) => a.title || a.text);
      if (!items.length) return null;
      return (
        <Section title={block.title}>
          <ul className="flex list-none flex-col gap-4 p-0">
            {items.map((a, i) => (
              <li key={i} className="flex flex-col gap-2 border-s-4 border-gold bg-surface p-5 xl:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  {a.badge ? <span className="bg-navy px-2.5 py-0.5 text-[13px] font-bold text-white">{a.badge}</span> : null}
                  {a.date ? (
                    <span className="t-body inline-flex items-center gap-1.5 text-[14px]">
                      <CalendarIcon className="h-4 w-4" />
                      {a.date}
                    </span>
                  ) : null}
                </div>
                {a.title ? <h3 className="t-h5 text-navy">{a.title}</h3> : null}
                {a.text ? <RichText value={a.text} className="t-body" /> : null}
              </li>
            ))}
          </ul>
        </Section>
      );
    }

    case "cta":
      if (!block.title) return null;
      return (
        <section className="mx-auto w-full max-w-[1520px] px-5 py-10 xl:px-25 xl:py-16">
          <div className="relative isolate flex w-full flex-col items-start gap-6 overflow-hidden border-s-4 border-gold bg-navy px-6 py-8 xl:flex-row xl:items-center xl:justify-between xl:gap-12 xl:px-14 xl:py-11">
            {block.image ? (
              <Image src={block.image} alt="" fill sizes="100vw" className="-z-20 object-cover opacity-25" />
            ) : null}
            <CircuitPattern className="absolute inset-y-0 end-0 -z-10 h-full w-full opacity-70 xl:w-[55%]" />
            <div className="flex flex-col items-start gap-2 xl:max-w-[720px]">
              <h2 className="t-h2 text-white xl:text-[30px]">{block.title}</h2>
              {block.content ? <RichText value={block.content} className="t-body text-[#ccdce6]" /> : null}
            </div>
            {block.button && block.href ? (
              <SolidButton href={block.href} variant="gold" external={isExternal(block.href)} className="shrink-0">
                {block.button}
              </SolidButton>
            ) : null}
          </div>
        </section>
      );

    case "image":
      if (!block.image) return null;
      return (
        <figure className="mx-auto w-full max-w-[1520px] px-5 py-10 xl:px-25 xl:py-16">
          <div className="relative aspect-[16/7] w-full overflow-hidden bg-surface">
            <Image src={block.image} alt={block.caption ?? ""} fill sizes="(max-width: 1520px) 100vw, 1320px" className="object-cover" />
          </div>
          {block.caption ? <figcaption className="t-body mt-3">{block.caption}</figcaption> : null}
        </figure>
      );

    default:
      return null;
  }
}
