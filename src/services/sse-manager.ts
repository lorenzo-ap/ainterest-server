import { FastifyReply } from 'fastify';
import { Types } from 'mongoose';
import { INotification } from '../models';
import { SSEConnection, SSEMessage } from '../types';

class SSEConnectionManager {
	private connections: Map<string, Set<SSEConnection>> = new Map();

	addConnection(userId: string, reply: FastifyReply, frontendUrl?: string): SSEConnection {
		if (frontendUrl) {
			reply.raw.setHeader('Access-Control-Allow-Origin', frontendUrl);
			reply.raw.setHeader('Access-Control-Allow-Credentials', 'true');
		}

		reply.raw.setHeader('Content-Type', 'text/event-stream');
		reply.raw.setHeader('Cache-Control', 'no-cache');
		reply.raw.setHeader('Connection', 'keep-alive');
		reply.raw.setHeader('X-Accel-Buffering', 'no');

		const connection: SSEConnection = {
			reply,
			userId,
			heartbeatInterval: setInterval(() => {
				this.sendHeartbeat(connection);
			}, 30000)
		};

		if (!this.connections.has(userId)) {
			this.connections.set(userId, new Set());
		}
		this.connections.get(userId)!.add(connection);

		reply.raw.on('close', () => {
			this.removeConnection(connection);
		});

		reply.raw.on('error', (error) => {
			console.error('SSE connection error:', error);
			this.removeConnection(connection);
		});

		console.log(`SSE connection established for user ${userId}. Total connections: ${this.getTotalConnections()}`);

		this.sendHeartbeat(connection);

		return connection;
	}

	private removeConnection(connection: SSEConnection): void {
		const { userId, heartbeatInterval } = connection;

		clearInterval(heartbeatInterval);

		const userConnections = this.connections.get(userId);
		if (userConnections) {
			userConnections.delete(connection);
			if (userConnections.size === 0) {
				this.connections.delete(userId);
			}
		}

		console.log(`SSE connection closed for user ${userId}. Total connections: ${this.getTotalConnections()}`);
	}

	private sendMessage(connection: SSEConnection, message: SSEMessage): void {
		try {
			const data = `data: ${JSON.stringify(message)}\n\n`;
			connection.reply.raw.write(data);
		} catch (error) {
			console.error('Error sending SSE message:', error);
			this.removeConnection(connection);
		}
	}

	private sendHeartbeat(connection: SSEConnection): void {
		this.sendMessage(connection, { type: 'heartbeat' });
	}

	private getTotalConnections(): number {
		let total = 0;
		this.connections.forEach((connections) => {
			total += connections.size;
		});
		return total;
	}

	emitNotification(userId: string | Types.ObjectId, notification: INotification): void {
		const userIdStr = userId.toString();
		const userConnections = this.connections.get(userIdStr);

		if (userConnections && userConnections.size) {
			const message: SSEMessage = {
				type: 'notification',
				payload: notification
			};

			console.log(`Emitting notification to ${userConnections.size} connection(s) for user ${userIdStr}`);

			userConnections.forEach((connection) => {
				this.sendMessage(connection, message);
			});
		}
	}
}

export const sseManager = new SSEConnectionManager();
