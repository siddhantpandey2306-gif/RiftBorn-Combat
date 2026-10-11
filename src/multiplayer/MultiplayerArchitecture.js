// RIFTBORN Multiplayer Network Architecture
// Architectural blueprint for future deterministic rollback netcode (WebRTC DataChannel / WebSocket)
// NOTE: This module provides the authoritative protocol definitions and rollback state interfaces.
// As per project standards, we do NOT fake online multiplayer with bots disguised as players.

export const INPUT_MASKS = {
  UP: 1 << 0,
  DOWN: 1 << 1,
  LEFT: 1 << 2,
  RIGHT: 1 << 3,
  LIGHT: 1 << 4,
  HEAVY: 1 << 5,
  SPECIAL_1: 1 << 6,
  SPECIAL_2: 1 << 7,
  ULTIMATE: 1 << 8,
  BLOCK: 1 << 9,
  DODGE: 1 << 10,
  COUNTER: 1 << 11
};

export class InputPacket {
  constructor(tick, bitmask, timestamp) {
    this.tick = tick;
    this.bitmask = bitmask;
    this.timestamp = timestamp || Date.now();
  }

  has(inputFlag) {
    return (this.bitmask & inputFlag) !== 0;
  }
}

export class GameStateSnapshot {
  constructor(tick, p1State, p2State, rngSeed) {
    this.tick = tick;
    this.p1State = p1State;
    this.p2State = p2State;
    this.rngSeed = rngSeed;
  }
}

export class RollbackRingBuffer {
  constructor(capacity = 60) { // 1 second of rollback memory at 60 FPS
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  saveSnapshot(snapshot) {
    const index = snapshot.tick % this.capacity;
    this.buffer[index] = snapshot;
  }

  getSnapshot(tick) {
    const index = tick % this.capacity;
    const snap = this.buffer[index];
    return (snap && snap.tick === tick) ? snap : null;
  }
}

export class NetworkSessionInterface {
  constructor() {
    this.isConnected = false;
    this.localPlayerId = 1;
    this.remotePlayerId = 2;
    this.currentTick = 0;
    this.pingMs = 0;
    this.rollbackBuffer = new RollbackRingBuffer(60);
  }

  // Prepared for WebRTC DataChannel connection
  connectToPeer(signalingUrl, roomId) {
    console.info(`[Multiplayer Architecture] Ready for WebRTC / WebSocket connection to room: ${roomId}`);
    // Future WebRTC RTCPeerConnection and RTCDataChannel ('ordered: false, maxRetransmits: 0')
  }

  sendLocalInput(tick, bitmask) {
    const packet = new InputPacket(tick, bitmask);
    return packet;
  }

  onReceiveRemoteInput(packet) {
    // Check if packet.tick is in the past: if so, trigger rollback to packet.tick and resimulate to currentTick
  }

  disconnect() {
    this.isConnected = false;
  }
}

export const multiplayerAdapter = new NetworkSessionInterface();
