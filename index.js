require('dotenv').config();
const { App } = require('@slack/bolt');
const { addDays, isBefore } = require('date-fns');

const { ACTION_TYPES } = require('./src/constants/actionTypes');
const { view } = require('./src/view');
const { appointment } = require('./src/appointment');
const { CoffeeMember, coffeeMemberMap } = require('./src/coffeeMember');
const { memberSet } = require('./src/constants/members');

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

        await app.client.chat.postMessage({
          channel: command.channel_id,
          token: process.env.SLACK_BOT_TOKEN,
          blocks: view.날짜세팅안내(),
        });
        return;
      }
      case 'init': {
        const { ok, ...rest } = await app.client.conversations.members({
          channel: command.channel_id,
          token: process.env.SLACK_BOT_TOKEN,
        });
        if (ok) {
          return Promise.all(
            rest.members.map((memberId) => {
              return app.client.users.info({
                token: process.env.SLACK_BOT_TOKEN,
                user: memberId,
              });
            })
          )
            .then((userInfoResponse) => {
              userInfoResponse.forEach(({ user }) => {
                const member = new CoffeeMember({
                  id: user.id,
                  nickName: user.name,
                  name: user.real_name,
                  profileImg: user.profile.image_original,
                });
                if (memberSet.has(member.name)) {
                  coffeeMemberMap.set(member.id, member);
                }
              });
              const coffeeMembers = [...coffeeMemberMap.values()];
              if (coffeeMembers.length > 0) {
                return app.client.chat.postEphemeral({
                  channel: command.channel_id,
                  token: process.env.SLACK_BOT_TOKEN,
                  user: command.user_id,
                  blocks: view.멤버등록성공(coffeeMembers),
                });
              }
              return say('등록할 멤버가 없습니다. ☹️');
            })
            .catch(() => {
              say('멤버 등록 실패 ☹️');
            });
        }
        return await say('멤버 등록 실패 ☹️');
      }
      case 'channel': {
        const { ok, ...rest } = await app.client.conversations.members({
          channel: command.channel_id,
          token: process.env.SLACK_BOT_TOKEN,
        });
        if (ok) {
          return Promise.all(
            rest.members.map((memberId) => {
              return app.client.users.info({
                token: process.env.SLACK_BOT_TOKEN,
                user: memberId,
              });
            })
          )
            .then((userInfoResponse) => {
              const users = userInfoResponse.map(({ user }) => user);
              if (users) {
                app.client.chat.postEphemeral({
                  channel: command.channel_id,
                  token: process.env.SLACK_BOT_TOKEN,
                  user: command.user_id,
                  blocks: view.유저(users),
                });
              }
            })
            .catch((e) => {
              console.error(e);
              say('유저를 불러오는데 실패했어요. 😵');
            });
        }
        return await say('유저를 불러오는데 실패했어요. 😵');
      }
      case 'member': {
        const coffeeMembers = [...coffeeMemberMap.values()];
        if (coffeeMembers.length > 0) {
          return app.client.chat.postEphemeral({
            channel: command.channel_id,
            token: process.env.SLACK_BOT_TOKEN,
            user: command.user_id,
            blocks: view.멤버(coffeeMembers),
          });
        }
        return say('멤버가 없어요. /coffee init을 통해 멤버를 등록해주세요');
      }
      default:
        await say('잘못 입력하셨습니다😗');
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
  async ({ ack, payload, body: { channel } }) => {
    await ack();
    if (appointment.isLocked) {
      await app.client.chat.postMessage({
        channel: channel.id,
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

  await app.client.chat.postMessage({
    channel: channel.id,
    token: process.env.SLACK_BOT_TOKEN,
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
    appointment.shuffleGroup();

    await app.client.chat.postMessage({
      channel: id,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.커피타임안내(),
      text: '새로운 커피타임이 설정되었습니다',
    });

    appointment.groupsWithWeek.forEach((groupWeekStr) => {
      app.client.chat.postMessage({
        channel: id,
        token: process.env.SLACK_BOT_TOKEN,
        blocks: view.그룹모임메세지(groupWeekStr),
      });
    });
  }
);

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

module.exports = { app };
