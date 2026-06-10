const Contact = require("../../models/contact.model");

const listInterestedBuyers = async (projectId, args = {}) => {
  const filter = { projectId, interested: 1 };
  if (args.plotNumber != null) {
    filter.plotnumber = Number(args.plotNumber);
  }

  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 30);

  const contacts = await Contact.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("fullName email phone plotnumber description createdAt")
    .lean();

  return {
    projectId,
    count: contacts.length,
    buyers: contacts.map((c) => ({
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      plotNumber: c.plotnumber,
      note: c.description,
    })),
  };
};

module.exports = { listInterestedBuyers };
