import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Impressum | CineGrid',
  description: 'Impressum und rechtliche Hinweise von CineGrid.',
  alternates: {
    canonical: 'https://cinegrid.de/impressum',
  },
};

export default function ImpressumPage() {
  return (
    <main className="min-h-screen bg-cinema-bg px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-cinema-muted transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          Zurück zu CineGrid
        </Link>

        <header className="mt-10 border-b border-cinema-border/70 pb-6 sm:mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cinema-accent">CineGrid</p>
          <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">Impressum</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cinema-muted sm:text-base">
            Rechtliche Informationen und Kontaktangaben für CineGrid.
          </p>
        </header>

        <div className="mt-8 space-y-5">
          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7" aria-labelledby="anbieter">
            <h2 id="anbieter" className="text-lg font-semibold text-white sm:text-xl">
              Angaben gemäß § 5 TMG
            </h2>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-cinema-muted">
              <div>
                <h3 className="font-medium text-white">Diensteanbieter</h3>
                <p className="mt-1">[Tamino Schubarth]</p>
                <p>[Kremper Rhin 4A]</p>
                <p>[25348 Blomesche Wildnis]</p>
                <p>[Deutschland]</p>
              </div>

              <div className="border-t border-cinema-border/70 pt-4">
                <h3 className="flex items-center gap-2 font-medium text-white">
                  <Mail size={15} className="text-cinema-accent" /> Kontakt
                </h3>
                <p className="mt-1">E-Mail: [geschützte E-Mail-Adresse]</p>
                <p>Kontakt-Adresse: [geschützte Kontakt-Adresse]</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7" aria-labelledby="haftung">
            <h2 id="haftung" className="text-lg font-semibold text-white sm:text-xl">
              Haftungsausschluss
            </h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-cinema-muted">
              <p>
                Die Inhalte dieser Website werden mit größtmöglicher Sorgfalt erstellt. Für die Richtigkeit,
                Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr übernommen werden.
              </p>
              <p>
                CineGrid enthält Links zu externen Websites Dritter. Auf deren Inhalte und deren laufende
                Verfügbarkeit haben wir keinen Einfluss. Für fremde Inhalte ist stets der jeweilige Anbieter
                verantwortlich.
              </p>
            </div>
            <div className="mt-5 flex items-start gap-3 rounded-xl border border-cinema-accent/20 bg-cinema-accent/5 p-3 text-xs leading-relaxed text-cinema-muted">
              <ShieldCheck size={16} className="mt-0.5 shrink-0 text-cinema-accent" />
              <p>Externe Links werden zum Zeitpunkt der Verlinkung geprüft. Eine permanente Kontrolle ist nicht zumutbar.</p>
            </div>
          </section>
        </div>

        <footer className="mt-8 border-t border-cinema-border/70 pt-5 text-xs text-cinema-muted">
          <p>© {new Date().getFullYear()} CineGrid</p>
        </footer>
      </div>
    </main>
  );
}
