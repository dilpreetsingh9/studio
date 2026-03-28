import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Healthea: Hormone Intelligence',
    short_name: 'Healthea',
    description: 'Privacy-first hormone intelligence and health navigation for women.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAFAFA',
    theme_color: '#0A2558',
    icons: [
      {
        src: 'https://picsum.photos/seed/healthea-icon/192/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: 'https://picsum.photos/seed/healthea-icon/512/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
