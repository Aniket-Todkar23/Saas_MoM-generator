import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import crypto from "crypto";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  // In production, you would typically use IAM roles or configure AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in env
});

export async function POST(request: Request) {
  try {
    const { filename, contentType } = await request.json();

    const ext = filename.split('.').pop();
    const key = `mom-uploads/${crypto.randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || "elasticbeanstalk-ap-south-1-518733266398",
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ signedUrl, fileUrl, key });
  } catch (error) {
    console.error("S3 Presign Error:", error);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
