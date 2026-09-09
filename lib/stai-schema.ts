import { z } from "zod";

const imageSlot = z.object({ label: z.string(), src: z.string().url().optional() }).optional();

export const siteDataSchema = z.object({
  site: z.object({ name: z.string(), line: z.string() }),
  nav: z.array(z.object({ id: z.enum(["home", "about", "research", "team", "news", "contact"]), label: z.string() })),
  footer: z.array(z.string()),
  home: z.object({ title: z.string(), lead: z.string(), note: z.string() }),
  about: z.object({ title: z.string(), lead: z.string(), body: z.array(z.string()), contextLabel: z.string(), contextBody: z.string() }),
  thrusts: z.array(z.object({ title: z.string(), method: z.string(), line: z.string(), para: z.string() })),
  pubNotice: z.string(),
  publications: z.array(z.object({ id: z.string(), year: z.string(), venueFull: z.string(), title: z.string(), authors: z.string(), abstract: z.string(), bibtex: z.string() })),
  people: z.object({
    pi: z.object({
      name: z.string(), role: z.string(), affiliations: z.string(), supervisionNote: z.string(), portraitSlot: imageSlot,
      links: z.array(z.object({ label: z.string(), value: z.string(), href: z.string().url().refine((value) => /^(https?:|mailto:)/i.test(value), "Use an HTTP, HTTPS or email link") })),
    }),
    students: z.array(z.object({ name: z.string(), programme: z.string(), thesis: z.string() })),
    network: z.array(z.object({ org: z.string(), meta: z.string(), href: z.string().url().refine((value) => /^https?:/i.test(value), "Use an HTTP or HTTPS link"), note: z.string() })),
  }),
  team: z.object({ studentsNotice: z.string() }),
  news: z.array(z.object({ date: z.string(), title: z.string(), body: z.string() })),
  contact: z.object({ address: z.array(z.string()), directions: z.string(), photoSlot: imageSlot }),
});

export type SiteData = z.infer<typeof siteDataSchema>;
export type Publication = SiteData["publications"][number];
export type NewsItem = SiteData["news"][number];
