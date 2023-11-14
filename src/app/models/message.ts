export class MessageContent {
  id?: string;
  content: string;
  contentLowerCase: string;
  timestamp: number;
  senderId: string;
  receiverId?: string;
  senderName: string;
  senderImage: string;
  hasThread: boolean = false;
  messageId?: string;
  channelId?: string;
  emojis?: {
    complete?: number;
    handsUp?: number;
    rocket?: number;
    nerdSmiley?: number;
  };
  attachedFiles?: {
    url: string; 
    type: 'image' | 'data'; 
  }[];
  

  constructor(object?: any) {
    this.id = object ? object.id : undefined;
    this.content = object ? object.content : '';
    this.contentLowerCase = object ? object.contentLowerCase: '';
    this.timestamp = object ? object.timestamp : Date.now();
    this.senderId = object ? object.senderId : '';
    this.receiverId = object ? object.receiverId : '';
    this.senderName = object ? object.senderName : '';
    this.senderImage = object ? object.senderImage : '';
    this.hasThread = object ? object.hasThread : false;
    this.messageId = object ? object.messageId : '';
    this.channelId = object ? object.channelId : '';
    this.emojis = object ? object.emojis || {} : {};
    this.attachedFiles = object ? object.attachedFiles  : undefined;
  }

  public toJSON(): any {
    const json: any = {
      content: this.content,
      contentLowerCase: this.contentLowerCase,
      timestamp: this.timestamp,
      senderId: this.senderId,
      senderName: this.senderName,
      senderImage: this.senderImage,
      hasThread: this.hasThread,
      emojis: this.emojis || {} 
    };

    if (this.receiverId) {
      json.receiverId = this.receiverId;
    }

    if (this.messageId) {
      json.messageId = this.messageId;
    }

    if (this.channelId) {
      json.channelId = this.channelId;
    }

    if (this.attachedFiles) {
      json.attachedFiles  = this.attachedFiles;
    }

    return json;
  }

}
