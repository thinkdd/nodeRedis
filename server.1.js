const express = require('express')
const bodyParser = require('body-parser')
const { MongoClient } = require('mongodb')
const Promise = require('bluebird')

const redisConfig = {
    port: 6379,
    host: '192.168.99.100'
}
const redis = require('redis')
const client = Promise.promisifyAll(redis.createClient(redisConfig.port, redisConfig.host))

client.on('connect', () => {
    console.log('connect to redis is connected.')
})

// mongodb://192.168.99.100:27017/register
const mongodbName = 'register'
const mongodbUrl = 'mongodb://192.168.99.100:27017/' + mongodbName

const collectionUser = 'users'

let db

const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const keyGetUsers = 'userlist'

// Get user list
app.get('/users', async (req, res) => {
    try{
        const result = await client.getAsunc(keyGetUsers)
        if(!result){
            const dbResult = await db.collection(collectionUser).find().toArray()
            client.set(keyGetUsers,JSON.stringify(dbResult))
            res.send(dbResult)
            return
        }
        res.send(JSON.parse(result))
    } catch (err) {
        console.log('err',err)
    }
})

// Add new user
app.post('/users', async (req, res) => {
    // db.users.save()
    try{
        const result = await db.collection(collectionUser).save()
        console.log('add')
        await client.delAsync(keyGetUsers)
        console.log('ee')

        res.send(result)
    }catch (err) {
        console.log('err->',err)
    }

/* convert to async/await
    db.collection(collectionUser).save(req.body, async (err, result) => {
        if (err) {
            console.log('save user err ->', err)
        }

        await client.delAsync(keyGetUsers)

        console.log('user has been saved.')
        res.send('user has been saved.')
    })
    */
})

MongoClient.connect(mongodbUrl, (err, database) => {
    if (err) {
        console.log('err ->', err)
    }
    db = database

    console.log('connect to database is successfuly')

    app.listen(port, () => {
        console.log('app is listening on port ' + port)
    })
})
