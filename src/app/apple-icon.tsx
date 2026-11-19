import { ImageResponse } from 'next/og';
import fs from 'fs/promises';
import path from 'path';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default async function AppleIcon() {
  const logoPath = path.join(
    process.cwd(),
    'public',
    'images',
    'cbcmaterials-logo.jpg'
  );
  const logoBuf = await fs.readFile(logoPath);
  const logoDataUri = `data:image/jpeg;base64,${logoBuf.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '38px',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUri}
          alt="CBCMATERIALS.SHOP"
          width={180}
          height={180}
          style={{
            width: '180px',
            height: '180px',
            objectFit: 'cover',
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
