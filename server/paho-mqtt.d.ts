declare module "paho-mqtt" {
  export class Client {
    constructor(brokerUrl: string, clientId: string);
    connect(options: any): void;
    disconnect(): void;
    send(message: Message): void;
    subscribe(topic: string, options?: any): void;
    unsubscribe(topic: string): void;
    isConnected(): boolean;
    clientId: string;
    onConnectionLost: ((responseObject: any) => void) | null;
    onMessageArrived: ((message: Message) => void) | null;
    onConnected: (() => void) | null;
  }

  export class Message {
    constructor(payload: string);
    destinationName: string;
    qos: number;
    retained: boolean;
    payloadString: string;
  }
}
