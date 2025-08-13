const TicketManagement = artifacts.require("TicketManagement");

module.exports = function (deployer) {
  deployer.deploy(TicketManagement);
};
