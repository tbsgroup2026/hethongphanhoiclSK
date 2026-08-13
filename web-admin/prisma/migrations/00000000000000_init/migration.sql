-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorHex" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "issue_failure_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "part_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "pushToken" TEXT,
    "role" TEXT NOT NULL DEFAULT 'OPERATOR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "areaId" TEXT,
    CONSTRAINT "users_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "quality_issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT,
    "poCode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "areaId" TEXT,
    "teamId" TEXT,
    "productionLineId" TEXT,
    "failureCategoryId" TEXT,
    "investigationDeadline" DATETIME,
    "investigationLocked" BOOLEAN NOT NULL DEFAULT false,
    "rootCause" TEXT,
    "solution" TEXT,
    "rootCauseDecidedById" TEXT,
    "rootCauseDecidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "quality_issues_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "quality_issues_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_issues_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_issues_productionLineId_fkey" FOREIGN KEY ("productionLineId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_issues_failureCategoryId_fkey" FOREIGN KEY ("failureCategoryId") REFERENCES "issue_failure_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "quality_issues_rootCauseDecidedById_fkey" FOREIGN KEY ("rootCauseDecidedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "five_m_one_e_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "submitterRole" TEXT NOT NULL,
    "poCode" TEXT NOT NULL,
    "images" TEXT,
    "man" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "measurement" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "five_m_one_e_submissions_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "quality_issues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "five_m_one_e_submissions_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assigneeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptedAt" DATETIME,
    "completedAt" DATETIME,
    "repairDetail" TEXT,
    "partsReplaced" TEXT,
    "imagesBefore" TEXT,
    "imagesAfter" TEXT,
    "verifyDeadline" DATETIME,
    "lastVerifyPingAt" DATETIME,
    "verifiedStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" DATETIME,
    "verifiedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "maintenance_tasks_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "quality_issues" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_tasks_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_tasks_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "maintenance_tasks_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_type_name_key" ON "categories"("type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "users_employeeCode_key" ON "users"("employeeCode");

-- CreateIndex
CREATE UNIQUE INDEX "five_m_one_e_submissions_issueId_submitterId_key" ON "five_m_one_e_submissions"("issueId", "submitterId");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_tasks_issueId_key" ON "maintenance_tasks"("issueId");

