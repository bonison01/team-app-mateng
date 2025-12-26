export const calculateWorkingHours = (
  checkIn: Date,
  checkOut: Date
): number => {
  const diffMs = checkOut.getTime() - checkIn.getTime();
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

export const calculateSalary = (
  monthlySalary: number,
  totalHours: number
) => {
  const dailySalary = monthlySalary / 26;
  const hourlySalary = dailySalary / 8;
  return Math.round(totalHours * hourlySalary);
};
