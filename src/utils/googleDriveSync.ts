import {
  ActiveWorkout,
  BodyWeightEntry,
  CompletedWorkout,
  Exercise,
  RoutineTemplate,
  UserSettings,
  WorkoutExercise,
  WorkoutSet
} from '../types/fitness';

export const GOOGLE_DRIVE_CLIENT_ID = '';

const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
const BACKUP_FILE_NAME = 'fitlog-private-sync.json';

export interface FitLogDriveData {
  schemaVersion: 1;
  updatedAt?: string;
  exercises: Exercise[];
  routines: RoutineTemplate[];
  history: CompletedWorkout[];
  bodyWeights: BodyWeightEntry[];
  settings: UserSettings;
  activeWorkout: ActiveWorkout | null;
}

interface DriveFileRef {
  id: string;
  name: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenClient {
  requestAccessToken(options?: { prompt?: string }): void;
}

interface GoogleOAuth2 {
  initTokenClient(options: {
    client_id: string;
    scope: string;
    callback: (response: GoogleTokenResponse) => void;
    error_callback?: (error: { type?: string; message?: string }) => void;
  }): GoogleTokenClient;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

let googleScriptPromise: Promise<void> | null = null;

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[src="' + GOOGLE_SCRIPT_URL + '"]');
    const loaded = () => {
      if (window.google?.accounts?.oauth2) resolve();
      else reject(new Error('Google sign-in could not be initialized. Please try again.'));
    };
    const failed = () => reject(new Error('Google sign-in could not be loaded. Check your connection and try again.'));

    if (!script) {
      script = document.createElement('script');
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = loaded;
      script.onerror = failed;
      document.head.appendChild(script);
      return;
    }

    script.addEventListener('load', loaded, { once: true });
    script.addEventListener('error', failed, { once: true });
  }).catch((error) => {
    googleScriptPromise = null;
    throw error;
  });

  return googleScriptPromise;
}

export async function requestGoogleDriveToken(clientId: string): Promise<string> {
  await loadGoogleIdentity();
  const oauth = window.google?.accounts?.oauth2;
  if (!oauth) throw new Error('Google sign-in is unavailable. Please reload FitLog and try again.');

  return new Promise<string>((resolve, reject) => {
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_DRIVE_SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error_description || response.error || 'Google Drive access was not granted.'));
          return;
        }
        resolve(response.access_token);
      },
      error_callback: (error) => reject(new Error(error.message || 'Google sign-in was closed before it finished.'))
    });
    client.requestAccessToken({ prompt: '' });
  });
}

async function driveRequest<T>(token: string, url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: 'Bearer ' + token,
      ...(init.headers || {})
    }
  });
  if (!response.ok) {
    let message = 'Google Drive request failed (' + response.status + ').';
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {
      // Keep the concise default message when Google returns no JSON details.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function loadDriveBackup(token: string): Promise<{ file: DriveFileRef; data: FitLogDriveData } | null> {
  const query = new URLSearchParams({
    spaces: 'appDataFolder',
    q: "name='" + BACKUP_FILE_NAME + "' and trashed=false",
    fields: 'files(id,name)',
    pageSize: '1'
  });
  const listing = await driveRequest<{ files?: DriveFileRef[] }>(
    token,
    'https://www.googleapis.com/drive/v3/files?' + query.toString()
  );
  const file = listing.files?.[0];
  if (!file) return null;

  const response = await fetch('https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(file.id) + '?alt=media', {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!response.ok) {
    throw new Error('FitLog could not read its private backup from Google Drive (' + response.status + ').');
  }

  const data = await response.json() as FitLogDriveData;
  if (!data || !Array.isArray(data.history) || !Array.isArray(data.routines) || !Array.isArray(data.exercises)) {
    throw new Error('The FitLog private backup in Google Drive could not be read.');
  }
  return { file, data };
}

export async function saveDriveBackup(
  token: string,
  data: FitLogDriveData,
  file?: DriveFileRef
): Promise<DriveFileRef> {
  const backup = JSON.stringify({ ...data, schemaVersion: 1, updatedAt: new Date().toISOString() });
  if (file?.id) {
    return driveRequest<DriveFileRef>(
      token,
      'https://www.googleapis.com/upload/drive/v3/files/' + encodeURIComponent(file.id) + '?uploadType=media&fields=id,name',
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: backup }
    );
  }

  const boundary = 'fitlog_drive_boundary';
  const metadata = JSON.stringify({
    name: BACKUP_FILE_NAME,
    mimeType: 'application/json',
    parents: ['appDataFolder']
  });
  const multipartBody = [
    '--' + boundary,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    '--' + boundary,
    'Content-Type: application/json',
    '',
    backup,
    '--' + boundary + '--',
    ''
  ].join('\r\n');

  return driveRequest<DriveFileRef>(
    token,
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
      body: multipartBody
    }
  );
}

function mergeById<T extends { id: string }>(preferred: T[], secondary: T[]): T[] {
  const values = new Map<string, T>();
  secondary.forEach((item) => values.set(item.id, item));
  preferred.forEach((item) => values.set(item.id, item));
  return Array.from(values.values());
}

function mergeActiveWorkout(primary: ActiveWorkout | null, secondary: ActiveWorkout | null): ActiveWorkout | null {
  if (!primary) return secondary;
  if (!secondary) return primary;
  if (primary.id !== secondary.id) return primary.startTime >= secondary.startTime ? primary : secondary;

  const exerciseMap = new Map<string, WorkoutExercise>();
  [...secondary.exercises, ...primary.exercises].forEach((exercise) => {
    const earlier = exerciseMap.get(exercise.id);
    if (!earlier) {
      exerciseMap.set(exercise.id, exercise);
      return;
    }
    const setMap = new Map<string, WorkoutSet>();
    [...earlier.sets, ...exercise.sets].forEach((set) => setMap.set(set.id, {
      ...setMap.get(set.id),
      ...set,
      completed: Boolean(setMap.get(set.id)?.completed || set.completed)
    }));
    exerciseMap.set(exercise.id, { ...earlier, ...exercise, sets: Array.from(setMap.values()) });
  });

  return {
    ...secondary,
    ...primary,
    durationSeconds: Math.max(primary.durationSeconds, secondary.durationSeconds),
    exercises: Array.from(exerciseMap.values())
  };
}

export function mergeDriveData(
  cloud: FitLogDriveData,
  local: FitLogDriveData,
  preferCloud: boolean
): FitLogDriveData {
  const preferred = preferCloud ? cloud : local;
  const secondary = preferCloud ? local : cloud;
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    exercises: mergeById(preferred.exercises || [], secondary.exercises || []),
    routines: mergeById(preferred.routines || [], secondary.routines || []),
    history: mergeById(local.history || [], cloud.history || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    bodyWeights: mergeById(local.bodyWeights || [], cloud.bodyWeights || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    settings: preferred.settings || secondary.settings,
    activeWorkout: mergeActiveWorkout(preferred.activeWorkout ?? null, secondary.activeWorkout ?? null)
  };
}

export function sameDriveData(a: FitLogDriveData, b: FitLogDriveData): boolean {
  return ['exercises', 'routines', 'history', 'bodyWeights', 'settings', 'activeWorkout']
    .every((key) => JSON.stringify(a[key as keyof FitLogDriveData]) === JSON.stringify(b[key as keyof FitLogDriveData]));
}
