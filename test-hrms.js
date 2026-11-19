const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const express = require("express");
if (
  process.env.DB_HOST !== "127.0.0.1" ||
  !process.env.DB_NAME?.includes("test")
)
  throw Error("Isolated local test database required");
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "isolated-hrms-test-only";
process.env.HR_DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");
const db = require("./config/database"),
  M = require("./models"),
  H = require("./utils/hrms"),
  { generateToken } = require("./utils/jwt");
const stamp = Date.now(),
  created = [];
let server;
let checks = 0;
(async () => {
  await require("./config/initializeDatabase")();
  async function user(name, role, manager) {
    const u = await M.User.create({
      firstName: name,
      lastName: "HR Verification",
      fullName: name + " HR Verification",
      username: `hr-${stamp}-${name}`,
      email: `hr-${stamp}-${name}@pamsforce.com`,
      password: "isolated-unused-hashed-later",
      role: role || "Field Representative",
      reportingTo: manager || null,
      isActive: true,
    });
    created.push(u.id);
    return u;
  }
  const admin = await user("Admin", "admin"),
    hr = await user("HR"),
    finance = await user("Finance"),
    manager = await user("Manager", "Area Manager"),
    employee = await user("Employee", null, manager.id),
    outsider = await user("Outsider");
  await M.HRMembership.create({
    user_id: hr.id,
    role: "HR Executive",
    updated_by: admin.id,
  });
  await M.HRMembership.create({
    user_id: finance.id,
    role: "Finance",
    updated_by: admin.id,
  });
  const app = express();
  app.use(express.json({ limit: "10mb" }));
  app.use("/api/hrms", require("./routes/hrms.routes"));
  server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api/hrms`;
  const call = async (u, method, url, body, status = 200) => {
    const response = await fetch(base + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(u
          ? {
              Authorization:
                "Bearer " + generateToken({ id: u.id, email: u.email }),
            }
          : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data;
    const raw = await response.text();
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
    assert.equal(response.status, status, `${method} ${url}: ${raw}`);
    checks++;
    return data;
  };
  const create = (u, r, data, id = employee.id) =>
    call(u, "POST", "/records/" + r, { employee_id: id, data }, 201);
  const action = (u, r, row, act, status = 200) =>
    call(
      u,
      "POST",
      `/records/${r}/${row.id}/action`,
      {
        action: act,
        version: row.version,
        comment: "Verification",
        ...(act === "settle"
          ? { paymentReference: "LOCAL-VERIFICATION-ONLY" }
          : {}),
      },
      status,
    );
  const get = async (u, r, id) =>
    (await call(u, "GET", "/records/" + r)).find((row) => row.id === id);
  await call(null, "GET", "/meta", null, 401);
  assert.equal((await call(employee, "GET", "/meta")).role, "Employee");
  await call(
    employee,
    "POST",
    "/memberships/" + employee.id,
    { role: "HR Admin" },
    404,
  );
  await call(
    employee,
    "PUT",
    "/memberships/" + employee.id,
    { role: "HR Admin" },
    403,
  );
  await call(
    hr,
    "PUT",
    "/memberships/" + outsider.id,
    { role: "HR Admin" },
    403,
  );
  await call(
    employee,
    "POST",
    "/records/openings",
    { data: { title: "Forbidden" } },
    403,
  );
  await call(employee, "GET", `/employees/${outsider.id}/private`, null, 403);
  const p = {
    department: "Field Sales",
    joiningDate: "2026-11-01",
    employmentStatus: "Probation",
  };
  await call(admin, "PUT", `/employees/${employee.id}`, {
    profile: p,
    private: { pan: "ABCDE1234F", bankAccount: "1234567890" },
    version: 0,
  });
  const stored = await M.HREmployee.findOne({
    where: { user_id: employee.id },
  });
  assert.ok(!stored.private_data.includes("ABCDE1234F"));
  assert.equal(
    (await call(employee, "GET", `/employees/${employee.id}/private`)).pan,
    "ABCDE1234F",
  );
  await call(
    admin,
    "PUT",
    `/employees/${employee.id}`,
    { profile: p, version: 0 },
    409,
  );
  const attendance = {
    title: "Field attendance",
    date: "2026-11-19",
    source: "GPS",
    checkIn: "2026-11-19T09:15",
    checkOut: "2026-11-19T17:00",
    latitude: 20.29,
    longitude: 85.82,
    scheduledStart: "2026-11-19T09:00",
    scheduledEnd: "2026-11-19T17:30",
  };
  await call(
    employee,
    "POST",
    "/records/attendance",
    { employee_id: employee.id, data: { ...attendance, latitude: null } },
    400,
  );
  let a = await create(employee, "attendance", attendance);
  assert.equal(a.data.lateMinutes, 15);
  assert.equal(a.data.earlyExitMinutes, 30);
  await call(
    employee,
    "POST",
    "/records/attendance",
    { employee_id: employee.id, data: attendance },
    409,
  );
  assert.equal(
    (await call(outsider, "GET", "/records/attendance")).some(
      (r) => r.id === a.id,
    ),
    false,
  );
  await action(employee, "attendance", a, "submit");
  a = await get(employee, "attendance", a.id);
  await action(employee, "attendance", a, "approve", 403);
  await action(outsider, "attendance", a, "approve", 403);
  await action(manager, "attendance", a, "approve");
  const balance = await create(admin, "leave-balances", {
    title: "Casual leave",
    year: 2026,
    leaveType: "Casual",
    entitledDays: 2,
  });
  let leave = await create(employee, "leave-requests", {
    title: "Casual request",
    leaveType: "Casual",
    startDate: "2026-11-20",
    endDate: "2026-11-20",
    days: 1,
    reason: "Personal",
  });
  await action(employee, "leave-requests", leave, "submit");
  leave = await get(employee, "leave-requests", leave.id);
  await action(manager, "leave-requests", leave, "approve");
  const balances = await call(employee, "GET", "/leave-summary");
  assert.equal(
    balances.find(
      (r) => r.employee_id === employee.id && r.leaveType === "Casual",
    ).remaining,
    1,
  );
  let excessive = await create(employee, "leave-requests", {
    title: "Excessive request",
    leaveType: "Casual",
    startDate: "2026-11-21",
    endDate: "2026-11-23",
    days: 3,
    reason: "Personal",
  });
  await action(employee, "leave-requests", excessive, "submit");
  excessive = await get(employee, "leave-requests", excessive.id);
  await action(manager, "leave-requests", excessive, "approve", 409);
  let pay = await create(finance, "payroll", {
    title: "November salary",
    month: "2026-11",
    basic: 10000,
    allowances: 2000,
    pf: 1200,
    tds: 500,
  });
  assert.equal(pay.data.netPay, 10300);
  await action(finance, "payroll", pay, "submit");
  pay = await get(finance, "payroll", pay.id);
  await action(admin, "payroll", pay, "approve");
  pay = await get(finance, "payroll", pay.id);
  await action(finance, "payroll", pay, "settle");
  assert.ok(
    (await call(employee, "GET", "/records/payroll")).some(
      (r) => r.id === pay.id,
    ),
  );
  assert.ok(
    !(await call(manager, "GET", "/records/payroll")).some(
      (r) => r.id === pay.id,
    ),
  );
  const file = {
    filename: "policy.pdf",
    mime: "application/pdf",
    content: Buffer.from("%PDF-1.4\nHR verification").toString("base64"),
  };
  let doc = await create(employee, "documents", {
    title: "Policy acceptance",
    documentType: "Agreement",
    issueDate: "2026-11-19",
    document: file,
  });
  assert.ok(!doc.data.document.blob);
  const storedDoc = await M.HRRecord.findByPk(doc.id);
  assert.ok(!storedDoc.data.document.blob.includes(file.content));
  await call(
    outsider,
    "GET",
    `/records/documents/${doc.id}/file/document`,
    null,
    404,
  );
  const downloaded = await call(
    employee,
    "GET",
    `/records/documents/${doc.id}/file/document`,
  );
  assert.ok(downloaded.startsWith("%PDF-"));
  const asset = await create(
    hr,
    "asset-register",
    {
      title: "Verification laptop",
      assetType: "Laptop",
      assetCode: "HR-TEST-" + stamp,
      condition: "Good",
    },
    null,
  );
  let allocation = await create(hr, "asset-allocations", {
    title: "Laptop allocation",
    assetCode: asset.data.assetCode,
    allocatedDate: "2026-11-19",
    quantity: 1,
  });
  await action(hr, "asset-allocations", allocation, "submit");
  allocation = await get(admin, "asset-allocations", allocation.id);
  await action(admin, "asset-allocations", allocation, "approve");
  allocation = await get(admin, "asset-allocations", allocation.id);
  await action(hr, "asset-allocations", allocation, "complete", 400);
  await action(hr, "asset-allocations", allocation, "return");
  let movement = await create(hr, "movements", {
    title: "Designation change",
    changeType: "Designation Change",
    effectiveDate: "2026-11-01",
    newDesignation: "ABM",
    reason: "Approved change",
  });
  await action(hr, "movements", movement, "submit");
  movement = await get(admin, "movements", movement.id);
  await action(admin, "movements", movement, "approve");
  movement = await get(hr, "movements", movement.id);
  await action(hr, "movements", movement, "complete");
  assert.equal((await M.User.findByPk(employee.id)).employeeType, "ABM");
  const newEmployee = await call(
    admin,
    "POST",
    "/employees",
    {
      firstName: "New",
      lastName: "HR Verification",
      email: `new-hr-${stamp}@pamsforce.com`,
      password: "isolated-hr-initial-password",
      employeeType: "MR",
    },
    201,
  );
  created.push(newEmployee.id);
  assert.ok(newEmployee.employeeId.startsWith("PAMS-"));
  assert.ok(await M.HREmployee.findOne({ where: { user_id: newEmployee.id } }));
  const dashboard = await call(admin, "GET", "/dashboard");
  assert.ok(dashboard.totalEmployees >= 6);
  assert.ok("integration" in dashboard);
  let resignation = await create(employee, "resignations", {
    title: "Exit request",
    resignationDate: "2026-11-19",
    proposedLastDay: "2026-12-19",
    reason: "Personal",
  });
  await action(employee, "resignations", resignation, "submit");
  resignation = await get(hr, "resignations", resignation.id);
  await call(hr, "PUT", `/records/resignations/${resignation.id}`, {
    version: resignation.version,
    data: {
      ...resignation.data,
      clearanceComplete: true,
      assetsReturned: true,
      actualLastDay: "2026-11-19",
    },
  });
  resignation = await get(admin, "resignations", resignation.id);
  await action(admin, "resignations", resignation, "approve");
  resignation = await get(hr, "resignations", resignation.id);
  await action(hr, "resignations", resignation, "complete");
  await call(employee, "GET", "/meta", null, 401);
  console.log(
    `PASS: ${checks} HR API checks: scoped access, roles, encrypted identity and attachments, version conflicts, GPS attendance, leave balance, payroll, asset return, transfer and separation.`,
  );
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise((r) => server.close(r));
    if (created.length) {
      await M.HRRecord.destroy({ where: { created_by: created } });
      await M.HREmployee.destroy({ where: { user_id: created } });
      await M.HRMembership.destroy({ where: { user_id: created } });
      await M.User.destroy({ where: { id: created } });
    }
    await db.close();
  });
