const ColaDayBooking = artifacts.require("ColaDayBooking")

module.exports = function (deployer) {
  deployer.deploy(ColaDayBooking)
}
