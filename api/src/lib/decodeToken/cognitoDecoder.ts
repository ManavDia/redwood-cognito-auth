import jwt, { JwtPayload } from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'

/**
 * This function is used to get the list of clients from Cognito
 * Needs to be implemented
 * @returns
 */

const getCognitoPoolClients = async () => {
  return []
}

function verifyCognitoToken(token: string): Promise<null | JwtPayload> {
  return new Promise((resolve, reject) => {
    const { COGNITO_POOL_ID, COGNITO_REGION, COGNITO_APP_CLIENT_ID } =
      process.env
    if (!COGNITO_POOL_ID || !COGNITO_REGION || !COGNITO_APP_CLIENT_ID) {
      throw new Error(
        '`COGNITO_POOL_ID` or `COGNITO_REGION` or `COGNITO_APP_CLIENT_ID` env vars are not set.'
      )
    }

    const client = jwksClient({
      jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}/.well-known/jwks.json`,
    })

    jwt.verify(
      token,
      (header, callback) => {
        client.getSigningKey(header.kid as string, (error, key) => {
          callback(error, key?.getPublicKey())
        })
      },
      {
        algorithms: ['RS256'],
        issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_POOL_ID}`,
      },
      async (verifyError, decoded) => {
        const payload = decoded as JwtPayload
        const clientId = payload?.['client_id']
        const tokenUse = payload?.['token_use']
        if (verifyError) {
          return reject(verifyError)
        } else {
          if (clientId !== COGNITO_APP_CLIENT_ID) {
            const poolClients = await getCognitoPoolClients()
            const FEDERATED_CLIENT_IDS = poolClients.map(
              (client) => client.ClientId
            )
            if (!FEDERATED_CLIENT_IDS.includes(clientId)) {
              return reject(
                Error(`Invalid client_id. Expected: ${COGNITO_APP_CLIENT_ID}`)
              )
            }
          }
          if (tokenUse !== 'access') {
            return reject(Error(`Invalid token_use. Expected: "access"`))
          }
          resolve(typeof decoded === 'undefined' ? null : payload)
        }
      }
    )
  })
}

export const cognito = async (token: string) => {
  const user = await verifyCognitoToken(token)
  let roles = []

  //Extract roles from user groups
  if (user) {
    roles = user['cognito:groups']
  }

  return {
    ...user,
    roles,
  }
}
