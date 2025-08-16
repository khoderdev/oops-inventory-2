export const formatCurrency = (amount: number | null | undefined) => {
  const numAmount = Number(amount) || 0;
  return `$${numAmount.toFixed(2)}`;
};

export const formatDateTime = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid Date";
  }
};

export const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  try {
    let dateObj: Date;
    // Handle date string parsing to avoid timezone issues
    if (typeof date === "string") {
      // If it's a date-only string like "2025-08-01", parse it as local date
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split("-").map(Number);
        dateObj = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = new Date(date);
    }
    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  } catch (error) {
    console.error("Error formatting date:", error, "Input:", date);
    return "Invalid Date";
  }
};

export const formatWeekday = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  try {
    let dateObj: Date;
    // Handle date string parsing to avoid timezone issues
    if (typeof date === "string") {
      // If it's a date-only string like "2025-08-01", parse it as local date
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = date.split("-").map(Number);
        dateObj = new Date(year, month - 1, day); // month is 0-indexed
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = new Date(date);
    }

    if (isNaN(dateObj.getTime())) return "Invalid Date";
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long"
    });
  } catch (error) {
    console.error("Error formatting weekday:", error, "Input:", date);
    return "Invalid Date";
  }
};
