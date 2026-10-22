# Kutipan dokumentasi resmi PUDU Open Platform

> Disalin dari https://open.pudutech.com/en/cloud-api (diambil 2026-10-22 oleh tim).
> Ini sumber kebenaran untuk API PUDU. Kalau `docs/PUDU_INTEGRATION.md` berbeda dengan file ini, file ini yang benar.
> Dokumen PUDU punya filter kategori robot (Commercial Delivery, Commercial Cleaning, Industrial Delivery). T600 = Industrial Delivery.
> Tabel status/error `CLEANBOT_*` dan "Cleaning Robot Status Codes" di halaman Error Codes khusus robot pembersih; jangan dipakai untuk T600 tanpa konfirmasi PUDU.

## A. Panduan umum (ringkasan dari Overview, Quick Start, Authentication Access, Error Codes)

- Base URL produksi: Overseas `https://css-open-platform.pudutech.com/pudu-entry`, China `https://open-platform.pudutech.com/pudu-entry`, Germany `https://csg-open-platform.pudutech.com/pudu-entry`, US `https://csu-open-platform.pudutech.com/pudu-entry`. Contoh kode menyebut lingkungan test `open-platform-test.pudutech.com` (belum dikonfirmasi tersedia untuk kita).
- ApiAppKey/ApiAppSecret diajukan lewat platform distributor PUDU (Application Center -> Open Platform) atau merchant, direview PUDU Regional Technical Support Lead.
- Signing string: 6 baris dipisah `\n`, tanpa `\n` di akhir:
  `x-date: <GMT>` / HTTPMethod (huruf besar) / Accept / Content-Type / Content-MD5 / PathAndParameters.
  - Content-MD5 = Base64( hex( MD5(body UTF-8) ) ) -- yaitu base64 dari STRING hex, bukan dari byte digest. Hanya untuk request dengan body non-form.
  - PathAndParameters: path tanpa prefix environment (`/release`, `/test`, `/prepub`), query diurutkan leksikografis, parameter tanpa nilai ditulis key saja (tanpa `=`), nilai array diurutkan dan digabung koma, tanpa `?` kalau tidak ada query. Untuk GET, query di-decode (decodeURIComponent) sebelum masuk signing string.
  - Signature = Base64(HMAC-SHA1(signing_str, ApiAppSecret)).
  - Header `Authorization: hmac id="<ApiAppKey>", algorithm="hmac-sha1", headers="x-date", signature="<sig>"`. Header lain: Host, Accept (set eksplisit `application/json`), Content-Type, x-date, Content-MD5.
  - x-date kedaluwarsa setelah 900 detik. Saat verifikasi gagal, gateway membalas 401 dan menyertakan StringToSign milik server di header respons.
  - Contoh signing string resmi (form request, header `source` dan `x-date` ikut ditandatangani):
    ```
    source: apigw test
    x-date: Thu, 11 Mar 2021 08:29:58 GMT
    POST
    application/json
    application/x-www-form-urlencoded


    /?p=test
    ```
  - Contoh body resmi untuk healthCheck: path `/pudu-entry/data-open-platform-service/v1/api/healthCheck`, body `{"b":"2","a":"###Special Character Test","c":"3"}`.
