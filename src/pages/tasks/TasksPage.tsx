import { selectOpenTasks, selectTasks, useLifeHQStore } from '../../store';

export function TasksPage() {
  const tasks = useLifeHQStore(selectTasks);
  const openTasks = useLifeHQStore(selectOpenTasks);

  return (
    <section className="space-y-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Operational Execution</p>
      <h2 className="text-2xl font-semibold">Tasks</h2>
      <p className="max-w-2xl text-sm text-slate-300">Placeholder for LifeHQ task execution surface.</p>
      <div className="text-sm text-slate-300">Store debug: {tasks.length} tasks · {openTasks.length} open tasks</div>
    </section>
  );
}
