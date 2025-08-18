const httpStatus = require("http-status");
const sharp = require("sharp");
const projectService = require("../services/project.service");
const catchAsync = require("../utils/catchAsync");
const { formatDate } = require("../utils/dateUtils");

const createProject = catchAsync(async (req, res) => {
  let imageData = null;
  let contentType = null;
  let originalName = null;

  if (req.file) {
    // Compress the image using Sharp
    imageData = await sharp(req.file.buffer)
      .resize({ width: 800 })
      .jpeg({ quality: 80 })
      .toBuffer();
    contentType = req.file.mimetype;
    originalName = req.file.originalname;
  }
  console.log("Body received:", req.body);

  // Handle coordinates properly
  if (req.body.coordinates) {
    if (typeof req.body.coordinates === "string") {
      try {
        req.body.coordinates = JSON.parse(req.body.coordinates);
        console.log("Parsed coordinates:", req.body.coordinates);
      } catch (error) {
        console.error("Error parsing coordinates:", error);
        return res.status(httpStatus.BAD_REQUEST).json({
          status: "error",
          message:
            "Invalid coordinates format. Must be a valid JSON object with latitude and longitude.",
        });
      }
    }

    // Validate the structure of coordinates
    if (!req.body.coordinates.latitude || !req.body.coordinates.longitude) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: "error",
        message: "Coordinates must include both latitude and longitude values.",
      });
    }
  } else {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: "error",
      message: "Coordinates are required.",
    });
  }

  // Parse dates if they are strings
  if (req.body.startDate && typeof req.body.startDate === "string") {
    req.body.startDate = new Date(req.body.startDate);
  }

  if (req.body.endDate && typeof req.body.endDate === "string") {
    req.body.endDate = new Date(req.body.endDate);
  }

  const project = await projectService.createProject(
    req.body,
    imageData,
    contentType,
    originalName
  );

  res.status(httpStatus.CREATED).json({
    status: "success",
    data: {
      project: {
        _id: project._id,
        name: project.name,
        location: project.location,
        status: project.status,
        description: project.description,
        projectManager: project.projectManager,
        contactNumber: project.contactNumber,
        coordinates: project.coordinates,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate),
        createdAt: formatDate(project.createdAt),
        updatedAt: formatDate(project.updatedAt),
        hasImage: project.image && project.image.data ? true : false,
      },
    },
  });
});

const getProjects = catchAsync(async (req, res) => {
  const projects = await projectService.getProjects();

  const projectsWithImage = projects.map((project) => ({
    _id: project._id,
    name: project.name,
    location: project.location,
    status: project.status,
    description: project.description,
    projectManager: project.projectManager,
    contactNumber: project.contactNumber,
    coordinates: project.coordinates,
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.endDate),
    createdAt: formatDate(project.createdAt),
    updatedAt: formatDate(project.updatedAt),
    hasImage: project.image && project.image.data ? true : false,
    image:
      project.image && project.image.data
        ? {
            data: project.image.data.toString("base64"),
            contentType: project.image.contentType,
            originalName: project.image.originalName,
          }
        : null,
  }));

  res.status(httpStatus.OK).json({
    status: "success",
    results: projects.length,
    data: {
      projects: projectsWithImage,
    },
  });
});

const getProject = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);

  if (!project) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: "error",
      message: "Project not found",
    });
  }

  res.status(httpStatus.OK).json({
    status: "success",
    data: {
      project: {
        _id: project._id,
        name: project.name,
        location: project.location,
        status: project.status,
        description: project.description,
        projectManager: project.projectManager,
        contactNumber: project.contactNumber,
        coordinates: project.coordinates,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate),
        createdAt: formatDate(project.createdAt),
        updatedAt: formatDate(project.updatedAt),
        hasImage: project.image && project.image.data ? true : false,
      },
    },
  });
});

const getProjectImage = catchAsync(async (req, res) => {
  const project = await projectService.getProjectById(req.params.projectId);

  if (!project || !project.image || !project.image.data) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: "error",
      message: "Project image not found",
    });
  }

  res.set("Content-Type", project.image.contentType);
  res.send(project.image.data);
});

const updateProject = catchAsync(async (req, res) => {
  const project = await projectService.updateProject(
    req.params.projectId,
    req.body
  );

  if (!project) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: "error",
      message: "Project not found",
    });
  }

  res.status(httpStatus.OK).json({
    status: "success",
    data: {
      project: {
        _id: project._id,
        name: project.name,
        location: project.location,
        status: project.status,
        description: project.description,
        createdAt: formatDate(project.createdAt),
        updatedAt: formatDate(project.updatedAt),
        hasImage: project.image && project.image.data ? true : false,
      },
    },
  });
});

const deleteProject = catchAsync(async (req, res) => {
  const project = await projectService.deleteProject(req.params.projectId);

  if (!project) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: "error",
      message: "Project not found",
    });
  }

  res.status(httpStatus.OK).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  getProjectImage,
  updateProject,
  deleteProject,
};
