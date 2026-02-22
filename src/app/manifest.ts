
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HealthConnex',
    short_name: 'HealthConnex',
    description: 'Your personal AI-powered health navigator.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAFAFA',
    theme_color: '#0A2558',
    icons: [
      {
        src: 'https://picsum.photos/seed/healthconnex-icon/192/192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://picsum.photos/seed/healthconnex-icon/512/512',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
