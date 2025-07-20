const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const contactService = require("../services/contact.service");

const createContact = catchAsync(async (req, res) => {
  const contact = await contactService.createContact(req.body);
  res.status(httpStatus.CREATED).send(contact);
});

const getContacts = catchAsync(async (req, res) => {
  const { page, limit, sortBy, sortOrder } = req.query;
  const contacts = await contactService.getContacts({
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sortBy,
    sortOrder,
  });
  res.status(httpStatus.OK).send(contacts);
});

module.exports = {
  createContact,
  getContacts,
};
