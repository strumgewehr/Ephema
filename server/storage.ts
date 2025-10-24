import { type Room, type Message } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createRoom(): Room;
  getRoom(code: string): Room | undefined;
  deleteRoom(code: string): void;
  addUserToRoom(code: string, userId: string): boolean;
  removeUserFromRoom(code: string, userId: string): void;
  getRoomByUserId(userId: string): Room | undefined;
  addMessage(message: Message): void;
  getMessages(roomCode: string): Message[];
}

export class MemStorage implements IStorage {
  private rooms: Map<string, Room>;
  private messages: Map<string, Message[]>;
  private codeCounter: number;
  private userRoomMap: Map<string, string>;

  constructor() {
    this.rooms = new Map();
    this.messages = new Map();
    this.codeCounter = 1000;
    this.userRoomMap = new Map();
  }

  createRoom(): Room {
    const code = this.generateCode();
    const room: Room = {
      code,
      users: [],
      createdAt: Date.now(),
    };
    this.rooms.set(code, room);
    this.messages.set(code, []);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  deleteRoom(code: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.users.forEach(userId => this.userRoomMap.delete(userId));
    }
    this.rooms.delete(code);
    this.messages.delete(code);
  }

  addUserToRoom(code: string, userId: string): boolean {
    const room = this.rooms.get(code);
    if (!room || room.users.length >= 2) {
      return false;
    }
    room.users.push(userId);
    this.userRoomMap.set(userId, code);
    return true;
  }

  removeUserFromRoom(code: string, userId: string): void {
    const room = this.rooms.get(code);
    if (room) {
      room.users = room.users.filter(id => id !== userId);
      this.userRoomMap.delete(userId);
      
      if (room.users.length === 0) {
        this.deleteRoom(code);
      }
    }
  }

  getRoomByUserId(userId: string): Room | undefined {
    const code = this.userRoomMap.get(userId);
    return code ? this.rooms.get(code) : undefined;
  }

  addMessage(message: Message): void {
    const messages = this.messages.get(message.roomCode);
    if (messages) {
      messages.push(message);
    }
  }

  getMessages(roomCode: string): Message[] {
    return this.messages.get(roomCode) || [];
  }

  private generateCode(): string {
    this.codeCounter++;
    return this.codeCounter.toString().padStart(6, '0');
  }
}

export const storage = new MemStorage();
