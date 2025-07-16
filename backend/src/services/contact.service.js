const Contact = require("../models/contact.model");

class ContactService {
  async createContact(contactData) {
    try {
      const contact = new Contact(contactData);
      const savedContact = await contact.save();
      const { _id, __v, createdAt, ...rest } = savedContact.toObject();
      // Convert createdAt to IST format (YYYY-MM-DD HH:mm:ss)
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
}

module.exports = new ContactService();
