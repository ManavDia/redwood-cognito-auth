import { CognitoUserPool } from 'amazon-cognito-identity-js'

import { FatalErrorBoundary, RedwoodProvider } from '@redwoodjs/web'
import { RedwoodApolloProvider } from '@redwoodjs/web/apollo'

import FatalErrorPage from 'src/pages/FatalErrorPage'
import Routes from 'src/Routes'

import { createCustomAuth } from './auth'

import './index.css'
export interface AuthClient {
  id: string
  clientData: {
    UserPoolId: string
    ClientId: string
  }
  identityProvider?: string
  loginUrl?: string
  name?: string
  federated?: boolean
  tokenUrl?: string
  email?: string
}

export interface GetLoginUrlInput {
  identityProvider?: string
  clientId?: string
}

export const getRedirectUri = () =>
  window.location.hostname === 'localhost'
    ? 'http://localhost:8910/app/login'
    : window.location.origin + '/app/login'
export const getLoginUrl = (input: GetLoginUrlInput) =>
  `https://${process.env.COGNITO_DOMAIN}.auth.${
    process.env.COGNITO_REGION
  }.amazoncognito.com/oauth2/authorize?identity_provider=${
    input.identityProvider
  }&redirect_uri=${getRedirectUri()}&response_type=CODE&client_id=${
    input.clientId
  }&scope=email%20openid`
export const getTokenUrl = () =>
  `https://${process.env.COGNITO_DOMAIN}.auth.${process.env.COGNITO_REGION}.amazoncognito.com/oauth2/token`

export const AuthClients: AuthClient[] = [
  {
    id: 'default',
    clientData: {
      UserPoolId: process.env.COGNITO_POOL_ID,
      ClientId: process.env.COGNITO_APP_CLIENT_ID,
    },
  },
]
const cognitoPool = new CognitoUserPool(AuthClients[0].clientData)
const { AuthProvider, useAuth } = createCustomAuth(cognitoPool)
export { useAuth }
const App = () => {
  return (
    <FatalErrorBoundary page={FatalErrorPage}>
      <RedwoodProvider titleTemplate="%PageTitle | %AppTitle">
        {AuthProvider && (
          <AuthProvider>
            <RedwoodApolloProvider useAuth={useAuth}>
              <Routes />
            </RedwoodApolloProvider>
          </AuthProvider>
        )}
      </RedwoodProvider>
    </FatalErrorBoundary>
  )
}
export default App
