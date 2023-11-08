export class Signal<EventT = undefined> {
  readonly receiver = new SignalReceiver<EventT>(this);

  emit(event?: EventT) {}
}

export type SignalListenner<EventT> = (e: EventT) => void;
export type UnsubscribeFunction<EventT = any> = () => void;

export class SignalReceiver<EventT> {
  protected _listeners: Array<SignalListenner<EventT>> = [];

  constructor(protected signal: Signal<EventT>) {
    signal.emit = (e: EventT) => {
      for (let listener of this._listeners) {
        listener(e);
      }
    };
  }

  protected unSubscribe(listenner: SignalListenner<EventT>): void {
    const ind = this._listeners.indexOf(listenner);
    if (ind !== -1) {
      this._listeners.splice(ind, 1);
    }

  }

  subscribe(listenner: SignalListenner<EventT>): UnsubscribeFunction<EventT> {
    const ind = this._listeners.indexOf(listenner);
    if (ind === -1) {
      this._listeners.push(listenner);
    }

    return () => this.unSubscribe(listenner);
  }

  subscribeOnce(listenner: SignalListenner<EventT>): UnsubscribeFunction<EventT> {
    const listennerDel = (e: EventT) => {
      listenner(e);
      this.unSubscribe(listennerDel);
    };

    this.subscribe(listennerDel);

    return () => this.unSubscribe(listennerDel);
  }
}
