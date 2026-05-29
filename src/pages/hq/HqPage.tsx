import { selectLifeAreas, selectMilestones, selectProjects, useLifeHQStore } from '../../store';

export function HqPage() {
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const projects = useLifeHQStore(selectProjects);
  const milestones = useLifeHQStore(selectMilestones);

  return (
    <section className="max-w-3xl space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Strategic Overview</p>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold sm:text-3xl">HQ</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Placeholder for the strategic LifeHQ dashboard surface. This area remains intentionally simple while the responsive app layout is prepared.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-950/30 px-4 py-3 text-sm leading-6 text-slate-300">
        Store debug: {lifeAreas.length} life areas · {projects.length} projects · {milestones.length} milestones
      </div>
    </section>
  );
}
