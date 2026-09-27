// Encaminha qualquer rejeição de Promise para o errorHandler central,
// evitando esquecer um try/catch em algum controller e derrubar o processo.
module.exports = function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
