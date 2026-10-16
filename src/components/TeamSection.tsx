"use client";

import Image from "next/image";
import { useState } from "react";
import SectionLabel from "@/components/ui/SectionLabel";
import Reveal from "@/components/ui/Reveal";
import { AvatarIcon, ChevronDownIcon } from "@/components/icons";
import type { SiteContent } from "@/types/content";

/**
 * The roster. Cards are 3:4 portraits over a navy rule, name and role beneath.
 *
 * Every member's portrait and name are set in the admin (فريق المركز). A
 * member with no portrait yet gets a `#eef4f8` tile with the avatar glyph,
 * and an empty name falls back to `pendingName` in muted grey — so a partly filled
 * roster still reads as deliberate rather than broken.
 *
 * Only the first four cards show at first (one row on desktop, two on
 * phones); a button under them unfolds the rest of the roster and folds it
 * away again.
 *
 * This is the one grid that goes two-up below 1200px instead of stacking: the
 * cards are small and uniform, and seven of them in a single column would run
 * the section past three screens on a phone.
 */
const FIRST = 4;

export default function TeamSection({
  content,
}: {
  content: SiteContent["team"];
}) {
  const [all, setAll] = useState(false);
  const members = all ? content.members : content.members.slice(0, FIRST);
  const more = content.members.length > FIRST;

  return (
    <section
      id="team"
      className="mx-auto w-full max-w-[1520px] scroll-mt-24 px-5 pb-14 xl:px-25 xl:pb-[112px]"
    >
      <div className="flex flex-col items-start justify-between gap-6 xl:flex-row xl:items-end">
        <div className="flex flex-col items-start gap-4">
          <SectionLabel className="text-navy">{content.label}</SectionLabel>
          <h2 className="t-h2">
            {content.heading.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
        </div>
        <p className="t-body xl:max-w-[520px]">{content.intro}</p>
      </div>

      <ul id="team-roster" className="mt-8 grid list-none grid-cols-2 gap-x-5 gap-y-8 p-0 xl:mt-16 xl:grid-cols-4 xl:gap-x-10">
        {members.map((member, i) => {
          const named = Boolean(member.name);
          return (
            <li key={`${member.role}-${i}`} className="w-full">
              <Reveal scaleFrom={1} yFrom={30} className="w-full">
                <div className="flex flex-col items-start">
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface">
                    {member.image ? (
                      <Image
                        src={member.image}
                        alt={member.name || member.role}
                        fill
                        sizes="(max-width: 1199px) 50vw, 320px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <AvatarIcon
                          aria-hidden
                          className="h-16 w-16 text-[#b9cbd9]"
                        />
                      </span>
                    )}
                  </div>

                  <div className="mt-5 h-px w-full bg-navy" />
                  <div className="mt-3.5 flex flex-col items-start gap-1">
                    <h4
                      className="t-h4"
                      style={named ? undefined : { color: "var(--muted)" }}
                    >
                      {member.name || content.pendingName}
                    </h4>
                    <p className="t-body">{member.role}</p>
                  </div>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>

      {more ? (
        <div className="mt-10 flex justify-center xl:mt-14">
          <button
            type="button"
            aria-expanded={all}
            aria-controls="team-roster"
            onClick={() => setAll((v) => !v)}
            className="group inline-flex cursor-pointer items-center gap-3 border border-navy px-6 py-3 font-[family-name:var(--font-heading)] text-[15px] font-bold leading-6 text-navy transition-colors duration-200 hover:bg-navy hover:text-white"
          >
            {all ? content.less || "−" : `${content.more || "+"} (${content.members.length})`}
            <ChevronDownIcon aria-hidden className={`text-gold transition-transform duration-300 ${all ? "rotate-180" : ""}`} />
          </button>
        </div>
      ) : null}
    </section>
  );
}
