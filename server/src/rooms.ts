import { Room } from "./room"
import type { Persistence } from "./persistence"

/** Lazily-created registry of live rooms keyed by document id. */
export class RoomRegistry {
  private readonly rooms = new Map<string, Room>()

  constructor(private readonly persistence: Persistence) {}

  async get(id: string): Promise<Room> {
    let room = this.rooms.get(id)
    if (!room) {
      room = new Room(id, this.persistence)
      await room.hydrate()
      this.rooms.set(id, room)
    }
    return room
  }

  drop(id: string): void {
    this.rooms.delete(id)
  }

  all(): Room[] {
    return [...this.rooms.values()]
  }
}