- Callback: POST ke URL kita, header `Content-Type: application/json`, `TraceId` (ID unik request callback), `CallbackCode` (rahasia 32 byte dari PUDU). Body `{ "callback_type": "...", "data": {...} }`. HTTP 200 = sukses. Timeout 5 detik, gagal di-retry maksimal 3 kali. Callback harus diajukan/dikonfigurasi dulu, default tidak dikirim.
- Envelope respons Open API: `{ "trace_id", "message", "data" }`. `message` = `"SUCCESS"` jika sukses, selain itu berisi kode error.
- Kode error umum (bukan khusus pembersih) yang relevan: `SUCCESS`, `PARAM_ERROR`, `SYSTEM_ERROR`, `CLOUD_OPEN_UNKNOW_ERROR`, `CLOUD_OPEN_ROBOT_PARAM_ERROR`, `CLOUD_OPEN_WAIT`, `CLOUD_OPEN_ROBOT_UNREGISTER`, `CLOUD_OPEN_TIMEOUT`, `CLOUD_OPEN_IOT_SEND_ERROR`, `CLOUD_OPEN_ROBOT_INFO_ERROR`, `CLOUD_OPEN_ROBOT_NOT_EXISTS`, `CLOUD_OPEN_GET_STATUS_ERROR`, `CLOUD_OPEN_ROBOT_OFFLINE`, `CLOUD_OPEN_CANNOT_SCHEDULE`, `CLOUD_OPEN_ROBOT_IS_CHARGING`, `CLOUD_OPEN_NO_AVAILABLE_ROBOT`, `CLOUD_OPEN_ENTER_QUEUE_ERROR`, `CLOUD_OPEN_CALL_ERROR`, `CLOUD_OPEN_ROBOT_EXEC_FAIL`, `CLOUD_OPEN_QUEUE_OVER`, `CLOUD_OPEN_TASK_NOT_EXISTS`, `CLOUD_OPEN_TASK_BELONG_ERROR`, `CLOUD_OPEN_UNABLE_CANCEL_TASK`, `CLOUD_OPEN_QUEUE_CANCEL_FAIL`, `CLOUD_OPEN_QUEUE_LIMIT`, `CLOUD_OPEN_TASK_EXPIRED`, `CLOUD_OPEN_UNABLE_COMPLETE_TASK`, `CLOUD_OPEN_ROBOT_RSP_ERROR`, `CLOUD_OPEN_ROBOT_BELONG_ERROR`, `MAP_ROBOT_UNBOUND_MAP`, `CLOUD_OPEN_SENDING_COMMAND_FAILED`, `CLOUD_OPEN_TASK_END_STATUS`, `CLOUD_OPEN_TASK_IN_QUEUE`, `CLOUD_OPEN_TASK_NOT_SUPPORT_DISPATCH`, `CLOUD_OPEN_TASK_STATUS_ERROR`, `CLOUD_OPEN_DISPATCH_PARAM_ERROR`, `CLOUD_OPEN_ROBOT_USING_LIFT`, `CLOUD_OPEN_ROBOT_RETURN_BUSY`, `CLOUD_OPEN_ROBOT_LOW_POWER`, `CLOUD_OPEN_ROBOT_USING_GATE`, `CLOUD_OPEN_ROBOT_CHARGING`, `CLOUD_OPEN_ROBOT_EMERGEN`, `CLOUD_OPEN_SERVER_ERROR`. Data Center: `PARAM_ERROR`, `ACCOUNT_ERROR`, `SYSTEM_ERROR`, `DATA_NOT_EXIST`, `DATABASE_ERROR`.

## B. Halaman API (teks asli)

Robot taskCall robotInitiateCallTask
InitiateCallTask
Updated Time:2026-05-12 16:18:06
1. API Description
Function
Text
Copy
1
You can call a specific robot to a specific point, or randomly call any robot to a point. The response depends on the state from [【Get specific robot status V2】](/en/cloud-api/sw0bsggqvfpus4v1sq0269mn). Robot dispatch states and responses to call tasks:
• run_state=OFFLINE Robot is offline; cannot call.
• run_state=DISABLE Robot currently cannot execute tasks.
• run_state=BUSY Robot is busy; the server enqueues the task and issues it when the robot is idle.
• run_state=IDLE Robot is idle; the robot responds immediately after calling.
On success, this API also returns task_id. Cache it for:
• Listening to task status via 【Call task status notification】 callback.
• Canceling the task via 【Cancel call task】.
• Completing the task early via 【Complete call task】 and proceeding to the next task.
Use the new open API flow to call the robot when either of the following is true; otherwise use the legacy open platform (SDK microservice required):
• Robot has upgraded to the P-ONE system.
• call_mode is empty or call_mode=CALL.
Tasks time out and fail after 30 minutes from creation. This timeout may change; watch for documentation updates.
After initiating the task, you can go to【Callback notification】-【Task execution】-【notifyCustomCall-CallStatus】to subscribe to the task status.
Update Record for 2026-04-21: 1. Added queue priority; 2. Enhanced random call functionality to filter machines based on robot_group_ids (machine group IDs) and filter_category_ids (machine types)
Scope
Supported Models:FlashBot 2025、FlashBot Pro、FlashBot Max、FlashBot Ultra、KettyBot Pro、BellaBot Pro、PuduT300、KettyBot、BellaBot、Pudu Bot2、HolaBot、PuduT150、PuduT600、PuduT600Underride
Prerequisites: Ensure the robot is online and idle
2. Basic Info
Request Path (Path)
/open-platform-service/v1/custom_call
Request Method (Method)
POST
Data Format
JSON

3. Request Parameters
Headers
Name
Type
Example
Description
Content-Type
string
application/json
Fixed; body format is JSON

