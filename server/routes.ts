import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { WebSocketMessage, Message } from "@shared/schema";

const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB in bytes

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Map<string, WebSocket>();

  wss.on('connection', (ws: WebSocket) => {
    let userId = randomUUID();
    let isUserIdSet = false;

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());

        switch (message.type) {
          case 'create_room': {
            // Use provided userId if valid and not already in use by another socket
            const providedUserId = message.payload?.userId;
            if (providedUserId && typeof providedUserId === 'string' && !clients.has(providedUserId)) {
              userId = providedUserId;
            }
            
            if (!isUserIdSet) {
              clients.set(userId, ws);
              isUserIdSet = true;
            }
            
            const room = storage.createRoom();
            storage.addUserToRoom(room.code, userId);
            
            ws.send(JSON.stringify({
              type: 'room_created',
              payload: { code: room.code, userId },
            }));
            break;
          }

          case 'join_room': {
            const { code } = message.payload;
            const room = storage.getRoom(code);

            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { 
                  message: 'Room not found',
                  code: 'ROOM_NOT_FOUND',
                },
              }));
              break;
            }

            // Check if user is reconnecting with their previous ID
            const providedUserId = message.payload?.userId;
            const isReconnecting = providedUserId && room.users.includes(providedUserId);
            
            if (isReconnecting) {
              // User is reconnecting - reuse their existing ID
              userId = providedUserId;
              // Update the client mapping
              clients.set(userId, ws);
              isUserIdSet = true;
            } else {
              // New user joining
              if (room.users.length >= 2) {
                ws.send(JSON.stringify({
                  type: 'error',
                  payload: { 
                    message: 'Room is full',
                    code: 'ROOM_FULL',
                  },
                }));
                break;
              }
              
              // Use provided userId if valid and not already in use
              if (providedUserId && typeof providedUserId === 'string' && !clients.has(providedUserId)) {
                userId = providedUserId;
              }
              
              if (!isUserIdSet) {
                clients.set(userId, ws);
                isUserIdSet = true;
              }
              
              storage.addUserToRoom(code, userId);
            }
            
            const partnerConnected = room.users.length === 2;
            const existingMessages = storage.getMessages(code);
            
            ws.send(JSON.stringify({
              type: 'room_joined',
              payload: { 
                code,
                userId,
                partnerConnected,
                messages: existingMessages,
              },
            }));

            if (partnerConnected && !isReconnecting) {
              const partnerId = room.users.find(id => id !== userId);
              if (partnerId) {
                const partnerWs = clients.get(partnerId);
                if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
                  partnerWs.send(JSON.stringify({
                    type: 'user_joined',
                    payload: { userId },
                  }));
                }
              }
            }
            break;
          }

          case 'send_message': {
            const { roomCode, content, type } = message.payload;
            const room = storage.getRoom(roomCode);

            if (!room) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Room not found' },
              }));
              break;
            }

            if (!room.users.includes(userId)) {
              ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'You are not in this room' },
              }));
              break;
            }

            // Validate image size for base64 encoded images
            if (type === 'image') {
              const base64Size = content.length * 0.75; // Approximate decoded size
              if (base64Size > MAX_IMAGE_SIZE) {
                ws.send(JSON.stringify({
                  type: 'error',
                  payload: { message: 'Image size exceeds 8MB limit' },
                }));
                break;
              }
            }

            const newMessage: Message = {
              id: randomUUID(),
              roomCode,
              userId,
              content,
              type,
              timestamp: Date.now(),
            };

            storage.addMessage(newMessage);

            // Broadcast to all users in the room
            room.users.forEach(uid => {
              const userWs = clients.get(uid);
              if (userWs && userWs.readyState === WebSocket.OPEN) {
                userWs.send(JSON.stringify({
                  type: 'new_message',
                  payload: newMessage,
                }));
              }
            });
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
        }));
      }
    });

    ws.on('close', () => {
      const room = storage.getRoomByUserId(userId);
      
      if (room) {
        const partnerId = room.users.find(id => id !== userId);
        
        storage.removeUserFromRoom(room.code, userId);
        
        if (partnerId) {
          const partnerWs = clients.get(partnerId);
          if (partnerWs && partnerWs.readyState === WebSocket.OPEN) {
            partnerWs.send(JSON.stringify({
              type: 'user_left',
              payload: { userId },
            }));
          }
        }
      }
      
      clients.delete(userId);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
