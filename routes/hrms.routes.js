const express = require("express");
const { Op } = require("sequelize");
const db = require("../config/database");
const {
  User,
  Headquarter,
  HREmployee,
  HRRecord,
  HRMembership,
  Sale,
  DayCall,
  Expense,
} = require("../models");
const { authenticate } = require("../middleware/auth");
const H = require("../utils/hrms");
const router = express.Router();
router.use(authenticate);
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch((e) => {
    console.error("HRMS:", e.message);
    res
      .status(e.status || 500)
      .json({
        message: e.status
          ? e.message
          : "Unable to process HR data. Please try again.",
      });
  });
router.use(
  wrap(async (req, res, next) => {
    const membership = await HRMembership.findOne({
      where: { user_id: req.user.id },
    });
    const role = H.isAdmin(req.user)
      ? "HR Admin"
      : membership?.role ||
        (["HR", "HR Admin", "HR Executive"].includes(req.user.role)
          ? req.user.role === "HR"
            ? "HR Executive"
            : req.user.role
          : req.user.role === "National Manager"
            ? "National Manager"
            : [
                  "Area Manager",
                  "Regional Manager",
                  "Zonal Manager",
                  "Finance",
                ].includes(req.user.role)
              ? req.user.role
              : "Employee");
    req.hrRole = role;
    const users = await User.findAll({
      attributes: ["id", "reportingTo", "assigned_manager_id"],
    });
    const ids = new Set([req.user.id]);
    if (H.managers(role)) {
      let changed = true;
      while (changed) {
        changed = false;
        for (const u of users)
          if (
            !ids.has(u.id) &&
            (ids.has(u.reportingTo) || ids.has(u.assigned_manager_id))
          ) {
            ids.add(u.id);
            changed = true;
          }
      }
    }
    req.hrScope = [...ids];
    next();
  }),
);
const access = (req, module, operation = "read") => {
  const p = H.policy(req.hrRole, module);
  if (!p[operation]) H.fail("Your HR role does not permit this action.", 403);
  return p;
};
const scope = (req, module) =>
  H.policy(req.hrRole, module).global
    ? {}
    : {
        employee_id: {
          [Op.in]: module === "payroll" ? [req.user.id] : req.hrScope,
        },
      };
const employeeAllowed = (req, module, id) =>
  H.policy(req.hrRole, module).global ||
  (module === "payroll" ? id === req.user.id : req.hrScope.includes(id));