Body (Params)
Name
Type
Required
Description
sn
string
N
Specify the machine call. If this parameter is not passed and the shop_i is passed, a random call will be made to an available machine under the store. If there are no available machines, they will enter the queue
shop_id
int32
N
The shop_id and SN of the machine must be chosen between
map_name
string
Y
Map name
point
string
Y
Target point
point_type
string
Y
Point type, e.g., table
call_mode
string
N
Call mode:empty: non-custom call (task ends on arrival);IMG: image mode;QR_CODE: payment QR mode;VIDEO: video mode;CALL_CONFIRM: arrival confirmation mode;CALL: arrival completion modeNote: P-ONE robots support this field. For non P-ONE robots, when call_mode != CALL, the legacy platform flow is required
mode_data
object
N
Extra content for custom call; required only in specific modes
do_not_queue
bool
N
If true, do not queue; if task cannot run, return failure immediately
robot_group_ids
Array<string>
N
robot group IDs for group-based random call
filter_category_ids
Array<string>
N
Filtering category IDs
priority
int32
N
Priority levels from 1 to 5, with 1 being the highest. The default or out-of-range value is 5

Params.mode_data
Name
Type
Required
Description
urls
Array<string>
N
Image URLs or video URLs
switch_time
int32
N
Image mode: image switch time (seconds)
play_count
int32
N
Video mode: number of play loops
cancel_btn_time
int32
N
Time to show cancel button (seconds)
show_timeout
int32
N
Content display timeout (seconds)
qrcode
string
N
QR code content
text
string
N
Text content in QR code mode

4. Response
Body (Response)
Name
Type
Description
message
string
Error code; SUCCESS on success
data
object
Call result data

Res.data
Name
Type
Description
task_id
string
Task ID
queue
int32
Current queue number. If the robot is busy, it queues and returns state=QUEUEING; valid only when state=QUEUEING
state
string
Current state:"CALLING": calling,"CALL_SUCCESS": robot responded successfully,"QUEUEING": queuing,"CALL_FAILED": call failed,"CALL_COMPLETE": call completed,"QUEUING_CANCEL": queue canceled,"TASK_CANCEL": task canceled,"ROBOT_CANCEL": canceled by robot
remark
string
Task remark


5. Examples
Request
POST /open-platform-service/v1/custom_call
{
  "sn": "SN-PD202405000001",
  "shop_id": 1001,
  "map_name": "Restaurant-1F",
  "point": "TABLE-001",
  "point_type": "table",
  "call_device_name": "Waiter-terminal-001",
  "call_mode": "IMG",
  "mode_data": {
    "urls": ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
    "switch_time": 5,
    "cancel_btn_time": 10,
    "show_timeout": 30
  },
  "do_not_queue": false,
  "robot_group_ids": ["GROUP-001"],
  "filter_category_ids": [],
  "priority": 1
}
Response
{
  "trace_id": "YourApiAppKey_405eb004-7f09-4d86-bff1-4657cdec2717",
  "message": "SUCCESS",
  "data": {
    "task_id": "CALL-202405201234567890",
    "queue": 1,
    "state": "CALLING",
    "remark": "Call task created"
  }
}

Robot taskCall robotCancelCallTask
CancelCallTask
Updated Time:2026-03-30 10:09:49
1. Description
Function
Cancel a specified custom call task.
Scope
Supported Models: FlashBot 2025、FlashBot Pro、FlashBot Max、FlashBot Ultra、KettyBot Pro、BellaBot Pro、PuduT300、FlashBot、KettyBot、BellaBot、Pudu Bot2、HolaBot、PuduT150、PuduT600、PuduT600Underride
Prerequisites: Ensure the call task exists and is not completed
2. Basic Info
Request Path (Path)
/open-platform-service/v1/custom_call/cancel
Request Method (Method)
POST
Data Format
JSON

3. Request Parameters
Headers
Name
Type
Example
Description
Content-Type
string
application/json
Fixed; body format is JSON

Body (Params)
Name
Type
Required
Description
task_id
string
N
Call task id, returned when initiating the call task. Note: initiating and canceling must use the same APPKEY, otherwise CLOUD_OPEN_TASK_BELONG_ERROR is returned
sn
string
N
If task_id is not provided but sn is, cancel all unfinished tasks under sn
is_auto_back
bool
N
Whether the robot should auto return if the current task is canceled.Only versions after New Lightning Box 1.1.1 are supported (March 30, 2026)

4. Response
Body (Response)
Name
Type
Description
trace_id
string
Unique id for this request
message
string
Server return code

5. Examples
Request
POST /open-platform-service/v1/custom_call/cancel
{
  "task_id": "CALL-202405201234567890",
  "is_auto_back": true
}

