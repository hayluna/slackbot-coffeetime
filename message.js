const { app } = require('./index');

class MessageChannel {
  constructor() {
    this.channelId = process.env.SLACK_NEW_MATH_CHANNEL_ID;
    this.token = process.env.SLACK_BOT_TOKEN;
  }

  async postMessage({ blocks }) {
    return await app.client.chat.postMessage({
      channel: this.channelId,
      token: process.env.SLACK_BOT_TOKEN,
      blocks,
    });
  }

  async postEphemeral({ userId, blocks, alertText }) {
    return await app.client.chat.postEphemeral({
      channel: this.channelId,
      token: process.env.SLACK_BOT_TOKEN,
      user: userId,
      blocks,
      text: alertText,
    });
  }
}

module.exports = { MessageChannel: new MessageChannel() };
