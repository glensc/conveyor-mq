local fromQueue = KEYS[1]
local toQueue = KEYS[2]
local taskKeyPrefix = KEYS[3]
local ttl = KEYS[4]
local queue = KEYS[5]
local datetime = KEYS[6]
local publishChannel = KEYS[7]
local stallingHashKey = KEYS[8]

local taskId = redis.call('RPOPLPUSH', fromQueue, toQueue)

if taskId then
    local lockKey = queue .. ':acknowledged-tasks:' .. taskId
    redis.call('SET', lockKey, '', 'PX', ttl)
    redis.call('HSET', stallingHashKey, taskId, '')

    local taskKey = taskKeyPrefix .. taskId
    local taskJson = redis.call('GET', taskKey)
    local task = cjson.decode(taskJson)
    task['status'] = 'processing'
    task['processingStartedOn'] = datetime

    local processingTaskJson = cjson.encode(task)
    redis.call('SET', taskKey, processingTaskJson)
    redis.call('PUBLISH', publishChannel, processingTaskJson)

    return processingTaskJson
end