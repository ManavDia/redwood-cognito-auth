import type { ComponentMeta } from '@storybook/react'

import ProtectedPage from './ProtectedPage'

export const generated = () => {
  return <ProtectedPage />
}

export default {
  title: 'Pages/ProtectedPage',
  component: ProtectedPage,
} as ComponentMeta<typeof ProtectedPage>
