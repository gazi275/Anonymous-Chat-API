export const SESSION_KEY_PREFIX = 'session:';
export const SOCKET_STATE_KEY_PREFIX = 'socket:';
export const ROOM_ACTIVE_USERS_KEY_PREFIX = 'room:active-users:';
export const ROOM_SOCKET_SET_KEY_PREFIX = 'room:sockets:';
export const APP_EVENTS_CHANNEL = 'chat:events';

export const sessionKey = (token: string): string => `${SESSION_KEY_PREFIX}${token}`;
export const socketStateKey = (socketId: string): string => `${SOCKET_STATE_KEY_PREFIX}${socketId}`;
export const roomActiveUsersKey = (roomId: string): string => `${ROOM_ACTIVE_USERS_KEY_PREFIX}${roomId}`;
export const roomSocketSetKey = (roomId: string): string => `${ROOM_SOCKET_SET_KEY_PREFIX}${roomId}`;