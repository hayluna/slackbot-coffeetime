require('dotenv').config();
const { App } = require('@slack/bolt');
const { addDays, isBefore } = require('date-fns');

const { ACTION_TYPES } = require('./src/constants/actionTypes');
const { view } = require('./src/view');
const { appointment } = require('./src/appointment');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

//command listener
app.command('/coffee', async ({ command, ack, say }) => {
  // Acknowledge command request
  await ack();
  if (command.text) {
    switch (command.text) {
      case 'set': {
        if (isBefore(appointment.endDate, new Date())) {
          appointment.isLocked = false;
        }
        if (
          appointment.isLocked &&
          appointment.groups &&
          appointment.groups.length > 0
        ) {
          await app.client.chat.postEphemeral({
            channel: command.channel_id,
            token: process.env.SLACK_BOT_TOKEN,
            user: command.user_id,
            blocks: view.잠금안내(),
          });
          return;
        }

        app.client.chat.postMessage({
          channel: command.channel_id,
          token: process.env.SLACK_BOT_TOKEN,
          blocks: view.날짜세팅안내(),
        });
      }
    }
  }
});

// action listener
app.action(ACTION_TYPES.시작날짜설정, async ({ ack, payload }) => {
  await ack();
  if (appointment.isLocked) {
    await app.client.chat.postMessage({
      channel: id,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.잠금안내(),
    });
    return;
  }
  appointment.startDate = new Date(payload.selected_date);
});

app.action(
  ACTION_TYPES.마지막날짜설정,
  async ({
    ack,
    payload,
    body: {
      channel: { id },
    },
  }) => {
    await ack();
    if (appointment.isLocked) {
      await app.client.chat.postMessage({
        channel: id,
        token: process.env.SLACK_BOT_TOKEN,
        blocks: view.잠금안내(),
      });
      return;
    }
    appointment.endDate = new Date(payload.selected_date);
  }
);

app.action(ACTION_TYPES.잠금해제, async ({ ack, body: { channel, user } }) => {
  await ack();
  appointment.startDate = new Date();
  appointment.endDate = addDays(new Date(), 14);
  appointment.isLocked = false;

  await app.client.chat.postEphemeral({
    channel: channel.id,
    token: process.env.SLACK_BOT_TOKEN,
    user: user.id,
    blocks: view.날짜세팅안내(),
  });
});

app.action(
  ACTION_TYPES.잠금,
  async ({
    say,
    ack,
    body: {
      channel: { id },
    },
  }) => {
    await ack();
    if (isBefore(appointment.endDate, appointment.startDate)) {
      await say('날짜를 잘못 설정하셨어요~');
      return;
    }
    appointment.isLocked = true;
    appointment.setShuffledGroup();
    await app.client.chat.postMessage({
      channel: id,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.커피타임안내(),
      text: '새로운 커피타임이 설정되었습니다',
    });
  }
);

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

module.exports = { app };
