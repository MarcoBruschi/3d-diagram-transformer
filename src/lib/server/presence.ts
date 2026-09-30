import { redis } from './redis';

export interface DiagramMutation {
  nodeId: string;
  position3D: {
    x: number;
    y: number;
    z: number;
  };
  updatedBy: string;
  updatedAt: number;
}

export interface ParticipantPresence {
  userId: string;
  name: string;
  color: string;
  cursor: {
    x: number;
    y: number;
    z: number;
  };
  activeNodeId?: string;
  lastSeen: number;
}

/**
 * Sets the latest diagram node mutation in a room
 * Key: mutation:{diagramId}
 * TTL: 60 seconds
 */
export async function setRoomMutation(
  diagramId: string,
  mutation: DiagramMutation
): Promise<void> {
  const key = `mutation:${diagramId}`;
  try {
    await redis.set(key, JSON.stringify(mutation), 'EX', 60);
  } catch (err) {
    console.warn('[Presence] Error setting mutation:', err);
  }
}

/**
 * Gets the latest live diagram node mutation for a room
 */
export async function getRoomMutation(diagramId: string): Promise<DiagramMutation | null> {
  const key = `mutation:${diagramId}`;
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : (raw as DiagramMutation);
  } catch (err) {
    console.warn('[Presence] Error getting mutation:', err);
    return null;
  }
}

export interface WorkspaceMemberPresence {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currentDiagramId?: string;
  currentDiagramName?: string;
  lastSeen: number;
}

/**
 * Updates a user's 3D presence/cursor in a diagram room
 * Key: presence:{diagramId}
 * TTL: 30 seconds
 */
export async function updateParticipantPresence(
  diagramId: string,
  presence: Omit<ParticipantPresence, 'lastSeen'>
): Promise<void> {
  const key = `presence:${diagramId}`;
  const data: ParticipantPresence = {
    ...presence,
    lastSeen: Date.now(),
  };

  try {
    await redis.hset(key, presence.userId, JSON.stringify(data));
    await redis.expire(key, 30);
  } catch (err) {
    console.warn('[Presence] Error updating presence:', err);
  }
}

/**
 * Returns all active participants for a diagram room, filtering out expired ones (> 30s)
 */
export async function getActiveParticipants(diagramId: string): Promise<ParticipantPresence[]> {
  const key = `presence:${diagramId}`;
  try {
    const raw = await redis.hgetall(key);
    if (!raw || Object.keys(raw).length === 0) return [];

    const now = Date.now();
    const active: ParticipantPresence[] = [];

    for (const [userId, jsonStr] of Object.entries(raw)) {
      try {
        const item: ParticipantPresence = JSON.parse(jsonStr);
        // Exclude if inactive for more than 30 seconds
        if (now - item.lastSeen < 30000) {
          active.push(item);
        } else {
          // Cleanup stale participant asynchronously
          redis.hdel(key, userId).catch(() => {});
        }
      } catch {}
    }

    return active;
  } catch (err) {
    console.warn('[Presence] Error getting active participants:', err);
    return [];
  }
}

/**
 * Removes a participant upon disconnection/exit
 */
export async function removeParticipant(diagramId: string, userId: string): Promise<void> {
  const key = `presence:${diagramId}`;
  try {
    await redis.hdel(key, userId);
  } catch (err) {
    console.warn('[Presence] Error removing participant:', err);
  }
}

/**
 * Updates a member's presence in a workspace (TTL 30s)
 * Key: presence:ws:{orgId}
 */
export async function updateWorkspacePresence(
  orgId: string,
  presence: {
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    currentDiagramId?: string;
    currentDiagramName?: string;
  }
): Promise<void> {
  if (!orgId) return;
  const key = `presence:ws:${orgId}`;
  const data: WorkspaceMemberPresence = {
    ...presence,
    lastSeen: Date.now(),
  };

  try {
    await redis.hset(key, presence.userId, JSON.stringify(data));
    await redis.expire(key, 30);
  } catch (err) {
    console.warn('[Presence] Error updating workspace presence:', err);
  }
}

/**
 * Returns all online members in a workspace and which diagram they are viewing
 */
export async function getWorkspacePresence(orgId: string): Promise<WorkspaceMemberPresence[]> {
  if (!orgId) return [];
  const key = `presence:ws:${orgId}`;
  try {
    const raw = await redis.hgetall(key);
    if (!raw || Object.keys(raw).length === 0) return [];

    const now = Date.now();
    const active: WorkspaceMemberPresence[] = [];

    for (const [userId, jsonStr] of Object.entries(raw)) {
      try {
        const item: WorkspaceMemberPresence = JSON.parse(jsonStr);
        if (now - item.lastSeen < 30000) {
          active.push(item);
        } else {
          redis.hdel(key, userId).catch(() => {});
        }
      } catch {}
    }

    return active;
  } catch (err) {
    console.warn('[Presence] Error getting workspace presence:', err);
    return [];
  }
}

/**
 * Returns who has the diagram open (from room participants and/or workspace presence)
 */
export async function getDiagramViewers(
  diagramId: string,
  orgId?: string
): Promise<Array<{ userId: string; name: string }>> {
  if (!diagramId) return [];
  try {
    const viewersMap = new Map<string, { userId: string; name: string }>();

    // 1. Direct active room participants
    const participants = await getActiveParticipants(diagramId);
    for (const p of participants) {
      viewersMap.set(p.userId, { userId: p.userId, name: p.name });
    }

    // 2. Workspace online members viewing this diagram
    if (orgId) {
      const wsPresence = await getWorkspacePresence(orgId);
      for (const m of wsPresence) {
        if (m.currentDiagramId === diagramId && !viewersMap.has(m.userId)) {
          viewersMap.set(m.userId, { userId: m.userId, name: m.name });
        }
      }
    }

    return Array.from(viewersMap.values());
  } catch (err) {
    console.warn('[Presence] Error getting diagram viewers:', err);
    return [];
  }
}
