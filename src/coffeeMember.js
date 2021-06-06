class CoffeeMember {
  constructor({ id, nickName, name, profileImg }) {
    this.id = id;
    this.nickName = nickName;
    this.name = name;
    this.profileImg = profileImg;
  }
}

module.exports = { CoffeeMember, coffeeMemberMap: new Map() };
