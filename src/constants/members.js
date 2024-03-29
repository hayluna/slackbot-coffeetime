const members = [
  "강승훈",
  "김회준",
  "임한울",
  "명혜은",
  "성민화",
  "조수현",
  "김태련",
  "육용수",
  "김용현",
  "임민석",
  "신제훈",
  "Junseok Oh",
  "구주승",
  "노기진",
  "유시온",
  "이진혁",
  "조충근",
];

const memberSet = new Set([...members]);
const excludedMembers = ["coffeetime", "Ahram Chang", "신규식"];

const excludedMemberSet = new Set([...excludedMembers]);

module.exports = { members, memberSet, excludedMemberSet };
