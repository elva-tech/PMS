const Contact = require("../models/contact.model");

class ContactService {
  async createContact(contactData) {
    try {
      const contactWithDefaults = {
        ...contactData,
        interested: contactData.interested || 1,
      };
      const contact = new Contact(contactWithDefaults);
      const savedContact = await contact.save();
      const { _id, __v, interested, createdAt, ...rest } =
        savedContact.toObject();
      const istDate = new Date(createdAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      return { ...rest, createdAt: istDate };
    } catch (error) {
      throw error;
    }
  }

  async getContacts({
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
  }) {
    try {
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Create sort object
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Get total count of contacts
      const total = await Contact.countDocuments();

      // Get paginated and sorted contacts
      const contacts = await Contact.find({})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      const formattedContacts = contacts.map((contact) => {
        const { _id, __v, createdAt, ...rest } = contact;
        const istDate = new Date(createdAt).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        return { ...rest, createdAt: istDate };
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / limit);

      // Return paginated result with metadata
      return {
        contacts: formattedContacts,
        pagination: {
          currentPage: page,
          totalPages,
          totalRecords: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ContactService();
