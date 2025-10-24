import { z } from "zod";

export interface Room {
  code: string;
  users: string[];
  createdAt: number;
}

export interface Message {
  id: string;
  roomCode: string;
  userId: string;
  content: string;
  type: "text" | "image";
  timestamp: number;
}

export const createRoomSchema = z.object({});

export const joinRoomSchema = z.object({
  code: z.string().min(1, "Room code is required"),
});

export const sendMessageSchema = z.object({
  roomCode: z.string(),
  content: z.string().min(1, "Message cannot be empty"),
  type: z.enum(["text", "image"]),
});

export type CreateRoom = z.infer<typeof createRoomSchema>;
export type JoinRoom = z.infer<typeof joinRoomSchema>;
export type SendMessage = z.infer<typeof sendMessageSchema>;

export interface WebSocketMessage {
  type: "create_room" | "join_room" | "send_message" | "room_created" | "room_joined" | "new_message" | "user_joined" | "user_left" | "error";
  payload?: any;
}
