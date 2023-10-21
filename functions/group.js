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

const classifyPostFiles = (file) => ({
    file,
    folder: /.(jpg|png|jpeg)$/i.test(file) ? 'images/post_images' : /(.mp4)$/i.test(file) ? 'videos/post_videos' : null
})

const classifyStoryFiles = (file) => ({
    file,
    folder: /.(jpg|png|jpeg)$/i.test(file) ? 'images/stories' : /(.mp4)$/i.test(file) ? 'videos/stories' : 'text'
})
  
async function handleDelete({ picture, cover, post_files = [], story_files = [] }) {
    const posts = post_files.map(classifyPostFiles)
    const stories = story_files.map(classifyStoryFiles)
    const to_delete = [
        ...posts,
        ...stories,
        { file: picture, folder: 'images/profile_pics' },
        { file: cover, folder: 'images/covers' }
    ]
    for (let { folder, file } of to_delete) {
        if (folder === 'text') continue;
        const { fail, message } = await deleteFile(folder, file);
        if (fail) console.log('delete failed: %s', message);
        else console.log(message);
    }
}

async function deleteFile(folder, file) {
    if (!folder || !file) return { fail: true, message: 'no arguments found' };
    const filePath = path.join(__dirname, `../${folder}/${file}`)
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