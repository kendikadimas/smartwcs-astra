-- CreateTable
CREATE TABLE "Warehouse" (
    "warehouseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("warehouseId")
);

-- CreateTable
CREATE TABLE "Zone" (
    "zoneId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "zoneType" TEXT NOT NULL,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("zoneId")
);

-- CreateTable
CREATE TABLE "Location" (
    "locationId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "nodeId" UUID,
    "code" TEXT NOT NULL,
    "locationType" TEXT NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("locationId")
);

-- CreateTable
CREATE TABLE "Node" (
    "nodeId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "x" DECIMAL(14,4) NOT NULL,
    "y" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("nodeId")
);

-- CreateTable
CREATE TABLE "Edge" (
    "edgeId" UUID NOT NULL,
    "fromNodeId" UUID NOT NULL,
    "toNodeId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Edge_pkey" PRIMARY KEY ("edgeId")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "equipmentId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "capabilities" JSONB NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("equipmentId")
);

-- CreateTable
CREATE TABLE "Robot" (
    "robotId" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "serialNumber" TEXT,
    "vendor" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,

    CONSTRAINT "Robot_pkey" PRIMARY KEY ("robotId")
);

-- CreateTable
CREATE TABLE "Station" (
    "stationId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "stationType" TEXT NOT NULL,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("stationId")
);

-- CreateTable
CREATE TABLE "Material" (
    "materialId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("materialId")
);

-- CreateTable
CREATE TABLE "Route" (
    "routeId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "fromLocationId" UUID NOT NULL,
    "toLocationId" UUID NOT NULL,
    "resourceType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("routeId")
);

-- CreateTable
CREATE TABLE "Task" (
    "taskId" UUID NOT NULL,
    "taskType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceLocationId" UUID NOT NULL,
    "destinationLocationId" UUID NOT NULL,
    "materialId" UUID,
    "containerId" TEXT,
    "quantity" DECIMAL(14,4),
    "priority" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "resourceType" TEXT,
    "assignedResourceId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMPTZ(3),
    "completedAt" TIMESTAMPTZ(3),
    "failureCode" TEXT,
    "externalRef" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("taskId")
);

-- CreateTable
CREATE TABLE "TaskStatusHistory" (
    "historyId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "reason" TEXT,
    "changedBy" UUID,
    "integrationLogId" UUID,
    "changedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "TaskStatusHistory_pkey" PRIMARY KEY ("historyId")
);

-- CreateTable
CREATE TABLE "TaskDetail" (
    "taskDetailId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "TaskDetail_pkey" PRIMARY KEY ("taskDetailId")
);

-- CreateTable
CREATE TABLE "Mission" (
    "missionId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "robotId" UUID NOT NULL,
    "externalMissionId" TEXT,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("missionId")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "assignmentId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("assignmentId")
);

-- CreateTable
CREATE TABLE "MaterialMovement" (
    "movementId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "fromLocationId" UUID NOT NULL,
    "toLocationId" UUID NOT NULL,
    "containerId" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "resourceType" TEXT,
    "resourceId" UUID,
    "movedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MaterialMovement_pkey" PRIMARY KEY ("movementId")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "inventoryId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "locationId" UUID NOT NULL,
    "containerId" TEXT,
    "quantity" DECIMAL(14,4) NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "lastSyncedAt" TIMESTAMPTZ(3),

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("inventoryId")
);

-- CreateTable
CREATE TABLE "MaterialRequest" (
    "requestId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "destinationLocationId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "taskId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaterialRequest_pkey" PRIMARY KEY ("requestId")
);

-- CreateTable
CREATE TABLE "Discrepancy" (
    "discrepancyId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "materialId" UUID,
    "expectedQuantity" DECIMAL(14,4) NOT NULL,
    "actualQuantity" DECIMAL(14,4) NOT NULL,
    "expectedLocationId" UUID,
    "actualLocationId" UUID,
    "status" TEXT NOT NULL,
    "detectedAt" TIMESTAMPTZ(3) NOT NULL,
    "notifiedAt" TIMESTAMPTZ(3),
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Discrepancy_pkey" PRIMARY KEY ("discrepancyId")
);

