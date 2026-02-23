import type { FastifyReply } from 'fastify/types/reply';
import type { Notification } from './notification';

export type SSEMessageType = 'notification' | 'heartbeat';

export interface SSEMessage {
	type: SSEMessageType;
	payload?: Notification;
}

export interface SSEConnection {
	reply: FastifyReply;
	userId: string;
	heartbeatInterval: NodeJS.Timeout;
}
