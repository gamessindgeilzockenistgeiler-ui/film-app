import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | CineGrid',
  description: 'Datenschutzerklärung und Informationen zur Datenverarbeitung bei CineGrid.',
  alternates: {
    canonical: 'https://cinegrid.de/datenschutz',
  },
};

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen bg-cinema-bg px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="inline-block font-display text-3xl tracking-widest text-cinema-accent transition-colors hover:text-white sm:text-4xl">
          CineGrid
        </Link>

        <header className="mt-10 border-b border-cinema-border/70 pb-6 sm:mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cinema-accent">Rechtliches</p>
          <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">Datenschutz</h1>
          <p className="mt-3 text-sm leading-relaxed text-cinema-muted sm:text-base">
            Informationen darüber, welche Daten CineGrid verarbeitet und warum.
          </p>
        </header>

        <div className="mt-8 space-y-5 text-sm leading-relaxed text-cinema-muted">
          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-white sm:text-xl">1. Verantwortliche Stelle</h2>
            <p className="mt-4">Verantwortlich für die Datenverarbeitung ist die im <Link href="/impressum" className="text-cinema-accent hover:text-white">Impressum</Link> genannte Person bzw. Stelle.</p>
            <p className="mt-3">Kontakt: cinegridcg@gmail.com</p>
          </section>

          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-white sm:text-xl">2. Nutzung ohne Konto</h2>
            <p className="mt-4">CineGrid kann ohne Anmeldung durchsucht werden. Filme, die Gäste hinzufügen, sowie deren Bewertungs- und Gesehen-Status werden ausschließlich im lokalen Speicher des verwendeten Browsers gespeichert. Diese Daten werden nicht an CineGrid übertragen.</p>
          </section>

          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-white sm:text-xl">3. Nutzerkonto und Supabase</h2>
            <p className="mt-4">Für ein Nutzerkonto werden die zur Registrierung erforderlichen Angaben, insbesondere die E-Mail-Adresse, verarbeitet. Watchlist, Bewertungen, Profile, Kommentare und Reaktionen werden über Supabase gespeichert. Supabase verarbeitet diese Daten als technischer Dienstleister nach den geltenden Datenschutzanforderungen.</p>
            <p className="mt-3">Die Verarbeitung erfolgt zur Bereitstellung der Konto- und Watchlist-Funktionen. Nutzer können ihre Daten im Rahmen der gesetzlichen Vorgaben löschen oder eine Auskunft anfordern.</p>
          </section>

          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-white sm:text-xl">4. TMDB und externe Inhalte</h2>
            <p className="mt-4">Film-, Poster-, Besetzungs-, Streaming- und Empfehlungsdaten werden über The Movie Database (TMDB) abgerufen. Bei der Anzeige von Postern, Bildern, Trailer-Videos oder externen Reviews können Verbindungen zu den jeweiligen Anbietern hergestellt werden.</p>
            <p className="mt-3">Für deren Datenverarbeitung gelten die Datenschutzerklärungen der jeweiligen Anbieter. CineGrid verwendet TMDB-Daten gemäß den geltenden TMDB-Nutzungsbedingungen.</p>
          </section>

          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-white sm:text-xl">5. Server- und Verbindungsdaten</h2>
            <p className="mt-4">Beim Aufruf der Website können durch Hosting- und Infrastruktur-Dienste technische Verbindungsdaten wie IP-Adresse, Zeitpunkt, angeforderte Seite und Browsertyp in Serverlogs verarbeitet werden. Diese Verarbeitung dient der Sicherheit, Stabilität und Fehleranalyse des Angebots.</p>
          </section>

          <section className="rounded-2xl border border-cinema-border bg-cinema-surface p-5 sm:p-7">
            <h2 className="text-lg font-semibold text-white sm:text-xl">6. Deine Rechte</h2>
            <p className="mt-4">Du hast im Rahmen der gesetzlichen Voraussetzungen das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem besteht ein Beschwerderecht bei einer Datenschutzaufsichtsbehörde.</p>
            <p className="mt-3">Anfragen kannst du an die im Impressum genannte Kontaktadresse richten.</p>
          </section>
        </div>

        <footer className="mt-8 border-t border-cinema-border/70 pt-5 text-xs text-cinema-muted">
          <Link href="/impressum" className="text-cinema-accent hover:text-white">Impressum</Link>
        </footer>
      </div>
    </main>
  );
}
