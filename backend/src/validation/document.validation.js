const Joi = require("joi");

const listDocuments = {
  params: Joi.object({
    projectId: Joi.string().required(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(500).default(10),
    filterUserId: Joi.string().trim().allow("", null),
    search: Joi.string().allow("", null),
    searchBy: Joi.string().valid("document", "user").default("document"),
    sortBy: Joi.string().valid("createdAt", "originalName").default("createdAt"),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),
};

const assignDocumentUsers = {
  params: Joi.object({
    projectId: Joi.string().required(),
    documentId: Joi.string().required(),
  }),
  body: Joi.object({
    userIds: Joi.array().items(Joi.string().trim().required()).min(1).required(),
  }),
};

const bulkAssignDocuments = {
  params: Joi.object({
    projectId: Joi.string().required(),
  }),
  body: Joi.object({
    userId: Joi.string().trim().required(),
    documentIds: Joi.array()
      .items(Joi.string().trim().required())
      .min(1)
      .required(),
  }),
};

const documentIdParams = {
  params: Joi.object({
    projectId: Joi.string().required(),
    documentId: Joi.string().required(),
  }),
};

module.exports = {
  listDocuments,
  assignDocumentUsers,
  bulkAssignDocuments,
  documentIdParams,
};
