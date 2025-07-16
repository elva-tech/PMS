const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const contactService = require("../services/contact.service");

const createContact = catchAsync(async (req, res) => {
  const contact = await contactService.createContact(req.body);
  res.status(httpStatus.CREATED).send(contact);
});

module.exports = {
  createContact,
};
