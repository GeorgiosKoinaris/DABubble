export class Channel {
  channelName: string;
  channelDescription: string;
  createDate: number;
  users: any;
  channelId: string;
  readBy?: string[];
  channelCreatedBy: any;

  constructor(object?: any) {
    this.channelName = object ? object.channelName : '';
    this.channelDescription = object ? object.channelDescription : '';
    this.createDate = object ? object.createDate : Date.now();
    this.users = object ? object.users : null;
    this.channelId = object ? object.channelId : null;
    this.readBy = object && object.readBy ? object.readBy : [];
    this.channelCreatedBy = object ? object.channelCreatedBy : null;
  }

  toJSON() {
    const json: any = {
      channelName: this.channelName,
      channelDescription: this.channelDescription,
      createDate: this.createDate,
      users: this.users,
      channelId: this.channelId,
      channelCreatedBy: this.channelCreatedBy,
    };

    if (this.readBy) {
      json.readBy = this.readBy;
    }

    return json;
  }
}
