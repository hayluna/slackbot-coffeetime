// const { members } = require('./constants/members');
const { format } = require('date-fns');
const { ACTION_TYPES } = require('./constants/actionTypes');
const { appointment } = require('./appointment');
const { coffeeMemberMap } = require('./coffeeMember');

const view = {
  잠금안내: () => {
    const members = [...coffeeMemberMap.values()];
    return [
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: ':lock: 잠겨있어요~',
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          emoji: true,
          text: ':coffee: 이번 주 커피 타임 안내 :coffee:',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<fakeLink.toUserProfiles.com|커피타임>*\n${format(
            appointment.startDate,
            'yyyy년 MM월 dd일'
          )} ~ ${format(appointment.endDate, 'yyyy년 MM월 dd일')}\n${
            members.length
          }명`,
        },
        accessory: {
          type: 'image',
          image_url:
            'https://api.slack.com/img/blocks/bkb_template_images/notifications.png',
          alt_text: 'calendar thumbnail',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${appointment.scheduleToPrint.join('')}*`,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: ':unlock: 잠금 풀고 재설정하기',
              emoji: true,
            },
            style: 'danger',
            value: 'click_me_123',
            action_id: ACTION_TYPES.잠금해제,
          },
        ],
      },
    ];
  },
  잠금재설정안내: () => [
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: ':lock: 잠겨있어요~',
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: ':unlock: 잠금 풀고 재설정하기',
            emoji: true,
          },
          style: 'danger',
          action_id: ACTION_TYPES.잠금해제,
        },
      ],
    },
  ],
  날짜세팅안내: () => [
    {
      type: 'actions',
      elements: [
        {
          type: 'datepicker',
          initial_date: format(appointment.startDate, 'yyyy-MM-dd'),
          placeholder: {
            type: 'plain_text',
            text: 'Select a date',
            emoji: true,
          },
          action_id: ACTION_TYPES.시작날짜설정,
        },
        {
          type: 'datepicker',
          initial_date: format(appointment.endDate, 'yyyy-MM-dd'),
          placeholder: {
            type: 'plain_text',
            text: 'Select a date',
            emoji: true,
          },
          action_id: ACTION_TYPES.마지막날짜설정,
        },
      ],
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: ':unlock: 확인하고 잠그기',
            emoji: true,
          },
          style: 'primary',
          action_id: ACTION_TYPES.잠금,
        },
      ],
    },
  ],
  커피타임안내: () => {
    const members = [...coffeeMemberMap.values()];
    return [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          emoji: true,
          text: ':coffee: 이번 주 커피 타임 안내 :coffee:',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<fakeLink.toUserProfiles.com|커피타임>*\n${format(
            appointment.startDate,
            'yyyy년 MM월 dd일'
          )} ~ ${format(appointment.endDate, 'yyyy년 MM월 dd일')}\n${
            members.length
          }명`,
        },
        accessory: {
          type: 'image',
          image_url:
            'https://api.slack.com/img/blocks/bkb_template_images/notifications.png',
          alt_text: 'calendar thumbnail',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `${appointment.scheduleToPrint.join('')}*`,
          },
        ],
      },
      {
        type: 'divider',
      },
    ];
  },
  그룹모임메세지: (groupWeekStr) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:coffee: *${groupWeekStr}*`,
      },
    },
  ],
  멤버: (coffeeMembers) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${coffeeMembers.map(({ id }) => `<@${id}> ${id}`).join('\n')}`,
      },
    },
  ],
  유저: (users) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${users.map(({ id }) => `<@${id}> ${id}`).join('\n')}`,
      },
    },
  ],
  멤버등록성공: (coffeeMembers) => [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `멤버가 성공적으로 등록되었습니다. 😁\n ${coffeeMembers
          .map(({ name }) => name)
          .join('\n')}`,
      },
    },
  ],
};

module.exports = { view };
