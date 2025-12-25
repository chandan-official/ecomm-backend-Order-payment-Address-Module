// utils/doSpaces.js
import AWS from "aws-sdk";

const s3 = new AWS.S3({
  endpoint: `https://${process.env.DO_SPACES_ENDPOINT}`, // must include https
  accessKeyId: process.env.DO_SPACES_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET,
});

export const uploadBufferToDO = async (file, folder) => {
  let buffer;

  // Convert ArrayBuffer to Node Buffer if needed
  if (file.buffer instanceof ArrayBuffer) {
    buffer = Buffer.from(file.buffer);
  } else {
    buffer = file.buffer; // already Buffer
  }

  const params = {
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `${folder}/${Date.now()}-${file.originalname}`,
    Body: buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
  };

  const data = await s3.upload(params).promise();
  return data.Location;
};

export default uploadBufferToDO;
