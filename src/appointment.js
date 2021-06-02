const { addDays } = require('date-fns');
const { members } = require('./constants/members');

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

const CORONA_LIMIT = 4;

class Appointment {
  constructor() {
    this.isLocked = false;
    this.startDate = new Date();
    this.endDate = addDays(this.startDate, 14);
    const { groupedMembers, groupedMembersWithMark } =
      this.getShuffledGroup(members);

    this.groups = groupedMembers;
    this.groupWithMark = groupedMembersWithMark;
  }

  get groupToString() {
    return this.groupWithMark.map(
      (group, idx) =>
        `*:coffee: ${group.join(' ')}${
          idx < this.groupWithMark.length - 1 ? '*\n' : ''
        }`
    );
  }

  getShuffledGroup() {
    const shuffledMembers = shuffle(members);
    const maxGroupCount = Math.ceil(members.length / CORONA_LIMIT);
    const groupedMembers = Array.from({ length: maxGroupCount }, () => []);
    const groupedMembersWithMark = Array.from(
      { length: maxGroupCount },
      () => []
    );

    shuffledMembers.forEach((member, index) => {
      groupedMembers[index % maxGroupCount].push(member);
      groupedMembersWithMark[index % maxGroupCount].push(`${member}`);
    });
    return { groupedMembers, groupedMembersWithMark };
  }

  setShuffledGroup() {
    const { groupedMembers, groupedMembersWithMark } = this.getShuffledGroup();

    this.groups = groupedMembers;
    this.groupWithMark = groupedMembersWithMark;
  }
}

module.exports = { appointment: new Appointment() };
