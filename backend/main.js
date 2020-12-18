const morgan = require('morgan')
const express = require('express')
const cors = require('cors')
const mysql = require('mysql2/promise')

const multer = require('multer');
const fs = require('fs');
const AWS = require('aws-sdk');

const { MongoClient } = require('mongodb');

const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('combined'))


//S3
const s3 = new AWS.S3({
    endpoint: new AWS.Endpoint('sfo2.digitaloceanspaces.com'),
    accessKeyId: process.env.ACCESS_KEY, 
	secretAccessKey: process.env.SECRET_ACCESS_KEY 
})

const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME //|| 'lancertan'

const upload = multer({
    dest: process.env.TMP_DIR || '/opt/tmp/uploads'
})

const mkJson = (params, image) => {
	return {
		title: params.title,
		comments: params.comments,
		image: image,
		ts: new Date()
	}
}

const readFile = (path) => new Promise(
	(resolve, reject) => 
		fs.readFile(path, (err, buff) => {
			if (null != err)
				reject(err)
			else 
				resolve(buff)
		})
)

const putObject = (file, buff, s3) => new Promise(
	(resolve, reject) => {
		const params = {
			Bucket: AWS_S3_BUCKET_NAME,
			Key: file.filename, 
			Body: buff,
			ACL: 'public-read',
			ContentType: file.mimetype,
			ContentLength: file.size
		}
		s3.putObject(params, (err, result) => {
			if (null != err)
				reject(err)
			else
				resolve(result)
		})
	}
)


//configure mysql pool
//!!!DELETE USER and PASSWORD BEFORE CHECK-IN!!!
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'paf2020',
    connectionLimit: 4,
    timezone: '+08:00'
})

//construct SQL
const getLoginDetails = "SELECT * FROM user WHERE user_id = ? AND password = ?"

//establish SQL connection, take in params and query the rdbms
const mkQuery = (sql, pool) => {
    return(async(args)=>{
        const conn = await pool.getConnection();
        try{
            let results = await conn.query(sql, args || [])
            console.log(results)
            return results[0]
        }catch(err){
            console.log(err)
        }finally{
            conn.release()
        }
    })
}

//create the SQL closure function
const executeGetLoginDetails = mkQuery(getLoginDetails, pool)

//MONGODB
//configure mongoDB

const MONGO_URL = 'mongodb://localhost:27017'

const mongoClient = new MongoClient(MONGO_URL, {
    useNewUrlParser: true, useUnifiedTopology: true
})

const DATABASE = 'share-something-today'
const COLLECTION = 'sharing'


//POST /upload  file upload
app.post('/login', (req, resp) => {
    
	const username = req.body.username
	const password = req.body.password
	serverPassword = ""
	errorMsg = ""

	console.log('username: ', username)
	console.log('password: ', password)

	executeGetLoginDetails([username, password]).then((results) => {
		
		if(results.length > 0){
			console.log('successful login')
			resp.status(200)
			resp.json({ authenticated: 'true' })
		} else {
			console.log('failed login')
			resp.status(401)
			resp.json({ authenticated: 'false' })
		}

    }).catch((e)=> {
		resp.status(500)
		resp.json({authenticated: 'false', e: e})
	})
})

//POST /upload file upload
app.post('/upload', upload.single('upload'), (req, resp) => {
    
    console.info('>>> req.body: ', req.body)
	console.info('>>> req.file: ', req.file)
	const username = req.body.username
	const password = req.body.password

	executeGetLoginDetails([username, password]).then((results) => {
		if(results.length > 0){
			console.log('login verified')
			console.log('perform file upload steps here')
		
			//make a json obj of the body and file data
			const doc = mkJson(req.body, req.file.filename)
		
			readFile(req.file.path)
				.then(buff => 
					putObject(req.file, buff, s3)
				)
				.then(()=>
				//perform inserting of record of json obj doc into mongodb here
					mongoClient.db(DATABASE).collection(COLLECTION)
						.insertOne(doc)					
				)
				.then(results => {
					console.info('insert results: ', results)
					//delete the temp file
					fs.unlink(req.file.path, ()=> {})
					resp.status(200)
					resp.json({ id: results.ops[0]._id })
				})
				.catch(error => {
					console.error('insert error: ', error)
					resp.status(500)
					resp.json({ error })
				})

		} else {
			console.log('login failed')
			resp.status(401)
			resp.json({e: 'check login details'})
		}
    

})
})
//console.log(`${__dirname}\\frontend`)
// Serve angular
//console.log(__dirname, '/frontend')
app.use(express.static(`${__dirname}\\frontend`));


//start the server
//check SQL connection
const p0 = (async () => {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    return true
})()

//check mongoDb connection
const p1 = (async () => {
    await mongoClient.connect()
    return true
})()


Promise.all([ p0, p1 ])
    .then((r) => {
        app.listen(PORT, () => {
            console.info(`Application started on port ${PORT} at ${new Date()}`)
        })
    })

