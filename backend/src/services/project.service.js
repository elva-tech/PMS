const Project = require("../models/project.model");

const createProject = async (
  projectData,
  imageData = null,
  contentType = null,
  originalName = null
) => {
  const project = new Project({
    ...projectData,
    image: imageData
      ? {
          data: imageData,
          contentType,
          originalName,
        }
      : undefined,
  });

  return project.save();
};

const getProjects = async () => {
  return Project.find();
};

const getProjectById = async (id) => {
  return Project.findById(id);
};

const updateProject = async (id, updateData) => {
  return Project.findByIdAndUpdate(id, updateData, { new: true });
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
