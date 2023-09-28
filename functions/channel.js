const multer = require('multer');
const path = require('path');
const DatauriParser = require('datauri/parser');
const cloudinary = require('../utils/cloudinary');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { user_id, name } = req.body;
        if (!user_id || !name) return cb(new Error('some fields are empty'));
        const folderName = file.fieldname === 'profile_pic' ? '../images/profile_pics' : '../images/covers';
        cb(null, path.join(__dirname, folderName))
    },
    filename: (req, file, cb) => {
        const date = new Date();
        const filename = Date.now() + Math.round(Math.random() * 1000000) + path.extname(file.originalname);
        if (file.fieldname === 'profile_pic') req.body.picture = req.body.profile_pic = filename;
        if (file.fieldname === 'cover') req.body.cover = filename;
        cb(null, filename);
    }
})
 
const uploadLocal = multer({
    storage,
    limits: { fileSize: 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const typeCheck = ['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype);
        if (typeCheck) {
            cb(null, true);
        } else {
            cb(null, false);
            const err = new Error('File type not supported');
            err.name = 'ExtensionError'
            return cb(err);
        }
    }
}).fields([{ name: 'profile_pic', maxCount: 1 }, { name: 'cover', maxCount: 1 }])

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const typeCheck = ['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)
        
        if (typeCheck) {
            cb(null, true);
        } else {
            cb(null, false);
            const err = new Error('File type not supported');
            err.name = 'ExtensionError'
            return cb(err);
        }
    }
}).fields([{ name: 'channel_pic', maxCount: 1 }, { name: 'channel_cover', maxCount: 1 }])

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

function uploadMiddleware(req, res, next) {
    // upload(req, res, async (err) => {
    //     try {
    //         let results = []
    //         const { files, body } = req

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
            const { user_id, name } = req.body;
            if (!user_id || !name) throw new Error('Some fields are empty');
            if (err) {
                let message;
                if (err instanceof multer.MulterError) {
                    message = 'Error occured in multer'
                } else {
                    message = err.message
                }
                throw new Error(message)
            }
            next()
        } catch (error) {
            console.log(error.message);
            return res.status(500).json({ message: error.message })
        }
    })
}

module.exports = uploadMiddleware;