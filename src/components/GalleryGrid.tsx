import PhotoGallery from "@/components/ui/PhotoGallery";
import { dirOf, type Locale } from "@/i18n/config";
import type { SiteContent } from "@/types/content";

/** The `/gallery` page: every photo in an even grid, opening the shared Lightbox. */
export default function GalleryGrid({
  content,
  lang,
}: {
  content: SiteContent["pages"]["gallery"];
  lang: Locale;
}) {
  return (
    <section className="mx-auto w-full max-w-[1520px] px-5 pb-14 xl:px-25 xl:pb-[112px]">
      <PhotoGallery photos={content.photos} labels={content.lightbox} rtl={dirOf(lang) === "rtl"} />
    </section>
  );
}
