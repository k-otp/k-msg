type Listener = (...args: unknown[]) => void;

/**
 * Minimal event emitter implementation for runtime-neutral (Edge/Web) usage.
 */
export class EventEmitter {
  private listenersMap = new Map<string, Set<Listener>>();

  on(eventName: string, listener: Listener): this {
    const listeners = this.listenersMap.get(eventName) ?? new Set<Listener>();
    listeners.add(listener);
    this.listenersMap.set(eventName, listeners);
    return this;
  }

  addListener(eventName: string, listener: Listener): this {
    return this.on(eventName, listener);
  }

  off(eventName: string, listener: Listener): this {
    const listeners = this.listenersMap.get(eventName);
    if (!listeners) return this;

    listeners.delete(listener);
    if (listeners.size === 0) {
      this.listenersMap.delete(eventName);
    }
    return this;
  }

  removeListener(eventName: string, listener: Listener): this {
    return this.off(eventName, listener);
  }

  once(eventName: string, listener: Listener): this {
    const wrappedListener: Listener = (...args) => {
      this.off(eventName, wrappedListener);
      listener(...args);
    };

    return this.on(eventName, wrappedListener);
  }

  emit(eventName: string, ...args: unknown[]): boolean {
    const listeners = this.listenersMap.get(eventName);
    if (!listeners || listeners.size === 0) {
      return false;
    }

    for (const listener of [...listeners]) {
      listener(...args);
    }

    return true;
  }

  removeAllListeners(eventName?: string): this {
    if (eventName) {
      this.listenersMap.delete(eventName);
      return this;
    }

    this.listenersMap.clear();
    return this;
  }
}
