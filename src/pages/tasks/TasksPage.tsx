import { selectOpenTasks, selectTasks, useLifeHQStore } from '../../store';

export function TasksPage() {
  const tasks = useLifeHQStore(selectTasks);
  const openTasks = useLifeHQStore(selectOpenTasks);

  return (
    <section className="max-w-3xl space-y-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Operational Execution</p>
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold sm:text-3xl">Tasks</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Placeholder for the operational task execution surface. This area stays lightweight while navigation and responsive layout are stabilized.
        </p>
      </div>
      <div className="rounded-2xl border border-slate-700/50 bg-slate-950/30 px-4 py-3 text-sm leading-6 text-slate-300">
        Store debug: {tasks.length} tasks · {openTasks.length} open tasks
      </div>
    </section>
  );
}
