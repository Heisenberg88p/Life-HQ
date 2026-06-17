import type { LifeArea } from '../models/lifeArea';
import type { LifeSystem } from '../models/lifeSystem';
import type { Project } from '../models/project';

export interface LifeAreaToLifeSystemMigrationState {
  lifeAreas: LifeArea[];
  lifeSystems: LifeSystem[];
  projects: Project[];
}

const getMigratedLifeSystemId = (lifeAreaId: string): string => `life-system-from-life-area-${lifeAreaId}`;

const getTimestamp = (value: string | undefined, fallback: string): string => value ?? fallback;

const findExistingLifeSystemForLifeArea = (lifeSystems: LifeSystem[], lifeArea: LifeArea): LifeSystem | undefined => {
  const migratedId = getMigratedLifeSystemId(lifeArea.id);

  return lifeSystems.find((lifeSystem) => lifeSystem.id === migratedId || lifeSystem.legacyLifeAreaId === lifeArea.id);
};

export const migrateLifeAreasToLifeSystems = <T extends LifeAreaToLifeSystemMigrationState>(
  state: T,
  timestampFallback = new Date().toISOString(),
): T => {
  if (state.lifeAreas.length === 0) {
    return state;
  }

  const lifeSystems = [...state.lifeSystems];
  const lifeSystemIdsByLifeAreaId = new Map<string, string>();

  state.lifeAreas.forEach((lifeArea) => {
    const existingLifeSystem = findExistingLifeSystemForLifeArea(lifeSystems, lifeArea);

    if (existingLifeSystem) {
      lifeSystemIdsByLifeAreaId.set(lifeArea.id, existingLifeSystem.id);
      return;
    }

    const migratedLifeSystem: LifeSystem = {
      id: getMigratedLifeSystemId(lifeArea.id),
      name: lifeArea.name,
      description: lifeArea.description,
      legacyLifeAreaId: lifeArea.id,
      createdAt: getTimestamp(lifeArea.createdAt, timestampFallback),
      updatedAt: getTimestamp(lifeArea.updatedAt, timestampFallback),
    };

    lifeSystems.push(migratedLifeSystem);
    lifeSystemIdsByLifeAreaId.set(lifeArea.id, migratedLifeSystem.id);
  });

  const validLifeSystemIds = new Set(lifeSystems.map((lifeSystem) => lifeSystem.id));
  const projects = state.projects.map((project) => {
    if (project.lifeSystemId && validLifeSystemIds.has(project.lifeSystemId)) {
      return project;
    }

    if (!project.lifeAreaId) {
      return project.lifeSystemId ? { ...project, lifeSystemId: undefined } : project;
    }

    const migratedLifeSystemId = lifeSystemIdsByLifeAreaId.get(project.lifeAreaId);

    if (!migratedLifeSystemId) {
      return project.lifeSystemId ? { ...project, lifeSystemId: undefined } : project;
    }

    return {
      ...project,
      lifeSystemId: migratedLifeSystemId,
    };
  });

  return {
    ...state,
    lifeSystems,
    projects,
  };
};