Response
{
  "trace_id": "YourApiAppKey_405eb004-7f09-4d86-bff1-4657cdec2717",
  "message": "SUCCESS"
}


Robot taskCall robotCompleteCallTask
CompleteCallTask
Updated Time:2026-01-16 15:31:15
1. Complete Custom Call
Function
When the call task is not in auto-completion mode, use this API to complete the specified custom call task and optionally execute the next custom task.
Scope
Supported Models: FlashBot 2025、FlashBot Pro、FlashBot Max、FlashBot Ultra、KettyBot Pro、BellaBot Pro、PuduT300、FlashBot、KettyBot、BellaBot、Pudu Bot2、HolaBot、PuduT150、PuduT600、PuduT600Underride
Prerequisites: Ensure the call task exists and is in progress
2. Basic Info
Request Path (Path)
/open-platform-service/v1/custom_call/complete
Request Method (Method)
POST
Data Format
JSON

3. Request Parameters
Headers
Name
Type
Example
Description
Content-Type
string
application/json
Fixed; body format is JSON

Body (Params)
Name
Type
Required
Description
task_id
string
Y
Call task id. Note: initiating and completing must use the same APPKEY, otherwise returns error
next_call_task
object
N
Next custom task

Params.next_call_task
Name
Type
Required
Description
shop_id
int32
Y
Shop ID the robot belongs to
map_name
string
Y
Map name
point
string
Y
Target point
point_type
string
Y
Point type, e.g., table
call_mode
string
N
Call mode: empty (non-custom), IMG (image), QR_CODE (payment QR), VIDEO (video), CALL_CONFIRM (arrival confirmation), CALL (arrival completion)
mode_data
object
N
Additional content for custom call; required only for specific modes

Params.next_call_task.mode_data
Name
Type
Required
Description
urls
Array<string>
N
Image URLs or video URLs
switch_time
int32
N
Image mode: image switch time (seconds)
play_count
int32
N
Video mode: number of play loops
cancel_btn_time
int32
N
Time to show cancel button (seconds)
show_timeout
int32
N
Content display timeout (seconds)
qrcode
string
N
QR code content
text
string
N
Text content in QR code mode

4. Response
Body (Response)
Name
Type
Description
trace_id
string
Unique id for this request
message
string
Server return code
data
object
Completion result data

Res.data
Name
Type
Description
next_call_result
object
Next task immediate execution result

Res.data.next_call_result
Name
Type
Description
message
string
Next task execution result; SUCCESS on success
task_id
string
Next task id

5. Examples
Request
http
Copy
1
POST /open-platform-service/v1/custom_call/complete
json
Copy
{
   "task_id": "CALL-202405201234567890",
   "next_call_task": {
       "shop_id": 1001,
       "map_name": "Restaurant-1F",
       "point": "TABLE-001",
       "point_type": "table",
       "call_device_name": "Waiter-terminal-001",
       "call_mode": "IMG",
       "mode_data": {
           "urls": [
               "https://example.com/image1.jpg",
               "https://example.com/image2.jpg"
           ],
           "switch_time": 5,
           "cancel_btn_time": 10,
           "show_timeout": 30
       },
       "do_not_queue": false
   }
}
Response
{
  "trace_id": "YourApiAppKey_405eb004-7f09-4d86-bff1-4657cdec2717",
  "message": "SUCCESS",
  "data": {
    "next_call_result": {
      "message": "SUCCESS",
      "task_id": "CALL-202405201234567891"
    }
  }
}


Robot taskCall robotGetCallList
GetCallList
Updated Time:2026-01-16 15:32:44
1. Description
Function
Get the call task list for a specified robot.
Scope
Supported Models: FlashBot 2025、FlashBot Pro、FlashBot Max、FlashBot Ultra、KettyBot Pro、BellaBot Pro、PuduT300、FlashBot、KettyBot、BellaBot、Pudu Bot2、HolaBot、PuduT150、PuduT600、PuduT600Underride
Prerequisites:
2. Basic Info
Request Path (Path)
/open-platform-service/v1/call/list
Request Method (Method)
GET
Data Format
Query Params

3. Request Parameters
Headers
Name
Type
Example
Description
Content-Type
string
application/json
Fixed; body format is JSON

Query Params
Name
Type
Required
Description
sn
string
N
Robot serial number
task_id
string
N
Task ID
shop_id
int32
N
Shop ID
status
Array<string>
N
Status list; error if none of the four optional params are provided
offset
int32
N
Offset
limit
int32
N
Limit; default 10