-- CreateTable
CREATE TABLE "Line" (
    "lineId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shiftCapacityUnit" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("lineId")
);

-- CreateTable
CREATE TABLE "ProductionPlan" (
    "planId" UUID NOT NULL,
    "lineId" UUID NOT NULL,
    "materialId" UUID NOT NULL,
    "shiftDate" DATE NOT NULL,
    "shiftNumber" INTEGER NOT NULL,
    "plannedQty" DECIMAL(14,4) NOT NULL,
    "source" TEXT NOT NULL,
    "syncedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProductionPlan_pkey" PRIMARY KEY ("planId")
);

-- CreateTable
CREATE TABLE "CustomerOrder" (
    "orderId" UUID NOT NULL,
    "customerName" TEXT NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "requestedDeliveryAt" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "ProductionLineRequest" (
    "requestId" UUID NOT NULL,
    "lineId" UUID NOT NULL,
    "requestType" TEXT NOT NULL,
    "materialId" UUID NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "requestedBy" UUID,
    "status" TEXT NOT NULL,
    "taskId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionLineRequest_pkey" PRIMARY KEY ("requestId")
);

-- CreateTable
CREATE TABLE "PackagingRequest" (
    "packagingRequestId" UUID NOT NULL,
    "materialId" UUID,
    "boxType" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "requestedBy" UUID,
    "status" TEXT NOT NULL,
    "taskId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackagingRequest_pkey" PRIMARY KEY ("packagingRequestId")
);

-- CreateTable
CREATE TABLE "DeliveryRequest" (
    "deliveryRequestId" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "taskId" UUID,
    "status" TEXT NOT NULL,
    "requestedBy" UUID,
    "dispatchedAt" TIMESTAMPTZ(3),
    "deliveredAt" TIMESTAMPTZ(3),

    CONSTRAINT "DeliveryRequest_pkey" PRIMARY KEY ("deliveryRequestId")
);

-- CreateTable
CREATE TABLE "Event" (
    "eventId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "errorCode" TEXT,
    "externalErrorId" TEXT,
    "externalLevel" TEXT,
    "integrationLogId" UUID,
    "payload" JSONB,
    "taskId" UUID,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "Alarm" (
    "alarmId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "acknowledgedBy" UUID,
    "acknowledgedAt" TIMESTAMPTZ(3),
    "clearedBy" UUID,
    "clearedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Alarm_pkey" PRIMARY KEY ("alarmId")
);

-- CreateTable
CREATE TABLE "EquipmentStatus" (
    "statusId" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "x" DECIMAL(14,4),
    "y" DECIMAL(14,4),
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "EquipmentStatus_pkey" PRIMARY KEY ("statusId")
);

-- CreateTable
CREATE TABLE "RobotStatus" (
    "statusId" UUID NOT NULL,
    "robotId" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "battery" DECIMAL(14,4) NOT NULL,
    "x" DECIMAL(14,4) NOT NULL,
    "y" DECIMAL(14,4) NOT NULL,
    "currentTaskId" UUID,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RobotStatus_pkey" PRIMARY KEY ("statusId")
);

-- CreateTable
CREATE TABLE "IntegrationLog" (
    "logId" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "direction" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "payload" JSONB NOT NULL,
    "traceId" TEXT,
    "messageType" TEXT NOT NULL,
    "robotId" UUID,
    "callbackCodeValid" BOOLEAN,
    "httpStatus" INTEGER,
    "responseCode" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ(3),
    "processedAt" TIMESTAMPTZ(3),
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "IntegrationLog_pkey" PRIMARY KEY ("logId")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "eventId" UUID NOT NULL,
    "integrationId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "sequence" BIGINT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMPTZ(3),

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("eventId")
);

-- CreateTable
CREATE TABLE "User" (
    "userId" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "roleId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Role" (
    "roleId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "auditId" UUID NOT NULL,
    "userId" UUID,
    "username" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" UUID,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("auditId")
);

-- CreateTable
CREATE TABLE "Integration" (
    "integrationId" UUID NOT NULL,
    "systemType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "endpointUrl" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "apiKeyHash" TEXT,
    "apiKeyRotatedAt" TIMESTAMPTZ(3),
    "status" TEXT NOT NULL,
    "lastTestedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("integrationId")
);

-- CreateTable
CREATE TABLE "PuduShop" (
    "puduShopId" UUID NOT NULL,
    "shopId" TEXT NOT NULL,
    "shopName" TEXT,
    "companyId" TEXT,
    "companyName" TEXT,
    "syncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduShop_pkey" PRIMARY KEY ("puduShopId")
);

-- CreateTable
CREATE TABLE "PuduRobotGroup" (
    "puduRobotGroupId" UUID NOT NULL,
    "groupId" TEXT NOT NULL,
    "groupName" TEXT,
    "puduShopId" UUID,
    "syncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduRobotGroup_pkey" PRIMARY KEY ("puduRobotGroupId")
);

-- CreateTable
CREATE TABLE "PuduRobot" (
    "puduRobotId" UUID NOT NULL,
    "robotId" UUID NOT NULL,
    "sn" TEXT NOT NULL,
    "mac" TEXT,
    "name" TEXT,
    "model" TEXT NOT NULL,
    "productCode" TEXT,
    "puduShopId" UUID,
    "puduRobotGroupId" UUID,
    "bindingStatus" TEXT NOT NULL,
    "boundAt" TIMESTAMPTZ(3),
    "unboundAt" TIMESTAMPTZ(3),
    "activatedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduRobot_pkey" PRIMARY KEY ("puduRobotId")
);

-- CreateTable
CREATE TABLE "PuduRobotState" (
    "puduRobotId" UUID NOT NULL,
    "online" BOOLEAN,
    "runState" TEXT,
    "moveState" TEXT,
    "chargeStage" TEXT,
    "chargeType" TEXT,
    "isCharging" INTEGER,
    "remainTime" INTEGER,
    "battery" INTEGER,
    "currentPuduMapId" UUID,
    "x" DECIMAL(14,4),
    "y" DECIMAL(14,4),
    "yaw" DECIMAL(14,4),
    "nearestPoint" TEXT,
    "currentPuduTaskId" UUID,
    "poseReportInterval" INTEGER,
    "poseReportTimes" INTEGER,
    "poseReportStartedAt" TIMESTAMPTZ(3),
    "emergencyRecoveredAt" TIMESTAMPTZ(3),
    "lastPoseAt" TIMESTAMPTZ(3),
    "vendorStatusAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduRobotState_pkey" PRIMARY KEY ("puduRobotId")
);

-- CreateTable
CREATE TABLE "PuduRobotStatusLog" (
    "statusLogId" BIGSERIAL NOT NULL,
    "puduRobotId" UUID NOT NULL,
    "integrationLogId" UUID,
    "source" TEXT NOT NULL,
    "online" BOOLEAN,
    "runState" TEXT,
    "moveState" TEXT,
    "chargeStage" TEXT,
    "battery" INTEGER,
    "isCharging" INTEGER,
    "remainTime" INTEGER,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduRobotStatusLog_pkey" PRIMARY KEY ("statusLogId")
);

-- CreateTable
CREATE TABLE "PuduMap" (
    "puduMapId" UUID NOT NULL,
    "warehouseId" UUID,
    "zoneId" UUID,
    "puduShopId" UUID NOT NULL,
    "mapName" TEXT NOT NULL,
    "mapCode" TEXT,
    "floor" TEXT,
    "imageUrl" TEXT,
    "width" DECIMAL(14,4),
    "height" DECIMAL(14,4),
    "resolution" DECIMAL(14,4),
    "originX" DECIMAL(14,4),
    "originY" DECIMAL(14,4),
    "originZ" DECIMAL(14,4),
    "zones" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastChangedAt" TIMESTAMPTZ(3),
    "syncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduMap_pkey" PRIMARY KEY ("puduMapId")
);

-- CreateTable
CREATE TABLE "PuduRobotMap" (
    "puduRobotId" UUID NOT NULL,
    "puduMapId" UUID NOT NULL,
    "isUsed" INTEGER NOT NULL,
    "syncedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduRobotMap_pkey" PRIMARY KEY ("puduRobotId","puduMapId")
);

-- CreateTable
CREATE TABLE "PuduMapElement" (
    "puduMapElementId" UUID NOT NULL,
    "puduMapId" UUID NOT NULL,
    "vendorElementId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "elementType" TEXT NOT NULL,
    "pointType" TEXT,
    "x" DECIMAL(14,4),
    "y" DECIMAL(14,4),
    "z" DECIMAL(14,4),
    "geometry" JSONB,
    "nodeId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMPTZ(3),
    "syncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduMapElement_pkey" PRIMARY KEY ("puduMapElementId")
);

-- CreateTable
CREATE TABLE "PuduTask" (
    "puduTaskId" UUID NOT NULL,
    "missionId" UUID,
    "puduRobotId" UUID NOT NULL,
    "previousPuduTaskId" UUID,
    "vendorTaskId" TEXT NOT NULL,
    "taskKind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "queueNo" INTEGER,
    "puduMapId" UUID,
    "targetPoint" TEXT,
    "pointType" TEXT,
    "callMode" TEXT,
    "priority" INTEGER,
    "deliverySort" TEXT,
    "deliveryMode" TEXT,
    "completeType" TEXT,
    "remark" TEXT,
    "isOverTime" BOOLEAN,
    "spentTime" INTEGER,
    "robotResponseCode" TEXT,
    "robotResponseMessage" TEXT,
    "requestPayload" JSONB,
    "vendorCreatedAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "lastNotifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduTask_pkey" PRIMARY KEY ("puduTaskId")
);

-- CreateTable
CREATE TABLE "PuduTaskStop" (
    "puduTaskStopId" UUID NOT NULL,
    "puduTaskId" UUID NOT NULL,
    "trayNo" INTEGER NOT NULL,
    "seq" INTEGER NOT NULL,
    "pointName" TEXT NOT NULL,
    "puduMapElementId" UUID,
    "puduMapId" UUID,
    "vendorStopId" TEXT,
    "destType" TEXT,
    "status" TEXT,
    "estimatedTime" INTEGER,
    "spendTime" INTEGER,
    "isTimeout" BOOLEAN,
    "completeType" TEXT,
    "arrivedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PuduTaskStop_pkey" PRIMARY KEY ("puduTaskStopId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Robot_equipmentId_key" ON "Robot"("equipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Robot_serialNumber_key" ON "Robot"("serialNumber");

-- CreateIndex
CREATE INDEX "Task_status_priority_idx" ON "Task"("status", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Task_source_externalRef_key" ON "Task"("source", "externalRef");

-- CreateIndex
CREATE INDEX "TaskStatusHistory_taskId_changedAt_idx" ON "TaskStatusHistory"("taskId", "changedAt");

-- CreateIndex
CREATE INDEX "Mission_taskId_idx" ON "Mission"("taskId");

-- CreateIndex
CREATE INDEX "Mission_robotId_status_idx" ON "Mission"("robotId", "status");

-- CreateIndex
CREATE INDEX "Event_sourceType_sourceId_occurredAt_idx" ON "Event"("sourceType", "sourceId", "occurredAt");

-- CreateIndex
CREATE INDEX "Event_externalErrorId_idx" ON "Event"("externalErrorId");

-- CreateIndex
CREATE INDEX "Event_taskId_idx" ON "Event"("taskId");

-- CreateIndex
CREATE INDEX "Alarm_status_idx" ON "Alarm"("status");

-- CreateIndex
CREATE INDEX "RobotStatus_robotId_recordedAt_idx" ON "RobotStatus"("robotId", "recordedAt");

-- CreateIndex
CREATE INDEX "IntegrationLog_status_nextAttemptAt_idx" ON "IntegrationLog"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "IntegrationLog_messageType_occurredAt_idx" ON "IntegrationLog"("messageType", "occurredAt");

-- CreateIndex
CREATE INDEX "IntegrationLog_robotId_occurredAt_idx" ON "IntegrationLog"("robotId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationLog_integrationId_direction_traceId_key" ON "IntegrationLog"("integrationId", "direction", "traceId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PuduShop_shopId_key" ON "PuduShop"("shopId");

-- CreateIndex
CREATE UNIQUE INDEX "PuduRobotGroup_groupId_key" ON "PuduRobotGroup"("groupId");

-- CreateIndex
CREATE INDEX "PuduRobotGroup_puduShopId_idx" ON "PuduRobotGroup"("puduShopId");

-- CreateIndex
CREATE UNIQUE INDEX "PuduRobot_robotId_key" ON "PuduRobot"("robotId");

-- CreateIndex
CREATE UNIQUE INDEX "PuduRobot_sn_key" ON "PuduRobot"("sn");

-- CreateIndex
CREATE INDEX "PuduRobot_puduShopId_idx" ON "PuduRobot"("puduShopId");

-- CreateIndex
CREATE INDEX "PuduRobot_puduRobotGroupId_idx" ON "PuduRobot"("puduRobotGroupId");

-- CreateIndex
CREATE INDEX "PuduRobotStatusLog_puduRobotId_recordedAt_idx" ON "PuduRobotStatusLog"("puduRobotId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PuduMap_puduShopId_mapName_key" ON "PuduMap"("puduShopId", "mapName");

-- CreateIndex
CREATE INDEX "PuduMapElement_nodeId_idx" ON "PuduMapElement"("nodeId");

-- CreateIndex
CREATE INDEX "PuduMapElement_puduMapId_name_idx" ON "PuduMapElement"("puduMapId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PuduMapElement_puduMapId_vendorElementId_key" ON "PuduMapElement"("puduMapId", "vendorElementId");

-- CreateIndex
CREATE UNIQUE INDEX "PuduTask_missionId_key" ON "PuduTask"("missionId");

-- CreateIndex
CREATE UNIQUE INDEX "PuduTask_vendorTaskId_key" ON "PuduTask"("vendorTaskId");

-- CreateIndex
CREATE INDEX "PuduTask_puduRobotId_status_idx" ON "PuduTask"("puduRobotId", "status");

-- CreateIndex
CREATE INDEX "PuduTask_createdAt_idx" ON "PuduTask"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PuduTaskStop_puduTaskId_trayNo_seq_key" ON "PuduTaskStop"("puduTaskId", "trayNo", "seq");

-- AddForeignKey
ALTER TABLE "Zone" ADD CONSTRAINT "Zone_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("warehouseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("zoneId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("nodeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Node" ADD CONSTRAINT "Node_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("zoneId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "Node"("nodeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edge" ADD CONSTRAINT "Edge_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "Node"("nodeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Robot" ADD CONSTRAINT "Robot_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("equipmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("zoneId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Station" ADD CONSTRAINT "Station_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("zoneId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sourceLocationId_fkey" FOREIGN KEY ("sourceLocationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskStatusHistory" ADD CONSTRAINT "TaskStatusHistory_integrationLogId_fkey" FOREIGN KEY ("integrationLogId") REFERENCES "IntegrationLog"("logId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDetail" ADD CONSTRAINT "TaskDetail_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("robotId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialMovement" ADD CONSTRAINT "MaterialMovement_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_destinationLocationId_fkey" FOREIGN KEY ("destinationLocationId") REFERENCES "Location"("locationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaterialRequest" ADD CONSTRAINT "MaterialRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discrepancy" ADD CONSTRAINT "Discrepancy_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discrepancy" ADD CONSTRAINT "Discrepancy_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discrepancy" ADD CONSTRAINT "Discrepancy_expectedLocationId_fkey" FOREIGN KEY ("expectedLocationId") REFERENCES "Location"("locationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discrepancy" ADD CONSTRAINT "Discrepancy_actualLocationId_fkey" FOREIGN KEY ("actualLocationId") REFERENCES "Location"("locationId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Line" ADD CONSTRAINT "Line_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("zoneId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("lineId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionPlan" ADD CONSTRAINT "ProductionPlan_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLineRequest" ADD CONSTRAINT "ProductionLineRequest_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("lineId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLineRequest" ADD CONSTRAINT "ProductionLineRequest_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLineRequest" ADD CONSTRAINT "ProductionLineRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionLineRequest" ADD CONSTRAINT "ProductionLineRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingRequest" ADD CONSTRAINT "PackagingRequest_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("materialId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingRequest" ADD CONSTRAINT "PackagingRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagingRequest" ADD CONSTRAINT "PackagingRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("orderId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryRequest" ADD CONSTRAINT "DeliveryRequest_requestedBy_fkey" FOREIGN KEY ("requestedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_integrationLogId_fkey" FOREIGN KEY ("integrationLogId") REFERENCES "IntegrationLog"("logId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("eventId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_acknowledgedBy_fkey" FOREIGN KEY ("acknowledgedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alarm" ADD CONSTRAINT "Alarm_clearedBy_fkey" FOREIGN KEY ("clearedBy") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentStatus" ADD CONSTRAINT "EquipmentStatus_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("equipmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RobotStatus" ADD CONSTRAINT "RobotStatus_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("robotId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RobotStatus" ADD CONSTRAINT "RobotStatus_currentTaskId_fkey" FOREIGN KEY ("currentTaskId") REFERENCES "Task"("taskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("integrationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationLog" ADD CONSTRAINT "IntegrationLog_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("robotId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("integrationId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("roleId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotGroup" ADD CONSTRAINT "PuduRobotGroup_puduShopId_fkey" FOREIGN KEY ("puduShopId") REFERENCES "PuduShop"("puduShopId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobot" ADD CONSTRAINT "PuduRobot_robotId_fkey" FOREIGN KEY ("robotId") REFERENCES "Robot"("robotId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobot" ADD CONSTRAINT "PuduRobot_puduShopId_fkey" FOREIGN KEY ("puduShopId") REFERENCES "PuduShop"("puduShopId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobot" ADD CONSTRAINT "PuduRobot_puduRobotGroupId_fkey" FOREIGN KEY ("puduRobotGroupId") REFERENCES "PuduRobotGroup"("puduRobotGroupId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotState" ADD CONSTRAINT "PuduRobotState_puduRobotId_fkey" FOREIGN KEY ("puduRobotId") REFERENCES "PuduRobot"("puduRobotId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotState" ADD CONSTRAINT "PuduRobotState_currentPuduMapId_fkey" FOREIGN KEY ("currentPuduMapId") REFERENCES "PuduMap"("puduMapId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotState" ADD CONSTRAINT "PuduRobotState_currentPuduTaskId_fkey" FOREIGN KEY ("currentPuduTaskId") REFERENCES "PuduTask"("puduTaskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotStatusLog" ADD CONSTRAINT "PuduRobotStatusLog_puduRobotId_fkey" FOREIGN KEY ("puduRobotId") REFERENCES "PuduRobot"("puduRobotId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotStatusLog" ADD CONSTRAINT "PuduRobotStatusLog_integrationLogId_fkey" FOREIGN KEY ("integrationLogId") REFERENCES "IntegrationLog"("logId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduMap" ADD CONSTRAINT "PuduMap_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("warehouseId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduMap" ADD CONSTRAINT "PuduMap_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("zoneId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduMap" ADD CONSTRAINT "PuduMap_puduShopId_fkey" FOREIGN KEY ("puduShopId") REFERENCES "PuduShop"("puduShopId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotMap" ADD CONSTRAINT "PuduRobotMap_puduRobotId_fkey" FOREIGN KEY ("puduRobotId") REFERENCES "PuduRobot"("puduRobotId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduRobotMap" ADD CONSTRAINT "PuduRobotMap_puduMapId_fkey" FOREIGN KEY ("puduMapId") REFERENCES "PuduMap"("puduMapId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduMapElement" ADD CONSTRAINT "PuduMapElement_puduMapId_fkey" FOREIGN KEY ("puduMapId") REFERENCES "PuduMap"("puduMapId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduMapElement" ADD CONSTRAINT "PuduMapElement_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("nodeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduTask" ADD CONSTRAINT "PuduTask_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("missionId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduTask" ADD CONSTRAINT "PuduTask_puduRobotId_fkey" FOREIGN KEY ("puduRobotId") REFERENCES "PuduRobot"("puduRobotId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduTask" ADD CONSTRAINT "PuduTask_previousPuduTaskId_fkey" FOREIGN KEY ("previousPuduTaskId") REFERENCES "PuduTask"("puduTaskId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduTask" ADD CONSTRAINT "PuduTask_puduMapId_fkey" FOREIGN KEY ("puduMapId") REFERENCES "PuduMap"("puduMapId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduTaskStop" ADD CONSTRAINT "PuduTaskStop_puduTaskId_fkey" FOREIGN KEY ("puduTaskId") REFERENCES "PuduTask"("puduTaskId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduTaskStop" ADD CONSTRAINT "PuduTaskStop_puduMapElementId_fkey" FOREIGN KEY ("puduMapElementId") REFERENCES "PuduMapElement"("puduMapElementId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PuduTaskStop" ADD CONSTRAINT "PuduTaskStop_puduMapId_fkey" FOREIGN KEY ("puduMapId") REFERENCES "PuduMap"("puduMapId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Partisi PuduPoseLog (lihat prisma/sql/pudu_pose_log_partition.sql)

CREATE TABLE "PuduPoseLog" (
    "poseLogId"    BIGSERIAL      NOT NULL,
    "puduRobotId"  UUID           NOT NULL,
    "puduMapId"    UUID,
    "x"            DECIMAL(14,4)  NOT NULL,
    "y"            DECIMAL(14,4)  NOT NULL,
    "z"            DECIMAL(14,4),
    "yaw"          DECIMAL(14,4),
    "nearestPoint" TEXT,
    "source"       TEXT           NOT NULL,
    "recordedAt"   TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "PuduPoseLog_pkey" PRIMARY KEY ("poseLogId", "recordedAt")
) PARTITION BY RANGE ("recordedAt");

CREATE INDEX "PuduPoseLog_puduRobotId_recordedAt_idx" ON "PuduPoseLog" ("puduRobotId", "recordedAt");

ALTER TABLE "PuduPoseLog"
    ADD CONSTRAINT "PuduPoseLog_puduRobotId_fkey" FOREIGN KEY ("puduRobotId")
        REFERENCES "PuduRobot" ("puduRobotId") ON DELETE RESTRICT ON UPDATE CASCADE,
    ADD CONSTRAINT "PuduPoseLog_puduMapId_fkey" FOREIGN KEY ("puduMapId")
        REFERENCES "PuduMap" ("puduMapId") ON DELETE SET NULL ON UPDATE CASCADE;

-- Partisi awal. Partisi bulan berikutnya dibuat oleh job terjadwal (cron / pg_partman)
-- sebelum bulan berjalan habis.
CREATE TABLE "PuduPoseLog_2026_10" PARTITION OF "PuduPoseLog"
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');
CREATE TABLE "PuduPoseLog_2026_11" PARTITION OF "PuduPoseLog"
    FOR VALUES FROM ('2026-11-01 00:00:00+00') TO ('2026-12-01 00:00:00+00');
CREATE TABLE "PuduPoseLog_2026_12" PARTITION OF "PuduPoseLog"
    FOR VALUES FROM ('2026-12-01 00:00:00+00') TO ('2027-01-01 00:00:00+00');

-- Retensi: hapus partisi yang lebih tua dari 90 hari dengan DROP TABLE partisinya
-- (jauh lebih cepat daripada DELETE baris per baris). Contoh:
--   DROP TABLE IF EXISTS "PuduPoseLog_2026_07";