const recordJson = (r) => ({ ...r.toJSON(), data: H.publicData(r.data) });
router.get(
  "/meta",
  wrap(async (req, res) => {
    res.json({
      ...H.catalog,
      role: req.hrRole,
      permissions: Object.fromEntries(
        ["employees", "reports", ...H.catalog.modules.map((m) => m.id)].map(
          (m) => [m, H.policy(req.hrRole, m)],
        ),
      ),
      roles: H.roles,
      canAssignRoles: H.isAdmin(req.user) || req.hrRole === "HR Admin",
      canGrantHrAdmin: H.isAdmin(req.user),
    });
  }),
);
const privateFields = ["aadhaar", "pan", "bankName", "bankAccount", "ifsc"];
const profileFields = [
  "department",
  "grade",
  "joiningDate",
  "confirmationDate",
  "employmentStatus",
  "emergencyName",
  "emergencyPhone",
  "address",
  "contactPhone",
  "photo",
  "zone",
  "region",
];
async function employees(req) {
  const p = access(req, "employees");
  const all = await User.findAll({
    where: p.global ? {} : { id: { [Op.in]: req.hrScope } },
    attributes: [
      "id",
      "firstName",
      "lastName",
      "fullName",
      "username",
      "email",
      "employeeId",
      "employeeType",
      "role",
      "hq_id",
      "reportingTo",
      "isActive",
    ],
  });
  const profiles = await HREmployee.findAll({
    where: { user_id: { [Op.in]: all.map((u) => u.id) } },
  });
  return all
    .filter(
      (u) =>
        !H.isAdmin(u) ||
        u.employeeId ||
        u.employeeType ||
        profiles.some((p) => p.user_id === u.id),
    )
    .map((u) => {
      const profile = profiles.find((p) => p.user_id === u.id);
      return {
        ...u.toJSON(),
        profile: profile?.profile || {},
        version: profile?.version || 0,
      };
    });
}
router.get(
  "/employees",
  wrap(async (req, res) => res.json(await employees(req))),
);
router.post(
  "/employees",
  wrap(async (req, res) => {
    if (!H.hr(req.hrRole))
      H.fail("HR employee maintenance permission is required.", 403);
    const {
      firstName,
      lastName,
      email,
      username,
      password,
      employeeType,
      hq_id,
      reportingTo,
    } = req.body;
    if (
      !String(firstName || "").trim() ||
      !String(lastName || "").trim() ||
      !/^\S+@\S+\.\S+$/.test(email || "") ||
      typeof password !== "string" ||
      password.length < 10
    )
      H.fail(
        "Enter employee name, valid email and an initial password of at least 10 characters.",
      );
    const role = {
      MR: "Field Representative",
      TBM: "Field Representative",
      ABM: "Area Manager",
      RBM: "Regional Manager",
      ZBM: "Zonal Manager",
      NSM: "National Manager",
      "HR Admin": "user",
      "HR Executive": "user",
      Finance: "user",
      Employee: "user",
      "Reporting Manager": "user",
    }[employeeType];
    if (!role) H.fail("Select a valid designation.");
    if (employeeType === "HR Admin" && !H.isAdmin(req.user))
      H.fail("Only the platform administrator can create HR Admin access.", 403);
    if (
      await User.findOne({
        where: {
          [Op.or]: [
            { email: String(email).toLowerCase() },
            { username: username || email },
          ],
        },
      })
    )
      H.fail("An employee with this email or username already exists.", 409);
    const hash = await require("../utils/password").hashPassword(password);
    const user = await db.transaction(async (transaction) => {
      if (hq_id && !(await Headquarter.findByPk(hq_id, { transaction })))
        H.fail("Select a valid HQ.");
      if (reportingTo && !(await User.findByPk(reportingTo, { transaction })))
        H.fail("Select a valid reporting manager.");
      const u = await User.create(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`,
          email: email.toLowerCase().trim(),
          username: username || email,
          password: hash,
          employeeType,
          role,
          hq_id: hq_id || null,
          reportingTo: reportingTo || null,
          assigned_manager_id: reportingTo || null,
          isActive: true,
        },
        { transaction },
      );
      await u.update(
        { employeeId: `PAMS-${String(u.id).padStart(5, "0")}` },
        { transaction },
      );
      await HREmployee.create(
        { user_id: u.id, profile: { employmentStatus: "Probation" } },
        { transaction },
      );
      if (["HR Admin", "HR Executive", "Finance", "Reporting Manager"].includes(employeeType))
        await HRMembership.create({user_id:u.id,role:employeeType,updated_by:req.user.id},{transaction});
      return u;
    });
    res
      .status(201)
      .json({
        id: user.id,
        employeeId: user.employeeId,
        message: "Employee created with a separate platform login.",
      });
  }),
);
router.get(
  "/headquarters",
  wrap(async (req, res) =>
    res.json(
      await Headquarter.findAll({
        attributes: ["id", "name", "zone", "region", "state"],
        where: { isActive: true },
      }),
    ),
  ),
);
router.get(
  "/employees/:id/private",
  wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!(H.hr(req.hrRole) || H.finance(req.hrRole) || id === req.user.id))
      H.fail("Private employee details are restricted.", 403);
    const p = await HREmployee.findOne({ where: { user_id: id } });
    res.json(H.open(p?.private_data));
  }),
);
router.put(
  "/employees/:id",
  wrap(async (req, res) => {
    if (!H.hr(req.hrRole))
      H.fail("HR employee maintenance permission is required.", 403);
    const id = Number(req.params.id);
    const user = await User.findByPk(id);
    if (!user) H.fail("Employee not found.", 404);
    const input = req.body.profile || {};
    const profile = {};
    for (const f of profileFields)
      if (input[f] !== undefined) {
        if (typeof input[f] !== "string" || input[f].length > 1000000)
          H.fail(`Invalid ${f}.`);
        profile[f] = input[f].trim();
      }
    if (
      profile.employmentStatus &&
      ![
        "Probation",
        "Confirmed",
        "Notice Period",
        "Resigned",
        "Terminated",
        "Retired",
      ].includes(profile.employmentStatus)
    )
      H.fail("Select a valid employment status.");
    for (const f of ["joiningDate", "confirmationDate"])
      if (profile[f] && !Number.isFinite(Date.parse(profile[f])))
        H.fail("Enter a valid employee date.");
    if (
      profile.confirmationDate &&
      profile.joiningDate &&
      profile.confirmationDate < profile.joiningDate
    )
      H.fail("Confirmation cannot precede joining.");
    if (
      profile.photo &&
      !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(profile.photo)
    )
      H.fail("Use a PNG or JPEG employee photo.");
    const secret = {};
    for (const f of privateFields)
      if (req.body.private?.[f] !== undefined) {
        if (
          typeof req.body.private[f] !== "string" ||
          req.body.private[f].length > 100
        )
          H.fail(`Invalid ${f}.`);
        secret[f] = req.body.private[f].trim();
      }
    if (secret.aadhaar && !/^\d{12}$/.test(secret.aadhaar.replace(/\s/g, "")))
      H.fail("Aadhaar must contain 12 digits.");
    if (secret.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(secret.pan))
      H.fail("Enter a valid PAN format.");
    await db.transaction(async (transaction) => {
      const [row] = await HREmployee.findOrCreate({
        where: { user_id: id },
        defaults: { profile: {} },
        transaction,
      });
      await row.reload({ transaction, lock: transaction.LOCK.UPDATE });
      if (
        Number(req.body.version) !== row.version &&
        !(
          Number(req.body.version) === 0 &&
          row.version === 1 &&
          Object.keys(row.profile).length === 0
        )
      )
        H.fail("Employee was updated by another user. Refresh and retry.", 409);
      await row.update(
        {
          profile: { ...row.profile, ...profile },
          ...(Object.keys(secret).length
            ? {
                private_data: H.seal({
                  ...H.open(row.private_data),
                  ...secret,
                }),
              }
            : {}),
          version: row.version + 1,
        },
        { transaction },
      );
    });
    res.json({ message: "Employee HR profile saved." });
  }),
);
router.get(
  "/memberships",
  wrap(async (req, res) => {
    if (!(H.isAdmin(req.user) || req.hrRole === "HR Admin"))
      H.fail("HR administrator permission required.", 403);
    res.json(await HRMembership.findAll());
  }),
);
router.put(
  "/memberships/:id",
  wrap(async (req, res) => {
    if (!(H.isAdmin(req.user) || req.hrRole === "HR Admin"))
      H.fail("HR administrator permission required.", 403);
    const id = Number(req.params.id),
      role = req.body.role;
    if (!H.roles.includes(role)) H.fail("Unknown HR role.");
    const target = await User.findByPk(id);
    if (!target || H.isAdmin(target))
      H.fail("Select a non-administrator employee.");
    if (id === req.user.id || (role === "HR Admin" && !H.isAdmin(req.user)))
      H.fail(
        "Only the platform administrator can grant HR Admin; self role changes are prohibited.",
        403,
      );
    const [row] = await HRMembership.findOrCreate({
      where: { user_id: id },
      defaults: { role, updated_by: req.user.id },
    });
    await row.update({ role, updated_by: req.user.id });
    res.json({ message: "HR role assigned." });
  }),
);
router.get(
  "/records/:resource",
  wrap(async (req, res) => {
    const spec = H.catalog.resources[req.params.resource];
    if (!spec) H.fail("Unknown HR register.", 404);
    access(req, spec.module);
    const globalReference = [
      "holidays",
      "courses",
      "training-calendar",
    ].includes(req.params.resource);
    res.json(
      (
        await HRRecord.findAll({
          where: {
            resource: req.params.resource,
            archived: false,
            ...(globalReference ? {} : scope(req, spec.module)),
          },
          order: [["id", "DESC"]],
          limit: 2000,
        })
      ).map(recordJson),
    );
  }),
);
function restrictedFields(req, resource, data, existing = {}) {
  if (!H.hr(req.hrRole) && !H.managers(req.hrRole))
    for (const f of [
      "actualLastDay",
      "managerReview",
      "finalRating",
      "promotionRecommendation",
      "incrementRecommendation",
      "score",
      "passMark",
      "certificate",
      "clearanceComplete",
      "finalSettlement",
      "experienceLetter",
      "relievingLetter",
    ])
      if (
        data[f] != null &&
        JSON.stringify(data[f]) !== JSON.stringify(existing[f])
      )
        H.fail(
          "Only an authorized reviewer can set review, assessment or clearance fields.",
          403,
        );
  if (!H.hr(req.hrRole) && !H.finance(req.hrRole))
    for (const f of ["settlementDate", "paymentReference"])
      if (data[f] && data[f] !== existing[f])
        H.fail("Only HR or Finance can record settlement details.", 403);
}
router.post(
  "/records/:resource",
  wrap(async (req, res) => {
    const resource = req.params.resource,
      spec = H.catalog.resources[resource];
    if (!spec) H.fail("Unknown HR register.", 404);
    const p = access(req, spec.module, "write");
    if (!p.global && !spec.selfService)
      H.fail("This register is maintained by HR.", 403);
    const employee_id = Number(req.body.employee_id) || null;
    if (
      !employee_id &&
      ![
        "holidays",
        "courses",
        "training-calendar",
        "openings",
        "requisitions",
        "candidates",
        "interviews",
        "offers",
        "background-checks",
        "joining-tracker",
        "asset-register",
      ].includes(resource)
    )
      H.fail("Select an employee.");
    if (!p.global && employee_id !== req.user.id)
      H.fail("Create requests only for yourself.", 403);
    if (employee_id && !(await User.findByPk(employee_id)))
      H.fail("Employee not found.");
    const data = H.validate(resource, req.body.data || {});
    restrictedFields(req, resource, data);
    const row = await db.transaction(async (transaction) => {
      await db.query("SELECT pg_advisory_xact_lock(724631907)", {
        transaction,
      });
      if (
        ["attendance", "payroll", "leave-balances", "asset-register"].includes(
          resource,
        )
      ) {
        const key = {
          attendance: "date",
          payroll: "month",
          "leave-balances": "year",
          "asset-register": "assetCode",
        }[resource];
        const existing = await HRRecord.findAll({
          where: {
            resource,
            ...(resource === "asset-register" ? {} : { employee_id }),
            archived: false,
          },
          transaction,
        });
        if (
          existing.some(
            (r) =>
              r.data[key] === data[key] &&
              (resource !== "leave-balances" ||
                r.data.leaveType === data.leaveType),
          )
        )
          H.fail(
            "An entry already exists for this employee and period/code.",
            409,
          );
      }
      if (resource === "asset-allocations") {
        const assets = await HRRecord.findAll({
          where: { resource: "asset-register", archived: false },
          transaction,
        });
        if (!assets.some((r) => r.data.assetCode === data.assetCode))
          H.fail("Register the asset before allocating it.");
        const allocated = await HRRecord.findAll({
          where: { resource, archived: false },
          transaction,
        });
        if (
          allocated.some(
            (r) =>
              r.data.assetCode === data.assetCode &&
              !r.data.returnedDate &&
              r.status !== "rejected",
          )
        )
          H.fail("This asset has an outstanding allocation.", 409);
      }
      return HRRecord.create(
        {
          resource,
          employee_id,
          data,
          created_by: req.user.id,
          history: [
            {
              action: "created",
              by: req.user.id,
              name:
                req.user.fullName ||
                `${req.user.firstName} ${req.user.lastName}`,
              at: new Date().toISOString(),
            },
          ],
        },
        { transaction },
      );
    });
    res.status(201).json(recordJson(row));
  }),
);
router.put(
  "/records/:resource/:id",
  wrap(async (req, res) => {
    const spec = H.catalog.resources[req.params.resource];
    if (!spec) H.fail("Unknown HR register.", 404);
    access(req, spec.module, "write");
    await db.transaction(async (transaction) => {
      const row = await HRRecord.findOne({
        where: {
          id: req.params.id,
          resource: req.params.resource,
          archived: false,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) H.fail("HR record not found.", 404);
      if (!employeeAllowed(req, spec.module, row.employee_id))
        H.fail("This employee is outside your reporting scope.", 403);
      const review = H.policy(req.hrRole, spec.module).review;
      if (!H.hr(req.hrRole) && row.created_by !== req.user.id && !review)
        H.fail("You cannot edit this record.", 403);
      if (
        !["draft", "rejected"].includes(row.status) &&
        !(row.status === "submitted" && review)
      )
        H.fail(
          "Only draft/rejected records or a reviewer assessment can be edited.",
          409,
        );
      if (Number(req.body.version) !== row.version)
        H.fail("Record changed. Refresh and retry.", 409);
      const data = H.validate(row.resource, req.body.data || {}, row.data);
      restrictedFields(req, row.resource, data, row.data);
      if (
        ["attendance", "payroll", "leave-balances", "asset-register"].includes(
          row.resource,
        )
      ) {
        const key = {
          attendance: "date",
          payroll: "month",
          "leave-balances": "year",
          "asset-register": "assetCode",
        }[row.resource];
        const others = await HRRecord.findAll({
          where: {
            resource: row.resource,
            archived: false,
            id: { [Op.ne]: row.id },
            ...(row.resource === "asset-register"
              ? {}
              : { employee_id: row.employee_id }),
          },
          transaction,
        });
        if (
          others.some(
            (r) =>
              r.data[key] === data[key] &&
              (row.resource !== "leave-balances" ||
                r.data.leaveType === data.leaveType),
          )
        )
          H.fail("Another entry already exists for this period or code.", 409);
      }
      if (row.status === "submitted")
        for (const f of spec.fields.filter(
          (f) =>
            ![
              "actualLastDay",
              "managerReview",
              "finalRating",
              "promotionRecommendation",
              "incrementRecommendation",
              "score",
              "passMark",
              "certificate",
              "clearanceComplete",
              "assetsReturned",
              "exitInterview",
              "finalSettlement",
              "experienceLetter",
              "relievingLetter",
              "employeeResponse",
              "actionTaken",
            ].includes(f.name),
        ))
          if (JSON.stringify(data[f.name]) !== JSON.stringify(row.data[f.name]))
            H.fail(
              "Return the request before changing submitted details.",
              409,
            );
      await row.update(
        {
          data,
          version: row.version + 1,
          history: [
            ...row.history,
            {
              action: "updated",
              by: req.user.id,
              name:
                req.user.fullName ||
                `${req.user.firstName} ${req.user.lastName}`,
              at: new Date().toISOString(),
            },
          ],
        },
        { transaction },
      );
    });
    res.json({ message: "HR record saved." });
  }),
);
async function leaveRemaining(employee, year, type, transaction) {
  const rows = await HRRecord.findAll({
    where: {
      employee_id: employee,
      archived: false,
      resource: {
        [Op.in]: [
          "leave-balances",
          "leave-requests",
          "encashments",
          "comp-off",
        ],
      },
    },
    transaction,
  });
  const balance = rows.find(
    (r) =>
      r.resource === "leave-balances" &&
      Number(r.data.year) === year &&
      r.data.leaveType === type,
  );
  if (!balance) return null;
  const used = rows
    .filter(
      (r) =>
        ["approved", "settled", "completed"].includes(r.status) &&
        r.resource !== "leave-balances" &&
        r.data.leaveType === type &&
        Number(
          (r.data.startDate || r.data.date || r.createdAt.toISOString()).slice(
            0,
            4,
          ),
        ) === year,
    )
    .reduce((s, r) => s + Number(r.data.days || 0), 0);
  const comp =
    type === "Comp Off"
      ? rows
          .filter(
            (r) =>
              r.resource === "comp-off" &&
              r.status === "approved" &&
              Number(r.data.workedDate.slice(0, 4)) === year,
          )
          .reduce((s, r) => s + Number(r.data.days || 0), 0)
      : 0;
  return (
    Number(balance.data.entitledDays || 0) +
    Number(balance.data.openingDays || 0) +
    comp -
    used
  );
}
router.post(
  "/records/:resource/:id/action",
  wrap(async (req, res) => {
    const spec = H.catalog.resources[req.params.resource];
    if (!spec) H.fail("Unknown HR register.", 404);
    access(req, spec.module);
    await db.transaction(async (transaction) => {
      await db.query("SELECT pg_advisory_xact_lock(724631907)", {
        transaction,
      });
      const row = await HRRecord.findOne({
        where: {
          id: req.params.id,
          resource: req.params.resource,
          archived: false,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!row) H.fail("HR record not found.", 404);
      if (!employeeAllowed(req, spec.module, row.employee_id))
        H.fail("Outside your employee scope.", 403);
      if (Number(req.body.version) !== row.version)
        H.fail("Record changed. Refresh and retry.", 409);
      const { action } = req.body;
      let status;
      if (
        action === "submit" &&
        ["draft", "rejected"].includes(row.status) &&
        row.created_by === req.user.id
      )
        status = "submitted";
      else if (
        ["approve", "reject"].includes(action) &&
        row.status === "submitted"
      ) {
        access(req, spec.module, "review");
        if (row.employee_id === req.user.id || row.created_by === req.user.id)
          H.fail("An independent reviewer must approve this request.", 403);
        status = action === "approve" ? "approved" : "rejected";
        if (action === "reject" && !String(req.body.comment || "").trim())
          H.fail("Give a reason for rejection.");
        if (
          action === "approve" &&
          ["leave-requests", "encashments"].includes(row.resource) &&
          row.data.leaveType !== "Unpaid"
        ) {
          const year = Number(
            (row.data.startDate || row.createdAt.toISOString()).slice(0, 4),
          );
          const remaining = await leaveRemaining(
            row.employee_id,
            year,
            row.data.leaveType,
            transaction,
          );
          if (remaining === null || remaining < row.data.days)
            H.fail("Configure sufficient leave balance before approval.", 409);
        }
      } else if (
        action === "settle" &&
        row.status === "approved" &&
        ["payroll", "claims", "encashments"].includes(row.resource)
      ) {
        if (!(H.finance(req.hrRole) || req.hrRole === "HR Admin"))
          H.fail("Finance settlement permission required.", 403);
        if (
          typeof req.body.paymentReference !== "string" ||
          !req.body.paymentReference.trim()
        )
          H.fail("A payment reference is required to settle this record.");
        await row.update(
          {
            data: {
              ...row.data,
              paymentReference: req.body.paymentReference.trim().slice(0, 150),
              [row.resource === "payroll" ? "paymentDate" : "settlementDate"]:
                new Date().toISOString().slice(0, 10),
            },
          },
          { transaction },
        );
        status = "settled";
      } else if (
        action === "return" &&
        row.status === "approved" &&
        row.resource === "asset-allocations" &&
        H.hr(req.hrRole)
      ) {
        await row.update(
          {
            data: {
              ...row.data,
              returnedDate: new Date().toISOString().slice(0, 10),
            },
          },
          { transaction },
        );
        status = "completed";
      } else if (
        action === "complete" &&
        row.status === "approved" &&
        H.hr(req.hrRole) &&
        !["payroll", "claims", "encashments"].includes(row.resource)
      ) {
        if (row.resource === "asset-allocations" && !row.data.returnedDate)
          H.fail("Use Return asset to record its return before completion.");
        status = "completed";
        if (row.resource === "movements") {
          if (row.data.effectiveDate > new Date().toISOString().slice(0, 10))
            H.fail("The movement is not effective yet.", 409);
          const changes = {};
          if (row.data.newHqId) {
            if (
              !(await Headquarter.findByPk(row.data.newHqId, { transaction }))
            )
              H.fail("HQ not found.");
            changes.hq_id = row.data.newHqId;
            changes.territory_id = null;
          }
          if (row.data.newManagerId) {
            if (row.data.newManagerId === row.employee_id)
              H.fail("An employee cannot report to themselves.");
            const all = await User.findAll({ transaction });
            let next = row.data.newManagerId;
            const visited = new Set();
            while (next) {
              if (next === row.employee_id || visited.has(next))
                H.fail("Reporting changes cannot create a cycle.");
              visited.add(next);
              next = all.find((u) => u.id === next)?.reportingTo;
            }
            if (!all.some((u) => u.id === row.data.newManagerId && u.isActive))
              H.fail("Select an active manager.");
            changes.reportingTo = row.data.newManagerId;
            changes.assigned_manager_id = row.data.newManagerId;
          }
          if (row.data.newDesignation) {
            changes.employeeType = row.data.newDesignation;
            changes.role = {
              MR: "Field Representative",
              TBM: "Field Representative",
              ABM: "Area Manager",
              RBM: "Regional Manager",
              ZBM: "Zonal Manager",
              NSM: "National Manager",
            }[row.data.newDesignation];
          }
          await User.update(changes, {
            where: { id: row.employee_id },
            transaction,
          });
        }
        if (
          row.resource === "induction" &&
          ![
            "documentsVerified",
            "policyAccepted",
            "assetsAllocated",
            "inductionCompleted",
          ].every((f) => row.data[f])
        )
          H.fail(
            "Complete document verification, policy acceptance, asset allocation and induction before closing onboarding.",
          );
        if (row.resource === "resignations") {
          const lastDay = row.data.actualLastDay || row.data.proposedLastDay;
          if (lastDay > new Date().toISOString().slice(0, 10))
            H.fail(
              "The approved last working day has not arrived. Record an approved early release date if applicable.",
              409,
            );
          if (!row.data.clearanceComplete || !row.data.assetsReturned)
            H.fail(
              "Complete clearance and asset returns before closing separation.",
            );
          const assets = await HRRecord.findAll({
            where: {
              resource: "asset-allocations",
              employee_id: row.employee_id,
              archived: false,
            },
            transaction,
          });
          if (assets.some((r) => !r.data.returnedDate))
            H.fail("Outstanding allocated assets must be returned.");
          await User.update(
            { isActive: false },
            { where: { id: row.employee_id }, transaction },
          );
          const [profile] = await HREmployee.findOrCreate({
            where: { user_id: row.employee_id },
            defaults: { profile: {} },
            transaction,
          });
          await profile.update(
            {
              profile: {
                ...profile.profile,
                employmentStatus: "Resigned",
                lastWorkingDay: lastDay,
              },
              version: profile.version + 1,
            },
            { transaction },
          );
        }
      } else if (
        action === "archive" &&
        row.status === "draft" &&
        (row.created_by === req.user.id || H.hr(req.hrRole))
      ) {
        await row.update(
          {
            archived: true,
            version: row.version + 1,
            history: [
              ...row.history,
              {
                action,
                by: req.user.id,
                name:
                  req.user.fullName ||
                  `${req.user.firstName} ${req.user.lastName}`,
                at: new Date().toISOString(),
              },
            ],
          },
          { transaction },
        );
        return;
      } else
        H.fail(
          "This action is not available for the current record status.",
          409,
        );
      await row.update(
        {
          status,
          version: row.version + 1,
          history: [
            ...row.history,
            {
              action,
              by: req.user.id,
              name:
                req.user.fullName ||
                `${req.user.firstName} ${req.user.lastName}`,
              at: new Date().toISOString(),
              comment: String(req.body.comment || "").slice(0, 1000),
            },
          ],
        },
        { transaction },
      );
    });
    res.json({ message: "Workflow updated." });
  }),
);
router.get(
  "/records/:resource/:id/file/:field",
  wrap(async (req, res) => {
    const spec = H.catalog.resources[req.params.resource];
    if (!spec) H.fail("Unknown register.", 404);
    access(req, spec.module);
    const row = await HRRecord.findOne({
      where: {
        id: req.params.id,
        resource: req.params.resource,
        archived: false,
      },
    });
    if (
      !row ||
      !(
        ["courses", "training-calendar", "holidays"].includes(
          req.params.resource,
        ) || employeeAllowed(req, spec.module, row.employee_id)
      )
    )
      H.fail("Document not found.", 404);
    const file = row.data[req.params.field];
    if (!file?.blob) H.fail("Attachment not found.", 404);
    res.set("Cache-Control", "no-store");
    res.type(file.mime);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);
    res.send(Buffer.from(H.open(file.blob), "base64"));
  }),
);
router.get(
  "/leave-summary",
  wrap(async (req, res) => {
    access(req, "leave");
    const rows = await HRRecord.findAll({
      where: {
        resource: "leave-balances",
        archived: false,
        ...scope(req, "leave"),
      },
    });
    const result = [];
    for (const row of rows)
      result.push({
        employee_id: row.employee_id,
        ...row.data,
        remaining: await leaveRemaining(
          row.employee_id,
          Number(row.data.year),
          row.data.leaveType,
        ),
      });
    res.json(result);
  }),
);
router.get(
  "/dashboard",
  wrap(async (req, res) => {
    const staff = await employees(req);
    const permissions = H.policy(req.hrRole, "reports");
    const rows = await HRRecord.findAll({
      where: {
        archived: false,
        ...(permissions.global
          ? {}
          : { employee_id: { [Op.in]: req.hrScope } }),
      },
      attributes: ["resource", "employee_id", "data", "status", "createdAt"],
    });
    const allowed = rows.filter((r) => {
      const module = H.catalog.resources[r.resource]?.module;
      return (
        H.policy(req.hrRole, module).read &&
        (module !== "payroll" ||
          H.policy(req.hrRole, module).global ||
          r.employee_id === req.user.id)
      );
    });
    const now = new Date(),
      month = now.toISOString().slice(0, 7);
    const count = (type, pred = () => true) =>
      allowed.filter((r) => r.resource === type && pred(r)).length;
    const current = (type) =>
      allowed.filter(
        (r) =>
          r.resource === type &&
          (r.data.month === month ||
            String(r.data.date || r.data.startDate || "").startsWith(month)),
      );
    const ratings = allowed.filter(
      (r) =>
        r.resource === "evaluations" &&
        ["approved", "completed"].includes(r.status) &&
        r.data.finalRating != null,
    );
    const where = permissions.global
      ? {}
      : { userId: { [Op.in]: req.hrScope } };
    const [sales, calls, expenses] = await Promise.all([
      Sale.sum("totalAmount", { where }),
      DayCall.count({ where }),
      Expense.count({
        where: permissions.global ? {} : { user_id: { [Op.in]: req.hrScope } },
      }),
    ]);
    res.json({
      totalEmployees: staff.length,
      activeEmployees: staff.filter((u) => u.isActive).length,
      newJoinings: staff.filter((u) => u.profile.joiningDate?.startsWith(month))
        .length,
      resignations: count("resignations", (r) =>
        r.data.resignationDate?.startsWith(month),
      ),
      vacantPositions: allowed
        .filter((r) => r.resource === "openings" && r.status === "approved")
        .reduce((s, r) => s + Number(r.data.positions || 0), 0),
      attendance: current("attendance").length,
      leaveRequests: current("leave-requests").length,
      pendingTraining: count(
        "training-history",
        (r) => !["approved", "completed"].includes(r.status),
      ),
      performanceRating: ratings.length
        ? ratings.reduce((s, r) => s + Number(r.data.finalRating), 0) /
          ratings.length
        : null,
      payroll: H.policy(req.hrRole, "payroll").read
        ? {
            pending: current("payroll").filter((r) => r.status !== "settled")
              .length,
            settled: current("payroll").filter((r) => r.status === "settled")
              .length,
          }
        : null,
      pending: allowed.filter((r) => r.status === "submitted").length,
      counts: Object.fromEntries(
        Object.keys(H.catalog.resources).map((k) => [k, count(k)]),
      ),
      integration: {
        salesAmount: Number(sales || 0),
        doctorCallRecords: calls,
        sfaExpenseRecords: expenses,
      },
      recent: allowed
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8)
        .map((r) => ({
          resource: r.resource,
          title: r.data.title,
          status: r.status,
        })),
    });
  }),
);
module.exports = router;
