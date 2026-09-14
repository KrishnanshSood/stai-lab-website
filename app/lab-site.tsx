"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { SiteData, Publication, NewsItem } from "@/lib/stai-schema";

const routeIds = new Set(["home", "about", "research", "team", "news", "contact"]);
function subscribeToRoute(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}
function currentRoute() {
  const route = window.location.hash.slice(1);
  return routeIds.has(route) ? route : "home";
}
async function fetchSiteData(): Promise<SiteData> {
  const response = await fetch("/api/v1/site", { headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("The lab content is temporarily unavailable. Please try again shortly.");
  return response.json();
}

export function LabSite() {
  const [data, setData] = useState<SiteData | null>(null);
  const route = useSyncExternalStore(subscribeToRoute, currentRoute, () => "home");
  const [error, setError] = useState("");
  const [openPublication, setOpenPublication] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(() => fetchSiteData().then(
    (content) => {
      setData(content);
      setError("");
    },
    (caught: unknown) => {
      setData(null);
      setError(caught instanceof Error ? caught.message : "The lab content could not be loaded.");
    },
  ), []);

  useEffect(() => {
    const closePublication = () => setOpenPublication(null);
    window.addEventListener("hashchange", closePublication);
    void load();
    return () => window.removeEventListener("hashchange", closePublication);
  }, [load]);

  const publicationGroups = useMemo(() => {
    const groups = new Map<string, Publication[]>();
    for (const publication of data?.publications ?? []) {
      groups.set(publication.year, [...(groups.get(publication.year) ?? []), publication]);
    }
    return [...groups.entries()];
  }, [data]);

  async function copyBibtex(publication: Publication) {
    try {
      await navigator.clipboard.writeText(publication.bibtex);
      setCopied(publication.id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied(null);
    }
  }

  if (!data) {
    return (
      <main className="status-page">
        {error ? (
          <section>
            <h1>Content unavailable</h1>
            <p>{error}</p>
            <Button variant="outline" onClick={() => { setError(""); void load(); }}>Try again</Button>
          </section>
        ) : <p>Loading…</p>}
      </main>
    );
  }

  const { pi, students, network } = data.people;

  return (
    <div className="site-frame">
      <div className="site-shell">
        <aside className="site-sidebar">
          <a className="brand" href="#home">
            <span>{data.site.name}</span>
            <small>{data.site.line}</small>
          </a>
          <nav className="site-nav" aria-label="Primary navigation">
            {data.nav.map((item) => (
              <a key={item.id} href={`#${item.id}`} aria-current={route === item.id ? "page" : undefined}>{item.label}</a>
            ))}
          </nav>
        </aside>

        <main className="site-main">
          {route === "home" && (
            <section className="page-panel">
              <h1>{data.home.title}</h1>
              <p className="lead">{data.home.lead}</p>
              <p>{data.home.note}</p>
              {data.news.length > 0 && <section className="home-news" aria-labelledby="home-news-title">
                <div className="news-heading"><h2 id="home-news-title">Latest news & events</h2><a href="#news">All news <span aria-hidden="true">↗</span></a></div>
                <NewsRow item={data.news[0]} featured compact />
              </section>}
              <SectionTitle>Research lines</SectionTitle>
              <div>{data.thrusts.map((thrust) => <article className="list-card" key={thrust.title}><h3><a href="#research">{thrust.title}</a></h3><p>{thrust.line}</p></article>)}</div>
            </section>
          )}

          {route === "about" && (
            <section className="page-panel">
              <h1>{data.about.title}</h1>
              <p className="lead">{data.about.lead}</p>
              {data.about.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <SectionTitle>{data.about.contextLabel}</SectionTitle>
              <p>{data.about.contextBody}</p>
            </section>
          )}

          {route === "research" && (
            <section className="page-panel">
              <h1>Research</h1>
              <div className="research-list">{data.thrusts.map((thrust) => <article className="research-card" key={thrust.title}><h3>{thrust.title}</h3><span>{thrust.method}</span><p>{thrust.para}</p></article>)}</div>
              <SectionTitle>Publications</SectionTitle>
              <p className="muted">{data.pubNotice}</p>
              {publicationGroups.map(([year, publications]) => (
                <section className="publication-year" key={year}>
                  <h3>{year}</h3>
                  {publications.map((publication) => {
                    const isOpen = openPublication === publication.id;
                    return (
                      <article className="publication" key={publication.id}>
                        <h4>{publication.title}</h4><p>{publication.authors}</p><em>{publication.venueFull}</em>
                        <Button className="detail-button" variant="link" size="sm" aria-expanded={isOpen} onClick={() => setOpenPublication(isOpen ? null : publication.id)}>{isOpen ? "Hide details" : "Abstract and BibTeX"}</Button>
                        {isOpen && <div className="publication-details"><p>{publication.abstract}</p><pre>{publication.bibtex}</pre><Button variant="outline" size="sm" onClick={() => void copyBibtex(publication)}>{copied === publication.id ? "Copied" : "Copy BibTeX"}</Button></div>}
                      </article>
                    );
                  })}
                </section>
              ))}
            </section>
          )}

          {route === "team" && (
            <section className="page-panel">
              <h1>Team</h1>
              <section className="pi-grid">
                <ImageSlot slot={pi.portraitSlot} portrait />
                <div><h2>{pi.name}</h2><p className="muted compact">{pi.role}</p><p>{pi.affiliations}</p><p>{pi.supervisionNote}</p><div className="pi-links">{pi.links.map((link) => <a key={link.label} href={link.href}>{link.value}</a>)}</div></div>
              </section>
              <SectionTitle>Students</SectionTitle>
              <p className="muted">{data.team.studentsNotice}</p>
              {students.map((student) => <div className="two-column-row" key={`${student.name}-${student.thesis}`}><div><strong>{student.name}</strong><small>{student.programme}</small></div><p>{student.thesis}</p></div>)}
              <SectionTitle>Collaborations</SectionTitle>
              {network.length === 0 && <p className="muted">Verified institutional collaborations will be listed here.</p>}
              {network.map((item) => <div className="two-column-row" key={item.org}><div><a href={item.href} target="_blank" rel="noreferrer">{item.org}</a><small>{item.meta}</small></div><p>{item.note}</p></div>)}
            </section>
          )}

          {route === "news" && <section className="page-panel"><h1>News</h1><div className="news-list">{data.news.map((item) => <NewsRow key={`${item.date}-${item.title}`} item={item} />)}</div></section>}

          {route === "contact" && (
            <section className="page-panel">
              <h1>Contact</h1>
              <div className="contact-grid">
                <div><address>{data.contact.address.map((line) => <span key={line}>{line}</span>)}</address><div className="contact-links">{pi.links.map((link) => <div key={link.label}><small>{link.label}</small><a href={link.href}>{link.value}</a></div>)}</div></div>
                <div><p>{data.contact.directions}</p><ImageSlot slot={data.contact.photoSlot} /></div>
              </div>
            </section>
          )}

          <footer>{data.footer.map((line) => <span key={line}>{line}</span>)}</footer>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) { return <h2 className="section-title">{children}</h2>; }
function NewsRow({ item, featured = false, compact = false }: { item: NewsItem; featured?: boolean; compact?: boolean }) {
  const paragraphs = item.body.split(/\n\s*\n/).filter(Boolean);
  const summary = item.summary ?? (item.body.length > 280 ? `${item.body.slice(0, 260).replace(/\s+\S*$/, "")}…` : item.body);
  const hasDetails = Boolean(item.sections?.length || item.poster || summary !== item.body);
  return <article className={`news-card${featured ? " news-featured" : ""}`}>
    <div className="news-card-content">
      <div className="news-eyebrow"><time>{item.date}</time>{featured && <span>In focus</span>}</div>
      <h3>{item.title}</h3>
      {item.highlights?.length ? <ul className="news-highlights" aria-label="Event information">{item.highlights.map((text) => <li key={text}>{text}</li>)}</ul> : null}
      <p className="news-summary">{summary}</p>
      {compact ? <a className="news-cta" href="#news">Explore the event <span aria-hidden="true">→</span></a> : hasDetails && <details className="news-details">
        <summary><span className="details-closed">View full details</span><span className="details-open">Hide details</span><span className="details-symbol" aria-hidden="true">+</span></summary>
        <div className="news-detail-body">
          {item.sections?.length ? item.sections.map((section) => <section className="event-section" key={section.title}><h4>{section.title}</h4><ul>{section.items.map((text) => <li key={text}>{text}</li>)}</ul></section>) : paragraphs.map((text, index) => <p key={index}>{text}</p>)}
          {item.poster && <a className="poster-link" href={item.poster.href} target="_blank" rel="noreferrer">View full-size poster (PDF) <span aria-hidden="true">↗</span></a>}
        </div>
      </details>}
    </div>
    {item.poster && <a className="news-poster" href={item.poster.href} target="_blank" rel="noreferrer" aria-label="Open inauguration poster PDF in a new tab"><Image src={item.poster.src} alt={item.poster.alt} width={1000} height={1105} sizes="(max-width: 600px) 180px, 220px" /></a>}
  </article>;
}
function ImageSlot({ slot, portrait = false }: { slot?: { label: string; src?: string }; portrait?: boolean }) {
  if (!slot) return null;
  return <div className={portrait ? "image-wrap portrait" : "image-wrap"}>{slot.src ? <Image src={slot.src} alt={slot.label} width={portrait ? 400 : 800} height={500} unoptimized /> : <div className="image-placeholder" aria-label={`${slot.label} placeholder`} />}{!slot.src && <small>{slot.label} · image coming soon</small>}</div>;
}
