type Listener = (event: unknown) => void;

export class FakeXMLHttpRequest {
  static instances: FakeXMLHttpRequest[] = [];

  status = 0;
  responseText = '';
  responseType = '';
  aborted = false;

  upload = { addEventListener: (_type: string, listener: Listener) => this.on('upload:progress', listener) };

  private listeners = new Map<string, Listener[]>();

  constructor() {
    FakeXMLHttpRequest.instances.push(this);
  }

  private on(type: string, listener: Listener): void {
    const list = this.listeners.get(type) ?? [];
    list.push(listener);
    this.listeners.set(type, list);
  }

  addEventListener(type: string, listener: Listener): void {
    this.on(type, listener);
  }

  open(): void {}

  send(): void {}

  abort(): void {
    this.aborted = true;
    this.emit('abort', {});
  }

  emit(type: string, event: unknown = {}): void {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }

  respond(status: number, body: string): void {
    this.status = status;
    this.responseText = body;
    this.emit('load', {});
  }

  progress(loaded: number, total: number): void {
    this.emit('upload:progress', { lengthComputable: true, loaded, total });
  }

  networkError(): void {
    this.emit('error', {});
  }

  timeout(): void {
    this.emit('timeout', {});
  }
}
