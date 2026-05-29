import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './layouts/AppShell';
import { HqPage } from './pages/hq/HqPage';
import { TasksPage } from './pages/tasks/TasksPage';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/hq" replace />} />
        <Route path="/hq" element={<HqPage />} />
        <Route path="/tasks" element={<TasksPage />} />
      </Route>
    </Routes>
  );
}
