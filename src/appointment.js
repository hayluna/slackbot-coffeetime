const { addDays } = require('date-fns');
const { coffeeMemberMap } = require('./coffeeMember');

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

const CORONA_LIMIT = 6;
const 요일 = ['월', '화', '수', '목', '금'];

class Appointment {
  constructor() {
    this.isLocked = false;
    this.startDate = new Date();
    this.endDate = addDays(this.startDate, 14);
    this.shuffleGroup();
  }

  get scheduleToPrint() {
    return this.groupsWithWeek.map(
      (groupWeekStr, idx) =>
        `*:coffee: ${groupWeekStr}${idx < this.groups.length - 1 ? '*\n' : ''}`
    );
  }

  get groupsWithWeek() {
    return this.groups
      .map((group) => group.map((member) => `<@${member.id}>`))
      .map((group, idx) => `${요일[idx % 5]}요일 : ${group.join(' ')}`);
  }

  shuffleGroup() {
    const members = [...coffeeMemberMap.values()];
    const shuffledMembers = shuffle(members);
    const maxGroupCount = Math.ceil(members.length / CORONA_LIMIT);
    const groupedMembers = Array.from({ length: maxGroupCount }, () => []);

    shuffledMembers.forEach((member, index) => {
      groupedMembers[index % maxGroupCount].push(member);
    });
    this.groups = groupedMembers;
  }
}

module.exports = { appointment: new Appointment() };
