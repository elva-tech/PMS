import { createContext, useContext, useState } from "react";

const ProjectContext = createContext();

export const useProject = () => useContext(ProjectContext);

export const ProjectProvider = ({ children }) => {
  const [projectId, setProjectId] = useState(null);
  const [plotId, setPlotId] = useState(null);

  return (
    <ProjectContext.Provider
      value={{
        projectId,
        setProjectId,
        plotId,
        setPlotId,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};
