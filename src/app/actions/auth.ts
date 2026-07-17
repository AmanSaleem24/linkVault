// Barrel re-export — keeps all existing imports stable.
// New implementations live in focused sibling files.

import { signUpAction } from './auth.signup'
import { verifyEmailAction } from './auth.verify'
import { loginAction, googleSignInAction, signOutAction } from './auth.login'
import { forgotPasswordAction, resetPasswordAction } from './auth.password'

export { signUpAction, verifyEmailAction, loginAction, googleSignInAction, signOutAction, forgotPasswordAction, resetPasswordAction }