4. Response
Body (Response)
Name
Type
Description
trace_id
string
Unique id for this request
message
string
Message
data
Object
Call task data

Res.data
Name
Type
Description
total
int32
Total count
list
Array<object>
Call task list

Res.data.list
Name
Type
Description
task_id
string
Task ID
shop_id
int32
Shop ID
map_name
string
Map name
point
string
Target point
sn
string
Robot serial number
queue
int32
Queue number; valid only when status=QUEUEING
create_time
int32
Created at (Unix seconds)
finish_time
int32
Finished at (Unix seconds)
status
string
Status: "CALLING", "CALL_SUCCESS", "QUEUEING", "CALL_FAILED", "CALL_COMPLETE", "QUEUING_CANCEL", "TASK_CANCEL", "ROBOT_CANCEL"
remark
string
Remark
product_code
string
Product code

5. Examples
Request
http
Copy
1
GET /open-platform-service/v1/call/list?sn=SN-PD202405000001&limit=10
Response
{
 "trace_id": "YourApiAppKey_405eb004-7f09-4d86-bff1-4657cdec2717",
 "message": "SUCCESS",
 "data": {
   "total": 5,
   "list": [
     {
       "task_id": "CALL-202405201234567890",
       "shop_id": 1001,
       "map_name": "Restaurant-1F",
       "point": "TABLE-001",
       "sn": "SN-PD202405000001",
       "queue": 1,
       "create_time": 1640995200,
       "finish_time": 1640995800,
       "status": "COMPLETE",
       "remark": "call task",
       "product_code": "PD-001"
     }
   ]
 }
}

Callback notificationTask executionCallStatus-notifyCustomCall
CallStatus-notifyCustomCall
Updated Time:2026-01-16 15:17:49
1、Description
Function Description
After the developer calls Open API 【Robot task】 → 【Call robot】→ 【InitiateCallTask】, the robot’s response status (calling / success / queuing / failed) is sent via this callback. Note: The states PAUSE and ARRIVE are reported only by P-ONE versions.
Scope
Supported Models：FlashBot 2025、FlashBot Pro、FlashBot Max、FlashBot Ultra、KettyBot Pro、BellaBot Pro、PuduT300、FlashBot、KettyBot、BellaBot、Pudu Bot2、HolaBot、PuduT150、PuduT600、PuduT600Underride
2、Callback Parameters
POST https://yourdomain.com/youruri
【https://yourdomain.com/youruri】 is the callback endpoint provided by the developer. You must fill this address in the 【Callback URL】 field when applying for the APPKey to receive notifications.
Request Body (Params)
Parameter
Type
Description
callback_type
string
Callback message type, here: notifyCustomCall
data
object
Additional payload; structure varies by callback_type

Params.data
Parameter
Type
Description
task_id
string
Task ID
shop_id
int32
Shop ID
map_name
string
Map name
point
string
Map point
queue
int32
Queue number; when the robot is busy and called again, state=QUEUING and this field returns the queue number; valid only when state=QUEUING
state
string
Current state "CALLING": calling, "CALL_SUCCESS": robot responded successfully, "QUEUING": queuing, "CALL_FAILED": call failed, "CALL_COMPLETE": call completed, "QUEUING_CANCEL": queue canceled, "TASK_CANCEL": task canceled, "ROBOT_CANCEL": canceled by robot, "PAUSE": robot paused(This will only be reported by the P1 machine.), "ARRIVE": arrived at point(This will only be reported by the P1 machine.)
sn
string
Robot SN
robot_response_code
int32
If this message is a robot reply, the robot’s response code
robot_response_message
string
If this message is a robot reply, the robot’s response message

