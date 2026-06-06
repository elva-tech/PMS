const Contact = require("../models/contact.model");
const Plot = require("../models/plot.model");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const shareQuoteService = require("./shareQuote.service");

class ContactService {
  normalizePhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  async createContact(contactData) {
    try {
      const plotId = String(contactData.plotid || "").trim();
      const source = String(contactData.source || "ADMIN").toUpperCase();
      const normalizedPhone = this.normalizePhone(contactData.phone);
      if (!normalizedPhone || normalizedPhone.length < 10) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Enter a valid 10-digit phone number");
      }
      const needsPlot =
        source === "WEBSITE" || Boolean(contactData.projectId) || Boolean(plotId);
      let plot = null;
      let normalizedProjectId =
        contactData.projectId && String(contactData.projectId).trim()
          ? String(contactData.projectId).trim()
          : null;

      if (needsPlot) {
        if (!plotId) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Plot selection is required");
        }
        plot = await Plot.findById(plotId).lean();
        if (!plot) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Invalid plot selected");
        }
        normalizedProjectId = normalizedProjectId || String(plot.projectid);
        if (normalizedProjectId !== String(plot.projectid)) {
          throw new ApiError(httpStatus.BAD_REQUEST, "Plot does not belong to selected project");
        }
        const existing = await Contact.find({
          projectId: normalizedProjectId,
        })
          .select("phone plotid plotnumber fullName createdAt")
          .lean();
        const duplicate = existing.find(
          (row) =>
            this.normalizePhone(row.phone) === normalizedPhone &&
            (String(row.plotid || "") === plotId ||
              Number(row.plotnumber) === Number(plot.plotnumber))
        );
        if (duplicate) {
          const duplicateDate = duplicate?.createdAt
            ? new Date(duplicate.createdAt).toLocaleDateString("en-IN")
            : null;
          throw new ApiError(
            httpStatus.CONFLICT,
            `Buyer already exists for this phone and plot${duplicate?.fullName ? ` (Existing: ${duplicate.fullName}` : ""}${duplicateDate ? ` on ${duplicateDate}` : ""}${duplicate?.fullName ? ")" : ""}`
          );
        }
      }

      const contactWithDefaults = {
        ...contactData,
        interested: contactData.interested || 1,
        phone: normalizedPhone,
        source,
        projectId: normalizedProjectId,
        plotid: plot ? plotId : null,
        plotnumber: plot ? Number(plot.plotnumber) : null,
        description: String(contactData.description || "").trim() || "—",
      };
      const contact = new Contact(contactWithDefaults);
      const savedContact = await contact.save();
      const obj = savedContact.toObject();
      const { _id, __v, createdAt, ...rest } = obj;
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
      return {
        id: _id,
        ...rest,
        interested: obj.interested,
        createdAt: istDate,
        createdAtISO: createdAt ? new Date(createdAt).toISOString() : null,
      };
    } catch (error) {
      throw error;
    }
  }

  async getContacts({
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    projectId,
    plotid,
    source,
    interested,
  }) {
    try {
      // Calculate skip value for pagination
      const skip = (page - 1) * limit;

      // Create sort object
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      const filter = {};
      if (projectId && String(projectId).trim()) {
        filter.projectId = String(projectId).trim();
      }
      if (plotid && String(plotid).trim()) {
        filter.plotid = String(plotid).trim();
      }
      if (source && String(source).trim()) {
        filter.source = String(source).trim().toUpperCase();
      }
      if (interested === 0 || interested === 1) {
        filter.interested = interested;
      }

      // Get total count of contacts
      const total = await Contact.countDocuments(filter);

      // Get paginated and sorted contacts
      const contacts = await Contact.find(filter)
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
        return {
          id: _id,
          ...rest,
          createdAt: istDate,
          createdAtISO: createdAt ? new Date(createdAt).toISOString() : null,
        };
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

  async deleteContact(contactId) {
    const deleted = await Contact.findByIdAndDelete(contactId).lean();
    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, "Contact not found");
    }
    return { id: deleted._id };
  }

  async updateContactStatus(contactId, interestedStatus) {
    try {
      const contact = await Contact.findByIdAndUpdate(
        contactId,
        { interested: interestedStatus },
        { new: true }
      ).lean();

      if (!contact) {
        throw new ApiError(httpStatus.NOT_FOUND, "Contact not found");
      }

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

      return {
        id: _id,
        ...rest,
        createdAt: istDate,
        createdAtISO: createdAt ? new Date(createdAt).toISOString() : null,
      };
    } catch (error) {
      throw error;
    }
  }

  async createPublicInterestedBuyer(contactData) {
    const created = await this.createContact({
      ...contactData,
      source: "WEBSITE",
      interested: 1,
    });
    const preview = await shareQuoteService.previewShareQuote({
      plotId: created.plotid,
      buyerDetails: { fullName: created.fullName },
    });
    return {
      lead: created,
      smsPreview: preview.message,
    };
  }
}

module.exports = new ContactService();
