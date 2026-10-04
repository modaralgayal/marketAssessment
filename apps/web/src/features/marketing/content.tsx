import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------ *
 * Loose content shape. The prototype embeds a `project` object that
 * drives every page; we type it loosely and read via dotted paths.
 * ------------------------------------------------------------------ */
export interface Project {
  assets: Record<string, string>;
  global: {
    siteTitle: string;
    nav: { label: string; href: string; children?: { label: string; href: string }[] }[];
    secondaryLabel: string;
    primaryLabel: string;
    footer: {
      tagline: string;
      description: string;
      links: { label: string; href: string }[];
      copyright: string;
      email: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  textColors?: Record<string, string>;
  pages: Record<string, { label?: string; sections: Section[] }>;
  forms: {
    start: { fields: FormFieldDef[]; [k: string]: unknown };
    organization: {
      title: string;
      body: string;
      types: string[];
      support: string[];
      confirmationTitle?: string;
      confirmationBody?: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

export interface Section {
  type: string;
  id?: string;
  visible?: boolean;
  mode?: string;
  steps?: string[];
  image?: string;
  layout?: string;
  email?: string;
  href?: string;
  status?: string;
  body?: string;
  category?: string;
  title?: string;
  summary?: string;
  author?: string;
  date?: string;
  fields?: FormFieldDef[];
  items?: Record<string, unknown>[];
  button?: string;
  [k: string]: unknown;
}

export interface FormFieldDef {
  name: string;
  label: string;
  kind?: string;
  required?: boolean;
  placeholder?: string;
}

/* ------------------------------------------------------------------ *
 * Content loading
 * ------------------------------------------------------------------ */
const CONTENT_URL = "/tradelomacy-content.json";

let cache: Promise<Project> | null = null;

export function loadProject(): Promise<Project> {
  if (!cache) {
    cache = fetch(CONTENT_URL).then((r) => {
      if (!r.ok) throw new Error(`Failed to load content: ${r.status}`);
      return r.json() as Promise<Project>;
    });
  }
  return cache;
}

export function useProject(): { project: Project | null; loading: boolean; error: Error | null } {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  useEffect(() => {
    let alive = true;
    loadProject()
      .then((p) => alive && setProject(p))
      .catch((e) => alive && setError(e as Error))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);
  return { project, loading, error };
}

/* ------------------------------------------------------------------ *
 * Path access + escaping (mirrors the prototype's get / E)
 * ------------------------------------------------------------------ */
export function get(obj: Project | Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((a, k) => (a as Record<string, unknown>)?.[k], obj);
}

const ACCENT_PHRASES = [
  "Matched.",
  "at scale.",
  "at scale.  ",
  "Verified, Customized Process.",
  "Market Dynamics.",
  "trade goals.",
  "Insights from our work.",
  "trade opportunity.",
  "Market Entry Platform",
];

/** Wrap a known accent phrase in a span, exactly like the prototype. */
export function accentParts(text: string): ReactNode {
  const phrase = ACCENT_PHRASES.find((x) => text.includes(x));
  if (!phrase) return text;
  const idx = text.indexOf(phrase);
  return (
    <>
      {text.slice(0, idx)}
      <span className="heading-accent">{phrase}</span>
      {text.slice(idx + phrase.length)}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Countries (mirrors the prototype's COUNTRY_CODES / exportCodes)
 * ------------------------------------------------------------------ */
export const COUNTRY_CODES =
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(
    " ",
  );

export const EXPORT_CODES = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE CH AL BA ME MK RS TR BH IQ IR KW OM QA SA AE JO DZ EG LY MA SD TN EH MR".split(
    " ",
  ),
);

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
export const COUNTRIES = COUNTRY_CODES.map((code) => ({
  code,
  label: displayNames.of(code) ?? code,
})).sort((a, b) => a.label.localeCompare(b.label));

export function countryOptions(exportOnly = false): { code: string; label: string }[] {
  return COUNTRIES.filter((c) => !exportOnly || EXPORT_CODES.has(c.code));
}

/* ------------------------------------------------------------------ *
 * Navigation link helper — maps prototype hrefs (#/x, #organization)
 * onto react-router navigation and org-modal triggers.
 * ------------------------------------------------------------------ */
export type HrefHandler = (href: string) => void;

export function normalizeHref(href: string): string {
  if (href === "#start") return "/start-trading";
  if (href.startsWith("#/")) {
    const path = href.slice(2).split("#")[0];
    return path === "home" ? "/" : "/" + path;
  }
  return href;
}

export function isRouteHref(href: string): boolean {
  return href === "#start" || href.startsWith("#/");
}

export function isOrgHref(href: string): boolean {
  return href === "#organization" || href === "#/organization";
}

export function isAnchorHref(href: string): boolean {
  return href.startsWith("#") && !isRouteHref(href) && !isOrgHref(href);
}

/* ------------------------------------------------------------------ *
 * Org-modal context
 * ------------------------------------------------------------------ */
const OrgModalCtx = createContext<{ open: () => void; close: () => void }>({
  open: () => {},
  close: () => {},
});

export function OrgModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <OrgModalCtx.Provider value={{ open: () => setOpen(true), close: () => setOpen(false) }}>
      {children}
      {open && <OrgModalSlot onClose={() => setOpen(false)} />}
    </OrgModalCtx.Provider>
  );
}

// Imported lazily to avoid a cycle; OrganizationModal is defined separately.
import { OrganizationModal } from "./forms/OrganizationModal";
function OrgModalSlot({ onClose }: { onClose: () => void }) {
  const { project } = useProject();
  if (!project) return null;
  return <OrganizationModal project={project} onClose={onClose} />;
}

export const useOrgModal = () => useContext(OrgModalCtx);

/* ------------------------------------------------------------------ *
 * A link that understands prototype href conventions.
 * ------------------------------------------------------------------ */
export function TLink({
  href,
  className,
  children,
  ariaCurrent,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  ariaCurrent?: boolean;
}) {
  const navigate = useNavigate();
  const org = useOrgModal();

  if (isOrgHref(href)) {
    return (
      <a
        className={className}
        href="#organization"
        onClick={(e) => {
          e.preventDefault();
          org.open();
        }}
      >
        {children}
      </a>
    );
  }
  if (isAnchorHref(href)) {
    const id = href.slice(1);
    return (
      <a
        className={className}
        href={href}
        onClick={(e) => {
          e.preventDefault();
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
        }}
      >
        {children}
      </a>
    );
  }
  const to = normalizeHref(href);
  return (
    <a
      className={className}
      href={to}
      aria-current={ariaCurrent ? "page" : undefined}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

/* Convenience for reading text nodes from the content object. */
export function text(project: Project, path: string): string {
  const v = get(project, path);
  return v == null ? "" : String(v);
}
