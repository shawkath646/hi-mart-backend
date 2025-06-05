const { bucket, db } = require('./firebase');

async function uploadFile(base64File, fileName = `file_${Date.now()}`) {
    if (!/^data:.*;base64,/.test(base64File)) return base64File;

    const base64Data = base64File.split(';base64,').pop();
    const buffer = Buffer.from(base64Data, 'base64');

    const fileRef = bucket.file(fileName);

    const fileExists = await fileRef.exists();
    if (fileExists[0]) await fileRef.delete();

    await fileRef.save(buffer, {
        metadata: {
            contentType: base64File.match(/^data:(.*);base64,/)[1],
        },
    });

    const [signedUrl] = await fileRef.getSignedUrl({
        action: 'read',
        expires: '03-01-2500',
    });

    return signedUrl;
};

module.exports = { uploadFile };