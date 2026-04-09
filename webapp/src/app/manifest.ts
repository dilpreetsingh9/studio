import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Jeiva: Hormone Intelligence',
    short_name: 'Jeiva',
    description: 'Privacy-first hormone intelligence and health navigation for women.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F8F7FB',
    theme_color: '#3D3060',
    icons: [
      {
        src: 'https://picsum.photos/seed/jeiva-icon/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/jeiva-icon/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
