const path = require('path');
const fs = require('fs');

async function handleFiles(files) {
    const result = await Promise.all(files.map(
        async function ([prev, current], i) {
            if (!current) {
                console.log('File is the same');
                return prev || '';
            }
            const filePath = path.join(__dirname, `../images/${i == 0 ? 'profile_pics' : 'covers'}/${prev}`);
            const exists = await fs.existsSync(filePath);
            if (!exists) {
                console.log('File does not exist.');
                return current || '';
            }
            await fs.unlinkSync(filePath);
            console.log('Delete successful!');
            return current || '';
        }
    ));
    return result;
};

async function handleDelete(deleted) {
    if (!deleted) return;
    const { picture, cover, files } = deleted
    const to_delete = [
        ...files.map((file, i) => (
            { file, type: /.(jpg|png|jpeg)$/i.test(file) ? 'photo' : /(.mp4)$/i.test(file) ? 'video' : null }
        )),
        { file: picture, type: 'profile' },
        { file: cover, type: 'cover' }
    ]
    for (let { type, file } of to_delete) {
        if (type === 'text') continue;
        const { fail, message } = await deleteFile(type, file);
        if (fail) console.log('delete failed: %s', message);
        else console.log(message);
    }
}

async function deleteFile(type, file) {
    if (!type || !file) return { fail: true, message: 'no arguments found' };
    const filePath = /(video|photo)/.test(type) ?
        path.join(__dirname, `../${type === 'video' ? 'videos/post_videos' : 'images/post_images'}/${file}`) :
        path.join(__dirname, `../images/${type === 'profile' ? 'profile_pics' : 'covers'}/${file}`)
    const exists = await fs.existsSync(filePath);
    if (!exists) return { fail: true, message: 'file doesn\'t exists' };
    await fs.unlinkSync(filePath);
    return { fail: false, message: 'file deleted' };
}

module.exports = { 
    handleFiles,
    handleDelete,
    deleteFile
}