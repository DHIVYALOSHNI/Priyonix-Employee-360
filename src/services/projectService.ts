import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProjectItem, ProjectStatus } from '../types';
import { PROJECTS_DATA } from './seedData';
import { logActivity } from './activityService';
import { memoryCache, FIVE_MINUTES_MS } from './cacheUtils';

const CACHE_KEY_PROJECTS = 'projects_cache';

export const getCachedProjects = (): ProjectItem[] => {
  const cached = memoryCache.peek<ProjectItem[]>(CACHE_KEY_PROJECTS);
  if (cached && cached.length > 0) return cached;
  return PROJECTS_DATA;
};

export const fetchProjects = async (forceRefresh = false): Promise<ProjectItem[]> => {
  return memoryCache.getOrFetch(CACHE_KEY_PROJECTS, async () => {
    let list: ProjectItem[] = [];
    try {
      const colRef = collection(db, 'projects');
      const q = query(colRef, orderBy('startDate', 'desc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProjectItem));
      } else {
        list = [...PROJECTS_DATA];
      }
    } catch (err) {
      console.warn('Firestore projects query error, falling back to seed projects:', err);
      list = [...PROJECTS_DATA];
    }
    return list;
  }, FIVE_MINUTES_MS, forceRefresh);
};

export const saveProject = async (
  project: ProjectItem,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'projects', project.id);
  const payload = JSON.parse(JSON.stringify(project));
  await setDoc(ref, payload, { merge: true });
  memoryCache.invalidate(CACHE_KEY_PROJECTS);

  await logActivity(
    'PROJECT_SAVED',
    adminUid,
    adminName,
    'ADMIN',
    'PROJECT',
    project.id,
    `Saved project ${project.name} (${project.status}, ${project.completionPercentage}% complete).`
  );
};

export const updateProjectStatus = async (
  projectId: string,
  projectName: string,
  newStatus: ProjectStatus,
  completionPercentage: number,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'projects', projectId);
  await updateDoc(ref, { 
    status: newStatus,
    completionPercentage,
  });
  memoryCache.invalidate(CACHE_KEY_PROJECTS);

  await logActivity(
    'PROJECT_STATUS_CHANGED',
    adminUid,
    adminName,
    'ADMIN',
    'PROJECT',
    projectId,
    `Changed project ${projectName} status to ${newStatus} (${completionPercentage}%).`
  );
};

export const deleteProject = async (
  projectId: string,
  projectName: string,
  adminUid: string,
  adminName: string
): Promise<void> => {
  const ref = doc(db, 'projects', projectId);
  await deleteDoc(ref);
  memoryCache.invalidate(CACHE_KEY_PROJECTS);

  await logActivity(
    'PROJECT_ARCHIVED',
    adminUid,
    adminName,
    'ADMIN',
    'PROJECT',
    projectId,
    `Archived project ${projectName} (${projectId}).`
  );
};
