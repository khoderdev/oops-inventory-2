export const getClientIP = req => {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || (req.connection?.socket ? req.connection.socket.remoteAddress : null) || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.headers["x-client-ip"] || req.headers["cf-connecting-ip"] || req.headers["x-forwarded"] || req.headers["forwarded-for"] || req.headers["forwarded"] || "Unknown";

  if (ip === "::1") {
    return "127.0.0.1";
  }
  if (ip && ip.includes("::ffff:")) {
    return ip.replace("::ffff:", "");
  }

  return ip;
};

export const getDeviceInfo = userAgent => {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("macintosh") || ua.includes("mac os")) os = "macOS";
  else if (ua.includes("linux")) os = "Linux";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";

  let browser = "Unknown Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";
  else if (ua.includes("opera")) browser = "Opera";

  let deviceType = "Desktop";
  if (ua.includes("mobile")) deviceType = "Mobile";
  else if (ua.includes("tablet") || ua.includes("ipad")) deviceType = "Tablet";

  return `${browser} - ${deviceType} - ${os}`;
};
