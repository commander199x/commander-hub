"use client";

import { Radio, Users, ArrowUpRight } from "lucide-react";
import { C, JOIN_FORM_URL, JOIN_FORM_EMBED_URL } from "@/lib/theme";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function JoinView() {
  const { t } = useLanguage();

  return (
    <main className="min-h-screen w-full cz-grid-bg">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-14">
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase" style={{ color: C.radar }}>
          <Radio size={13} className="cz-live" />
          <span>{t("common.fieldComms")}</span>
        </div>

        <h1
          className="cz-display uppercase mt-4 leading-[0.95]"
          style={{ fontSize: "clamp(2.6rem, 6vw, 4.5rem)", fontWeight: 700, letterSpacing: "0.01em" }}
        >
          {t("join.titleLine1")}
          <br />
          <span style={{ color: C.amber }}>{t("join.titleLine2")}</span>
        </h1>

        <p className="text-sm mt-6 max-w-lg" style={{ color: C.muted }}>
          {t("join.desc")}
        </p>

        <div className="flex items-center gap-2 mt-10 mb-4">
          <Users size={16} style={{ color: C.amber }} />
          <h2 className="cz-display uppercase text-xl" style={{ fontWeight: 600 }}>
            {t("join.registrationForm")}
          </h2>
        </div>

        <div style={{ border: `1px solid ${C.line}`, background: C.panel }}>
          <iframe
            src={JOIN_FORM_EMBED_URL}
            width="100%"
            height="900"
            style={{ border: "none", display: "block" }}
            title="Commander team registration form"
          >
            {t("join.loadingForm")}
          </iframe>
        </div>

        <p className="text-xs uppercase tracking-widest mt-4" style={{ color: C.muted }}>
          {t("join.formNotLoading")}{" "}
          <a
            href={JOIN_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1"
            style={{ color: C.amber }}
          >
            {t("join.openInNewTab")}
            <ArrowUpRight size={12} />
          </a>
        </p>
      </div>
    </main>
  );
}
