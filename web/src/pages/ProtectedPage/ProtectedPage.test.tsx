import { render } from '@redwoodjs/testing/web'

import ProtectedPage from './ProtectedPage'

//   Improve this test with help from the Redwood Testing Doc:
//   https://redwoodjs.com/docs/testing#testing-pages-layouts

describe('ProtectedPage', () => {
  it('renders successfully', () => {
    expect(() => {
      render(<ProtectedPage />)
    }).not.toThrow()
  })
})
