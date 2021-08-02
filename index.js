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
  try {
    // Acknowledge command request
    await ack();
    if (
      command.channel_id !== process.env.SLACK_CHANNEL_ID_TEST &&
      command.channel_id !== process.env.SLACK_CHANNEL_ID_NEW_MATHFLAT
    ) {
      await app.client.chat.postEphemeral({
        channel: command.channel_id,
        token: process.env.SLACK_BOT_TOKEN,
        user: command.user_id,
        blocks: view.로그(
          '현재 커피타임은 뉴매쓰플랫 채널에서만 운영하고 있습니다 😇'
        ),
      });
      return;
    }
    if (command.text) {
      switch (command.text) {
        case 'set': {
          if (isBefore(appointment.endDate, new Date())) {
            appointment.isLocked = false;
          }
          const coffeeMembers = [...coffeeMemberMap.values()];
          if (!coffeeMembers || coffeeMembers.length <= 0) {
            await app.client.chat.postEphemeral({
              channel: command.channel_id,
              token: process.env.SLACK_BOT_TOKEN,
              user: command.user_id,
              text: `커피멤버가 없습니다. 혹시 /coffee init하셨나요?`,
            });
            return;
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

            await app.client.chat.postMessage({
              channel: process.env.SLACK_CHANNEL_ID_TEST,
              token: process.env.SLACK_BOT_TOKEN,
              blocks: view.로그(
                `채널 ${command.channel_name}에서 @${command.user_name}쌤이 잠금된 일정을 조회하셨습니다.`
              ),
            });
            return;
          }

          appointment.startDate = new Date();
          appointment.endDate = addDays(appointment.startDate, 14);

          await app.client.chat.postMessage({
            channel: command.channel_id,
            token: process.env.SLACK_BOT_TOKEN,
            // user: command.user_id,
            blocks: view.날짜세팅안내(),
          });
          await app.client.chat.postMessage({
            channel: process.env.SLACK_CHANNEL_ID_TEST,
            token: process.env.SLACK_BOT_TOKEN,
            blocks: view.로그(
              `채널 ${command.channel_name}에서 @${command.user_name}쌤이 날싸세팅을 시작하셨습니다.`
            ),
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
              .then(async (userInfoResponse) => {
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
                  await app.client.chat.postEphemeral({
                    channel: command.channel_id,
                    token: process.env.SLACK_BOT_TOKEN,
                    user: command.user_id,
                    blocks: view.멤버등록성공(coffeeMembers),
                  });
                  await app.client.chat.postMessage({
                    channel: process.env.SLACK_CHANNEL_ID_TEST,
                    token: process.env.SLACK_BOT_TOKEN,
                    blocks: view.로그(
                      `채널 ${command.channel_name}에서 @${command.user_name}쌤이 init하셨습니다.`
                    ),
                  });
                  return;
                }
                return say('등록할 멤버가 없습니다. ☹️');
              })
              .catch(async (e) => {
                console.error(e);
                await say('멤버 등록 실패 ☹️');

                await app.client.chat.postMessage({
                  channel: process.env.SLACK_CHANNEL_ID_TEST,
                  token: process.env.SLACK_BOT_TOKEN,
                  blocks: view.로그(
                    `채널 ${command.channel_name}에서 @${command.user_name}쌤이 멤버등록(init)을 하셨으나 실패하였습니다.`
                  ),
                });
              });
          }
          await say('멤버 등록 실패 ☹️');
          await app.client.chat.postMessage({
            channel: process.env.SLACK_CHANNEL_ID_TEST,
            token: process.env.SLACK_BOT_TOKEN,
            blocks: view.로그(
              `채널 ${command.channel_name}에서 @${command.user_name}쌤이 멤버등록(init)을 하셨으나 실패하였습니다.`
            ),
          });
          return;
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
              .then(async (userInfoResponse) => {
                const users = userInfoResponse.map(({ user }) => user);
                if (users) {
                  await app.client.chat.postEphemeral({
                    channel: command.channel_id,
                    token: process.env.SLACK_BOT_TOKEN,
                    user: command.user_id,
                    blocks: view.유저(users),
                  });
                  await app.client.chat.postMessage({
                    channel: process.env.SLACK_CHANNEL_ID_TEST,
                    token: process.env.SLACK_BOT_TOKEN,
                    blocks: view.로그(
                      `채널 ${command.channel_name}에서 @${command.user_name}쌤이 채널을 조회하셨습니다.\n채널 아이디 : ${command.channel_id}\n유저 아이디 : ${command.user_id}\n유저 이름: ${command.user_name}`
                    ),
                  });
                }
              })
              .catch(async (e) => {
                console.error(e);
                await say('유저를 불러오는데 실패했어요. 😵');
                await app.client.chat.postMessage({
                  channel: process.env.SLACK_CHANNEL_ID_TEST,
                  token: process.env.SLACK_BOT_TOKEN,
                  blocks: view.로그(
                    `채널 ${command.channel_name}에서 @${command.user_name}쌤이 멤버를 조회에 실패하셨습니다.`
                  ),
                });
              });
          }
          return await say('유저를 불러오는데 실패했어요. 😵');
        }
        case 'member': {
          const coffeeMembers = [...coffeeMemberMap.values()];
          if (coffeeMembers.length > 0) {
            await app.client.chat.postEphemeral({
              channel: command.channel_id,
              token: process.env.SLACK_BOT_TOKEN,
              user: command.user_id,
              blocks: view.멤버(coffeeMembers),
            });

            await app.client.chat.postMessage({
              channel: process.env.SLACK_CHANNEL_ID_TEST,
              token: process.env.SLACK_BOT_TOKEN,
              blocks: view.로그(
                `채널 ${command.channel_name}에서 @${command.user_name}쌤이 커피멤버를 조회하셨습니다.\n채널 아이디 : ${command.channel_id}\n유저 아이디 : ${command.user_id}\n유저 이름: @${command.user_id}`
              ),
            });
            return;
          }
          return say('멤버가 없어요. /coffee init을 통해 멤버를 등록해주세요');
        }
        case 'help': {
          await app.client.chat.postEphemeral({
            channel: command.channel_id,
            token: process.env.SLACK_BOT_TOKEN,
            user: command.user_id,
            blocks: view.도움말(),
          });
          return;
        }
        default:
          await app.client.chat.postEphemeral({
            channel: command.channel_id,
            token: process.env.SLACK_BOT_TOKEN,
            user: command.user_id,
            text: `잘못 입력하셨습니다😗. 명령어를 알고 싶으시면 /help를 입력해주세요'`,
          });
      }
    }
  } catch (e) {
    console.log(`command 에러`, e);
  }
});

