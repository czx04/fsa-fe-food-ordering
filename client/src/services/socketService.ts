import { io, Socket } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

class SocketService {
  private socket: Socket | null = null
  private token: string | null = null

  /**
   * Sets the authentication token for the socket connection.
   * If the token changes, it disconnects any existing socket.
   * A new connection will be established on the next `connect()` call.
   * @param token The JWT authentication token, or null to clear it.
   */
  setAuthToken(token: string | null) {
    if (this.token !== token) {
      this.disconnect()
      this.token = token
    }
  }

  connect(): Socket {
    if (this.socket && this.socket.connected) {
      return this.socket
    }

    if (!this.token) {
      throw new Error('SocketService: Authentication token not set. Cannot connect.')
    }

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { token: this.token },
    })

    return this.socket
  }

  disconnect() {
    this.socket?.disconnect()
    this.socket = null
  }
}

export const socketService = new SocketService()
