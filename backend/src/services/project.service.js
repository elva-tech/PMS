const Project = require("../models/project.model");

const createProject = async (projectData, imageMeta = null, brochureMeta = null) => {
  const project = new Project({
    ...projectData,
    ...(imageMeta?.data
      ? {
          image: {
            data: imageMeta.data,
            contentType: imageMeta.contentType,
            originalName: imageMeta.originalName,
          },
        }
      : {}),
    ...(brochureMeta?.data
      ? {
          brochure: {
            data: brochureMeta.data,
            contentType: brochureMeta.contentType,
            originalName: brochureMeta.originalName,
          },
        }
      : {}),
  });

  return project.save();
};

const getProjects = async () => {
  return Project.find();
};

const getProjectById = async (id) => {
  return Project.findById(id);
};

const updateProject = async (
  id,
  updateData,
  imageMeta = null,
  brochureMeta = null
) => {
  const payload = { ...updateData };
  if (imageMeta?.data) {
    payload.image = {
      data: imageMeta.data,
      contentType: imageMeta.contentType,
      originalName: imageMeta.originalName,
    };
  }
  if (brochureMeta?.data) {
    payload.brochure = {
      data: brochureMeta.data,
      contentType: brochureMeta.contentType,
      originalName: brochureMeta.originalName,
    };
  }
  return Project.findByIdAndUpdate(id, payload, { new: true });
};

const deleteProject = async (id) => {
  return Project.findByIdAndDelete(id);
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
