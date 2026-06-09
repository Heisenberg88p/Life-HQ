import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getLifeHQBackupFileName,
  parseLifeHQBackupJson,
  serializeLifeHQBackup,
} from '../../store/backup';
import { useLifeHQStore } from '../../store';
import type { PersistableLifeHQState } from '../../store/persistence';

interface SettingsSectionProps {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

type DataSafetyMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
};

type PendingImport = {
  fileName: string;
  data: PersistableLifeHQState;
  itemCount: number;
};

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

function getImportItemCount(data: PersistableLifeHQState): number {
  return data.lifeAreas.length + data.projects.length + data.tasks.length + data.milestones.length + data.historyEntries.length;
}

function getMessageClassName(type: DataSafetyMessage['type']) {
  if (type === 'error') {
    return 'border-red-400/25 bg-red-500/10 text-red-100';
  }

  if (type === 'success') {
    return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-100';
  }

  return 'border-[#D6AD64]/25 bg-[#D6AD64]/10 text-[#F5F1EA]';
}

export function SettingsPage() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);
  const clearAllUserData = useLifeHQStore((state) => state.clearAllUserData);
  const replaceAppData = useLifeHQStore((state) => state.replaceAppData);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [dataSafetyMessage, setDataSafetyMessage] = useState<DataSafetyMessage | null>(null);

  function handleResetAllData() {
    clearAllUserData();
    setIsResetConfirmOpen(false);
    navigate('/hq');
  }

  function handleExportData() {
    const state = useLifeHQStore.getState();
    const exportedAt = new Date();
    const backupJson = serializeLifeHQBackup(state, exportedAt);
    const backupBlob = new Blob([backupJson], { type: 'application/json' });
    const downloadUrl = window.URL.createObjectURL(backupBlob);
    const downloadLink = document.createElement('a');

    downloadLink.href = downloadUrl;
    downloadLink.download = getLifeHQBackupFileName(exportedAt);
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.URL.revokeObjectURL(downloadUrl);

    setPendingImport(null);
    setDataSafetyMessage({ type: 'success', text: 'Backup wurde erstellt. Deine aktuellen LifeHQ-Daten wurden nicht verändert.' });
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setPendingImport(null);
      setDataSafetyMessage({ type: 'error', text: 'Bitte wähle eine JSON-Datei aus.' });
      return;
    }

    let fileText: string;

    try {
      fileText = await file.text();
    } catch {
      setPendingImport(null);
      setDataSafetyMessage({ type: 'error', text: 'Die Datei konnte nicht gelesen werden.' });
      return;
    }

    const parsedBackup = parseLifeHQBackupJson(fileText);

    if (!parsedBackup.ok) {
      setPendingImport(null);
      setDataSafetyMessage({ type: 'error', text: parsedBackup.error });
      return;
    }

    setPendingImport({
      fileName: file.name,
      data: parsedBackup.backup.data,
      itemCount: getImportItemCount(parsedBackup.backup.data),
    });
    setDataSafetyMessage({
      type: 'info',
      text: 'Backup wurde geprüft. Bitte bestätige den Import, bevor deine aktuellen lokalen Daten ersetzt werden.',
    });
  }

  function handleConfirmImport() {
    if (!pendingImport) {
      return;
    }

    replaceAppData(pendingImport.data);
    setDataSafetyMessage({
      type: 'success',
      text: `Backup „${pendingImport.fileName}“ wurde importiert. Deine lokalen LifeHQ-Daten wurden ersetzt.`,
    });
    setPendingImport(null);
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

        <SettingsSection title="Datensicherung" eyebrow="Export / Import">
          <p>LifeHQ speichert Daten lokal auf diesem Gerät und in diesem Browser.</p>
          <p>Updates löschen Daten normalerweise nicht. Ein Backup schützt dich aber, wenn Website-Daten gelöscht werden oder du das Gerät wechselst.</p>
          <p>Der Import ist eine Wiederherstellung: Er ersetzt deine aktuellen lokalen LifeHQ-Daten und führt sie nicht zusammen.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.1rem] border border-white/[0.08] bg-black/20 p-4">
              <p className="font-semibold text-[#F5F1EA]">Daten exportieren</p>
              <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">Lädt eine JSON-Datei mit Lebensbereichen, Projekten, Aufgaben, Meilensteinen und Verlauf herunter.</p>
              <button type="button" onClick={handleExportData} className="lifehq-button-primary mt-3">
                Daten exportieren
              </button>
            </div>

            <div className="rounded-[1.1rem] border border-white/[0.08] bg-black/20 p-4">
              <p className="font-semibold text-[#F5F1EA]">Daten importieren</p>
              <p className="mt-2 text-sm leading-6 text-[#B8B1A7]">Wähle eine LifeHQ-Backup-Datei aus. Vor dem Überschreiben musst du den Import bestätigen.</p>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFileChange}
                className="hidden"
              />
              <button type="button" onClick={() => importInputRef.current?.click()} className="lifehq-button-secondary mt-3">
                Daten importieren
              </button>
            </div>
          </div>

          {dataSafetyMessage && (
            <div className={`mt-4 rounded-[1rem] border px-4 py-3 text-sm leading-6 ${getMessageClassName(dataSafetyMessage.type)}`}>
              {dataSafetyMessage.text}
            </div>
          )}

          {pendingImport && (
            <div className="lifehq-danger-zone mt-4 space-y-3">
              <p className="font-semibold text-[#F5F1EA]">Import bestätigen</p>
              <p>
                Der Import ersetzt deine aktuellen lokalen LifeHQ-Daten. Bitte exportiere vorher ein Backup, falls du den aktuellen Stand behalten möchtest.
              </p>
              <p className="text-[#7E776E]">
                Ausgewählte Datei: {pendingImport.fileName} · {pendingImport.itemCount} Einträge
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setPendingImport(null)} className="lifehq-button-secondary">
                  Abbrechen
                </button>
                <button type="button" onClick={handleConfirmImport} className="lifehq-button-primary">
                  Daten ersetzen
                </button>
              </div>
            </div>
          )}
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
