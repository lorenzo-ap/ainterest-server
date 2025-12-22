import { FastifyReply } from 'fastify/types/reply';
import { INotification } from '../models';

export type SSEMessageType = 'notification' | 'heartbeat';

export interface SSEMessage {
	type: SSEMessageType;
	payload?: INotification;
}

export interface SSEConnection {
	reply: FastifyReply;
	userId: string;
	heartbeatInterval: NodeJS.Timeout;
}
