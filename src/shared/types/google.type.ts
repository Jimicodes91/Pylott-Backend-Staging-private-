export interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export interface GoogleAuthData {
  googleId: string;
  email: string;
  name?: string;
  profilePicture?: string;
}

export interface GoogleAuthOptions {
  clientId: string;
  clientSecret: string;
  callbackURL: string;
}
