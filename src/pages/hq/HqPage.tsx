import { selectLifeAreas, selectMilestones, selectProjects, useLifeHQStore } from '../../store';

export function HqPage() {
  const lifeAreas = useLifeHQStore(selectLifeAreas);
  const projects = useLifeHQStore(selectProjects);
  const milestones = useLifeHQStore(selectMilestones);

  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Strategic Overview</p>
      <h2 className="text-2xl font-semibold">HQ</h2>
      <p className="max-w-2xl text-sm text-slate-300">Placeholder for LifeHQ strategic dashboard surface.</p>
      <div className="text-sm text-slate-300">
        Store debug: {lifeAreas.length} life areas · {projects.length} projects · {milestones.length} milestones
      </div>
    </section>
  );
}
