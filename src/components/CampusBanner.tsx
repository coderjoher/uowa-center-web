import Image from "next/image";
import type { SiteContent } from "@/types/content";

/** Full-bleed campus band. 400px tall, 600px from 1200px up. */
export default function CampusBanner({
  content,
}: {
  content: SiteContent["banner"];
}) {
  return (
    <div className="relative h-100 w-full overflow-hidden xl:h-150">
      <Image
        src="/images/banner-campus-life.jpg"
        alt={content.imageAlt}
        fill
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}
