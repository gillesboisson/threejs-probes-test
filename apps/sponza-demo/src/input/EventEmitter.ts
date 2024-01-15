import { EventListenner } from './GameInput';

export interface IEventEmitter {

  on<EventT = any>(eventType: string, listener: (e: EventT) => void): void;

  off<EventT = any>(eventType: string, listener: (e: EventT) => void): void;

  emit<EventT = any>(eventType: string, event?: EventT): void;

  once<EventT = any>(eventType: string, listener: (e: EventT) => void): void ;
}
export class EventEmitter {
  protected events: { [name: string]: EventListenner[]; } = {};

  

  static extends<T>(element: T): IEventEmitter & T{
    (element as any).on = EventEmitter.prototype.on;
    (element as any).off = EventEmitter.prototype.off;
    (element as any).emit = EventEmitter.prototype.emit;
    (element as any).once = EventEmitter.prototype.once;

    return element as any;
  }

  on<EventT = any>(eventType: string, listener: (e: EventT) => void): void {
    if (!this.events[eventType]) {
      this.events[eventType] = [];
    }

    this.events[eventType].push(listener);
  }

  off<EventT = any>(eventType: string, listener: (e: EventT) => void): void {
    return this.removeListener<EventT>(eventType, listener);
  }

  removeListener<EventT = any>(eventType: string, listener: (e: EventT) => void): void {
    if (typeof this.events[eventType] === 'object') {
      const idx = this.events[eventType].indexOf(listener);

      if (idx !== -1) {
        this.events[eventType].splice(idx, 1);
      }
    }
  }

  emit<EventT = any>(eventType: string, event?: EventT): void {
    const listenners = this.events[eventType];

    if (listenners) {
      for (const listenner of listenners) {
        listenner(event);
      }
    }
  }

  once<EventT = any>(eventType: string, listener: (e: EventT) => void): void {
    const self = this;
    this.on(eventType, function g(e: EventT) {
      self.removeListener(eventType, g);
      listener(e);
    });
  }
}
