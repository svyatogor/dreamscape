import Redis from 'redis'
import bluebird from 'bluebird'

bluebird.promisifyAll(Redis.RedisClient.prototype);
bluebird.promisifyAll(Redis.Multi.prototype);
export const redis = Redis.createClient(process.env.REDIS_URL)

