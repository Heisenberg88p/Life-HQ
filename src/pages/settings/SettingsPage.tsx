import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLifeHQStore } from '../../store';

interface SettingsSectionProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

function SettingsSection({ title, eyebrow, children }: SettingsSectionProps) {
  return (
    <section className="lifehq-settings-section">
      <div className="lifehq-section-title">
        <span aria-hidden="true" />
        <div>
          {eyebrow && <p className="lifehq-label">{eyebrow}</p>}
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#F5F1EA]">{title}</h2>
        </div>
      </div>
      <div className="mt-3 space-y-2 text-sm leading-6 text-[#B8B1A7]">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const clearAllUserData = useLifeHQStore((state) => state.clearAllUserData);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  function handleResetAllData() {
    clearAllUserData();
    setIsResetConfirmOpen(false);
    navigate('/hq');
  }

  return (
    <div className="mx-auto max-w-[56rem] space-y-5">
      <div className="space-y-3">
        <Link to="/hq" className="lifehq-project-backlink">← Zurück zum HQ</Link>
        <div className="space-y-2">
          <p className="lifehq-label">Lokale Systemsteuerung</p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#F5F1EA] sm:text-5xl">Einstellungen</h1>
          <p className="max-w-2xl text-sm leading-6 text-[#B8B1A7]">
            Minimaler V1-Bereich für App-Info, lokale Speicherung und bewusstes Zurücksetzen deiner Browserdaten.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        <SettingsSection title="App" eyebrow="LifeHQ">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-[#F5F1EA]">LifeHQ V1</p>
              <p className="mt-1 text-[#7E776E]">Lokale MVP-Version</p>
            </div>
            <span className="lifehq-badge w-fit border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#D6AD64]">V1</span>
          </div>
        </SettingsSection>

        <SettingsSection title="Lokale Speicherung" eyebrow="Browserdaten">
          <p>LifeHQ V1 speichert deine Daten lokal in diesem Browser.</p>
          <p>Keine Cloud. Kein Account. Keine Synchronisierung.</p>
        </SettingsSection>

        <SettingsSection title="Datenverwaltung" eyebrow="Reset">
          <p>Du kannst alle lokal gespeicherten Inhalte zurücksetzen.</p>
          <div className="lifehq-danger-zone mt-3">
            <p className="font-semibold text-[#F5F1EA]">Daten zurücksetzen</p>
            {!isResetConfirmOpen ? (
              <div className="mt-2 space-y-3">
                <p className="text-sm leading-6 text-[#B8B1A7]">
                  Diese Aktion leert LifeHQ auf diesem Gerät und stellt keine Demo-Daten wieder her.
                </p>
                <button type="button" onClick={() => setIsResetConfirmOpen(true)} className="lifehq-button-secondary">
                  Daten zurücksetzen
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                <p className="text-sm leading-6 text-[#B8B1A7]">
                  Alle lokal gespeicherten Lebensbereiche, Projekte, Aufgaben, Meilensteine und Verlaufseinträge werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setIsResetConfirmOpen(false)} className="lifehq-button-secondary">
                    Abbrechen
                  </button>
                  <button type="button" onClick={handleResetAllData} className="lifehq-button-primary">
                    Endgültig zurücksetzen
                  </button>
                </div>
              </div>
            )}
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
