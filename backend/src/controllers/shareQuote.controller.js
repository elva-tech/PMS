const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const shareQuoteService = require("../services/shareQuote.service");

const previewShareQuote = catchAsync(async (req, res) => {
  const data = await shareQuoteService.previewShareQuote({
    plotId: req.body.plotId,
    buyerDetails: req.body.buyer || {},
  });
  res.status(httpStatus.OK).send({
    message: data.message,
    data,
  });
});

module.exports = {
  previewShareQuote,
};
