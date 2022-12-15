import {
  CognitoUserPool,
  CognitoUser,
  IAuthenticationDetailsData,
  AuthenticationDetails,
  CognitoUserSession,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js'

import { createAuthentication } from '@redwoodjs/auth'
export interface ChangePasswordProps {
  oldPassword: string
  newPassword: string
}
export interface NewPasswordRequired {
  newPasswordCallback: (
    newPassword: string,
    user: CognitoUser
  ) => Promise<CognitoUserSession>
  status: {
    code: number
    message: string
  }
}

export interface TotpCallback {
  totpCallback: (code: string) => Promise<CognitoUserSession>
}

export interface RedwoodCognitoClient {
  client: CognitoUserPool
  login: (options: {
    email: string
    password?: string
    session?: CognitoUserSession
  }) => Promise<CognitoUserSession | NewPasswordRequired | TotpCallback>
  currentUser: () => Promise<CognitoUser | null>
  /**
   * Use this function when a user has a reset token and needs to change their password
   */
  confirmNewPassword: (
    email: string,
    newPassword: string,
    token: string
  ) => Promise<void>
  logout: () => Promise<unknown>
  signup: ({ email, password }: CognitoCredentials) => Promise<unknown>
  getToken: () => Promise<string | null>
  getUserMetadata: () => Promise<CognitoUser | null>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: ({
    oldPassword,
    newPassword,
  }: ChangePasswordProps) => Promise<string>
}

export interface ValidateResetTokenResponse {
  error?: string
  [key: string]: string | undefined
}

interface CognitoCredentials {
  email: string
  password: string
}
// Replace this with the auth service provider client sdk
const customCognitoClient = (
  client: CognitoUserPool
): RedwoodCognitoClient => ({
  client,
  login: ({ email, password, session }) => {
    return new Promise((resolve, reject) => {
      if (session) {
        if (session.isValid()) {
          const user = new CognitoUser({
            Username: email,
            Pool: client,
          })
          user.setSignInUserSession(session)
          return resolve(session)
        }
      }
      const authenticationData: IAuthenticationDetailsData = {
        Username: email,
        Password: password,
      }
      const authenticationDetails = new AuthenticationDetails(
        authenticationData
      )
      const userData = {
        Username: email,
        Pool: client,
      }
      const cognitoUser = new CognitoUser(userData)
      cognitoUser?.setAuthenticationFlowType('USER_PASSWORD_AUTH')
      cognitoUser?.authenticateUser(authenticationDetails, {
        onSuccess: (session: CognitoUserSession) => {
          resolve(session)
        },
        onFailure: (err) => {
          reject(err)
        },
        newPasswordRequired: (_userAttributes, _requiredAttributes) => {
          resolve({
            // TODO: Fix security vulnerability with allowing a CognitoUser Parameter to this callback
            newPasswordCallback: (newPassword: string, user = cognitoUser) => {
              return new Promise((resolve, reject) => {
                user.completeNewPasswordChallenge(
                  newPassword,
                  {},
                  {
                    onSuccess: (session: CognitoUserSession) => {
                      resolve(session)
                    },
                    onFailure: (err: Error | unknown) => {
                      reject(err)
                    },
                  }
                )
              })
            },
            status: {
              code: 409,
              message: 'User needs to change their password',
            },
          })
        },
        totpRequired: (
          challengeName: string,
          _challengeParameters: unknown
        ) => {
          resolve({
            totpCallback: (totpCode: string, user = cognitoUser) => {
              return new Promise((resolve, reject) => {
                user.sendMFACode(
                  totpCode,
                  {
                    onSuccess: (session: CognitoUserSession) => {
                      resolve(session)
                    },
                    onFailure: (err: Error | unknown) => {
                      console.error({ err })
                      reject(err)
                    },
                  },
                  challengeName
                )
              })
            },
          })
        },
      })
    })
  },
  logout: async () => {
    await client.getCurrentUser()?.signOut()
  },
  signup: ({ email, password }: CognitoCredentials) => {
    return new Promise(function (resolve, reject) {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email,
        }),
      ]

      client.signUp(
        email,
        password,
        attributeList,
        [],
        function (err: Error | unknown, res: unknown) {
          if (err) {
            reject(err)
          } else {
            resolve(res)
          }
        }
      )
    }).catch((err) => {
      throw err
    })
  },
  getToken: (): Promise<string | null> => {
    return new Promise<string>((resolve, reject) => {
      const user = client.getCurrentUser()
      user?.getSession((err: Error | null, session: CognitoUserSession) => {
        if (err) {
          reject(err)
        } else {
          const jwtToken = session.getAccessToken().getJwtToken()
          resolve(jwtToken)
        }
      })
    }).catch((err) => {
      throw err
    })
  },
  getUserMetadata: (): Promise<CognitoUser | null> => {
    return new Promise<CognitoUser | null>((resolve) => {
      const currentUser = client.getCurrentUser()
      resolve(currentUser)
    }).catch((err) => {
      throw err
    })
  },
  currentUser: () => {
    return new Promise<CognitoUser | null>((resolve) => {
      const currentUser = client.getCurrentUser()
      resolve(currentUser)
    }).catch((err) => {
      throw err
    })
  },
  forgotPassword: (email: string) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: email,
        Pool: client,
      })
      user.forgotPassword({
        onSuccess: (result: any) => {
          resolve(result)
        },
        onFailure: (err: Error) => {
          console.error(
            `Error getting validation token for user ${email}. ${err.message}`
          )
          reject(err)
        },
      })
    })
  },
  confirmNewPassword: (email, newPassword, token) => {
    return new Promise((resolve, reject) => {
      const user = new CognitoUser({
        Username: email,
        Pool: client,
      })
      if (!user) {
        return reject(Error(`Could not find that user`))
      } else {
        user.confirmPassword(token, newPassword, {
          onSuccess: (_success: string) => {
            return resolve()
          },
          onFailure: (err: Error) => {
            return reject(err)
          },
        })
      }
    })
  },
  resetPassword: ({ oldPassword, newPassword }: ChangePasswordProps) => {
    return new Promise((resolve, reject) => {
      const user = client.getCurrentUser()
      if (user) {
        user.changePassword(oldPassword, newPassword, (err, result) => {
          if (err || result !== 'SUCCESS') {
            reject(err || Error('Could not change password'))
          } else {
            resolve(result)
          }
        })
      } else {
        reject(Error('Not logged in'))
      }
    })
  },
})

export function createCustomAuth(client: CognitoUserPool) {
  const authImplementation = createCustomAuthImplementation(client)

  // You can pass custom provider hooks here if you need to as a second
  // argument. See the Redwood framework source code for how that's used
  return createAuthentication(authImplementation)
}

function createCustomAuthImplementation(customClient: CognitoUserPool) {
  const cognitoClient = customCognitoClient(customClient)
  return {
    type: 'cognito',
    client: cognitoClient,
    login: cognitoClient.login,
    logout: cognitoClient.logout,
    signup: cognitoClient.signup,
    getToken: cognitoClient.getToken,
    getUserMetadata: cognitoClient.getUserMetadata,
    currentUser: cognitoClient.currentUser,
  }
}
