import hourglass from "../Images/Flathourglass.gif";

export const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
      <img
        src={hourglass}
        alt="Loading..."
        className="h-16 w-16 mix-blend-multiply"
      />
    </div>
  );
};

export default LoadingSpinner;
