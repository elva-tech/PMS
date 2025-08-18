const Joi = require("joi");

const createProject = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    location: Joi.string().required(),
    status: Joi.string()
      .valid("Not Started", "In Progress", "Completed")
      .required(),
    description: Joi.string().required(),
    projectManager: Joi.string().required(),
    contactNumber: Joi.number().required(),
    coordinates: Joi.alternatives()
      .try(
        Joi.object().keys({
          latitude: Joi.number().required(),
          longitude: Joi.number().required(),
        }),
        Joi.string().custom((value, helpers) => {
          try {
            const parsed = JSON.parse(value);
            if (!parsed.latitude || !parsed.longitude) {
              return helpers.error("any.invalid", {
                message: "Coordinates must contain latitude and longitude",
              });
            }
            return {
              latitude: Number(parsed.latitude),
              longitude: Number(parsed.longitude),
            };
          } catch (error) {
            return helpers.error("any.invalid", {
              message: "Coordinates must be a valid JSON string",
            });
          }
        })
      )
      .required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    image: Joi.object().keys({
      data: Joi.binary(),
      contentType: Joi.string(),
      originalName: Joi.string(),
    }),
  }),
};

const updateProject = {
  params: Joi.object().keys({
    projectId: Joi.string().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    location: Joi.string(),
    status: Joi.string().valid("Not Started", "In Progress", "Completed"),
    description: Joi.string(),
    projectManager: Joi.string(),
    contactNumber: Joi.number(),
    coordinates: Joi.alternatives().try(
      Joi.object().keys({
        latitude: Joi.number(),
        longitude: Joi.number(),
      }),
      Joi.string().custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          if (!parsed.latitude || !parsed.longitude) {
            return helpers.error("any.invalid", {
              message: "Coordinates must contain latitude and longitude",
            });
          }
          return {
            latitude: Number(parsed.latitude),
            longitude: Number(parsed.longitude),
          };
        } catch (error) {
          return helpers.error("any.invalid", {
            message: "Coordinates must be a valid JSON string",
          });
        }
      })
    ),
    startDate: Joi.date(),
    endDate: Joi.date(),
    image: Joi.object().keys({
      data: Joi.binary(),
      contentType: Joi.string(),
      originalName: Joi.string(),
    }),
  }),
};

module.exports = {
  createProject,
  updateProject,
};
