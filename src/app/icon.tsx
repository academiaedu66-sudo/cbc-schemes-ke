import { ImageResponse } from 'next/og';
import fs from 'fs/promises';
import path from 'path';

export const size = {
  width: 512,
  height: 512,
};
export const contentType = 'image/png';

export default async function Icon() {
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
          width: '512px',
          height: '512px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          borderRadius: '112px',
          overflow: 'hidden',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoDataUri}
          alt="CBCMATERIALS.SHOP"
          width={512}
          height={512}
          style={{
            width: '512px',
            height: '512px',
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
