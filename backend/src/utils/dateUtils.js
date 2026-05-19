const convertToIST = (utcDate) => {
  const date = utcDate || new Date();

  const options = {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  };

  const istString = date.toLocaleString("en-IN", options);

  const istDate = new Date(date.getTime());
  istDate.setHours(date.getHours() + 5);
  istDate.setMinutes(date.getMinutes() + 30);

  return {
    string: istString,
    date: istDate,
  };
};

const formatDate = (date) => {
  const ist = convertToIST(date);
  return ist.string;
};

module.exports = {
  convertToIST,
  formatDate,
};