3、Example
{
  "callback_type": "notifyCustomCall",
  "data": {
    "task_id": "123",
    "shop_id": 123,
    "map_name":"map1",
    "point":"point1",
    "point_type":"table",
    "queue":1,
    "state":"QUEUING",
    "sn":"PD1234567890123",
    "robot_response_code":0,
    "robot_response_message:":""
   
}


Robot informationGeneral robot status inquiryGetRobotStatusV2
GetRobotStatusV2
Updated Time:2026-03-12 14:14:30
1. API Description
Function
Get robot status by SN (V2). Three states (schedule_status, work_status, is_online) are merged into one (run_state): OFFLINE, DISABLE, BUSY, IDLE.If you need to obtain real-time machine status, you can subscribe through [Callback notification] - [Robot status & binding] - [RobotWorkStatusNotification-notifyRobotStatus]
Scope
Supported Models: ALL
Prerequisites: None
2. Basic Info
Request Path (Path)
/open-platform-service/v2/status/get_by_sn
Request Method (Method)
GET
Data Format
Query Params

3. Request Parameters
Headers
Name
Type
Example
Description
Content-Type
string
application/json
Fixed; body format is JSON

Query Params
Name
Type
Required
Description
sn
string
N
Robot SN; choose one of SN or MAC
mac
string
N
Robot MAC address

4. Response
Body (Response)
Name
Type
Description
trace_id
string
Unique id for this request
message
string
Message
data
object
Robot status data (V2)

Res.data
Name
Type
Description
sn
string
Robot serial number
mac
string
Device name
timestamp
int32
Updated at
battery
int32
Battery
is_charging
int32
Charging: 1 (charging), -1 (not charging)
move_state
string
Motion state: IDLE, MOVING, STUCK, APPROACHING, ARRIVE, PAUSE, AVOID
charge_stage
string
Battery status: IDLE, CHARGING, CHARGE_FULL, CHARGE_ERROR_CONTACT, CHARGE_ERROR_ELECTRIC, ERROR_BATTERY_PACK_COMM, ERROR_OVER_VOLT, ERROR_OVER_ELECTRIC, ERROR_OVER_TEMPERATURE, ERROR_OVER_TIME
remain_time
int32
T300 only. Remaining usage time (minutes)
product_code
string
Product code
run_state
string
Run state:OFFLINE: offline (e.g., network issue or call switch off)；DISABLE: unavailable (e.g., low battery or charging mode blocking calls; when switching from IDLE, queued call tasks end early)；BUSY: executing (some models keep busy 10s after touch); calls are queued (call tasks only)；IDLE: idle; tasks execute immediately
charge_type
int32
Charge type: 1 (wired), 2 (dock)

5. Examples
Request
GET /open-platform-service/v2/status/get_by_sn?sn=SN-PD202405000001
Response
{
 "trace_id": "YourApiAppKey_405eb004-7f09-4d86-bff1-4657cdec2717",
 "message": "SUCCESS",
 "data": {
   "sn": "SN-PD202405000001",
   "mac": "robot-001",
   "timestamp": 1640995200,
   "battery": 85,
   "is_charging": -1,
   "move_state": "IDLE",
   "charge_stage": "IDLE",
   "remain_time": 0,
   "product_code": "PD-001",
   "run_state": "IDLE",
   "charge_type": 2
 }
}

Callback notificationRobot status & bindingOnlineOffline-robotStatus
OnlineOffline-robotStatus
Updated Time:2025-11-17 20:13:04
1、Description
Function Description
After the robot connects to the cloud platform, the cloud pushes an online notification to the developer.
When the robot loses network or power and is detected offline by the cloud, the cloud pushes an offline notification. Note: this is not immediate upon disconnection. If the robot did not actively disconnect from the cloud, the cloud needs to detect heartbeat timeout, which typically takes 3–5 minutes.
Scope
Supported Models：ALL
2、Callback Parameters
POST https://yourdomain.com/youruri
【https://yourdomain.com/youruri】 is the callback endpoint provided by the developer. You must fill this address in the 【Callback URL】 field when applying for the APPKey to receive notifications.
Request Body (Params)
Parameter
Type
Description
callback_type
string
Callback message type, here: robotStatus
data
object
Additional payload; structure varies by callback_type

Params.data
Parameter
Type
Description
sn
string
Robot SN
run_status
string
Robot run status: online, offline
timestamp
int64
Unix timestamp, seconds

3、Example


{
  "callback_type": "robotStatus",
  "data": {
    "sn": "SV10111....",
    "run_status": "online",
    "timestamp": 1699364274
  }
}

Callback notificationRobot status & bindingRobotWorkStatusNotification-notifyRobotStatus
RobotWorkStatusNotification-notifyRobotStatus
Updated Time:2025-12-25 16:36:22
1. Description
Functional Description
Changes in robotworking status (busy/idle), battery level, mobility status, and online/offline will all be notified to developers through this callback interface.
Applicable Scope
Supported Models: ALL
2. Callback Parameters
POST https://yourdomain.com/youruri
https://yourdomain.com/youruri is the callback URL provided by the developer to receive notifications. It must be filled in the "Callback URL" field when applying for the APPKey, otherwise notifications cannot be received.
Request Body (Params)
Parameter Name
Type
Description
callback_type
string
Callback message type, here: notifyRobotStatus
data
object
Additional data of the callback. The structure varies depending on callback_type

Params.data
Parameter Name
Type
Description
mac
string
Device name, here refers to robot mac
sn
string
Robot sn
timestamp
int64
Server push timestamp seconds
battery
int32
Battery level
is_charging
int32
1: Charging -1 Not charging
charge_type
int32
1 Cable charging, 2 Pile charging (not sent), valid when charging
move_state
string
This field is only reported by P-ONE. Motion state IDLE: Idle MOVING: Moving STUCK: Blocked by obstacles APPROACHING: Approaching target point ARRIVE: Arrived at target point PAUSE: Paused AVOID: Scheduling with other robots
charge_stage
string
This field is only reported by P-ONE. Battery status IDLE: Idle CHARGING: Charging CHARGE_FULL: Fully charged CHARGE_ERROR_CONTACT: Charging connection abnormal CHARGE_ERROR_ELECTRIC: Current abnormal ERROR_BATTERY_PACK_COMM: Communication abnormal ERROR_OVER_VOLT: Voltage abnormal ERROR_OVER_ELECTRIC: Current abnormal ERROR_OVER_TEMPERATURE: Temperature abnormal ERROR_OVER_TIME: Timeout abnormal
run_state
string
Run state:OFFLINE: offline (e.g., network issue or call switch off)；DISABLE: unavailable (e.g., low battery or charging mode blocking calls; when switching from IDLE, queued call tasks end early)；BUSY: executing (some models keep busy 10s after touch); calls are queued (call tasks only)；IDLE: idle; tasks execute immediately. The mapping relationship between each state here and the states returned by original v1/get_by_sn: OFFLINE: is_online!=1 IDLE: is_online=1 && schedule_status=1 && work_status=-1 BUSY: is_online=1 && schedule_status=1 && work_status!=-1 DISABLE: is_online=1 && schedule_status!=1
remain_time
int32
Reported only by P1. Remaining usage time in seconds
notify_timestamp
int64
Robot notification timestamp, milliseconds

3. Call Example
{
 "callback_type": "robotEmergencyRecover",
 "data": {
   "sn": "SN-PD202405000001",
   "mac": "Robot001",
   "timestamp": 1640995200,
   "notify_timestamp": 1640995200000,
   "battery": 85,
   "is_charging": -1,
   "move_state": "IDLE",
   "charge_stage": "IDLE",
   "remain_time": 0,
   "run_state": "IDLE",
   "charge_type": 2
 }
}

Callback notificationMap & Position callbackRobotPose-notifyRobotPose
RobotPose-notifyRobotPose
Updated Time:2026-05-26 17:43:16
1、Description
Function Description
After the developer issues a report command via Open API 【Control Commands】-【Map & Position】-【NotifyRobotReportPosition】, the robot reports real-time positions according to the reporting frequency and count, and this callback notifies the developer after each report.
Scope
Supported Models：PuduT300、Flashbot NEW、BellabotPro、PuduT150、PuduT600、PuduT600Underride
2、Callback Parameters
POST https://yourdomain.com/youruri
【https://yourdomain.com/youruri】 is the callback endpoint provided by the developer. You must fill this address in the 【Callback URL】 field when applying for the APPKey to receive notifications.
Request Body (Params)
Parameter
Type
Description
callback_type
string
Callback message type, here: notifyRobotPose
data
object
Additional payload; structure varies by callback_type

Params.data
Parameter
Type
Description
x
float
X coordinate
y
float
Y coordinate
yaw
float
Angle
sn
string
Robot SN
mac
string
Robot MAC address
timestamp
int32
Current Unix timestamp, seconds
notify_timestamp
long
Timestamp reported by the robot, milliseconds; can be used for out-of-order filtering
nearest_point
string
the nearest point of this position

3、Example

{
   "callback_type": "notifyRobotPose",
   "data": {
     "x":1.234,
     "y":2.345,
     "yaw":32.34,
      "sn":"OP21321dsffsd",
      "mac":"AA:AA:AA:AA:AA:AA",
      "timestamp": 1764325632, // current timestamp, seconds
     "notify_timestamp" :1764325632000, // timestamp reported by the robot, milliseconds
     "nearest_point": "table1"
   }
}

Callback notificationTask executionDeliveryTask-notifyDeliveryTask
DeliveryTask-notifyDeliveryTask
Updated Time:2026-05-12 16:15:39
1、Description
Function Description
After the developer calls 【Robot task】 → 【Delivery task】→ 【DeliveryTask】, the robot reports task status via this callback.
Scope
Supported Models：FlashBot 2025、FlashBot Pro、FlashBot Max、FlashBot Ultra、KettyBot Pro、BellaBot Pro、PuduT300、BellaBot、Flashbot、Pudu Bot2、PuduT150、PuduT600、PuduT600Underride
2、Callback Parameters
POST https://yourdomain.com/youruri
【https://yourdomain.com/youruri】 is the callback endpoint provided by the developer. You must fill this address in the 【Callback URL】 field when applying for the APPKey to receive notifications.
Request Body (Params)
Parameter
Type
Description
callback_type
string
Callback message type, here: notifyDeliveryTask
data
object
Additional payload; structure varies by callback_type

Params.data
Field
Type
Description
sn
string
Robot SN
mac
string
Robot MAC address
timestamp
int
Server push timestamp, seconds
delivery_mode
string
Delivery mode: GENERAL (normal), DIRECT (direct), BIRTHDAY (birthday), SPECIAL (special)
task_id
string
Task ID
notify_timestamp
long
Robot notify timestamp, milliseconds
is_over_time
bool
Timed out or not: true/false
spent_time
int
Time spent by the task
task_status
string
Overall task status, low version machines will not report this field. Please confirm with the corresponding product before use.ON_THE_WAY:executing、CANCEL: canceled、FAILED: failed (when the robot rejects the task, updated by cloud)、COMPLETED: completed、PAUSE: paused
trays
Array<object>
Tray array

Params.data.trays
Field
Type
Description
destinations
Array<object>
Target tasks on each tray

Params.data.trays.destinations
Field
Type
Description
destination
string
Target point: the value is the name obtained from “Get robot map target points”
type
string
Task type: REMOTE: remotely sent; MANUAL: edited on the robot
id
string
Task ID; when tasks are sent via “Send a delivery task to the robot”, the robot will echo the received id in this field
status
string
Task status AWAIT: waiting, ON_THE_WAY: delivering, ARRIVED: arrived, CANCEL: canceled, COMPLETE: completed
estimated_time
Long
Estimated arrival time. When status becomes ON_THE_WAY, the system estimates time based on distance and configured speed. Unit: ms (may be inaccurate due to obstacles)
spend_time
Long
Total time for a status change. From the first task’s ON_THE_WAY to this task’s COMPLETE. Unit: ms
complete_type
string
How the robot completes the task after arrival: TIMEOUT: timeout, MANUAL: manual tap, REMOTE: remote control, QRCODE: QR code scan, TRAY_EMPTY: tray detected empty
timeout
bool
For any point: in trays.items, if ARRIVED duration exceeds the wait_time specified when issuing the task, this flag is true; in start_point.items, whether placing items exceeds wait_time
map_info
Object
The map that the point belongs to

Params.data.trays.destinations.map_info
Field
Type
Description
map_name
string
Map name

3、Example


{
    "callback_type": "notifyDeliveryTask",
    "data": {
        "delivery_mode": "GENERAL",
        "sn":"SV1111.....",
        "mac":"mac",
        "timestamp": 1699364274,
        "notify_timestamp": 1699364274000,
        "is_over_time":false,
        "spent_time":100,
        "task_id":"111111111",
        "task_status":"ON_THE_WAY",
        "trays": [
            {
                "destinations": [
                    {
                        "destination": "A1",
                        "type": "REMOTE/MANUAL",
                        "id": "task id; echoed when status sync occurs",
                        "estimated_time": 60000,
                        "spend_time": 80000,
                        "status": "AWAIT/ON_THE_WAY/ARRIVED/CANCEL/COMPLETE",
                        "timeout": false,
                        "complete_type": "REMOTE",
                        "map_info":{"map_name":"map name"}
                    }
                ]
            },
            {
                "destinations": [
                    {
                        "destination": "A1",
                        "type": "REMOTE/MANUAL",
                        "id": "task id; echoed when status sync occurs",
                        "estimated_time": 60000,
                        "spend_time": 80000,
                        "status": "AWAIT/ON_THE_WAY/ARRIVED/CANCEL/COMPLETE",
                        "timeout": false,
                        "complete_type": "REMOTE",
                        "map_info":{"map_name":"map name"}
                    }
                ]
            },
            {
                "destinations": [
                    {
                        "destination": "A1",
                        "type": "REMOTE/MANUAL",
                        "id": "task id; echoed when status sync occurs",
                        "estimated_time": 60000,
                        "spend_time": 80000,
                        "status": "AWAIT/ON_THE_WAY/ARRIVED/CANCEL/COMPLETE",
                        "timeout": false,
                        "complete_type": "REMOTE",
                        "map_info":{"map_name":"map name"}
                    }
                ]
            }
        ]
    }
}


