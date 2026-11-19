const crypto = require("node:crypto");
const catalog = require("../config/hrms-catalog.json");
const roles = [
  "HR Admin",
  "HR Executive",
  "Reporting Manager",
  "Area Manager",
  "Regional Manager",
  "Zonal Manager",
  "Finance",
  "Employee",
];
const administrators = ["admin", "super admin"];
const isAdmin = (user) =>
  administrators.includes(String(user.role).toLowerCase());
const hr = (role) => ["HR Admin", "HR Executive"].includes(role);
const managers = (role) =>
  [
    "Reporting Manager",
    "Area Manager",
    "Regional Manager",
    "Zonal Manager",
    "National Manager",
  ].includes(role);
const finance = (role) => role === "Finance";
function policy(role, module) {
  if (role === "HR Admin")
    return { read: true, write: true, review: true, global: true };
  if (role === "HR Executive")
    return {
      read: module !== "payroll",
      write: module !== "payroll",
      review: !["payroll", "expenses"].includes(module),
      global: true,
    };
  if (finance(role))
    return {
      read: ["employees", "payroll", "expenses", "leave", "reports"].includes(
        module,
      ),
      write: ["payroll", "expenses"].includes(module),
      review: ["payroll", "expenses", "leave"].includes(module),
      global: true,
    };
  const read = [
    "employees",
    "attendance",
    "leave",
    "payroll",
    "expenses",
    "performance",
    "training",
    "movement",
    "discipline",
    "separation",
    "documents",
    "assets",
    "reports",
  ].includes(module);
  return {
    read,
    write: read && !["payroll", "discipline", "employees"].includes(module),
    review:
      managers(role) &&
      [
        "attendance",
        "leave",
        "expenses",
        "performance",
        "training",
        "movement",
        "separation",
      ].includes(module),
    global: false,
  };
}
function key() {
  const raw = process.env.HR_DATA_ENCRYPTION_KEY || "";
  const value = /^[a-f\d]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (value.length !== 32)
    throw Object.assign(
      new Error(
        "Configure HR_DATA_ENCRYPTION_KEY with a 32-byte key before saving identity, bank details or attachments.",
      ),
      { status: 503 },
    );
  return value;
}
function seal(value) {
  const iv = crypto.randomBytes(12),
    cipher = crypto.createCipheriv("aes-256-gcm", key(), iv);
  return [
    iv.toString("base64"),
    cipher.update(JSON.stringify(value), "utf8", "base64") +
      cipher.final("base64"),
    cipher.getAuthTag().toString("base64"),
  ].join(".");
}
function open(value) {
  if (!value) return {};
  const [iv, data, tag] = value.split(".");
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return JSON.parse(
    decipher.update(data, "base64", "utf8") + decipher.final("utf8"),
  );
}
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
function validate(resource, input, existing = {}) {
  const spec = catalog.resources[resource];
  if (!spec) fail("Unknown HR register.", 404);
  const data = {};
  for (const f of spec.fields) {
    let value = input[f.name];
    if (value === undefined) value = existing[f.name];
    if (f.required && (value === undefined || value === null || value === ""))
      fail(`${f.label} is required.`);
    if (value === undefined || value === null || value === "") {
      data[f.name] = null;
      continue;
    }
    if (["number", "money", "employee", "hq"].includes(f.type)) {
      value = Number(value);
      if (!Number.isFinite(value)) fail(`${f.label} must be a number.`);
      if (f.type === "money" && (value < 0 || value > 999999999.99))
        fail(`${f.label} must be between 0 and 999999999.99.`);
    } else if (f.type === "checkbox") {
      if (typeof value !== "boolean")
        fail(`${f.label} must be checked or unchecked.`);
    } else if (f.type === "file") {
      if (
        typeof value === "object" &&
        existing[f.name] &&
        value.filename === existing[f.name].filename
      ) {
        data[f.name] = existing[f.name];
        continue;
      }
      if (
        typeof value !== "object" ||
        typeof value.content !== "string" ||
        !["application/pdf", "image/png", "image/jpeg"].includes(value.mime)
      )
        fail("Attachments must be PDF, PNG or JPEG.");
      const buf = Buffer.from(value.content, "base64");
      if (buf.length > 4 * 1024 * 1024 || !buf.length)
        fail("Each attachment must be between 1 byte and 4 MB.");
      const signature = buf.subarray(0, 8).toString("hex");
      if (!(
        (value.mime === "application/pdf" &&
          buf.subarray(0, 5).toString() === "%PDF-") ||
        (value.mime === "image/png" && signature === "89504e470d0a1a0a") ||
        (value.mime === "image/jpeg" && signature.startsWith("ffd8ff"))
      ))
        fail("Attachment contents do not match the file type.");
      value = {
        filename: String(value.filename || "document")
          .replace(/[^\w .()-]/g, "_")
          .slice(0, 120),
        mime: value.mime,
        blob: seal(value.content),
      };
    } else {
      if (typeof value !== "string") fail(`${f.label} must be text.`);
      value = value.trim();
      if (value.length > 10000) fail(`${f.label} is too long.`);
      if (f.type === "select" && !f.options.includes(value))
        fail(`Select a valid ${f.label}.`);
      if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
        fail("Enter a valid email address.");
      if (
        ["date", "month", "datetime-local"].includes(f.type) &&
        !Number.isFinite(Date.parse(value))
      )
        fail(`${f.label} is not a valid date.`);
    }
    data[f.name] = value;
  }
  for (const [start, end] of [
    ["startDate", "endDate"],
    ["periodStart", "periodEnd"],
    ["checkIn", "checkOut"],
    ["allocatedDate", "returnedDate"],
    ["resignationDate", "proposedLastDay"],
  ])
    if (data[start] && data[end] && data[end] < data[start])
      fail("The end date/time cannot precede the start date/time.");
  for (const field of ["days", "positions", "quantity"])
    if (field in data && !(data[field] > 0))
      fail(`${field} must be greater than zero.`);
  if (
    data.startDate &&
    data.endDate &&
    data.days >
      (Date.parse(data.endDate) - Date.parse(data.startDate)) / 86400000 + 1
  )
    fail("Leave days exceed the selected date range.");
  if (
    resource === "leave-requests" &&
    data.startDate?.slice(0, 4) !== data.endDate?.slice(0, 4)
  )
    fail("Split cross-year leave into one request per year.");
  if (
    data.year != null &&
    (!Number.isInteger(data.year) || data.year < 1900 || data.year > 2200)
  )
    fail("Enter a valid year.");
  for (const field of ["rating", "finalRating"])
    if (
      data[field] !== undefined &&
      data[field] !== null &&
      (data[field] < 0 || data[field] > 5)
    )
      fail("Ratings must be between 0 and 5.");
  if (resource === "attendance") {
    if (
      data.source === "GPS" &&
      (!Number.isFinite(data.latitude) || !Number.isFinite(data.longitude))
    )
      fail("GPS attendance requires location permission and coordinates.");
    if (
      (data.latitude != null && (data.latitude < -90 || data.latitude > 90)) ||
      (data.longitude != null &&
        (data.longitude < -180 || data.longitude > 180))
    )
      fail("Invalid GPS coordinates.");
    if (data.checkIn?.slice(0, 10) !== data.date)
      fail("Check-in must match the attendance date.");
    data.lateMinutes = data.scheduledStart
      ? Math.max(
          0,
          Math.round(
            (Date.parse(data.checkIn) - Date.parse(data.scheduledStart)) /
              60000,
          ),
        )
      : 0;
    data.earlyExitMinutes =
      data.checkOut && data.scheduledEnd
        ? Math.max(
            0,
            Math.round(
              (Date.parse(data.scheduledEnd) - Date.parse(data.checkOut)) /
                60000,
            ),
          )
        : 0;
  }
  if (["salary-structures", "payroll"].includes(resource)) {
    const cents = (names) =>
      names.reduce((sum, n) => sum + Math.round(Number(data[n] || 0) * 100), 0);
    const gross = cents(["basic", "allowances", "incentives", "bonus"]),
      deductions = cents([
        "pf",
        "esi",
        "professionalTax",
        "tds",
        "otherDeductions",
      ]);
    if (deductions > gross) fail("Deductions cannot exceed gross pay.");
    data.gross = gross / 100;
    data.deductions = deductions / 100;
    data.netPay = (gross - deductions) / 100;
  }
  if (resource === "evaluations")
    data.achievementPercent =
      data.target > 0
        ? Math.round(((data.achievement || 0) / data.target) * 10000) / 100
        : null;
  return data;
}
function publicData(data) {
  return Object.fromEntries(
    Object.entries(data).map(([k, v]) => [
      k,
      v?.blob ? { filename: v.filename, mime: v.mime } : v,
    ]),
  );
}
module.exports = {
  catalog,
  roles,
  isAdmin,
  hr,
  managers,
  finance,
  policy,
  seal,
  open,
  fail,
  validate,
  publicData,
};
