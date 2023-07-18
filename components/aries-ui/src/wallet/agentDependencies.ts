import type { AgentDependencies } from '@aries-framework/core'


import { WebInMemoryFileSystem } from './WebInMemoryFileSystem'
import EventEmitter from 'event-emitter'

const WebSocket = window.WebSocket as unknown as AgentDependencies['WebSocketClass']

const agentDependencies: AgentDependencies = {
    FileSystem: WebInMemoryFileSystem,
    fetch: window.fetch.bind(window) as any,
    EventEmitterClass: EventEmitter as any,
    WebSocketClass: WebSocket,
}

export { agentDependencies }
