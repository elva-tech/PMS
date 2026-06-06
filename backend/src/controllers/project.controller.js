const httpStatus = require("http-status");
const sharp = require("sharp");
const projectService = require("../services/project.service");
const catchAsync = require("../utils/catchAsync");
const { formatDate } = require("../utils/dateUtils");

const serializeFileField = (field) =>
  field && field.data
    ? {
        data: field.data.toString("base64"),
        contentType: field.contentType,
        originalName: field.originalName,
      }
    : null;

const buildProjectFileMeta = async (files = {}) => {
  const brochureFile = files.brochure?.[0];
  const imageFile = files.image?.[0];

  let imageMeta = null;
  if (imageFile) {
    const buf = await sharp(imageFile.buffer)
      .resize({ width: 1200 })
      .jpeg({ quality: 80 })
      .toBuffer();
    imageMeta = {
      data: buf,
      contentType: "image/jpeg",
      originalName: imageFile.originalname,
    };
  }

  let brochureMeta = null;
  if (brochureFile) {
    if (brochureFile.mimetype === "application/pdf") {
      brochureMeta = {
        data: brochureFile.buffer,
        contentType: brochureFile.mimetype,
        originalName: brochureFile.originalname,
      };
    } else {
      const buf = await sharp(brochureFile.buffer)
        .resize({ width: 600 })
        .jpeg({ quality: 85 })
        .toBuffer();
      brochureMeta = {
        data: buf,
        contentType: "image/jpeg",
        originalName: brochureFile.originalname,
      };
    }
  }

  return { imageMeta, brochureMeta };
};

const createProject = catchAsync(async (req, res) => {
  const { imageMeta, brochureMeta } = await buildProjectFileMeta(req.files);

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
    imageMeta,
    brochureMeta
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
        amenities: project.amenities,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate),
        createdAt: formatDate(project.createdAt),
        updatedAt: formatDate(project.updatedAt),
        hasImage: project.image && project.image.data ? true : false,
        hasBrochure: project.brochure && project.brochure.data ? true : false,
      },
    },
  });
});


const getProjects = catchAsync(async (req, res) => {
  const role = req.user?.role || req.user?.type;
  const requestUserId = req.user?.userid;

  let projects;

  if (role === "user" && requestUserId) {
    const Plot = require("../models/plot.model");
    const Document = require("../models/document.model");
    const Project = require("../models/project.model");
    
    // plots
    const assignedPlots = await Plot.find({
      assigneduserid: requestUserId,
    })
      .select("projectid")
      .lean();
    
    // documents
    const assignedDocs = await Document.find({
      assignedUserIds: requestUserId,
    })
      .select("projectid")
      .lean();
    
    // merge both
    const projectIds = [
      ...new Set([
        ...assignedPlots.map((p) => p.projectid),
        ...assignedDocs.map((d) => d.projectid),
      ]),
    ];
    
    projects = await Project.find({
      _id: { $in: projectIds },
    });
  } else {
    projects = await projectService.getProjects();
  }

  

  const projectsWithImage = projects.map((project) => ({
    _id: project._id,
    name: project.name,
    location: project.location,
    status: project.status,
    description: project.description,
    projectManager: project.projectManager,
    contactNumber: project.contactNumber,
    coordinates: project.coordinates,
    amenities: project.amenities,
    startDate: formatDate(project.startDate),
    endDate: formatDate(project.endDate),
    createdAt: formatDate(project.createdAt),
    updatedAt: formatDate(project.updatedAt),
    hasImage: project.image && project.image.data ? true : false,
    hasBrochure: project.brochure && project.brochure.data ? true : false,
    image: serializeFileField(project.image),
    brochure: serializeFileField(project.brochure),
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
        amenities: project.amenities,
        startDate: formatDate(project.startDate),
        endDate: formatDate(project.endDate),
        createdAt: formatDate(project.createdAt),
        updatedAt: formatDate(project.updatedAt),
        hasImage: project.image && project.image.data ? true : false,
        hasBrochure: project.brochure && project.brochure.data ? true : false,
        image: serializeFileField(project.image),
        brochure: serializeFileField(project.brochure),
      },
    },
  });
});

const getProjectImage = catchAsync(async (req, res) => {
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
      name: project.name,
      description: project.description,
      image:
        project.image && project.image.data
          ? {
              data: project.image.data.toString("base64"),
              contentType: project.image.contentType,
              originalName: project.image.originalName,
            }
          : null,
    },
  });
});

const updateProject = catchAsync(async (req, res) => {
  const { imageMeta, brochureMeta } = await buildProjectFileMeta(req.files);

  if (req.body.coordinates && typeof req.body.coordinates === "string") {
    try {
      req.body.coordinates = JSON.parse(req.body.coordinates);
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: "error",
        message: "Invalid coordinates format.",
      });
    }
  }

  if (req.body.startDate && typeof req.body.startDate === "string") {
    req.body.startDate = new Date(req.body.startDate);
  }
  if (req.body.endDate && typeof req.body.endDate === "string") {
    req.body.endDate = new Date(req.body.endDate);
  }
  if (req.body.contactNumber != null && req.body.contactNumber !== "") {
    req.body.contactNumber = Number(
      String(req.body.contactNumber).replace(/\D/g, "")
    );
  }

  const project = await projectService.updateProject(
    req.params.projectId,
    req.body,
    imageMeta,
    brochureMeta
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
        amenities: project.amenities,
        createdAt: formatDate(project.createdAt),
        updatedAt: formatDate(project.updatedAt),
        hasImage: project.image && project.image.data ? true : false,
        hasBrochure: project.brochure && project.brochure.data ? true : false,
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
