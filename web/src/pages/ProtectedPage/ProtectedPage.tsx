import { Link, routes } from '@redwoodjs/router'
import { MetaTags } from '@redwoodjs/web'

import { useAuth } from 'src/App'

const ProtectedPage = () => {
  const { logOut, currentUser } = useAuth()
  console.log({ currentUser })

  return (
    <>
      <MetaTags title="Protected" description="Protected page" />

      <h1>ProtectedPage</h1>
      <p>
        Find me in <code>./web/src/pages/ProtectedPage/ProtectedPage.tsx</code>
      </p>
      <p>
        welcome <span style={{ color: 'red' }}>{currentUser?.username}</span>
      </p>
      <button onClick={logOut}>Logout</button>
      <p>
        My default route is named <code>protected</code>, link to me with `
        <Link to={routes.protected()}>Protected</Link>
      </p>
    </>
  )
}

export default ProtectedPage
