"use client";

import type { SiteContent } from "@/types/content";

/**
 * Contact details plus a message form.
 *
 * There is no backend, so rather than a form that silently swallows input, the
 * submit builds a `mailto:` and hands the message to the visitor's own mail
 * client — which actually delivers it. The note under the button says so.
 */
export default function ContactPanel({
  content,
}: {
  content: SiteContent["pages"]["contact"];
}) {
  const email = "info@uowa.edu.iq";

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const subject = encodeURIComponent(String(data.get("subject") ?? ""));
    const body = encodeURIComponent(
      `${data.get("name") ?? ""} <${data.get("email") ?? ""}>\n\n${data.get("message") ?? ""}`,
    );
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const field =
    "h-14 w-full border border-border-soft bg-white px-5 font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy outline-none transition-colors duration-200 placeholder:text-muted focus:border-navy";

  return (
    <section className="mx-auto flex w-full max-w-[1520px] flex-col gap-12 px-5 pb-20 xl:flex-row xl:items-start xl:gap-20 xl:px-25 xl:pb-[140px]">
      {/* Details */}
      <ul className="grid w-full list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 xl:w-[420px] xl:shrink-0 xl:grid-cols-1">
        {content.cards.map((card) => (
          <li
            key={card.title}
            className="flex flex-col items-start gap-2 border-t-2 border-navy pt-5"
          >
            <h2 className="t-h5 text-navy">{card.title}</h2>
            {card.lines.map((line, i) =>
              card.href && i === 0 ? (
                <a
                  key={line}
                  href={card.href}
                  dir="ltr"
                  className="t-body text-start transition-colors duration-200 hover:text-navy"
                >
                  {line}
                </a>
              ) : (
                <p key={line} className="t-body">
                  {line}
                </p>
              ),
            )}
          </li>
        ))}
      </ul>

      {/* Message form */}
      <form
        onSubmit={onSubmit}
        className="flex w-full flex-col items-start gap-5 bg-surface p-[30px] xl:p-14"
      >
        <h2 className="t-h4">{content.form.legend}</h2>

        <div className="grid w-full grid-cols-1 gap-5 xl:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="sr-only">{content.form.name}</span>
            <input
              name="name"
              required
              placeholder={content.form.name}
              className={field}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="sr-only">{content.form.email}</span>
            <input
              type="email"
              name="email"
              required
              placeholder={content.form.email}
              className={field}
            />
          </label>
        </div>

        <label className="flex w-full flex-col gap-2">
          <span className="sr-only">{content.form.subject}</span>
          <input
            name="subject"
            required
            placeholder={content.form.subject}
            className={field}
          />
        </label>

        <label className="flex w-full flex-col gap-2">
          <span className="sr-only">{content.form.message}</span>
          <textarea
            name="message"
            required
            rows={6}
            placeholder={content.form.message}
            className="w-full resize-y border border-border-soft bg-white p-5 font-[family-name:var(--font-sans)] text-[16px] leading-[26px] text-navy outline-none transition-colors duration-200 placeholder:text-muted focus:border-navy"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-11 min-w-[189px] cursor-pointer items-center justify-center bg-navy px-10 py-2.5 font-[family-name:var(--font-heading)] text-[16px] font-bold leading-6 text-white transition-opacity duration-200 hover:opacity-90"
        >
          {content.form.submit}
        </button>

        <p className="t-body">{content.form.note}</p>
      </form>
    </section>
  );
}
