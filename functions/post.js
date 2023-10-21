const multer = require('multer');
const path = require('path');
const DatauriParser = require('datauri/parser');
const cloudinary = require('../utils/cloudinary');

const storage = multer.diskStorage({    
    destination: (req, file, cb) => {
        const body = req.body
        const folderName = body.post_type === 'video' ? '../videos/post_videos' : '../images/post_images'
        if (!checkValues(body)) return cb(new Error('some fields are empty'));
        cb(null, path.join(__dirname, folderName))
    },
    filename: (req, file, cb) => {
        const filename = Date.now() + path.extname(file.originalname);
        req.body.post_files = req.body.post_files ? [...req.body.post_files, filename] : [ filename ];
        cb(null, filename);
    }
})
 
const uploadLocal = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const { post_type } = req.body;
        const typeCheck = post_type === 'photo' ?
            ['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype) :
            file.mimetype === 'video/mp4';
        if (typeCheck) {
            cb(null, true);
        } else {
            cb(null, false);
            const err = new Error('File type not supported');
            err.name = 'ExtensionError'
            return cb(err);
        }
    }
}).array('files', 6)

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const { post_type } = req.body;
        const typeCheck = post_type === 'photo' ?
            ['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype) :
            file.mimetype === 'video/mp4';
        
        if (typeCheck) {
            cb(null, true);
        } else {
            cb(null, false);
            const err = new Error('File type not supported');
            err.name = 'ExtensionError'
            return cb(err);
        }
    }
}).array('files', 6)

const uploadToCloud = (file) => new Promise((resolve, reject) => {
    console.warn('uploading')
    try {
        const { uploader } = cloudinary;
        const parser = new DatauriParser();
        const fileFormat = file.mimetype.split('/')
        const { base64 } = parser.format(fileFormat[1], file.buffer)
        uploader.upload(`data:${file.mimetype};base64,${base64}`, { folder: 'post_images' })
            .then( ({ public_id, format }) => resolve(`${public_id}.${format}`) )
    } catch (error) {
        console.errror('upload failed')
        reject(error)
    }
})

function checkValues(values) {
    for (let [entry, value] of Object.entries(values)) {
        if (!value || value?.length < 1) {
            const err = new Error(`${entry} field cannot be empty!`);
            return false
        }
    }
    return true;
}

function uploadMiddleware(req, res, next) {
    // upload(req, res, async (err) => {
    //     try {
    //         let results = []
    //         const { files, body } = req
    //         const check = checkValues(body);

    //         if (err) {
    //             let message;
    //             if (err instanceof multer.MulterError) {
    //                 message = 'Error occured in multer'
    //             } else {
    //                 message = err.message
    //             }
    //             throw new Error(message)
    //         } else if (!check) {
    //             throw new Error('Some fields are empty')
    //         } else if (files.length > 0 && /photo|video/.test(body.post_type)) {
    //             const filesToUpload = files.map(uploadToCloud);
    //             results = await Promise.all(filesToUpload);
    //             console.log(results);
    //         }

    //         req.body.post_files = results
    //         next()
    //     } catch (error) {
    //         console.log(error.message);
    //         return res.status(500).json({ message: error.message })
    //     }
    // })
    uploadLocal(req, res, async (err) => {
        try {
            const { body, files } = req
            const check = checkValues(body);
            if (err) {
                let message;
                if (err instanceof multer.MulterError) {
                    message = 'Error occured in multer'
                } else {
                    message = err.message
                }
                throw new Error(message)
            }
            if (body.channel_id && files.length !== 1) throw new Error('You have to add a video file');
            if (/photo|video/i.test(body.post_type && files.length < 1)) throw Error('You have to post a file');
            if (!check) throw new Error('Some fields are empty');
            if (!/photo|video/i.test(body.post_type)) req.body.post_files = [];
            next()
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ message: error.message })
        }
    })
}

module.exports = uploadMiddleware;