// action listener
app.action(
  ACTION_TYPES.시작날짜설정,
  async ({ ack, payload, body: { channel, user } }) => {
    try {
      await ack();
      if (appointment.isLocked) {
        await app.client.chat.postMessage({
          channel: channel.id,
          token: process.env.SLACK_BOT_TOKEN,
          // user: user.id,
          blocks: view.잠금안내(),
        });
        return;
      }
      appointment.startDate = new Date(payload.selected_date);
    } catch (e) {
      console.log('잠금안내 에러', e);
      await app.client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID_TEST,
        token: process.env.SLACK_BOT_TOKEN,
        blocks: view.로그(
          `채널 ${channel.name}에서 @${user.name}쌤이 시작날짜설정에 실패하셨습니다.`
        ),
      });
    }
  }
);

app.action(
  ACTION_TYPES.마지막날짜설정,
  async ({ ack, payload, body: { channel, user } }) => {
    try {
      await ack();
      if (appointment.isLocked) {
        await app.client.chat.postMessage({
          channel: channel.id,
          token: process.env.SLACK_BOT_TOKEN,
          // user: user.id,
          blocks: view.잠금안내(),
        });
        return;
      }
      appointment.endDate = new Date(payload.selected_date);
    } catch (e) {
      console.log('마지막날짜설정 에러', e);
      await app.client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID_TEST,
        token: process.env.SLACK_BOT_TOKEN,
        blocks: view.로그(
          `채널 ${channel.name}에서 @${user.name}쌤이 마지막날짜설정에 실패하셨습니다.`
        ),
      });
    }
  }
);

app.action(ACTION_TYPES.잠금해제, async ({ ack, body: { channel, user } }) => {
  try {
    await ack();
    appointment.startDate = new Date();
    appointment.endDate = addDays(new Date(), 14);
    appointment.isLocked = false;

    await app.client.chat.postMessage({
      channel: channel.id,
      token: process.env.SLACK_BOT_TOKEN,
      // user: user.id,
      blocks: view.날짜세팅안내(),
    });
    await app.client.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID_TEST,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.로그(
        `채널 ${channel.name}에서 @${user.name}쌤이 잠금해제하셨습니다.`
      ),
    });
  } catch (e) {
    console.log('잠금해제 에러', e);
    app.client.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID_TEST,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.로그(
        `채널 ${channel.name}에서 @${user.name}쌤이 잠금해제에 실패하셨습니다.`
      ),
    });
  }
});

app.action(ACTION_TYPES.잠금, async ({ say, ack, body: { channel, user } }) => {
  try {
    await ack();
    if (isBefore(appointment.endDate, appointment.startDate)) {
      await say('날짜를 잘못 설정하셨어요~');
      await app.client.chat.postMessage({
        channel: process.env.SLACK_CHANNEL_ID_TEST,
        token: process.env.SLACK_BOT_TOKEN,
        blocks: view.로그(
          `채널 ${channel.name}에서 @${user.name}쌤이 날짜를 잘못설정하여 실패하셨습니다.`
        ),
      });
      return;
    }
    appointment.isLocked = true;
    appointment.shuffleGroup();

    await app.client.chat.postMessage({
      channel: channel.id,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.커피타임안내(),
      // user: user.id,
      text: '새로운 커피타임이 설정되었습니다',
    });

    for (const groupWeekStr of appointment.groupsWithWeek) {
      await app.client.chat.postMessage({
        channel: channel.id,
        token: process.env.SLACK_BOT_TOKEN,
        blocks: view.그룹모임메세지(groupWeekStr),
        // user: user.id,
      });
    }
    await app.client.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID_TEST,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.로그(
        `채널 ${channel.name}에서 @${user.name}쌤이 새로운 커피타임을 설정하셨습니다.`
      ),
    });
  } catch (e) {
    console.log('잠금에러', e);
    await app.client.chat.postMessage({
      channel: process.env.SLACK_CHANNEL_ID_TEST,
      token: process.env.SLACK_BOT_TOKEN,
      blocks: view.로그(
        `채널 ${name}에서 @${user.name}쌤이 잠금에 실패하셨습니다.`
      ),
    });
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();

module.exports = { app };
