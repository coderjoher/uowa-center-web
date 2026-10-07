import Link from "next/link";
import type { AnnualPlan } from "@/types/content";

/**
 * The annual plan as a table. On desktop it is a real `<table>`: a navy
 * header row, rows in month order with a gold month badge, the activity
 * linking to its own page when it has one. Below 1200px a five-column
 * table cannot breathe, so each row becomes a card with the month on top
 * and the other fields as label/value pairs; the same data drives both.
 * Rows, column labels and copy all come from the content file, so editors
 * add or change activities from the admin.
 */
export default function PlanTable({ content }: { content: AnnualPlan }) {
  const { columns: col, rows } = content;

  return (
    <section className="mx-auto w-full max-w-[1520px] px-5 pb-14 xl:px-25 xl:pb-[120px]">
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-md border border-border-soft xl:block">
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="bg-navy text-white">
              {[col.month, col.activity, col.type, col.date, col.venue].map((h) => (
                <th key={h} scope="col" className="px-6 py-4 text-start font-[family-name:var(--font-heading)] text-[15px] font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.activity}-${i}`} className="border-t border-border-soft odd:bg-white even:bg-surface/60">
                <td className="px-6 py-5 align-top">
                  <span className="inline-flex border-s-[3px] border-gold bg-navy px-3 py-1 font-[family-name:var(--font-heading)] text-[14px] font-semibold text-white">
                    {row.month}
                  </span>
                </td>
                <td className="px-6 py-5 align-top">
                  {row.href ? (
                    <Link href={row.href} className="t-h5 text-navy underline-offset-4 hover:underline hover:decoration-gold">
                      {row.activity}
                    </Link>
                  ) : (
                    <span className="t-h5 text-navy">{row.activity}</span>
                  )}
                </td>
                <td className="t-body px-6 py-5 align-top">{row.type}</td>
                <td className="t-body whitespace-nowrap px-6 py-5 align-top">{row.date}</td>
                <td className="t-body px-6 py-5 align-top">{row.venue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone cards */}
      <ul className="flex list-none flex-col gap-4 p-0 xl:hidden">
        {rows.map((row, i) => (
          <li key={`${row.activity}-${i}`} className="overflow-hidden rounded-md border border-border-soft bg-white">
            <div className="border-s-4 border-gold bg-navy px-4 py-2.5 font-[family-name:var(--font-heading)] text-[15px] font-semibold text-white">
              {row.month}
            </div>
            <div className="flex flex-col gap-3 p-4">
              {row.href ? (
                <Link href={row.href} className="t-h5 text-navy underline decoration-gold underline-offset-4">
                  {row.activity}
                </Link>
              ) : (
                <p className="t-h5 text-navy">{row.activity}</p>
              )}
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
                {([[col.type, row.type], [col.date, row.date], [col.venue, row.venue]] as const).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-[13px] leading-6 text-muted">{k}</dt>
                    <dd className="m-0 text-[14px] leading-6 text-body">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
